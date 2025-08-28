-- 1. Create app roles enum (with proper error handling)
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

-- RLS policy for user_roles
drop policy if exists "Users can view their own roles" on public.user_roles;
create policy "Users can view their own roles"
on public.user_roles for select
using (auth.uid() = user_id);

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
drop policy if exists "Doctors can view their own profile" on public.doctor_profiles;
create policy "Doctors can view their own profile"
on public.doctor_profiles for select
using (auth.uid() = id and public.has_role(auth.uid(), 'doctor'));

drop policy if exists "Doctors can create their own profile" on public.doctor_profiles;
create policy "Doctors can create their own profile"
on public.doctor_profiles for insert
with check (auth.uid() = id and public.has_role(auth.uid(), 'doctor'));

drop policy if exists "Doctors can update their own profile" on public.doctor_profiles;
create policy "Doctors can update their own profile"
on public.doctor_profiles for update
using (auth.uid() = id and public.has_role(auth.uid(), 'doctor'));

-- 4. Create request status enum and prescription requests table
do $$ begin
    create type public.request_status as enum ('pending', 'in_progress', 'completed');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.prescription_requests (
    id uuid primary key default gen_random_uuid(),
    patient_name text not null,
    patient_age text not null,
    patient_gender text not null,
    body_part text not null,
    symptoms text,
    probable_diagnosis text,
    short_summary text,
    basic_investigations text,
    common_treatments text,
    prescription_required boolean not null default true,
    status public.request_status not null default 'pending',
    assigned_doctor_id uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.prescription_requests enable row level security;

-- Apply trigger to prescription_requests
drop trigger if exists trg_prescription_requests_set_updated_at on public.prescription_requests;
create trigger trg_prescription_requests_set_updated_at
    before update on public.prescription_requests
    for each row
    execute function public.set_updated_at();

-- RLS policies for prescription_requests
drop policy if exists "Public can create prescription requests" on public.prescription_requests;
create policy "Public can create prescription requests"
on public.prescription_requests for insert
with check (true);

drop policy if exists "Doctors can view all requests" on public.prescription_requests;
create policy "Doctors can view all requests"
on public.prescription_requests for select
using (public.has_role(auth.uid(), 'doctor'));

drop policy if exists "Doctors can update requests" on public.prescription_requests;
create policy "Doctors can update requests"
on public.prescription_requests for update
using (public.has_role(auth.uid(), 'doctor'));

-- 5. Create prescriptions table
create table if not exists public.prescriptions (
    id uuid primary key default gen_random_uuid(),
    request_id uuid references public.prescription_requests(id) on delete cascade,
    doctor_id uuid references auth.users(id) not null,
    patient_name text not null,
    patient_age text not null,
    patient_gender text not null,
    diagnosis text,
    medications text,
    instructions text,
    follow_up_notes text,
    pdf_url text,
    created_at timestamptz not null default now()
);

alter table public.prescriptions enable row level security;

-- RLS policies for prescriptions
drop policy if exists "Doctors can create prescriptions" on public.prescriptions;
create policy "Doctors can create prescriptions"
on public.prescriptions for insert
with check (public.has_role(auth.uid(), 'doctor') and auth.uid() = doctor_id);

drop policy if exists "Doctors can view their prescriptions" on public.prescriptions;
create policy "Doctors can view their prescriptions"
on public.prescriptions for select
using (public.has_role(auth.uid(), 'doctor') and auth.uid() = doctor_id);

-- 6. Storage bucket for prescriptions (private)
insert into storage.buckets (id, name, public) 
values ('prescriptions', 'prescriptions', false) 
on conflict (id) do nothing;