insert into public.shop_products (name, slug, sku, short_description, description, price, tax_rate, stock, track_stock, images, is_published, sort_order, seo_title, seo_description)
values (
  'Geschenkgutschein',
  'geschenkgutschein',
  'GT-VOUCHER',
  'Das perfekte Geschenk für alle, die reisen wollen.',
  'METROPOL TOURS Geschenkgutschein – einlösbar auf alle Busreisen, Wochenendtrips und Pauschalreisen auf metours.de. Der Gutscheincode wird per E-Mail geliefert und ist 3 Jahre gültig.',
  0, 19, 9999, false, '[]'::jsonb, true, 1,
  'Geschenkgutschein für Busreisen | Metropol Tours',
  'METROPOL TOURS Geschenkgutschein: einlösbar auf alle Busreisen und Pauschalreisen. Per E-Mail geliefert, 3 Jahre gültig.'
)
on conflict (slug) do nothing;

insert into public.shop_product_variants (product_id, option_name, option_value, price_modifier, stock, is_active)
select p.id, 'Betrag', v.label, v.amount, 9999, true
from public.shop_products p
cross join (values ('25 €', 25), ('50 €', 50), ('75 €', 75), ('100 €', 100)) as v(label, amount)
where p.slug = 'geschenkgutschein'
  and not exists (
    select 1 from public.shop_product_variants ex
    where ex.product_id = p.id and ex.option_value = v.label
  );