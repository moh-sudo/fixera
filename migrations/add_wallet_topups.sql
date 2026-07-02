-- wallet_topups: tracks partner M-Pesa top-up requests
create table if not exists wallet_topups (
  id                  uuid primary key default gen_random_uuid(),
  worker_id           uuid not null references auth.users(id) on delete cascade,
  amount              numeric(12,2) not null,
  phone               text,
  status              text not null default 'initiated',  -- initiated | pending | paid | failed
  mpesa_checkout_id   text,
  mpesa_ref           text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists wallet_topups_worker_id_idx on wallet_topups(worker_id);
create index if not exists wallet_topups_checkout_idx  on wallet_topups(mpesa_checkout_id);

-- RLS: partners can only read/insert their own rows
alter table wallet_topups enable row level security;

create policy "partner select own topups"
  on wallet_topups for select
  using (auth.uid() = worker_id);

create policy "partner insert own topups"
  on wallet_topups for insert
  with check (auth.uid() = worker_id);

-- Service role (used by callback) can update any row
-- (service role bypasses RLS by default — no extra policy needed)


-- Postgres function to safely increment wallet balance (avoids race conditions)
create or replace function increment_wallet_balance(p_worker_id uuid, p_amount numeric)
returns void language sql security definer as $$
  update workers
  set wallet_balance = coalesce(wallet_balance, 0) + p_amount
  where id = p_worker_id;
$$;
