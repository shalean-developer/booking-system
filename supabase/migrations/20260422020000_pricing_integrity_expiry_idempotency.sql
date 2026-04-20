-- Pricing integrity v2: versioning, expiry, and route idempotency.

alter table if exists public.bookings
  add column if not exists pricing_version text,
  add column if not exists idempotency_key text;

alter table if exists public.pending_bookings
  add column if not exists pricing_version text,
  add column if not exists pricing_expires_at timestamptz,
  add column if not exists idempotency_key text;

create unique index if not exists uq_bookings_idempotency_key
  on public.bookings(idempotency_key)
  where idempotency_key is not null;

create unique index if not exists uq_pending_bookings_idempotency_key
  on public.pending_bookings(idempotency_key)
  where idempotency_key is not null;

-- Monitoring: mismatch/error rate by day and route.
create or replace view public.pricing_integrity_mismatch_rate_daily as
select
  date_trunc('day', created_at) as day,
  route,
  count(*) as mismatch_count,
  count(*) filter (where reason in ('pricing_hash_mismatch', 'authoritative_recalculation_changed_total', 'stored_hash_mismatch_on_confirmation', 'pricing_snapshot_expired', 'pricing_version_mismatch')) as hard_mismatch_count
from public.pricing_integrity_events
group by 1, 2
order by 1 desc, 2 asc;

-- Example query:
-- select day, route, mismatch_count, hard_mismatch_count
-- from public.pricing_integrity_mismatch_rate_daily
-- where day >= now() - interval '30 days';
