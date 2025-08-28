-- 1. Create app roles enum (handle if exists)
do $$ begin
    create type public.app_role as enum ('admin', 'doctor');
exception
    when duplicate_object then null;
end $$;

-- 2. Create user roles table
create table if not exists public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role public.app_role not null,
    created_at timestamptz not null default now(),
    unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Function to check if user has role (security definer to bypass RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS policies for user_roles
do $$ begin
    if not exists (select 1 from pg_policies where tablename = 'user_roles' and policyname = 'Users can view their own roles') then
        create policy "Users can view their own roles"
        on public.user_roles for select
        using (auth.uid() = user_id);
    end if;
end$$;

-- 3. Create doctor profiles table
create table if not exists public.doctor_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    specialization text,
    license_number text,
    phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.doctor_profiles enable row level security;

-- Updated at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Apply trigger to doctor_profiles
drop trigger if exists trg_doctor_profiles_set_updated_at on public.doctor_profiles;
create trigger trg_doctor_profiles_set_updated_at
    before update on public.doctor_profiles
    for each row
    execute function public.set_updated_at();

-- RLS policies for doctor_profiles
do $$ begin
    if not exists (select 1 from pg_policies where tablename = 'doctor_profiles' and policyname = 'Doctors can view their own profile') then
        create policy "Doctors can view their own profile"
        on public.doctor_profiles for select
        using (auth.uid() = id and public.has_role(auth.uid(), 'doctor'));
    end if;
    
    if not exists (select 1 from pg_policies where tablename = 'doctor_profiles' and policyname = 'Doctors can create their own profile') then
        create policy "Doctors can create their own profile"
        on public.doctor_profiles for insert
        with check (auth.uid() = id and public.has_role(auth.uid(), 'doctor'));
    end if;
    
    if not exists (select 1 from pg_policies where tablename = 'doctor_profiles' and policyname = 'Doctors can update their own profile') then
        create policy "Doctors can update their own profile"
        on public.doctor_profiles for update
        using (auth.uid() = id and public.has_role(auth.uid(), 'doctor'));
    end if;
end$$;