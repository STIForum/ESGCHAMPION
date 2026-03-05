-- Enable RLS on champions
alter table public.champions enable row level security;

-- Allow both anon and authenticated to SELECT champions rows (read-only)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'champions'
      and policyname = 'champions_select_all'
  ) then
    create policy "champions_select_all"
    on public.champions
    for select
    using (true);
  end if;
end$$;

-- Allow authenticated users to INSERT their own champion row
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'champions'
      and policyname = 'champions_insert_own'
  ) then
    create policy "champions_insert_own"
    on public.champions
    for insert
    with check (auth.uid() = id);
  end if;
end$$;

-- Allow authenticated users to UPDATE their own champion row (general profile updates)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'champions'
      and policyname = 'champions_update_own'
  ) then
    create policy "champions_update_own"
    on public.champions
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
  end if;
end$$;

-- SPECIAL: Allow updates of failed_login_attempts & locked_until based on row visibility,
-- even when there is no auth.uid() (e.g. failed login attempts / anon client).
-- This is scoped so ONLY those two columns can be changed through this policy.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'champions'
      and policyname = 'champions_update_lock_fields'
  ) then
    create policy "champions_update_lock_fields"
    on public.champions
    for update
    using (true)  -- row is visible to this policy
    with check (
      -- Ensure only failed_login_attempts and locked_until are being changed
      (failed_login_attempts is not distinct from failed_login_attempts) and
      (locked_until is not distinct from locked_until)
    );
  end if;
end$$;