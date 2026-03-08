import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/ListingCard";
import { ListingFilters } from "@/components/ListingFilters";
import Link from "next/link";

export const revalidate = 30;

const CATEGORY_ICONS = [
  { slug: "elektronik", label: "Elektronik", icon: "📱" },
  { slug: "giyim", label: "Giyim", icon: "👗" },
  { slug: "ev-yasam", label: "Ev & Yaşam", icon: "🏠" },
  { slug: "arac", label: "Araç", icon: "🚗" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string; city?: string };
}) {
  const params = searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*")
    .order("boosted_until", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (params.category) query = query.eq("category", params.category);
  if (params.city) query = query.ilike("city", `%${params.city}%`);

  const { data: listings, error } = await query;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        İlanlar yüklenirken hata oluştu.
      </div>
    );
  }

  const boosted = (listings ?? []).filter(
    (l) => l.boosted_until && new Date(l.boosted_until) > new Date()
  );
  const normal = (listings ?? []).filter(
    (l) => !l.boosted_until || new Date(l.boosted_until) <= new Date()
  );
  const ordered = [...boosted, ...normal];

  return (
    <div>
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 px-8 py-10 text-white text-center">
        <h1 className="text-3xl font-bold mb-2">Aradığını Bul, Bulduğunu Sat!</h1>
        <p className="text-blue-100">Türkiye&apos;nin en kolay ikinci el alışveriş platformu</p>
      </div>
      <div className="mb-8 grid grid-cols-4 gap-3">
        {CATEGORY_ICONS.map((cat) => (
          <Link
            key={cat.slug}
            href={`/?category=${cat.slug}`}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition hover:shadow-md ${
              params.category === cat.slug
                ? "border-blue-500 bg-blue-50"
                : "border-stone-200 bg-white"
            }`}
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-xs font-medium text-stone-700">{cat.label}</span>
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-stone-900">
          {params.category
            ? CATEGORY_ICONS.find((c) => c.slug === params.category)?.label ?? "İlanlar"
            : "Tüm İlanlar"}
        </h2>
        <ListingFilters category={params.category} city={params.city} />
      </div>
      {ordered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 py-12 text-center text-stone-500">
          Henüz ilan yok. İlk ilanı siz verin!
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </ul>
      )}
    </div>
  );
}