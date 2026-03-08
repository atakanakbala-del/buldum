"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      if (user) {
        fetchTokens();
        fetchUnread();
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTokens();
        fetchUnread();
      } else {
        setTokens(null);
        setUnreadCount(0);
      }
    });

    function fetchTokens() {
      supabase
        .from("profiles")
        .select("tokens")
        .single()
        .then(({ data }) => setTokens(data?.tokens ?? 0));
    }

    function fetchUnread() {
      supabase.rpc("get_unread_message_count").then(({ data }) => setUnreadCount(Number(data ?? 0)));
    }

    const onFocus = () => {
      if (user) fetchUnread();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [supabase.auth, user]);

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
                  {user.email && (
                    <span className="text-sm text-stone-600">
                      {user.email}
                    </span>
                  )}
                  {tokens !== null && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800">
                      {tokens} jeton
                    </span>
                  )}
                  <Link
  href="/profil"
  className="text-stone-600 hover:text-stone-900 text-sm transition"
>
  Profilim
</Link>
                  <Link
                    href="/mesajlar"
                    className="relative rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
                  >
                    Mesajlar
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
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
