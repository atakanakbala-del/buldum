"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      if (user) fetchTokens();
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTokens();
      else setTokens(null);
    });

    function fetchTokens() {
      supabase
        .from("profiles")
        .select("tokens")
        .single()
        .then(({ data }) => setTokens(data?.tokens ?? 0));
    }

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary-600">
          Buldum
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-stone-600 hover:text-stone-900 transition"
          >
            İlanlar
          </Link>
          {!loading && (
            <>
              {user ? (
                <>
                  {tokens !== null && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800">
                      {tokens} jeton
                    </span>
                  )}
                  <Link
                    href="/ilan-ver"
                    className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition"
                  >
                    İlan Ver
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-stone-500 hover:text-stone-800 text-sm"
                  >
                    Çıkış
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/giris"
                    className="text-stone-600 hover:text-stone-900 text-sm"
                  >
                    Giriş
                  </Link>
                  <Link
                    href="/kayit"
                    className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
