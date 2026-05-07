-- ============================================================
-- Dati di esempio - esegui DOPO schema.sql
-- ============================================================

insert into categories (name, type, color, icon) values
  ('Elettrico',    'lavoro', '#F59E0B', '⚡'),
  ('Idraulico',    'lavoro', '#3B82F6', '🔧'),
  ('Edilizia',     'lavoro', '#8B5CF6', '🏗️'),
  ('Ferramenta',   'lavoro', '#6B7280', '🔩'),
  ('Cucina',       'casa',   '#10B981', '🍳'),
  ('Pulizia',      'casa',   '#06B6D4', '🧹'),
  ('Giardino',     'casa',   '#84CC16', '🌿'),
  ('Bagno',        'casa',   '#EC4899', '🚿');

-- Inserisci alcuni materiali di esempio
with cats as (select id, name from categories)
insert into materials (name, category_id, unit, current_stock, min_stock)
select m.name, cats.id, m.unit, m.stock, m.min
from (values
  ('Cavo elettrico 1.5mm', 'Elettrico',  'metri', 25, 10),
  ('Cavo elettrico 2.5mm', 'Elettrico',  'metri', 15, 5),
  ('Interruttori',         'Elettrico',  'pz',    8,  3),
  ('Tubo rame 15mm',       'Idraulico',  'metri', 6,  3),
  ('Raccordi 3/4"',        'Idraulico',  'pz',    12, 5),
  ('Cemento',              'Edilizia',   'kg',    50, 20),
  ('Viti 4x40',            'Ferramenta', 'pz',    200, 50),
  ('Detergente pavimenti', 'Pulizia',    'litri', 3,  2),
  ('Candeggina',           'Pulizia',    'litri', 2,  1),
  ('Terriccio',            'Giardino',   'kg',    15, 5)
) as m(name, cat_name, unit, stock, min)
join cats on cats.name = m.cat_name;
