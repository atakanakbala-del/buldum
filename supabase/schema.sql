-- ============================================================
-- BULDUM – Supabase veritabanı kurulumu
-- Supabase Dashboard → SQL Editor → New query → Yapıştır → Run
-- ============================================================
-- Tablolar: public.profiles, public.listings
-- + Trigger, RLS, Storage bucket, İndeksler
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLO: profiles (kullanıcı profili ve jeton bakiyesi)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  tokens integer not null default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. TABLO: listings (ilanlar)
-- ------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in ('elektronik', 'giyim', 'ev-yasam', 'arac')),
  city text not null,
  image_urls text[] default '{}',
  boosted_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. TRIGGER: Yeni kayıt olan kullanıcıya otomatik profil + 10 jeton
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, tokens)
  values (new.id, new.email, 10);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 4. TRIGGER: updated_at alanını otomatik güncelle
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at before update on public.listings for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- 5. RLS (Row Level Security) – profiles
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Profiles: read own" on public.profiles;
create policy "Profiles: read own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: update own" on public.profiles for update using (auth.uid() = id);

-- ------------------------------------------------------------
-- 6. RLS – listings
-- ------------------------------------------------------------
alter table public.listings enable row level security;

drop policy if exists "Listings: anyone can read" on public.listings;
create policy "Listings: anyone can read" on public.listings for select using (true);

drop policy if exists "Listings: insert own" on public.listings;
create policy "Listings: insert own" on public.listings for insert with check (auth.uid() = user_id);

drop policy if exists "Listings: update own" on public.listings;
create policy "Listings: update own" on public.listings for update using (auth.uid() = user_id);

drop policy if exists "Listings: delete own" on public.listings;
create policy "Listings: delete own" on public.listings for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. STORAGE: İlan fotoğrafları bucket'ı
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

drop policy if exists "Listing images: public read" on storage.objects;
create policy "Listing images: public read" on storage.objects for select using (bucket_id = 'listing-images');

drop policy if exists "Listing images: authenticated upload" on storage.objects;
create policy "Listing images: authenticated upload" on storage.objects for insert with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');

drop policy if exists "Listing images: own delete" on storage.objects;
create policy "Listing images: own delete" on storage.objects for delete using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ------------------------------------------------------------
-- 8. İNDEKSLER (performans)
-- ------------------------------------------------------------
create index if not exists listings_user_id on public.listings(user_id);
create index if not exists listings_category on public.listings(category);
create index if not exists listings_city on public.listings(city);
create index if not exists listings_boosted_until on public.listings(boosted_until) where boosted_until is not null;
create index if not exists listings_created_at on public.listings(created_at desc);
