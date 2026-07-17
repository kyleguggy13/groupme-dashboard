create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'member');
create type public.membership_status as enum ('active', 'suspended');
create type public.import_status as enum ('pending', 'active', 'failed', 'superseded');

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  timezone text not null default 'America/New_York',
  active_import_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  source_user_id text not null,
  latest_export_name text not null check (char_length(latest_export_name) between 1 and 120),
  display_name_override text check (display_name_override is null or char_length(display_name_override) between 1 and 120),
  is_excluded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, source_user_id)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_member_id text,
  role public.member_role not null default 'member',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id),
  foreign key (group_id, source_member_id) references public.source_members(group_id, source_user_id) on update cascade
);
create unique index memberships_one_account_per_source_member on public.memberships(group_id, source_member_id) where source_member_id is not null;

create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  email text not null check (email = lower(email)),
  source_member_id text not null,
  token_hash text not null unique check (char_length(token_hash) = 64),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (group_id, source_member_id) references public.source_members(group_id, source_user_id) on update cascade
);

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  status public.import_status not null default 'pending',
  source_filename text not null default 'browser-sanitized-export',
  row_count integer not null default 0 check (row_count >= 0),
  message_count integer not null default 0 check (message_count >= 0),
  event_count integer not null default 0 check (event_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  min_date timestamptz,
  max_date timestamptz,
  warnings jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  check (min_date is null or max_date is null or min_date <= max_date)
);

alter table public.groups add constraint groups_active_import_fk foreign key (active_import_id) references public.imports(id) on delete set null;

create table public.message_metrics (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups(id) on delete cascade,
  import_id uuid not null references public.imports(id) on delete cascade,
  source_message_id text not null,
  source_user_id text not null,
  occurred_at timestamptz not null,
  favorite_count integer not null default 0 check (favorite_count >= 0),
  reaction_counts jsonb not null default '{}'::jsonb check (jsonb_typeof(reaction_counts) = 'object'),
  unique (import_id, source_message_id),
  foreign key (group_id, source_user_id) references public.source_members(group_id, source_user_id) on update cascade
);

create table public.group_events (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups(id) on delete cascade,
  import_id uuid not null references public.imports(id) on delete cascade,
  source_event_id text not null,
  event_type text not null,
  occurred_at timestamptz not null,
  actor_source_user_id text,
  display_value text check (display_value is null or char_length(display_value) <= 500),
  unique (import_id, source_event_id)
);

create index memberships_user_status_idx on public.memberships(user_id, status, group_id);
create index memberships_group_role_idx on public.memberships(group_id, role, status);
create index source_members_group_included_idx on public.source_members(group_id, is_excluded);
create index imports_group_status_idx on public.imports(group_id, status, created_at desc);
create index message_metrics_group_import_date_idx on public.message_metrics(group_id, import_id, occurred_at);
create index message_metrics_group_user_date_idx on public.message_metrics(group_id, source_user_id, occurred_at);
create index group_events_group_import_date_idx on public.group_events(group_id, import_id, occurred_at desc);
create index group_invites_group_email_idx on public.group_invites(group_id, email, expires_at);

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_group_member(target_group uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.memberships m where m.group_id = target_group and m.user_id = (select auth.uid()) and m.status = 'active');
$$;

create or replace function private.has_group_role(target_group uuid, allowed_roles public.member_role[])
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.memberships m where m.group_id = target_group and m.user_id = (select auth.uid()) and m.status = 'active' and m.role = any(allowed_roles));
$$;

alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.source_members enable row level security;
alter table public.memberships enable row level security;
alter table public.group_invites enable row level security;
alter table public.imports enable row level security;
alter table public.message_metrics enable row level security;
alter table public.group_events enable row level security;

create policy groups_read_members on public.groups for select to authenticated using (private.is_group_member(id));
create policy groups_update_owner on public.groups for update to authenticated using (private.has_group_role(id, array['owner']::public.member_role[])) with check (private.has_group_role(id, array['owner']::public.member_role[]));

create policy profiles_read_shared_group on public.profiles for select to authenticated using (id = (select auth.uid()) or exists(select 1 from public.memberships mine join public.memberships theirs on theirs.group_id = mine.group_id where mine.user_id = (select auth.uid()) and mine.status = 'active' and theirs.user_id = profiles.id and theirs.status = 'active'));
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy source_members_read_group on public.source_members for select to authenticated using (private.is_group_member(group_id));
create policy source_members_insert_admin on public.source_members for insert to authenticated with check (private.has_group_role(group_id, array['owner','admin']::public.member_role[]));
create policy source_members_update_admin on public.source_members for update to authenticated using (private.has_group_role(group_id, array['owner','admin']::public.member_role[])) with check (private.has_group_role(group_id, array['owner','admin']::public.member_role[]));
create policy source_members_delete_owner on public.source_members for delete to authenticated using (private.has_group_role(group_id, array['owner']::public.member_role[]));

create policy memberships_read_group on public.memberships for select to authenticated using (private.is_group_member(group_id));

create policy invites_read_admin on public.group_invites for select to authenticated using (private.has_group_role(group_id, array['owner','admin']::public.member_role[]));
create policy invites_insert_admin on public.group_invites for insert to authenticated with check (private.has_group_role(group_id, array['owner','admin']::public.member_role[]) and created_by = (select auth.uid()));
create policy invites_delete_admin on public.group_invites for delete to authenticated using (private.has_group_role(group_id, array['owner','admin']::public.member_role[]));

create policy imports_read_group on public.imports for select to authenticated using (private.is_group_member(group_id));
create policy imports_insert_admin on public.imports for insert to authenticated with check (private.has_group_role(group_id, array['owner','admin']::public.member_role[]) and created_by = (select auth.uid()) and status = 'pending');
create policy imports_update_admin on public.imports for update to authenticated using (private.has_group_role(group_id, array['owner','admin']::public.member_role[])) with check (private.has_group_role(group_id, array['owner','admin']::public.member_role[]));
create policy imports_delete_owner on public.imports for delete to authenticated using (private.has_group_role(group_id, array['owner']::public.member_role[]));

create policy metrics_read_active_group on public.message_metrics for select to authenticated using (private.is_group_member(group_id) and (import_id = (select active_import_id from public.groups where id = group_id) or private.has_group_role(group_id, array['owner','admin']::public.member_role[])));
create policy metrics_insert_pending_admin on public.message_metrics for insert to authenticated with check (private.has_group_role(group_id, array['owner','admin']::public.member_role[]) and exists(select 1 from public.imports i where i.id = import_id and i.group_id = message_metrics.group_id and i.status = 'pending' and i.created_by = (select auth.uid())));
create policy metrics_delete_admin on public.message_metrics for delete to authenticated using (private.has_group_role(group_id, array['owner','admin']::public.member_role[]));

create policy events_read_active_group on public.group_events for select to authenticated using (private.is_group_member(group_id) and (import_id = (select active_import_id from public.groups where id = group_id) or private.has_group_role(group_id, array['owner','admin']::public.member_role[])));
create policy events_insert_pending_admin on public.group_events for insert to authenticated with check (private.has_group_role(group_id, array['owner','admin']::public.member_role[]) and exists(select 1 from public.imports i where i.id = import_id and i.group_id = group_events.group_id and i.status = 'pending' and i.created_by = (select auth.uid())));
create policy events_delete_admin on public.group_events for delete to authenticated using (private.has_group_role(group_id, array['owner','admin']::public.member_role[]));

create or replace function public.get_available_years(p_group_id uuid)
returns table(year integer) language sql stable security invoker set search_path = public, pg_temp as $$
  select distinct extract(year from timezone(g.timezone, m.occurred_at))::integer
  from public.groups g join public.message_metrics m on m.import_id = g.active_import_id and m.group_id = g.id
  join public.source_members s on s.group_id = m.group_id and s.source_user_id = m.source_user_id and not s.is_excluded
  where g.id = p_group_id order by 1 desc;
$$;

create or replace function public.get_recap_summary(p_group_id uuid, p_from timestamptz default null, p_to timestamptz default null)
returns table(message_count bigint, favorite_count bigint, member_count bigint, active_days bigint, top_reaction text, last_imported_at timestamptz)
language sql stable security invoker set search_path = public, pg_temp as $$
  with filtered as (
    select m.* from public.groups g join public.message_metrics m on m.group_id = g.id and m.import_id = g.active_import_id
    join public.source_members s on s.group_id = m.group_id and s.source_user_id = m.source_user_id and not s.is_excluded
    where g.id = p_group_id and (p_from is null or m.occurred_at >= p_from) and (p_to is null or m.occurred_at <= p_to)
  ), reactions as (
    select r.key, sum((r.value)::integer) total from filtered f cross join lateral jsonb_each_text(f.reaction_counts) r group by r.key order by total desc limit 1
  )
  select count(*)::bigint, coalesce(sum(f.favorite_count),0)::bigint, count(distinct f.source_user_id)::bigint, count(distinct (f.occurred_at at time zone g.timezone)::date)::bigint, (select key from reactions), i.finalized_at
  from public.groups g left join filtered f on true left join public.imports i on i.id = g.active_import_id where g.id = p_group_id group by g.id, i.finalized_at;
$$;

create or replace function public.get_rankings(p_group_id uuid, p_from timestamptz default null, p_to timestamptz default null)
returns table(member_id text, display_name text, message_count bigint, favorite_count bigint, favorite_rate numeric, reaction_counts jsonb)
language sql stable security invoker set search_path = public, pg_temp as $$
  with filtered as (
    select m.* from public.groups g join public.message_metrics m on m.group_id = g.id and m.import_id = g.active_import_id
    where g.id = p_group_id and (p_from is null or m.occurred_at >= p_from) and (p_to is null or m.occurred_at <= p_to)
  ), base as (
    select s.source_user_id, coalesce(s.display_name_override,s.latest_export_name) name, count(f.id)::bigint messages, coalesce(sum(f.favorite_count),0)::bigint favorites
    from public.source_members s join filtered f on f.group_id=s.group_id and f.source_user_id=s.source_user_id where s.group_id=p_group_id and not s.is_excluded group by s.source_user_id,s.display_name_override,s.latest_export_name
  ), reaction_totals as (
    select x.source_user_id, jsonb_object_agg(x.key,x.total) reactions
    from (select f2.source_user_id,r.key,sum((r.value)::integer) total from filtered f2 cross join lateral jsonb_each_text(f2.reaction_counts) r group by f2.source_user_id,r.key) x
    group by x.source_user_id
  )
  select b.source_user_id,b.name,b.messages,b.favorites,case when b.messages=0 then null else round(b.favorites::numeric/b.messages,2) end,coalesce(rt.reactions,'{}'::jsonb)
  from base b left join reaction_totals rt on rt.source_user_id=b.source_user_id order by b.messages desc,b.name;
$$;

create or replace function public.get_timeline(p_group_id uuid, p_from timestamptz default null, p_to timestamptz default null, p_bucket text default 'month', p_member_ids text[] default null)
returns table(label text, bucket_start timestamptz, message_count bigint, favorite_count bigint)
language sql stable security invoker set search_path = public, pg_temp as $$
  select case when p_from is null or p_to is null or p_to-p_from > interval '370 days' then to_char(date_trunc('month',m.occurred_at at time zone g.timezone),'Mon YY') else to_char(date_trunc('month',m.occurred_at at time zone g.timezone),'Mon') end,
    min(date_trunc('month',m.occurred_at)),count(*)::bigint,coalesce(sum(m.favorite_count),0)::bigint
  from public.groups g join public.message_metrics m on m.group_id=g.id and m.import_id=g.active_import_id join public.source_members s on s.group_id=m.group_id and s.source_user_id=m.source_user_id and not s.is_excluded
  where g.id=p_group_id and (p_from is null or m.occurred_at>=p_from) and (p_to is null or m.occurred_at<=p_to) and (p_member_ids is null or m.source_user_id=any(p_member_ids))
  group by date_trunc('month',m.occurred_at at time zone g.timezone) order by date_trunc('month',m.occurred_at at time zone g.timezone);
$$;

create or replace function public.get_member_detail(p_group_id uuid, p_member_id text, p_from timestamptz default null, p_to timestamptz default null)
returns table(member_id text, display_name text, message_count bigint, favorite_count bigint, favorite_rate numeric, reaction_counts jsonb)
language sql stable security invoker set search_path = public, pg_temp as $$
  select r.* from public.get_rankings(p_group_id,p_from,p_to) r where r.member_id=p_member_id;
$$;

create or replace function public.get_group_history(p_group_id uuid, p_from timestamptz default null, p_to timestamptz default null)
returns table(event_id bigint, occurred_at timestamptz, event_type text, display_value text, actor_name text)
language sql stable security invoker set search_path = public, pg_temp as $$
  select e.id,e.occurred_at,e.event_type,e.display_value,coalesce(s.display_name_override,s.latest_export_name)
  from public.groups g join public.group_events e on e.group_id=g.id and e.import_id=g.active_import_id left join public.source_members s on s.group_id=e.group_id and s.source_user_id=e.actor_source_user_id
  where g.id=p_group_id and e.event_type in ('group.name_change','group.topic_change') and (p_from is null or e.occurred_at>=p_from) and (p_to is null or e.occurred_at<=p_to) order by e.occurred_at desc;
$$;

create or replace function public.finalize_import(p_import_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare target public.imports%rowtype; old_import uuid;
begin
  select * into target from public.imports where id=p_import_id for update;
  if target.id is null then raise exception 'Import not found'; end if;
  if target.status <> 'pending' then raise exception 'Only pending imports can be finalized'; end if;
  if not private.has_group_role(target.group_id,array['owner','admin']::public.member_role[]) then raise exception 'Admin access required'; end if;
  if target.created_by <> auth.uid() then raise exception 'Only the import creator can finalize it'; end if;
  if not exists(select 1 from public.message_metrics where import_id=p_import_id) then raise exception 'The import contains no valid messages'; end if;
  select active_import_id into old_import from public.groups where id=target.group_id for update;
  update public.imports set status='active',finalized_at=now() where id=p_import_id;
  update public.groups set active_import_id=p_import_id,updated_at=now() where id=target.group_id;
  if old_import is not null and old_import<>p_import_id then delete from public.imports where id=old_import; end if;
end;
$$;

create or replace function public.claim_group_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public, auth, extensions, pg_temp as $$
declare invite public.group_invites%rowtype; user_email text; display_name text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  user_email=lower(coalesce(auth.jwt()->>'email',''));
  select * into invite from public.group_invites where token_hash=encode(digest(p_token,'sha256'),'hex') for update;
  if invite.id is null or invite.claimed_at is not null or invite.expires_at<=now() then raise exception 'Invite is invalid or expired'; end if;
  if invite.email<>user_email then raise exception 'Use the Google account this invite was sent to'; end if;
  insert into public.memberships(group_id,user_id,source_member_id,role,status) values(invite.group_id,auth.uid(),invite.source_member_id,'member','active');
  display_name=coalesce(auth.jwt()->'user_metadata'->>'full_name',split_part(user_email,'@',1));
  insert into public.profiles(id,display_name,avatar_url) values(auth.uid(),display_name,auth.jwt()->'user_metadata'->>'avatar_url') on conflict(id) do update set display_name=excluded.display_name,avatar_url=excluded.avatar_url,updated_at=now();
  update public.group_invites set claimed_at=now(),claimed_by=auth.uid() where id=invite.id;
  return invite.group_id;
end;
$$;

create or replace function public.set_member_role(p_membership_id uuid, p_role public.member_role)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare target public.memberships%rowtype; caller public.memberships%rowtype;
begin
  select * into target from public.memberships where id=p_membership_id for update;
  if target.id is null then raise exception 'Membership not found'; end if;
  select * into caller from public.memberships where group_id=target.group_id and user_id=auth.uid() and status='active' for update;
  if caller.role<>'owner' then raise exception 'Only the owner can change roles'; end if;
  if target.user_id=caller.user_id and p_role<>'owner' then raise exception 'Transfer ownership to another member before changing your own role'; end if;
  if p_role='owner' and target.user_id<>caller.user_id then
    update public.memberships set role='admin',updated_at=now() where id=caller.id;
  end if;
  update public.memberships set role=p_role,updated_at=now() where id=target.id;
end;
$$;

revoke all on function public.finalize_import(uuid) from public;
revoke all on function public.claim_group_invite(text) from public;
revoke all on function public.set_member_role(uuid,public.member_role) from public;
grant execute on function public.finalize_import(uuid) to authenticated;
grant execute on function public.claim_group_invite(text) to authenticated;
grant execute on function public.set_member_role(uuid,public.member_role) to authenticated;
grant execute on function public.get_available_years(uuid) to authenticated;
grant execute on function public.get_recap_summary(uuid,timestamptz,timestamptz) to authenticated;
grant execute on function public.get_rankings(uuid,timestamptz,timestamptz) to authenticated;
grant execute on function public.get_timeline(uuid,timestamptz,timestamptz,text,text[]) to authenticated;
grant execute on function public.get_member_detail(uuid,text,timestamptz,timestamptz) to authenticated;
grant execute on function public.get_group_history(uuid,timestamptz,timestamptz) to authenticated;
