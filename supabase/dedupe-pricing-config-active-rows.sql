-- Dedupe active rows in pricing_config safely.
-- Keeps the newest active row per logical pricing key:
--   (service_type, price_type, item_name)
-- and deactivates older active duplicates.
--
-- Usage:
-- 1) Run SECTION A first (preview only).
-- 2) If output looks correct, run SECTION B (transactional update).

-- ============================================================================
-- SECTION A: PREVIEW duplicates (read-only)
-- ============================================================================
with normalized as (
  select
    id,
    service_type,
    price_type,
    item_name,
    price,
    effective_date,
    created_at,
    is_active,
    coalesce(lower(trim(service_type)), '') as service_key,
    lower(trim(price_type)) as price_type_key,
    coalesce(lower(trim(item_name)), '') as item_key
  from pricing_config
  where is_active = true
),
ranked as (
  select
    n.*,
    row_number() over (
      partition by service_key, price_type_key, item_key
      order by
        effective_date desc nulls last,
        created_at desc nulls last,
        id desc
    ) as rn,
    count(*) over (
      partition by service_key, price_type_key, item_key
    ) as group_count
  from normalized n
)
select
  service_type,
  price_type,
  item_name,
  group_count as active_rows_in_group,
  string_agg(
    concat(
      '[', rn, '] id=', id,
      ' price=', price,
      ' effective=', coalesce(effective_date::text, 'null'),
      ' created=', coalesce(created_at::text, 'null')
    ),
    ' | '
    order by rn
  ) as rows_ordered_newest_first
from ranked
where group_count > 1
group by service_type, price_type, item_name, group_count
order by service_type nulls first, price_type, item_name nulls first;

-- Quick count of rows that WOULD be deactivated:
with normalized as (
  select
    id,
    coalesce(lower(trim(service_type)), '') as service_key,
    lower(trim(price_type)) as price_type_key,
    coalesce(lower(trim(item_name)), '') as item_key,
    effective_date,
    created_at
  from pricing_config
  where is_active = true
),
ranked as (
  select
    n.*,
    row_number() over (
      partition by service_key, price_type_key, item_key
      order by effective_date desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from normalized n
)
select count(*) as rows_to_deactivate
from ranked
where rn > 1;

-- ============================================================================
-- SECTION B: APPLY dedupe (write)
-- ============================================================================
begin;

with normalized as (
  select
    id,
    coalesce(lower(trim(service_type)), '') as service_key,
    lower(trim(price_type)) as price_type_key,
    coalesce(lower(trim(item_name)), '') as item_key,
    effective_date,
    created_at
  from pricing_config
  where is_active = true
),
ranked as (
  select
    n.*,
    row_number() over (
      partition by service_key, price_type_key, item_key
      order by effective_date desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from normalized n
),
to_deactivate as (
  select id
  from ranked
  where rn > 1
),
updated as (
  update pricing_config pc
  set
    is_active = false,
    end_date = coalesce(pc.end_date, current_date),
    updated_at = now()
  where pc.id in (select id from to_deactivate)
  returning pc.id
)
select count(*) as deactivated_rows from updated;

commit;

-- Post-check: should be zero duplicate active groups
with normalized as (
  select
    coalesce(lower(trim(service_type)), '') as service_key,
    lower(trim(price_type)) as price_type_key,
    coalesce(lower(trim(item_name)), '') as item_key
  from pricing_config
  where is_active = true
),
grouped as (
  select service_key, price_type_key, item_key, count(*) as c
  from normalized
  group by service_key, price_type_key, item_key
)
select count(*) as remaining_duplicate_active_groups
from grouped
where c > 1;

