-- Persisted pricing snapshots for locked checkout (source of truth for Paystack + webhooks).

create table if not exists public.booking_pricing_snapshots (
  id uuid primary key default gen_random_uuid(),

  pricing_hash text not null,
  pricing_lock_token text not null,
  pricing_version text not null,

  snapshot_json jsonb not null,

  final_price integer not null,
  currency text not null default 'ZAR',

  expires_at timestamptz not null,
  created_at timestamptz not null default now(),

  booking_id text null references public.bookings(id) on delete set null,
  user_id uuid null
);

create index if not exists idx_snapshot_expires on public.booking_pricing_snapshots(expires_at);
create index if not exists idx_snapshot_hash on public.booking_pricing_snapshots(pricing_hash);

alter table if exists public.bookings
  add column if not exists pricing_snapshot_id uuid null references public.booking_pricing_snapshots(id) on delete set null;

create index if not exists idx_bookings_pricing_snapshot_id on public.bookings(pricing_snapshot_id);

comment on table public.booking_pricing_snapshots is 'Authoritative locked pricing rows; final_price is whole currency units (ZAR).';

-- Optional retention: remove expired rows older than 1 day (run via pg_cron or external cron).
-- delete from public.booking_pricing_snapshots where expires_at < now() - interval '1 day';
