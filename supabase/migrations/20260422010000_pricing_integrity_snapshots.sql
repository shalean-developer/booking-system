-- Pricing integrity ledger for pending checkout + confirmation validation.

alter table if exists public.bookings
  add column if not exists pricing_snapshot jsonb,
  add column if not exists pricing_hash text;

create table if not exists public.pending_bookings (
  booking_id text primary key references public.bookings(id) on delete cascade,
  pricing_snapshot jsonb not null,
  pricing_hash text not null,
  server_total numeric(10,2) not null,
  total_amount_cents integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_integrity_events (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  booking_id text null,
  client_total numeric(10,2) null,
  server_total numeric(10,2) not null,
  client_hash text null,
  server_hash text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pending_bookings_status on public.pending_bookings(status);
create index if not exists idx_pricing_integrity_events_booking on public.pricing_integrity_events(booking_id);

create or replace function public.touch_pending_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pending_bookings_updated_at on public.pending_bookings;
create trigger trg_pending_bookings_updated_at
before update on public.pending_bookings
for each row execute function public.touch_pending_bookings_updated_at();
