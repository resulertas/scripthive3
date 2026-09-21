# ScriptHive - Kurulum ve Çalıştırma Rehberi

Bu belge, projeyi devralan yazılımcının projeyi sıfırdan lokal makinesinde ayağa kaldırması için gereken adımları içerir.

---

## 1. Sistem Gereksinimleri
- **Node.js:** v18.x veya v20.x+ LTS (Önerilen: v20.x)
- **NPM:** v9.x+ (veya Bun / Yarn / PNPM)
- **Modern Web Tarayıcısı:** Chrome, Edge, Safari, Brave veya Firefox

---

## 2. Kurulum Adımları

### Adım 1: Bağımlılıkları Yükleyin
Proje kök dizininde terminali açıp şu komutu çalıştırın:
```bash
npm install
```

### Adım 2: Ortam Değişkenlerini Tanımlayın
Kök dizindeki `.env.example` dosyasını baz alarak bir `.env` dosyası oluşturun:
```bash
cp .env.example .env
```

`.env` dosyasının içeriği:
```env
# Uygulama Temel Adresi
APP_URL="http://localhost:3000"

# Google Drive Entegrasyonu (Google Cloud Console'dan alınır - Opsiyonel)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Gemini AI Entegrasyonu (Opsiyonel)
GEMINI_API_KEY=""
```

*Not: Google Drive veya AI özellikleri kullanılmayacaksa bu anahtarlar boş bırakılabilir; uygulama yerel depolama ile tam fonksiyonel çalışır.*

---

## 3. Çalıştırma Komutları

### Geliştirme Modunda Başlatma (Development)
```bash
npm run dev
```
- Sunucu **`http://localhost:3000`** üzerinde başlar.
- `server.ts` Express sunucusu ayağa kalkar ve Vite SPA middleware'i üzerinden uygulamayı canlı hot-reload ile sunar.

### Üretim Derlemesi ve Başlatma (Production Build)
```bash
npm run build
npm start
```
- `npm run build`: Vite ve PWA eklentileriyle optimize edilmiş statik dosyaları `dist/` klasörüne derler.
- `npm start`: Express sunucusu ile `dist/` dosyalarını 3000 portunda servis eder.

### Tip ve Sözdizimi Kontrolü (Linting)
```bash
npm run lint
```
