import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/types/database";
import { BoostButton } from "./BoostButton";
import { MessageButton } from "./MessageButton";

export const revalidate = 30;

export default async function IlanDetayPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !listing) notFound();

  const isBoosted =
    listing.boosted_until && new Date(listing.boosted_until) > new Date();
  const categoryLabel =
    CATEGORIES.find((c) => c.slug === listing.category)?.label ?? listing.category;
  const images = (listing.image_urls as string[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-700">← İlanlar</Link>
      </div>
      <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {images.length > 0 ? (
          <div className="relative aspect-[16/10] bg-stone-100">
            <Image
              src={images[0]}
              alt={listing.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 672px"
            />
            {isBoosted && (
              <span className="absolute left-3 top-3 rounded bg-amber-500 px-2.5 py-1 text-sm font-medium text-white">
                Öne çıkan
              </span>
            )}
          </div>
        ) : (
          <div className="aspect-[16/10] flex items-center justify-center bg-stone-100 text-stone-400">
            Görsel yok
          </div>
        )}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b border-stone-200 p-2">
            {images.slice(1, 5).map((url, i) => (
              <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                <Image src={url} alt="" fill className="object-cover" sizes="80px" />
              </div>
            ))}
          </div>
        )}
        <div className="p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-stone-100 px-2 py-0.5 text-sm text-stone-600">
              {categoryLabel}
            </span>
            <span className="text-sm text-stone-500">{listing.city}</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">{listing.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-stone-600">
            {listing.description}
          </p>
          <MessageButton
            listingId={listing.id}
            listingOwnerId={listing.user_id}
            listingTitle={listing.title}
          />
          <BoostButton listingId={listing.id} listingUserId={listing.user_id} />
        </div>
      </article>
    </div>
  );
}
