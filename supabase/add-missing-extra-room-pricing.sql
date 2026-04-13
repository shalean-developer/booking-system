-- Add missing "Per Extra Room" pricing rows to pricing_config.
-- Safe to run multiple times (idempotent).
--
-- It only inserts rows when there is no ACTIVE extra_room row for a service.
-- Default strategy:
--   1) Use explicit seed value if provided below
--   2) Otherwise fallback to current active bedroom price for that service
--   3) Otherwise fallback to 0

begin;

-- Ensure pricing_config accepts extra_room as a valid price_type
-- without breaking existing legacy price_type values already in table.
do $$
declare
  allowed_values text;
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_name = 'pricing_config'
      and constraint_name = 'valid_price_type'
  ) then
    select string_agg(quote_literal(v), ', ')
    into allowed_values
    from (
      select distinct price_type as v
      from pricing_config
      where price_type is not null
      union
      select 'extra_room'
    ) q;

    alter table pricing_config drop constraint if exists valid_price_type;
    execute format(
      'alter table pricing_config add constraint valid_price_type check (price_type in (%s))',
      allowed_values
    );
  end if;
end $$;

with target_services(service_type, explicit_extra_room_price) as (
  values
    ('Standard', 55.00::numeric),
    ('Deep', 80.00::numeric),
    ('Move In/Out', 75.00::numeric),
    ('Airbnb', 50.00::numeric),
    ('Carpet', 70.00::numeric),
    ('Office', 0.00::numeric),
    ('Window', 0.00::numeric)
),
active_bedroom as (
  select distinct on (pc.service_type)
    pc.service_type,
    pc.price as bedroom_price
  from pricing_config pc
  where pc.is_active = true
    and pc.price_type = 'bedroom'
  order by pc.service_type, pc.effective_date desc nulls last, pc.created_at desc nulls last
),
to_insert as (
  select
    ts.service_type,
    'extra_room'::text as price_type,
    null::text as item_name,
    coalesce(ts.explicit_extra_room_price, ab.bedroom_price, 0)::numeric as price
  from target_services ts
  left join active_bedroom ab
    on lower(ab.service_type) = lower(ts.service_type)
  where not exists (
    select 1
    from pricing_config existing
    where existing.is_active = true
      and lower(coalesce(existing.service_type, '')) = lower(ts.service_type)
      and lower(existing.price_type) = 'extra_room'
      and existing.end_date is null
  )
)
insert into pricing_config (
  service_type,
  price_type,
  item_name,
  price,
  effective_date,
  is_active,
  notes
)
select
  service_type,
  price_type,
  item_name,
  price,
  current_date,
  true,
  'Seeded missing per-extra-room pricing'
from to_insert;

commit;

-- Verification
select
  service_type,
  price_type,
  price,
  effective_date,
  is_active
from pricing_config
where price_type = 'extra_room'
  and is_active = true
order by service_type, effective_date desc;

