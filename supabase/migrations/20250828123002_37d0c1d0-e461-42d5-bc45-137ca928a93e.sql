-- Fix security issues by updating functions with proper search_path
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- 4. Create prescription requests table (submitted by patients)
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
do $$ begin
    if not exists (select 1 from pg_policies where tablename = 'prescription_requests' and policyname = 'Public can create prescription requests') then
        create policy "Public can create prescription requests"
        on public.prescription_requests for insert
        with check (true);
    end if;
    
    if not exists (select 1 from pg_policies where tablename = 'prescription_requests' and policyname = 'Doctors can view all requests') then
        create policy "Doctors can view all requests"
        on public.prescription_requests for select
        using (public.has_role(auth.uid(), 'doctor'));
    end if;
    
    if not exists (select 1 from pg_policies where tablename = 'prescription_requests' and policyname = 'Doctors can update requests') then
        create policy "Doctors can update requests"
        on public.prescription_requests for update
        using (public.has_role(auth.uid(), 'doctor'));
    end if;
end$$;

-- 5. Create prescriptions table (finalized documents)
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
do $$ begin
    if not exists (select 1 from pg_policies where tablename = 'prescriptions' and policyname = 'Doctors can create prescriptions') then
        create policy "Doctors can create prescriptions"
        on public.prescriptions for insert
        with check (public.has_role(auth.uid(), 'doctor') and auth.uid() = doctor_id);
    end if;
    
    if not exists (select 1 from pg_policies where tablename = 'prescriptions' and policyname = 'Doctors can view their prescriptions') then
        create policy "Doctors can view their prescriptions"
        on public.prescriptions for select
        using (public.has_role(auth.uid(), 'doctor') and auth.uid() = doctor_id);
    end if;
end$$;

-- 6. Storage bucket for prescriptions (private)
insert into storage.buckets (id, name, public) 
values ('prescriptions', 'prescriptions', false) 
on conflict (id) do nothing;

-- Storage policies for prescriptions bucket
do $$ begin
    if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'Doctors can read prescriptions files') then
        create policy "Doctors can read prescriptions files"
        on storage.objects for select
        using (bucket_id = 'prescriptions' and public.has_role(auth.uid(), 'doctor'));
    end if;
    
    if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'Doctors can upload prescriptions files') then
        create policy "Doctors can upload prescriptions files"
        on storage.objects for insert
        with check (bucket_id = 'prescriptions' and public.has_role(auth.uid(), 'doctor'));
    end if;
end$$;