"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/types/database";

const CITIES = [
  "Adana", "Ankara", "Antalya", "Aydın", "Balıkesir", "Bursa", "Denizli",
  "Diyarbakır", "Gaziantep", "Hatay", "İstanbul", "İzmir", "Kayseri", "Kocaeli",
  "Konya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Samsun",
  "Şanlıurfa", "Trabzon", "Van",
];

export function ListingFilters({
  category,
  city,
}: {
  category?: string;
  city?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={category ?? ""}
        onChange={(e) => setFilter("category", e.target.value)}
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-primary-500 focus:outline-none"
      >
        <option value="">Tüm kategoriler</option>
        {CATEGORIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.label}
          </option>
        ))}
      </select>
      <select
        value={city ?? ""}
        onChange={(e) => setFilter("city", e.target.value)}
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-primary-500 focus:outline-none"
      >
        <option value="">Tüm şehirler</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
