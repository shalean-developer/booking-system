-- Sync "new pricing page" seed data into database (idempotent).
-- Safe to run multiple times.
--
-- This script does 4 things:
-- 1) Ensures core services from pricing page exist in `services`.
-- 2) Ensures pricing rows (base/bedroom/bathroom/service_fee/frequency_discount/extras) exist in `pricing_config`.
-- 3) Ensures promo presets exist in `discount_codes`.
-- 4) Creates + seeds missing feature tables used by new pricing UI:
--    - cleaner_pricing_config
--    - bathroom_pricing_rules
--    - extra_room_pricing_rules

begin;

-- -----------------------------------------------------------------------------
-- 0) ALIGN SERVICE TYPE CONSTRAINTS WITH PRICING PAGE SERVICE SET
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_name = 'services'
      and constraint_name = 'valid_service_type'
  ) then
    alter table services drop constraint if exists valid_service_type;
    alter table services add constraint valid_service_type check (
      service_type in ('Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet', 'Office', 'Window')
    );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_name = 'pricing_config'
      and constraint_name = 'valid_service_type'
  ) then
    alter table pricing_config drop constraint if exists valid_service_type;
    alter table pricing_config add constraint valid_service_type check (
      service_type is null
      or service_type in ('Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet', 'Office', 'Window')
    );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1) SERVICES: add any pricing-page services that are missing
-- -----------------------------------------------------------------------------
with seed_services(service_type, display_name, description, display_order, is_active) as (
  values
    ('Standard', 'Standard Clean', 'Regular cleaning of all rooms, kitchen, and bathrooms', 10, true),
    ('Deep', 'Deep Clean', 'Thorough deep cleaning including inside appliances and cabinets', 20, true),
    ('Move In/Out', 'Move-In/Out Clean', 'Complete clean for property handovers and moves', 30, true),
    ('Office', 'Office Clean', 'Commercial cleaning for offices and business premises', 40, true),
    ('Window', 'Window Clean', 'Interior and exterior window cleaning', 50, true),
    ('Airbnb', 'Airbnb Turnover', 'Quick turnaround clean between Airbnb guests', 60, true),
    ('Carpet', 'Carpet Clean', 'Professional carpet shampooing and steam cleaning', 70, true)
)
insert into services (service_type, display_name, description, display_order, is_active)
select s.service_type, s.display_name, s.description, s.display_order, s.is_active
from seed_services s
where not exists (
  select 1 from services t where lower(t.service_type) = lower(s.service_type)
);

-- -----------------------------------------------------------------------------
-- 2) PRICING_CONFIG: insert missing pricing rows only
-- -----------------------------------------------------------------------------
with seed_pricing(service_type, price_type, item_name, price, notes) as (
  values
    -- Base/room pricing from active pricing-page setup
    ('Standard', 'base', null, 145.00, 'Pricing page seed'),
    ('Standard', 'bedroom', null, 20.00, 'Pricing page seed'),
    ('Standard', 'bathroom', null, 30.00, 'Pricing page seed'),

    ('Deep', 'base', null, 285.00, 'Pricing page seed'),
    ('Deep', 'bedroom', null, 80.00, 'Pricing page seed'),
    ('Deep', 'bathroom', null, 250.00, 'Pricing page seed'),

    ('Move In/Out', 'base', null, 420.00, 'Pricing page seed'),
    ('Move In/Out', 'bedroom', null, 160.00, 'Pricing page seed'),
    ('Move In/Out', 'bathroom', null, 220.00, 'Pricing page seed'),

    ('Airbnb', 'base', null, 195.00, 'Pricing page seed'),
    ('Airbnb', 'bedroom', null, 18.00, 'Pricing page seed'),
    ('Airbnb', 'bathroom', null, 26.00, 'Pricing page seed'),

    ('Carpet', 'base', null, 250.00, 'Pricing page seed'),

    -- Global rows
    (null, 'service_fee', null, 50.00, 'Pricing page seed'),
    (null, 'frequency_discount', 'weekly', 15.00, 'Pricing page seed'),
    (null, 'frequency_discount', 'bi-weekly', 10.00, 'Pricing page seed'),
    (null, 'frequency_discount', 'monthly', 5.00, 'Pricing page seed'),

    -- Extras from pricing page
    (null, 'extra', 'Fridge Clean', 85.00, 'Pricing page seed'),
    (null, 'extra', 'Oven Clean', 95.00, 'Pricing page seed'),
    (null, 'extra', 'Laundry & Folding', 120.00, 'Pricing page seed'),
    (null, 'extra', 'Ironing (per item)', 15.00, 'Pricing page seed'),
    (null, 'extra', 'Balcony / Patio', 65.00, 'Pricing page seed'),
    (null, 'extra', 'Garage Clean', 150.00, 'Pricing page seed'),
    (null, 'extra', 'Pet Hair Removal', 75.00, 'Pricing page seed'),
    (null, 'extra', 'Interior Windows', 55.00, 'Pricing page seed')
)
insert into pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
select
  sp.service_type,
  sp.price_type,
  sp.item_name,
  sp.price,
  current_date,
  true,
  sp.notes
from seed_pricing sp
where not exists (
  select 1
  from pricing_config pc
  where coalesce(lower(pc.service_type), '') = coalesce(lower(sp.service_type), '')
    and lower(pc.price_type) = lower(sp.price_type)
    and coalesce(lower(pc.item_name), '') = coalesce(lower(sp.item_name), '')
    and pc.is_active = true
);

-- -----------------------------------------------------------------------------
-- 3) PROMO PRESETS: add missing promo/discount codes
-- -----------------------------------------------------------------------------
with seed_codes(
  code,
  description,
  discount_type,
  discount_value,
  min_purchase_amount,
  max_discount_amount,
  valid_from,
  valid_until,
  usage_limit,
  is_active,
  applicable_services,
  notes
) as (
  values
    ('WELCOME20', '20% off for new customers', 'percentage', 20.00, 0.00, null::numeric, current_date, date '2025-12-31', 100, true, null::text[], 'Pricing page seed'),
    ('DEEP50', 'R50 flat off on Deep Clean bookings', 'fixed', 50.00, 200.00, null::numeric, current_date, date '2025-09-30', 50, true, array['deep']::text[], 'Pricing page seed'),
    ('SUMMER15', '15% summer discount on all services', 'percentage', 15.00, 150.00, null::numeric, current_date, date '2025-03-31', null::int, false, null::text[], 'Pricing page seed'),
    ('AIRBNB100', 'R100 off Airbnb Turnover bookings', 'fixed', 100.00, 195.00, null::numeric, current_date, null::date, 30, true, array['airbnb']::text[], 'Pricing page seed')
)
insert into discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_purchase_amount,
  max_discount_amount,
  valid_from,
  valid_until,
  usage_limit,
  is_active,
  applicable_services,
  notes
)
select
  sc.code,
  sc.description,
  sc.discount_type,
  sc.discount_value,
  sc.min_purchase_amount,
  sc.max_discount_amount,
  sc.valid_from,
  sc.valid_until,
  sc.usage_limit,
  sc.is_active,
  sc.applicable_services,
  sc.notes
from seed_codes sc
where not exists (
  select 1 from discount_codes dc where upper(dc.code) = upper(sc.code)
);

-- -----------------------------------------------------------------------------
-- 4) TABLES MISSING FROM CURRENT PRICING BACKEND: create + seed
-- -----------------------------------------------------------------------------
create table if not exists cleaner_pricing_config (
  id uuid primary key default gen_random_uuid(),
  cleaner_type text not null check (cleaner_type in ('individual', 'team')),
  base_rate numeric(10,2) not null default 0,
  additional_cleaner_rate numeric(10,2) not null default 0,
  label text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into cleaner_pricing_config (cleaner_type, base_rate, additional_cleaner_rate, label, description, is_active)
select *
from (
  values
    ('individual', 145.00, 0.00, 'Individual Cleaner', 'Single cleaner assignment for standard bookings', true),
    ('team', 245.00, 95.00, 'Team Clean (2+ cleaners)', 'Multi-cleaner team for large or deep clean jobs', true)
) as v(cleaner_type, base_rate, additional_cleaner_rate, label, description, is_active)
where not exists (
  select 1 from cleaner_pricing_config c where c.cleaner_type = v.cleaner_type
);

create table if not exists bathroom_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  price numeric(10,2) not null default 0,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into bathroom_pricing_rules (label, price, description, is_active, sort_order)
select *
from (
  values
    ('1 Bathroom', 0.00, 'Included in base price', true, 10),
    ('2 Bathrooms', 85.00, 'Additional bathroom surcharge', true, 20),
    ('3 Bathrooms', 160.00, 'Two extra bathrooms surcharge', true, 30),
    ('4+ Bathrooms', 230.00, 'Three+ extra bathrooms surcharge', true, 40)
) as v(label, price, description, is_active, sort_order)
where not exists (
  select 1 from bathroom_pricing_rules b where lower(b.label) = lower(v.label)
);

create table if not exists extra_room_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into extra_room_pricing_rules (name, price, description, icon, is_active, sort_order)
select *
from (
  values
    ('Study / Home Office', 120.00, 'Full clean of a dedicated home office or study', '💼', true, 10),
    ('Dining Room', 95.00, 'Clean dining area including table and chairs', '🪑', true, 20),
    ('Lounge / Sitting Room', 110.00, 'Additional lounge or sitting area', '🛋️', true, 30),
    ('Linen Room / Utility', 85.00, 'Utility room, linen cupboard area', '🧺', true, 40),
    ('Playroom', 130.00, 'Dedicated kids playroom including toys tidy', '🧸', true, 50),
    ('Gym / Fitness Room', 145.00, 'Equipment wipe-down and floor clean', '🏋️', false, 60),
    ('Wine Cellar', 180.00, 'Deep clean of a dedicated wine room', '🍷', false, 70)
) as v(name, price, description, icon, is_active, sort_order)
where not exists (
  select 1 from extra_room_pricing_rules e where lower(e.name) = lower(v.name)
);

commit;

-- Optional verification checks
select 'services_missing_after_sync' as check_name, count(*) as missing_count
from (
  select service_type from (values
    ('Standard'), ('Deep'), ('Move In/Out'), ('Office'), ('Window'), ('Airbnb'), ('Carpet')
  ) v(service_type)
  except
  select service_type from services
) m
union all
select 'pricing_config_active_rows', count(*) from pricing_config where is_active = true
union all
select 'discount_codes_total', count(*) from discount_codes
union all
select 'cleaner_pricing_config_total', count(*) from cleaner_pricing_config
union all
select 'bathroom_pricing_rules_total', count(*) from bathroom_pricing_rules
union all
select 'extra_room_pricing_rules_total', count(*) from extra_room_pricing_rules;
