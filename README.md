# Buldum – İkinci El İlan Uygulaması

Next.js ve Supabase ile geliştirilmiş ikinci el ilan uygulaması.

## Özellikler

- **Kayıt / Giriş:** E-posta ve şifre ile hesap oluşturma ve giriş.
- **İlanlar:** Kayıtlı kullanıcılar ilan verebilir (başlık, açıklama, kategori, şehir, en fazla 5 fotoğraf). İlk 2 fotoğraf ücretsiz, sonrakiler jeton ile.
- **Misafir:** Giriş yapmadan ilanları görüntüleyebilir; ilan vermek için giriş gerekir.
- **Kategoriler:** Elektronik, Giyim, Ev & Yaşam, Araç.
- **Jeton:** Yeni kullanıcılara 10 jeton verilir. Ek fotoğraf (3.–5.) başına 1 jeton, 1 günlük öne çıkarma 5 jeton.
- **Öne çıkarma (boost):** İlan sahibi jeton harcayarak ilanını 24 saat öne çıkarabilir.

## Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Supabase veritabanı şemasını çalıştırın:
   - [Supabase Dashboard](https://supabase.com/dashboard) → Projeniz → SQL Editor
   - `supabase/schema.sql` dosyasının içeriğini yapıştırıp çalıştırın.

3. Ortam değişkenleri:
   - `.env.local` dosyası projede tanımlı (Supabase URL ve anon key).
   - Kendi projeniz için `.env.example` dosyasını kopyalayıp `.env.local` oluşturabilirsiniz.

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
   Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Proje yapısı

- `src/app/` – Sayfalar (App Router)
- `src/components/` – Ortak bileşenler
- `src/lib/supabase/` – Supabase istemci ve middleware
- `src/types/database.ts` – Tipler ve sabitler (kategoriler, jeton kuralları)
- `supabase/schema.sql` – Veritabanı tabloları ve RLS politikaları

## Jeton kuralları

| İşlem              | Jeton |
|--------------------|--------|
| Yeni kayıt         | 10 jeton (başlangıç) |
| 3.–5. fotoğraf     | 1 jeton / fotoğraf   |
| 1 gün öne çıkarma  | 5 jeton              |
