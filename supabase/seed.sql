-- Sample VogueGarb products. Replace image_url values with your own photos
-- (put files in /public/products/ or use Supabase Storage URLs).
insert into public.products (name, slug, description, price, category, image_url, sizes) values
('Ankara Peplum Gown',   'ankara-peplum-gown',   'Tailored Ankara gown with a structured peplum waist.',        45000, 'dresses',    '/products/ankara-peplum-gown.jpg',   '{S,M,L,XL}'),
('Aso Oke Agbada Set',   'aso-oke-agbada-set',   'Three-piece Aso Oke agbada set for weddings and events.',     120000,'menswear',   '/products/aso-oke-agbada-set.jpg',   '{M,L,XL,XXL}'),
('Lace Corset Dress',    'lace-corset-dress',    'Fitted lace corset dress with a flowing skirt.',              68000, 'dresses',    '/products/lace-corset-dress.jpg',    '{S,M,L}'),
('Senator Wear Set',     'senator-wear-set',     'Classic senator top and trouser, clean finish.',              38000, 'menswear',   '/products/senator-wear-set.jpg',     '{M,L,XL,XXL}'),
('Kaftan Two-Piece',     'kaftan-two-piece',     'Relaxed kaftan with matching trousers. Breathable fabric.',   42000, 'casual',     '/products/kaftan-two-piece.jpg',     '{S,M,L,XL}'),
('Adire Wrap Skirt',     'adire-wrap-skirt',     'Hand-dyed Adire wrap skirt, adjustable waist.',               22000, 'skirts',     '/products/adire-wrap-skirt.jpg',     '{S,M,L}'),
('Bespoke Asoebi Gele',  'asoebi-gele-set',      'Matching gele and wrapper set for group asoebi orders.',      30000, 'accessories','/products/asoebi-gele-set.jpg',      '{One Size}'),
('Tailored Ankara Shirt','tailored-ankara-shirt','Slim-fit Ankara shirt, made to sit sharp.',                   18000, 'menswear',   '/products/tailored-ankara-shirt.jpg','{S,M,L,XL}')
on conflict (slug) do nothing;
