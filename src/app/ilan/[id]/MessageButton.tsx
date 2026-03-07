"use client";

import { useEffect } from "react";

export function MessageButton({
  listingId,
  listingOwnerId,
  listingTitle,
}: {
  listingId: string;
  listingOwnerId: string;
  listingTitle: string;
}) {
  useEffect(() => {
    console.log("[MessageButton] props", { listingId, listingOwnerId, listingTitle });
  }, [listingId, listingOwnerId, listingTitle]);

  return (
    <div className="mt-6 border-t border-stone-200 pt-4">
      <button
        type="button"
        onClick={() =>
          console.log("[MessageButton] Test Butonu tıklandı", {
            listingId,
            listingOwnerId,
          })
        }
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Test Butonu
      </button>
      <p className="mt-2 text-sm text-stone-500">
        &quot;{listingTitle}&quot; için test butonu.
      </p>
    </div>
  );
}
