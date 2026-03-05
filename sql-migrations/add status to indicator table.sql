alter table public.indicators
  add column status text
    check (status in ('active', 'inactive', 'draft'))
    default 'active';

-- (optional) backfill from is_active
update public.indicators
set status = case
    when is_active = true then 'active'
    when is_active = false then 'inactive'
    else 'draft'
end
where status is null;