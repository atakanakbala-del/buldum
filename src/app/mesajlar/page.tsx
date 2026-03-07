"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  listing_id: string;
  owner_id: string;
  buyer_id: string;
  updated_at: string;
  listing?: { title: string } | null;
};

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function MesajlarContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("c");
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return;
      setUser({ id: u.id });
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("conversations")
      .select("id, listing_id, owner_id, buyer_id, updated_at, listing:listings(title)")
      .or(`owner_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setConversations((data as Conversation[]) ?? []));
  }, [user]);

  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      return;
    }
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) ?? []));

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          supabase
            .from("messages")
            .select("id, sender_id, body, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .then(({ data }) => setMessages((data as Message[]) ?? []));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId || !user) return;
    supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .then(({ data: msgs }) => {
        if (!msgs?.length) return;
        const ids = msgs.map((m) => m.id);
        supabase.from("message_reads").upsert(
          ids.map((message_id) => ({ message_id, user_id: user.id })),
          { onConflict: "message_id,user_id", ignoreDuplicates: true }
        );
      });
  }, [conversationId, user, messages.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!conversationId || !user || !body.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: body.trim(),
    });
    setBody("");
    setSending(false);
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
        Mesajları görmek için{" "}
        <Link href="/giris" className="text-primary-600 hover:underline">giriş yapın</Link>.
      </div>
    );
  }

  const selected = conversations.find((c) => c.id === conversationId);
  const listingTitle = selected?.listing?.title ?? "Konuşma";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">← İlanlar</Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Mesajlar</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-stone-200 bg-white">
          <ul className="divide-y divide-stone-100">
            {conversations.length === 0 ? (
              <li className="p-4 text-sm text-stone-500">Henüz konuşma yok.</li>
            ) : (
              conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/mesajlar?c=${c.id}`}
                    className={`block p-3 text-left transition ${
                      c.id === conversationId ? "bg-primary-50 text-primary-800" : "hover:bg-stone-50"
                    }`}
                  >
                    <p className="font-medium text-stone-900 line-clamp-1">
                      {c.listing?.title ?? "İlan"}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date(c.updated_at).toLocaleDateString("tr-TR")}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </aside>
        <div className="flex flex-col rounded-xl border border-stone-200 bg-white">
          {!conversationId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-stone-500">
              Soldan bir konuşma seçin veya bir ilanda &quot;Mesaj Gönder&quot; ile başlayın.
            </div>
          ) : (
            <>
              <div className="border-b border-stone-200 px-4 py-2 font-medium text-stone-700">
                {listingTitle}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        m.sender_id === user.id
                          ? "bg-primary-500 text-white"
                          : "bg-stone-100 text-stone-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className={`mt-1 text-xs ${m.sender_id === user.id ? "text-primary-100" : "text-stone-500"}`}>
                        {new Date(m.created_at).toLocaleString("tr-TR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="border-t border-stone-200 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !body.trim()}
                    className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                  >
                    Gönder
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MesajlarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Yükleniyor...</div>}>
      <MesajlarContent />
    </Suspense>
  );
}
