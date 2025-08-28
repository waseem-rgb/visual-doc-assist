
-- Allow customers to view their own prescriptions via the linked request
-- This does NOT weaken doctor-only create/update policies.
create policy "Customers can view their prescriptions"
on public.prescriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.prescription_requests pr
    where pr.id = prescriptions.request_id
      and pr.customer_id = auth.uid()
  )
);

-- Helpful index to speed up request->prescription lookups
create index if not exists prescriptions_request_id_idx on public.prescriptions (request_id);
