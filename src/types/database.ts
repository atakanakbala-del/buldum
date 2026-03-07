export type CategorySlug = "elektronik" | "giyim" | "ev-yasam" | "arac";

export const CATEGORIES: { slug: CategorySlug; label: string }[] = [
  { slug: "elektronik", label: "Elektronik" },
  { slug: "giyim", label: "Giyim" },
  { slug: "ev-yasam", label: "Ev & Yaşam" },
  { slug: "arac", label: "Araç" },
];

export const FREE_PHOTOS = 2;
export const MAX_PHOTOS = 5;
export const TOKENS_PER_EXTRA_PHOTO = 1;
export const TOKENS_PER_BOOST_DAY = 5;
export const INITIAL_TOKENS = 10;

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: CategorySlug;
  city: string;
  image_urls: string[];
  boosted_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  tokens: number;
  created_at: string;
  updated_at: string;
}
