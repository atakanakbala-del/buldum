-- ============================================================
-- BULDUM – Mesajlaşma tabloları
-- Supabase SQL Editor'de bu dosyayı schema.sql'den sonra çalıştırın.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLO: conversations (ilan bazlı konuşma: sahip + alıcı)
-- ------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(listing_id, buyer_id)
);

-- ------------------------------------------------------------
-- 2. TABLO: messages
-- ------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. TABLO: message_reads (okundu bilgisi)
-- ------------------------------------------------------------
create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (message_id, user_id)
);

-- ------------------------------------------------------------
-- 4. TRIGGER: Konuşma updated_at güncelle
-- ------------------------------------------------------------
create or replace function public.conversation_updated_at()
returns trigger as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists messages_conversation_updated on public.messages;
create trigger messages_conversation_updated
  after insert on public.messages
  for each row execute procedure public.conversation_updated_at();

-- ------------------------------------------------------------
-- 5. RLS – conversations
-- ------------------------------------------------------------
alter table public.conversations enable row level security;

drop policy if exists "Conversations: participant access" on public.conversations;
create policy "Conversations: participant access" on public.conversations
  for all using (auth.uid() = owner_id or auth.uid() = buyer_id);

drop policy if exists "Conversations: insert as buyer" on public.conversations;
create policy "Conversations: insert as buyer" on public.conversations
  for insert with check (auth.uid() = buyer_id and auth.uid() != owner_id);

-- ------------------------------------------------------------
-- 6. RLS – messages
-- ------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists "Messages: participant access" on public.messages;
create policy "Messages: participant access" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.owner_id = auth.uid() or c.buyer_id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- 7. RLS – message_reads
-- ------------------------------------------------------------
alter table public.message_reads enable row level security;

drop policy if exists "Message reads: own" on public.message_reads;
create policy "Message reads: own" on public.message_reads
  for all using (auth.uid() = user_id);

drop policy if exists "Message reads: insert own" on public.message_reads;
create policy "Message reads: insert own" on public.message_reads
  for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 8. RPC: Okunmamış mesaj sayısı
-- ------------------------------------------------------------
create or replace function public.get_unread_message_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where (c.owner_id = auth.uid() or c.buyer_id = auth.uid())
    and m.sender_id != auth.uid()
    and not exists (
      select 1 from public.message_reads r
      where r.message_id = m.id and r.user_id = auth.uid()
    );
$$;

-- ------------------------------------------------------------
-- 9. İndeksler
-- ------------------------------------------------------------
create index if not exists conversations_listing_id on public.conversations(listing_id);
create index if not exists conversations_buyer_id on public.conversations(buyer_id);
create index if not exists conversations_owner_id on public.conversations(owner_id);
create index if not exists conversations_updated_at on public.conversations(updated_at desc);
create index if not exists messages_conversation_id on public.messages(conversation_id);
create index if not exists messages_created_at on public.messages(created_at);
