-- ============================================================
-- Migration: introduce macro_categories table
-- Esegui questo SQL nell'editor SQL di Supabase PRIMA di deployare
-- il nuovo codice. È idempotente: rieseguirla è sicuro.
-- ============================================================

-- 1. Crea tabella macro_categories
create table if not exists macro_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  icon text not null default '📦',
  color text not null default '#3B82F6',
  created_at timestamptz default now()
);

-- 2. Inserisce le 2 macro iniziali (skip se già presenti)
insert into macro_categories (name, icon, color) values
  ('Lavoro', '🔧', '#3B82F6'),
  ('Casa',   '🏠', '#10B981')
on conflict (name) do nothing;

-- 3. Aggiunge colonna macro_category_id a categories (nullable, FK soft-delete)
alter table categories
  add column if not exists macro_category_id uuid
  references macro_categories(id) on delete set null;

-- 4. Migra type → macro_category_id (solo dove non già popolato)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'categories' and column_name = 'type'
  ) then
    update categories set macro_category_id = (
      select id from macro_categories where name = 'Lavoro'
    ) where type = 'lavoro' and macro_category_id is null;

    update categories set macro_category_id = (
      select id from macro_categories where name = 'Casa'
    ) where type = 'casa' and macro_category_id is null;
  end if;
end $$;

-- 5. Rimuove la colonna type (rimuove anche il CHECK constraint)
alter table categories drop column if exists type;

-- 6. Indice
create index if not exists idx_categories_macro on categories(macro_category_id);

-- 7. RLS + policy public per macro_categories
alter table macro_categories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'macro_categories' and policyname = 'Public read macro_categories'
  ) then
    create policy "Public read macro_categories" on macro_categories for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'macro_categories' and policyname = 'Public write macro_categories'
  ) then
    create policy "Public write macro_categories" on macro_categories for all using (true);
  end if;
end $$;

-- 8. Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'macro_categories'
  ) then
    alter publication supabase_realtime add table macro_categories;
  end if;
end $$;
