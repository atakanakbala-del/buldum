"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [activeTab, setActiveTab] = useState("ilanlarim");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/giris"); return; }
      setUser(user);
      fetchProfile(user.id);
      fetchListings(user.id);
    });
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name ?? "");
      setPhone(data.phone ?? "");
    }
    setLoading(false);
  }

  async function fetchListings(userId: string) {
    const { data } = await supabase.from("listings").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setListings(data ?? []);
  }

  async function saveProfile() {
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
    setSaving(false);
    alert("Profil güncellendi!");
  }

  async function deleteListing(id: string) {
    if (!confirm("İlanı silmek istediğinizden emin misiniz?")) return;
    await supabase.from("listings").delete().eq("id", id);
    setListings(listings.filter((l) => l.id !== id));
  }

  if (loading) return <div className="text-center py-12">Yükleniyor...</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
            {fullName ? fullName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">{fullName || "İsimsiz Kullanıcı"}</h1>
            <p className="text-sm text-stone-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {["ilanlarim", "ayarlar"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-white border border-stone-200 text-stone-600"
            }`}
          >
            {tab === "ilanlarim" ? "İlanlarım" : "Ayarlar"}
          </button>
        ))}
      </div>

      {activeTab === "ilanlarim" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-stone-900">İlanlarım ({listings.length})</h2>
          {listings.length === 0 ? (
            <p className="text-center text-stone-500 py-8">Henüz ilan vermediniz.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {listings.map((listing) => (
                <li key={listing.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-stone-900">{listing.title}</p>
                    <p className="text-sm text-stone-500">{listing.city} · {listing.category}</p>
                  </div>
                  <button
                    onClick={() => deleteListing(listing.id)}
                    className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sil
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === "ayarlar" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-stone-900">Ayarlar</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Adınız Soyadınız"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="05XX XXX XX XX"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">E-posta</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400"
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}