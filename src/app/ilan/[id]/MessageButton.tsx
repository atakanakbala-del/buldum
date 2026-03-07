"use client";

import { useEffect, useState } from "react";
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
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, [supabase]);

  async function handleClick() {
    // Giriş yapmamışsa login'e yönlendir
    if (!userId) {
      router.push(`/giris?redirect=/ilan/${listingId}`);
      return;
    }
    // İlan sahibi kendi ilanına mesaj atmasın
    if (userId === listingOwnerId) return;

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
    if (error) {
      console.error("[MessageButton] conversation insert error", error);
      return;
    }
    if (created?.id) router.push(`/mesajlar?c=${created.id}`);
  }

  return (
    <div className="mt-6 border-t border-stone-200 pt-4">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Mesaj Gönder
      </button>
      <p className="mt-2 text-sm text-stone-500">
        &quot;{listingTitle}&quot; ilanı hakkında mesaj yazın.
      </p>
    </div>
  );
}
