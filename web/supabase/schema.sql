-- JIJA TRF Panvel – Textile Donation System (Supabase / Postgres)
-- Run once in Supabase → SQL Editor. Then set SUPABASE_URL and
-- SUPABASE_SERVICE_ROLE_KEY in .env.local and the app switches from demo
-- storage to Supabase automatically.

create table if not exists public.camps (
  slug        text primary key,
  name        text not null unique,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.donations (
  id              text primary key,                -- JTRF-2026-00001
  created_at      timestamptz not null default now(),
  donor_name      text not null,
  donor_type      text not null,
  organization    text not null default '',
  mobile          text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  email           text not null default '',
  address         text not null default '',
  textile_types   text[] not null,
  weight_kg       numeric(10,2) not null check (weight_kg > 0),
  items           integer not null default 0 check (items >= 0),
  footwear_pairs  integer not null default 0 check (footwear_pairs >= 0),
  camp            text not null,
  donation_date   date not null,
  status          text not null default 'issued' check (status in ('issued','void')),
  email_status    text not null default '',
  source          text not null default 'form' check (source in ('form','admin'))
);

create index if not exists donations_created_at_idx on public.donations (created_at desc);
create index if not exists donations_mobile_idx on public.donations (mobile);

-- One counter row per year → IDs restart every year: JTRF-2027-00001
create table if not exists public.id_counters (
  year  integer primary key,
  last  integer not null default 0
);

-- Assigns the next ID and inserts the donation in one transaction.
-- The row lock on id_counters makes parallel submissions safe.
create or replace function public.create_donation(p jsonb)
returns public.donations
language plpgsql
security definer
set search_path = public
as $$
declare
  y   integer := extract(year from (now() at time zone 'Asia/Kolkata'))::int;
  n   integer;
  rec public.donations;
begin
  insert into id_counters (year, last) values (y, 1)
  on conflict (year) do update set last = id_counters.last + 1
  returning last into n;

  insert into donations (
    id, donor_name, donor_type, organization, mobile, email, address,
    textile_types, weight_kg, items, footwear_pairs, camp, donation_date,
    email_status, source
  ) values (
    'JTRF-' || y || '-' || lpad(n::text, 5, '0'),
    p->>'donor_name', p->>'donor_type', coalesce(p->>'organization',''),
    p->>'mobile', coalesce(p->>'email',''), coalesce(p->>'address',''),
    array(select jsonb_array_elements_text(p->'textile_types')),
    (p->>'weight_kg')::numeric, coalesce((p->>'items')::int, 0),
    coalesce((p->>'footwear_pairs')::int, 0), p->>'camp',
    (p->>'donation_date')::date, coalesce(p->>'email_status',''),
    coalesce(p->>'source','form')
  )
  returning * into rec;
  return rec;
end $$;

-- Lock everything down: the Next.js server uses the service-role key.
alter table public.camps       enable row level security;
alter table public.donations   enable row level security;
alter table public.id_counters enable row level security;
revoke execute on function public.create_donation(jsonb) from public, anon, authenticated;

insert into public.camps (slug, name) values
  ('neelkanth-darshan-society-opp-orion-mall-panvel', 'Neelkanth Darshan Society – Opp. Orion Mall, Panvel'),
  ('jija-trf-facility-panvel', 'JIJA TRF Facility – Panvel'),
  ('doorstep-pickup', 'Doorstep Pickup')
on conflict do nothing;
