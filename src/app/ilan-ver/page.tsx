"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIES,
  FREE_PHOTOS,
  MAX_PHOTOS,
  TOKENS_PER_EXTRA_PHOTO,
  type CategorySlug,
} from "@/types/database";
import { v4 as uuidv4 } from "uuid";

const CITIES = [
  "Adana", "Ankara", "Antalya", "Aydın", "Balıkesir", "Bursa", "Denizli",
  "Diyarbakır", "Gaziantep", "Hatay", "İstanbul", "İzmir", "Kayseri", "Kocaeli",
  "Konya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Samsun",
  "Şanlıurfa", "Trabzon", "Van",
];

export default function IlanVerPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategorySlug>("elektronik");
  const [city, setCity] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/giris?redirect=/ilan-ver");
      setAuthChecked(true);
    });
  }, [supabase.auth, router]);

  const extraPhotos = Math.max(0, files.length - FREE_PHOTOS);
  const tokenCost = extraPhotos * TOKENS_PER_EXTRA_PHOTO;

  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-stone-500">
        Yükleniyor...
      </div>
    );
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    if (files.length + chosen.length > MAX_PHOTOS) {
      setError(`En fazla ${MAX_PHOTOS} fotoğraf yükleyebilirsiniz.`);
      return;
    }
    setFiles((prev) => [...prev, ...chosen].slice(0, MAX_PHOTOS));
    setError("");
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("İlan vermek için giriş yapmalısınız.");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("tokens")
      .eq("id", user.id)
      .single();
    if (!profile || profile.tokens < tokenCost) {
      setError(`Ek fotoğraflar için ${tokenCost} jeton gerekli. Bakiyeniz: ${profile?.tokens ?? 0}.`);
      return;
    }
    setLoading(true);
    const imageUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${uuidv4()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { upsert: false });
      if (uploadErr) {
        setError(`Fotoğraf yüklenemedi: ${uploadErr.message}`);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
      imageUrls.push(urlData.publicUrl);
    }
    const { error: insertErr } = await supabase.from("listings").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      city: city || null,
      image_urls: imageUrls,
    });
    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }
    if (tokenCost > 0) {
      await supabase
        .from("profiles")
        .update({ tokens: profile.tokens - tokenCost })
        .eq("id", user.id);
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">← İlanlar</Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Yeni İlan Ver</h1>
        <p className="mt-1 text-sm text-stone-500">
          İlk {FREE_PHOTOS} fotoğraf ücretsiz, sonraki her fotoğraf {TOKENS_PER_EXTRA_PHOTO} jeton.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Başlık *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Açıklama *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Kategori *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategorySlug)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-primary-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Şehir *</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-primary-500 focus:outline-none"
          >
            <option value="">Seçin</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Fotoğraflar (en fazla {MAX_PHOTOS}, ilk {FREE_PHOTOS} ücretsiz)
          </label>
          {files.length < MAX_PHOTOS && (
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              className="block w-full text-sm text-stone-500 file:mr-4 file:rounded file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-primary-700"
            />
          )}
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="relative">
                  <span className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">
                    {file.name.slice(0, 15)}…
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {extraPhotos > 0 && (
            <p className="mt-2 text-sm text-amber-700">
              +{extraPhotos} ek fotoğraf = {tokenCost} jeton kullanılacak.
            </p>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-500 py-2.5 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? "Yayınlanıyor..." : "İlanı Yayınla"}
        </button>
      </form>
    </div>
  );
}
