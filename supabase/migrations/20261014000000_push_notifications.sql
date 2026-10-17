-- device_tokens table
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  platform text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure unique constraint on token exists
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'device_tokens_token_key'
  ) then
    alter table public.device_tokens add constraint device_tokens_token_key unique (token);
  end if;
end $$;

alter table public.device_tokens enable row level security;

drop policy if exists "Users can select their own tokens" on public.device_tokens;
create policy "Users can select their own tokens"
on public.device_tokens for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tokens" on public.device_tokens;
create policy "Users can insert their own tokens"
on public.device_tokens for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tokens" on public.device_tokens;
create policy "Users can update their own tokens"
on public.device_tokens for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own tokens" on public.device_tokens;
create policy "Users can delete their own tokens"
on public.device_tokens for delete
to authenticated
using (auth.uid() = user_id);

-- SECURITY DEFINER RPC function to register/reassign device token
create or replace function public.register_device_token(
  p_token text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.device_tokens (user_id, token, platform, updated_at)
  values (v_user_id, p_token, p_platform, now())
  on conflict (token)
  do update set
    user_id = EXCLUDED.user_id,
    platform = EXCLUDED.platform,
    updated_at = EXCLUDED.updated_at;
end;
$$;

grant execute on function public.register_device_token(text, text) to authenticated;

-- muted_until for conversation_members
alter table public.conversation_members
add column if not exists muted_until timestamptz;

-- show_preview for profiles
alter table public.profiles
add column if not exists show_preview boolean default true;
