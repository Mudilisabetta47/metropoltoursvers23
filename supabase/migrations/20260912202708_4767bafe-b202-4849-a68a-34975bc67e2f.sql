alter table public.customer_reviews add column if not exists author_name text;
alter table public.customer_reviews add column if not exists source text default 'gaestebuch';
grant select on public.customer_reviews to anon, authenticated;
grant insert, update, delete on public.customer_reviews to authenticated;
grant all on public.customer_reviews to service_role;
create policy "Staff manage reviews"
  on public.customer_reviews for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'office'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'office'));