-- ============================================================
-- MAGAZZINO FAMILIARE - Schema Supabase
-- Esegui questo SQL nell'editor SQL di Supabase
-- ============================================================

-- Abilita l'estensione uuid
create extension if not exists "uuid-ossp";

-- Tabella categorie
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('lavoro', 'casa')) not null,
  color text not null default '#3B82F6',
  icon text not null default '📦',
  created_at timestamptz default now()
);

-- Tabella materiali
create table if not exists materials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category_id uuid references categories(id) on delete set null,
  unit text not null default 'pz',
  current_stock decimal not null default 0,
  min_stock decimal not null default 0,
  created_at timestamptz default now()
);

-- Tabella movimenti
create table if not exists movements (
  id uuid default gen_random_uuid() primary key,
  material_id uuid references materials(id) on delete cascade not null,
  quantity decimal not null check (quantity > 0),
  type text check (type in ('in', 'out')) not null,
  notes text,
  voice_input text,
  created_at timestamptz default now()
);

-- Indici per performance
create index if not exists idx_materials_category on materials(category_id);
create index if not exists idx_movements_material on movements(material_id);
create index if not exists idx_movements_created on movements(created_at desc);

-- Abilita Row Level Security (RLS)
alter table categories enable row level security;
alter table materials enable row level security;
alter table movements enable row level security;

-- Policy: accesso pubblico (per uso familiare senza autenticazione)
-- ATTENZIONE: per un uso multi-utente con autenticazione, modifica queste policy
create policy "Public read categories" on categories for select using (true);
create policy "Public write categories" on categories for all using (true);

create policy "Public read materials" on materials for select using (true);
create policy "Public write materials" on materials for all using (true);

create policy "Public read movements" on movements for select using (true);
create policy "Public write movements" on movements for all using (true);

-- Abilita Realtime per le tabelle
alter publication supabase_realtime add table materials;
alter publication supabase_realtime add table movements;
alter publication supabase_realtime add table categories;
