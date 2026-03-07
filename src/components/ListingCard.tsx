import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/types/database";
import type { Listing } from "@/types/database";

export function ListingCard({ listing }: { listing: Listing }) {
  const isBoosted =
    listing.boosted_until && new Date(listing.boosted_until) > new Date();
  const categoryLabel =
    CATEGORIES.find((c) => c.slug === listing.category)?.label ?? listing.category;
  const imageUrl = listing.image_urls?.[0];

  return (
    <Link href={`/ilan/${listing.id}`}>
      <article
        className={`overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
          isBoosted ? "border-amber-300 ring-1 ring-amber-200" : "border-stone-200"
        }`}
      >
        <div className="relative aspect-[4/3] bg-stone-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              Görsel yok
            </div>
          )}
          {isBoosted && (
            <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
              Öne çıkan
            </span>
          )}
          <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs text-stone-600">
            {categoryLabel}
          </span>
        </div>
        <div className="p-3">
          <h2 className="font-semibold text-stone-900 line-clamp-1">
            {listing.title}
          </h2>
          <p className="mt-0.5 text-sm text-stone-500">{listing.city}</p>
        </div>
      </article>
    </Link>
  );
}
