-- Dashboard aggregates only return data after a single indexed membership check.
-- SECURITY DEFINER avoids re-running message_metrics RLS membership predicates for
-- every row in large active imports; the raw tables remain protected by RLS.

create or replace function public.get_available_years(p_group_id uuid)
returns table(year integer)
language sql stable security definer set search_path = public, private, pg_temp as $$
  select distinct extract(year from timezone(g.timezone, m.occurred_at))::integer
  from public.groups g
  join public.message_metrics m on m.import_id = g.active_import_id and m.group_id = g.id
  join public.source_members s on s.group_id = m.group_id and s.source_user_id = m.source_user_id and not s.is_excluded
  where g.id = p_group_id
    and (select private.is_group_member(p_group_id))
  order by 1 desc;
$$;

create or replace function public.get_recap_summary(p_group_id uuid, p_from timestamptz default null, p_to timestamptz default null)
returns table(message_count bigint, favorite_count bigint, member_count bigint, active_days bigint, top_reaction text, last_imported_at timestamptz)
language sql stable security definer set search_path = public, private, pg_temp as $$
  with filtered as materialized (
    select m.*
    from public.groups g
    join public.message_metrics m on m.group_id = g.id and m.import_id = g.active_import_id
    join public.source_members s on s.group_id = m.group_id and s.source_user_id = m.source_user_id and not s.is_excluded
    where g.id = p_group_id
      and (select private.is_group_member(p_group_id))
      and (p_from is null or m.occurred_at >= p_from)
      and (p_to is null or m.occurred_at <= p_to)
  ), reactions as (
    select r.key, sum((r.value)::integer) total
    from filtered f
    cross join lateral jsonb_each_text(f.reaction_counts) r
    group by r.key
    order by total desc
    limit 1
  )
  select
    count(*)::bigint,
    coalesce(sum(f.favorite_count), 0)::bigint,
    count(distinct f.source_user_id)::bigint,
    count(distinct (f.occurred_at at time zone g.timezone)::date)::bigint,
    (select key from reactions),
    i.finalized_at
  from public.groups g
  left join filtered f on true
  left join public.imports i on i.id = g.active_import_id
  where g.id = p_group_id
    and (select private.is_group_member(p_group_id))
  group by g.id, i.finalized_at;
$$;

create or replace function public.get_rankings(p_group_id uuid, p_from timestamptz default null, p_to timestamptz default null)
returns table(member_id text, display_name text, message_count bigint, favorite_count bigint, favorite_rate numeric, reaction_counts jsonb)
language sql stable security definer set search_path = public, private, pg_temp as $$
  with filtered as materialized (
    select m.*
    from public.groups g
    join public.message_metrics m on m.group_id = g.id and m.import_id = g.active_import_id
    where g.id = p_group_id
      and (select private.is_group_member(p_group_id))
      and (p_from is null or m.occurred_at >= p_from)
      and (p_to is null or m.occurred_at <= p_to)
  ), base as (
    select
      s.source_user_id,
      coalesce(s.display_name_override, s.latest_export_name) name,
      count(f.id)::bigint messages,
      coalesce(sum(f.favorite_count), 0)::bigint favorites
    from public.source_members s
    join filtered f on f.group_id = s.group_id and f.source_user_id = s.source_user_id
    where s.group_id = p_group_id and not s.is_excluded
    group by s.source_user_id, s.display_name_override, s.latest_export_name
  ), reaction_totals as (
    select x.source_user_id, jsonb_object_agg(x.key, x.total) reactions
    from (
      select f2.source_user_id, r.key, sum((r.value)::integer) total
      from filtered f2
      cross join lateral jsonb_each_text(f2.reaction_counts) r
      group by f2.source_user_id, r.key
    ) x
    group by x.source_user_id
  )
  select
    b.source_user_id,
    b.name,
    b.messages,
    b.favorites,
    case when b.messages = 0 then null else round(b.favorites::numeric / b.messages, 2) end,
    coalesce(rt.reactions, '{}'::jsonb)
  from base b
  left join reaction_totals rt on rt.source_user_id = b.source_user_id
  order by b.messages desc, b.name;
$$;

create or replace function public.get_timeline(p_group_id uuid, p_from timestamptz default null, p_to timestamptz default null, p_bucket text default 'month', p_member_ids text[] default null)
returns table(label text, bucket_start timestamptz, message_count bigint, favorite_count bigint)
language sql stable security definer set search_path = public, private, pg_temp as $$
  select
    case
      when p_from is null or p_to is null or p_to - p_from > interval '370 days'
        then to_char(date_trunc('month', m.occurred_at at time zone g.timezone), 'Mon YY')
      else to_char(date_trunc('month', m.occurred_at at time zone g.timezone), 'Mon')
    end,
    min(date_trunc('month', m.occurred_at)),
    count(*)::bigint,
    coalesce(sum(m.favorite_count), 0)::bigint
  from public.groups g
  join public.message_metrics m on m.group_id = g.id and m.import_id = g.active_import_id
  join public.source_members s on s.group_id = m.group_id and s.source_user_id = m.source_user_id and not s.is_excluded
  where g.id = p_group_id
    and (select private.is_group_member(p_group_id))
    and (p_from is null or m.occurred_at >= p_from)
    and (p_to is null or m.occurred_at <= p_to)
    and (p_member_ids is null or m.source_user_id = any(p_member_ids))
  group by date_trunc('month', m.occurred_at at time zone g.timezone)
  order by date_trunc('month', m.occurred_at at time zone g.timezone);
$$;

create or replace function public.get_group_history(p_group_id uuid, p_from timestamptz default null, p_to timestamptz default null)
returns table(event_id bigint, occurred_at timestamptz, event_type text, display_value text, actor_name text)
language sql stable security definer set search_path = public, private, pg_temp as $$
  select
    e.id,
    e.occurred_at,
    e.event_type,
    e.display_value,
    coalesce(s.display_name_override, s.latest_export_name)
  from public.groups g
  join public.group_events e on e.group_id = g.id and e.import_id = g.active_import_id
  left join public.source_members s on s.group_id = e.group_id and s.source_user_id = e.actor_source_user_id
  where g.id = p_group_id
    and (select private.is_group_member(p_group_id))
    and e.event_type in ('group.name_change', 'group.topic_change')
    and (p_from is null or e.occurred_at >= p_from)
    and (p_to is null or e.occurred_at <= p_to)
  order by e.occurred_at desc;
$$;

revoke all on function public.get_available_years(uuid) from public;
revoke all on function public.get_recap_summary(uuid, timestamptz, timestamptz) from public;
revoke all on function public.get_rankings(uuid, timestamptz, timestamptz) from public;
revoke all on function public.get_timeline(uuid, timestamptz, timestamptz, text, text[]) from public;
revoke all on function public.get_group_history(uuid, timestamptz, timestamptz) from public;

grant execute on function public.get_available_years(uuid) to authenticated;
grant execute on function public.get_recap_summary(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_rankings(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_timeline(uuid, timestamptz, timestamptz, text, text[]) to authenticated;
grant execute on function public.get_group_history(uuid, timestamptz, timestamptz) to authenticated;
