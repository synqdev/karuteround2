-- =====================================================
-- Karute v1 Initial Schema
-- =====================================================

-- profiles: one per auth.users — links a user to a business (customer_id) and stores staff info
-- Defined first so foreign key references in other tables resolve cleanly.
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  customer_id uuid not null,  -- the business this staff member belongs to
  full_name text,
  role text default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users view profiles in same business"
  on profiles for select to authenticated
  using (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  );

create policy "Users update own profile"
  on profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- customers: businesses' client records
create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid not null,  -- the business (tenant) this customer belongs to
  name text not null,
  contact_info text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table customers enable row level security;

create policy "Users access own customer's clients"
  on customers for all to authenticated
  using (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  )
  with check (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  );

-- karute_records: session records linking a customer to a staff session
create table if not exists karute_records (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid not null,
  client_id uuid references customers(id) on delete cascade not null,
  staff_profile_id uuid references profiles(id) on delete set null,
  session_date timestamptz default now() not null,
  transcript text,
  summary text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table karute_records enable row level security;

create policy "Users access own customer's records"
  on karute_records for all to authenticated
  using (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  )
  with check (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  );

-- entries: individual AI-extracted or manually added karute entries
create table if not exists entries (
  id uuid default gen_random_uuid() primary key,
  karute_record_id uuid references karute_records(id) on delete cascade not null,
  customer_id uuid not null,
  category text not null check (category in ('Preference', 'Treatment', 'Lifestyle', 'Physical', 'Note')),
  title text not null,
  source_quote text,
  confidence_score numeric(3,2) check (confidence_score >= 0 and confidence_score <= 1),
  is_manual boolean default false not null,
  created_at timestamptz default now() not null
);

alter table entries enable row level security;

create policy "Users access own customer's entries"
  on entries for all to authenticated
  using (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  )
  with check (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  );

-- Auto-create profile row when a new auth user signs up
-- customer_id must be set manually or via an admin flow after creation
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, customer_id, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'customer_id')::uuid, gen_random_uuid()),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_customers_updated_at before update on customers
  for each row execute procedure update_updated_at_column();

create trigger update_karute_records_updated_at before update on karute_records
  for each row execute procedure update_updated_at_column();
