-- Create a table for public customers
create table if not exists public.customers (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default now(),
  full_name text,
  avatar_url text,
  phone text unique,
  is_anonymous boolean default false,
  push_subscription jsonb
);

-- Set up Row Level Security (RLS)
alter table public.customers enable row level security;

-- Drop existing policies if they exist to avoid errors
drop policy if exists "Public customers are viewable by everyone." on public.customers;
drop policy if exists "Users can insert their own customer profile." on public.customers;
drop policy if exists "Users can update their own customer profile." on public.customers;

create policy "Public customers are viewable by everyone." on public.customers
  for select using (true);

create policy "Users can insert their own customer profile." on public.customers
  for insert with check (auth.uid() = id);

create policy "Users can update their own customer profile." on public.customers
  for update using (auth.uid() = id);

-- Idempotent trigger function for CUSTOMERS only
create or replace function public.handle_new_customer()
returns trigger as $$
begin
  -- Check if user is an admin or explicitly marked to skip customer creation
  if (new.raw_user_meta_data->>'role') in ('admin', 'super_admin') or 
     (new.raw_user_meta_data->>'skip_customer')::boolean = true then
    return new;
  end if;

  insert into public.customers (id, full_name, avatar_url, phone, is_anonymous)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.phone,
    (case when (new.email is null or new.email = '') and (new.phone is null or new.phone = '') then true else false end)
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid "already exists" error
drop trigger if exists on_auth_user_created_customers on auth.users;

create trigger on_auth_user_created_customers
  after insert on auth.users
  for each row execute procedure public.handle_new_customer();
