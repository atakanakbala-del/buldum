"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MessageButton({
  listingId,
  listingOwnerId,
  listingTitle,
}: {
  listingId: string;
  listingOwnerId: string;
  listingTitle: string;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  async function handleClick() {
    if (!userId || userId === listingOwnerId) return;
    setLoading(true);
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", userId)
      .maybeSingle();
    if (existing?.id) {
      router.push(`/mesajlar?c=${existing.id}`);
      return;
    }
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        listing_id: listingId,
        owner_id: listingOwnerId,
        buyer_id: userId,
      })
      .select("id")
      .single();
    setLoading(false);
    if (error) {
      return;
    }
    if (created?.id) router.push(`/mesajlar?c=${created.id}`);
  }

  if (!userId) return null;
  if (userId === listingOwnerId) return null;

  return (
    <div className="mt-6 border-t border-stone-200 pt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
      >
        {loading ? "Açılıyor..." : "Mesaj Gönder"}
      </button>
      <p className="mt-2 text-sm text-stone-500">
        &quot;{listingTitle}&quot; ilanı hakkında mesaj yazın.
      </p>
    </div>
  );
}
