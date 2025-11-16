-- ============================================
-- CLEANER PAYOUT SETTINGS TABLE
-- ============================================
create table if not exists cleaner_payout_settings (
  cleaner_id uuid primary key references cleaners(id) on delete cascade,
  bank_name text,
  account_holder text,
  account_number text,
  account_type text, -- 'cheque' | 'savings' | 'business'
  branch_code text,
  updated_at timestamp tz not null default now()
);

alter table cleaner_payout_settings enable row level security;

-- Allow cleaners to manage their own payout settings via service API (server checks)
drop policy if exists "read payout settings" on cleaner_payout_settings;
create policy "read payout settings" on cleaner_payout_settings
for select
using (true);

drop policy if exists "upsert payout settings" on cleaner_payout_settings;
create policy "upsert payout settings" on cleaner_payout_settings
for insert
with check (true);

create policy "update payout settings" on cleaner_payout_settings
for update
using (true);




