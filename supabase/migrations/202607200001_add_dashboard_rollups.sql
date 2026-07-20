-- Precompute the daily, per-member values used by the period picker and
-- timeline. Raw message metrics remain the source of truth and can rebuild
-- these rollups whenever an import is finalized or the group timezone changes.

create table public.daily_member_metrics (
  group_id uuid not null references public.groups(id) on delete cascade,
  import_id uuid not null references public.imports(id) on delete cascade,
  source_user_id text not null,
  local_date date not null,
  message_count bigint not null check (message_count >= 0),
  favorite_count bigint not null check (favorite_count >= 0),
  reaction_counts jsonb not null default '{}'::jsonb
    check (jsonb_typeof(reaction_counts) = 'object'),
  primary key (import_id, source_user_id, local_date),
  foreign key (group_id, source_user_id)
    references public.source_members(group_id, source_user_id)
    on update cascade
);

create index daily_member_metrics_group_import_date_idx
  on public.daily_member_metrics(group_id, import_id, local_date);

alter table public.daily_member_metrics enable row level security;
revoke all on public.daily_member_metrics from anon, authenticated;

create or replace function private.rebuild_daily_member_metrics(p_import_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  target_group_id uuid;
  target_timezone text;
begin
  select i.group_id, g.timezone
  into target_group_id, target_timezone
  from public.imports i
  join public.groups g on g.id = i.group_id
  where i.id = p_import_id;

  if target_group_id is null then
    raise exception 'Import not found';
  end if;

  delete from public.daily_member_metrics
  where import_id = p_import_id;

  with rollup_source as materialized (
    select
      m.*,
      (m.occurred_at at time zone target_timezone)::date as local_date
    from public.message_metrics m
    where m.import_id = p_import_id
  ), base as (
    select
      m.group_id,
      m.import_id,
      m.source_user_id,
      m.local_date,
      count(*)::bigint as message_count,
      coalesce(sum(m.favorite_count), 0)::bigint as favorite_count
    from rollup_source m
    group by m.group_id, m.import_id, m.source_user_id, m.local_date
  ), reaction_totals as (
    select
      m.group_id,
      m.import_id,
      m.source_user_id,
      m.local_date,
      r.key,
      sum((r.value)::integer)::bigint as total
    from rollup_source m
    cross join lateral jsonb_each_text(m.reaction_counts) r
    group by m.group_id, m.import_id, m.source_user_id, m.local_date, r.key
  ), reaction_objects as (
    select
      r.group_id,
      r.import_id,
      r.source_user_id,
      r.local_date,
      jsonb_object_agg(r.key, r.total) as reaction_counts
    from reaction_totals r
    group by r.group_id, r.import_id, r.source_user_id, r.local_date
  )
  insert into public.daily_member_metrics (
    group_id,
    import_id,
    source_user_id,
    local_date,
    message_count,
    favorite_count,
    reaction_counts
  )
  select
    b.group_id,
    b.import_id,
    b.source_user_id,
    b.local_date,
    b.message_count,
    b.favorite_count,
    coalesce(r.reaction_counts, '{}'::jsonb)
  from base b
  left join reaction_objects r
    on r.group_id = b.group_id
   and r.import_id = b.import_id
   and r.source_user_id = b.source_user_id
   and r.local_date = b.local_date;
end;
$$;

revoke all on function private.rebuild_daily_member_metrics(uuid) from public;

-- Keep the existing public API while making rollup generation part of the
-- atomic import swap. A failed rollup cannot become the active import.
create or replace function public.finalize_import(p_import_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  target public.imports%rowtype;
  old_import uuid;
begin
  select * into target
  from public.imports
  where id = p_import_id
  for update;

  if target.id is null then
    raise exception 'Import not found';
  end if;
  if target.status <> 'pending' then
    raise exception 'Only pending imports can be finalized';
  end if;
  if not private.has_group_role(target.group_id, array['owner','admin']::public.member_role[]) then
    raise exception 'Admin access required';
  end if;
  if target.created_by <> auth.uid() then
    raise exception 'Only the import creator can finalize it';
  end if;
  if not exists(select 1 from public.message_metrics where import_id = p_import_id) then
    raise exception 'The import contains no valid messages';
  end if;

  select active_import_id into old_import
  from public.groups
  where id = target.group_id
  for update;

  perform private.rebuild_daily_member_metrics(p_import_id);

  update public.imports
  set status = 'active', finalized_at = now()
  where id = p_import_id;

  update public.groups
  set active_import_id = p_import_id, updated_at = now()
  where id = target.group_id;

  if old_import is not null and old_import <> p_import_id then
    delete from public.imports where id = old_import;
  end if;
end;
$$;

revoke all on function public.finalize_import(uuid) from public;
grant execute on function public.finalize_import(uuid) to authenticated;

-- Existing active imports predate the rollup table, so populate them once.
do $$
declare
  active_id uuid;
begin
  for active_id in
    select active_import_id
    from public.groups
    where active_import_id is not null
  loop
    perform private.rebuild_daily_member_metrics(active_id);
  end loop;
end;
$$;

create or replace function public.get_available_years(p_group_id uuid)
returns table(year integer)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select distinct extract(year from d.local_date)::integer
  from public.groups g
  join public.daily_member_metrics d
    on d.group_id = g.id
   and d.import_id = g.active_import_id
  join public.source_members s
    on s.group_id = d.group_id
   and s.source_user_id = d.source_user_id
   and not s.is_excluded
  where g.id = p_group_id
    and (select private.is_group_member(p_group_id))
  order by 1 desc;
$$;

create or replace function public.get_recap_summary(
  p_group_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table(
  message_count bigint,
  favorite_count bigint,
  member_count bigint,
  active_days bigint,
  top_reaction text,
  last_imported_at timestamptz
)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  with filtered as materialized (
    select d.*
    from public.groups g
    join public.daily_member_metrics d
      on d.group_id = g.id
     and d.import_id = g.active_import_id
    join public.source_members s
      on s.group_id = d.group_id
     and s.source_user_id = d.source_user_id
     and not s.is_excluded
    where g.id = p_group_id
      and (select private.is_group_member(p_group_id))
      and (p_from is null or d.local_date >= (p_from at time zone 'UTC')::date)
      and (p_to is null or d.local_date <= (p_to at time zone 'UTC')::date)
  ), reactions as (
    select r.key, sum((r.value)::bigint) as total
    from filtered f
    cross join lateral jsonb_each_text(f.reaction_counts) r
    group by r.key
    order by total desc, r.key
    limit 1
  )
  select
    coalesce(sum(f.message_count), 0)::bigint,
    coalesce(sum(f.favorite_count), 0)::bigint,
    count(distinct f.source_user_id)::bigint,
    count(distinct f.local_date)::bigint,
    (select key from reactions),
    i.finalized_at
  from public.groups g
  left join filtered f on true
  left join public.imports i on i.id = g.active_import_id
  where g.id = p_group_id
    and (select private.is_group_member(p_group_id))
  group by g.id, i.finalized_at;
$$;

create or replace function public.get_rankings(
  p_group_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table(
  member_id text,
  display_name text,
  message_count bigint,
  favorite_count bigint,
  favorite_rate numeric,
  reaction_counts jsonb
)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  with filtered as materialized (
    select d.*
    from public.groups g
    join public.daily_member_metrics d
      on d.group_id = g.id
     and d.import_id = g.active_import_id
    where g.id = p_group_id
      and (select private.is_group_member(p_group_id))
      and (p_from is null or d.local_date >= (p_from at time zone 'UTC')::date)
      and (p_to is null or d.local_date <= (p_to at time zone 'UTC')::date)
  ), base as (
    select
      s.source_user_id,
      coalesce(s.display_name_override, s.latest_export_name) as name,
      coalesce(sum(f.message_count), 0)::bigint as messages,
      coalesce(sum(f.favorite_count), 0)::bigint as favorites
    from public.source_members s
    join filtered f
      on f.group_id = s.group_id
     and f.source_user_id = s.source_user_id
    where s.group_id = p_group_id
      and not s.is_excluded
    group by s.source_user_id, s.display_name_override, s.latest_export_name
  ), reaction_totals as (
    select
      f.source_user_id,
      r.key,
      sum((r.value)::bigint)::bigint as total
    from filtered f
    cross join lateral jsonb_each_text(f.reaction_counts) r
    group by f.source_user_id, r.key
  ), reaction_objects as (
    select
      r.source_user_id,
      jsonb_object_agg(r.key, r.total) as reactions
    from reaction_totals r
    group by r.source_user_id
  )
  select
    b.source_user_id,
    b.name,
    b.messages,
    b.favorites,
    case
      when b.messages = 0 then null
      else round(b.favorites::numeric / b.messages, 2)
    end,
    coalesce(r.reactions, '{}'::jsonb)
  from base b
  left join reaction_objects r on r.source_user_id = b.source_user_id
  order by b.messages desc, b.name;
$$;

create or replace function public.get_timeline(
  p_group_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_bucket text default 'month',
  p_member_ids text[] default null
)
returns table(
  label text,
  bucket_start timestamptz,
  message_count bigint,
  favorite_count bigint
)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select
    case
      when p_from is null or p_to is null or p_to - p_from > interval '370 days'
        then to_char(date_trunc('month', d.local_date::timestamp), 'Mon YY')
      else to_char(date_trunc('month', d.local_date::timestamp), 'Mon')
    end,
    date_trunc('month', d.local_date::timestamp) at time zone g.timezone,
    sum(d.message_count)::bigint,
    sum(d.favorite_count)::bigint
  from public.groups g
  join public.daily_member_metrics d
    on d.group_id = g.id
   and d.import_id = g.active_import_id
  join public.source_members s
    on s.group_id = d.group_id
   and s.source_user_id = d.source_user_id
   and not s.is_excluded
  where g.id = p_group_id
    and (select private.is_group_member(p_group_id))
    and (p_from is null or d.local_date >= (p_from at time zone 'UTC')::date)
    and (p_to is null or d.local_date <= (p_to at time zone 'UTC')::date)
    and (p_member_ids is null or d.source_user_id = any(p_member_ids))
  group by g.timezone, date_trunc('month', d.local_date::timestamp)
  order by date_trunc('month', d.local_date::timestamp);
$$;

grant execute on function public.get_available_years(uuid) to authenticated;
grant execute on function public.get_recap_summary(uuid,timestamptz,timestamptz) to authenticated;
grant execute on function public.get_rankings(uuid,timestamptz,timestamptz) to authenticated;
grant execute on function public.get_timeline(uuid,timestamptz,timestamptz,text,text[]) to authenticated;

-- local_date is defined in the group's timezone. Rebuild the active snapshot
-- after a timezone edit so midnight-boundary messages remain correct.
create or replace function private.rebuild_rollups_after_timezone_change()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if new.active_import_id is not null then
    perform private.rebuild_daily_member_metrics(new.active_import_id);
  end if;
  return new;
end;
$$;

revoke all on function private.rebuild_rollups_after_timezone_change() from public;

create trigger groups_rebuild_rollups_after_timezone_change
after update of timezone on public.groups
for each row
when (old.timezone is distinct from new.timezone)
execute function private.rebuild_rollups_after_timezone_change();
