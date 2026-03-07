"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TOKENS_PER_BOOST_DAY } from "@/types/database";

export function BoostButton({
  listingId,
  listingUserId,
}: {
  listingId: string;
  listingUserId: string;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("tokens")
      .eq("id", userId)
      .single()
      .then(({ data }) => setTokens(data?.tokens ?? 0));
  }, [userId]);

  if (!userId || userId !== listingUserId) return null;

  async function handleBoost() {
    if (tokens === null || tokens < TOKENS_PER_BOOST_DAY) {
      setMessage(`En az ${TOKENS_PER_BOOST_DAY} jeton gerekli.`);
      return;
    }
    setLoading(true);
    setMessage("");
    const { data: profile } = await supabase
      .from("profiles")
      .select("tokens")
      .eq("id", userId)
      .single();
    if (!profile || profile.tokens < TOKENS_PER_BOOST_DAY) {
      setMessage("Yetersiz jeton.");
      setLoading(false);
      return;
    }
    const newTokens = profile.tokens - TOKENS_PER_BOOST_DAY;
    const boostedUntil = new Date();
    boostedUntil.setDate(boostedUntil.getDate() + 1);
    const { error: updateListingErr } = await supabase
      .from("listings")
      .update({ boosted_until: boostedUntil.toISOString() })
      .eq("id", listingId)
      .eq("user_id", userId);
    if (updateListingErr) {
      setMessage("Güncelleme hatası.");
      setLoading(false);
      return;
    }
    const { error: updateProfileErr } = await supabase
      .from("profiles")
      .update({ tokens: newTokens })
      .eq("id", userId);
    if (updateProfileErr) {
      setMessage("Jeton güncellenemedi.");
      setLoading(false);
      return;
    }
    setTokens(newTokens);
    setMessage("İlan 24 saat öne çıkarıldı.");
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="mt-6 border-t border-stone-200 pt-4">
      <p className="mb-2 text-sm text-stone-500">
        1 gün öne çıkarma: {TOKENS_PER_BOOST_DAY} jeton. Bakiyeniz: {tokens ?? "—"} jeton.
      </p>
      <button
        onClick={handleBoost}
        disabled={loading || (tokens !== null && tokens < TOKENS_PER_BOOST_DAY)}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {loading ? "İşleniyor..." : "Öne çıkar (1 gün)"}
      </button>
      {message && <p className="mt-2 text-sm text-stone-600">{message}</p>}
    </div>
  );
}
