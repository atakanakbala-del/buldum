import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/ListingCard";
import { ListingFilters } from "@/components/ListingFilters";

export const revalidate = 30;

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
        İlanlar yüklenirken hata oluştu. Lütfen Supabase şemasını çalıştırdığınızdan emin olun.
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-stone-900">İlanlar</h1>
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
