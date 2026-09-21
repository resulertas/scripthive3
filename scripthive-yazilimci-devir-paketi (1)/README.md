# ScriptHive - Profesyonel Senaryo Editörü (Yazılımcı Devir & Mimari Kılavuzu)

Bu belge, **ScriptHive** projesini devralacak yazılımcının projeyi sıfırdan kurabilmesi, mimariyi ve veri akışını en ince ayrıntısına kadar anlayabilmesi ve geliştirmeye anında başlayabilmesi için hazırlanmıştır.

---

## 1. Projenin Amacı ve Özeti

**ScriptHive**, senaristler, yönetmenler ve yazarlar için tasarlanmış; hem modern web tarayıcılarında hem de tablet/iPad gibi taşınabilir cihazlarda kusursuz çalışan **çevrimdışı öncelikli (Offline-First), tam teşekküllü bir senaryo editörüdür.**

### Çözdüğü Temel Problemler:
1. **Endüstri Standardı Senaryo Formatlaması:** Amerikan (US) ve Fransız (FR) standartlarında sahne başlıkları (Scene Heading), eylem (Action), karakter (Character), diyalog (Dialogue), parantez içi (Parenthetical) ve geçiş (Transition) bloklarını otomatik algılar, klavye kısayolları ve Tab/Enter akışlarıyla anında biçimlendirir.
2. **Çevrimdışı Bağımsızlık (Offline-First PWA):** İnternet bağlantısı koptuğunda dahi yazmaya kesintisiz devam edebilmeyi sağlar. Service Worker ve yerel depolama mekanizması sayesinde veriler kaybolmaz.
3. **Bulut ve Dışa Aktarım Özgürlüğü:** Google Drive entegrasyonu (OAuth2 + Multipart Drive API), Final Draft (.fdx), DOCX, PDF, Celtx, Kitsp, Fountain ve Markdown dışa/içe aktarım formatlarını destekler.
4. **Yazarlık & Prodüksiyon Araç Seti:** Karakter İncili (Character Bible), Hikaye İncili (Story Bible), Mekan Listesi (Location Manager), Karakter İstatistik Analizi, Mantar Pano (Corkboard / Beat Board), Çöp Kutusu / Alternatif Sahneler (Bin), Sesle Yazma (Web Speech API Dikte) ve Pomodoro / Kelime Hedefi Sprint motoru içerir.
5. **Renkli Revizyon Sistemi:** Endüstri standardı revizyon renkleri (Mavi, Pembe, Sarı, Yeşil, Altın, Beyaz) ve revizyon yıldız işaretleri (*) ile versiyon takibi sağlar.

---

## 2. Teknoloji Yığını (Tech Stack) ve Kütüphaneler

| Katman | Teknoloji / Kütüphane | Versiyon | Görevi / Açıklaması |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.0.0` | UI bileşen mimarisi ve state yönetimi |
| **Dil** | TypeScript | `~5.8.2` | Tip güvenliği ve ölçeklenebilir kod tabanı |
| **Build & Dev Tool** | Vite | `^6.2.0` | Hızlı derleme, SPA geliştirme sunucusu |
| **Styling** | Tailwind CSS (Vite Plugin) | `^4.1.14` | Modern CSS yardımcı sınıfları |
| **PWA & Offline** | vite-plugin-pwa (Workbox) | `^1.2.0` | Service Worker, web manifest, offline önbellek |
| **Backend Server** | Node.js + Express | `^4.21.2` | Google OAuth2 ve Drive API proxy sunucusu |
| **TypeScript Runner** | tsx | `^4.21.0` | TypeScript tabanlı `server.ts` çalıştırma motoru |
| **İkon Seti** | Lucide React | `^0.546.0` | Vektörel modern UI ikonları |
| **Animasyon** | Motion (`motion/react`) | `^12.23.24` | Akıcı geçişler ve modal animasyonları |
| **Sürükle & Bırak** | @dnd-kit/core & sortable | `^6.3.1` / `^10.0.0` | Mantar Pano ve Sahne listesi sıralaması |
| **Doküman & Dışa Aktarma** | docx | `^9.6.1` | Word (.docx) formatı oluşturma |
| | html2pdf.js / jspdf | `^0.14.0` / `^4.2.1` | PDF dışa aktarma |
| | jszip | `^3.10.1` | FDX, DOCX ve sıkıştırılmış paket okuma |
| | mammoth | `^1.12.0` | DOCX dosyasını HTML/metne dönüştürerek içe aktarma |
| | canvas-confetti | `^1.9.4` | Yazma sprinti tamamlandığında kutlama efekti |
| | recharts | `^3.8.1` | Karakter ve sahne dağılım istatistik grafikleri |

---

## 3. Klasör Mimarisi ve Dosya Hiyerarşisi

```
├── .env.example              # Gerekli ortam değişkenleri şablonu (Client ID, Secret vb.)
├── index.html                # Ana HTML kabuğu, PWA meta etiketleri ve favicon tanımları
├── metadata.json             # AI Studio ve uygulama meta verileri, izin listesi
├── package.json              # Paket bağımlılıkları ve npm scriptleri
├── server.ts                 # Express backend sunucusu (OAuth, Drive proxy, SPA fallback)
├── tsconfig.json             # TypeScript derleyici yapılandırması
├── vite.config.ts            # Vite, PWA, Tailwind v4 eklentileri ve proxy ayarları
├── public/                   # Statik varlıklar (icon.svg, manifest, sesler vb.)
└── src/
    ├── main.tsx              # React DOM entry point
    ├── App.tsx               # Ana uygulama omurgası, senaryo parse/export motoru ve state
    ├── index.css             # Tailwind v4 import ve genel stil tanımları
    ├── types.ts              # Tüm TypeScript tip, arayüz ve sabit tanımları
    ├── vite-env.d.ts         # Vite ortam tipi bildirimleri
    ├── lib/
    │   └── storage.ts        # Güvenli localStorage erişim wrapper'ı (safeStorage)
    ├── store/
    │   └── sprintStore.ts    # Pomodoro & Kelime hedefi sprint state yönetimi (Observer Pattern)
    └── components/
        ├── TopBar.tsx        # Masaüstü ve Tablet üst menü çubuğu (Dosya, Araçlar, Görünüm, Revizyon)
        ├── Toolbar.tsx       # Masaüstü formatlama, font, renk ve hizalama araç çubuğu
        ├── TabletToolbar.tsx # Dokunmatik/Tablet ekranlar için optimize edilmiş araç çubuğu
        ├── Editor.tsx        # Senaryo düzenleme alanı, satır satır element render motoru
        ├── Sidebar.tsx       # Sol panel: Sahne dizini, hızlı sahne atlama, başlık düzenleme
        ├── RightSidebar.tsx  # Sağ panel: Karakter istatistikleri, hedef sayaçları, notlar
        ├── Corkboard.tsx     # Mantar Pano: Sahneleri kart olarak görme, özetleme, sürükle-bırak
        ├── SprintWidget.tsx  # Pomodoro ve yazma hedefi yüzen mini paneli
        ├── BinModal.tsx      # Silinen sahneler ve alternatif versiyonlar arşivi (Çöp Kutusu)
        ├── CharacterBibleModal.tsx # Karakter profilleri, fotoğraflar, ark ve soru-cevap
        ├── StoryBibleModal.tsx     # Bölüm bölüm hikaye özeti, logline, sezonluk kurgu
        ├── NotesModal.tsx          # Senaryoya özel serbest not alma defteri
        ├── CharacterStatsModal.tsx # Recharts destekli karakter diyalog ve sahne analizleri
        ├── LocationListModal.tsx   # Mekan dağılımı (İÇ/DIŞ) ve lokasyon yönetim tablosu
        ├── FindReplaceModal.tsx    # Gelişmiş regex ve büyük/küçük harf duyarlı Bul & Değiştir
        └── GuideModal.tsx          # Klavye kısayolları ve senaryo yazım standartları rehberi
```

---

## 4. Kurulum ve Çalıştırma Adımları

### 4.1. Ön Gereksinimler
- **Node.js**: v18+ veya v20+ (Önerilen: Node 20 LTS)
- **Paket Yöneticisi**: `npm` (veya `bun` / `pnpm`)

### 4.2. Ortam Değişkenleri (.env)
Proje kök dizininde bir `.env` dosyası oluşturun (`.env.example` dosyasını kopyalayabilirsiniz):

```env
# Uygulama adresi (Local geliştirme için http://localhost:3000)
APP_URL="http://localhost:3000"

# Google Drive Entegrasyonu (Google Cloud Console'dan alınır)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gemini AI (Gerektiğinde arka plan servisleri için)
GEMINI_API_KEY=""
```

### 4.3. Bağımlılıkların Yüklenmesi
```bash
npm install
```

### 4.4. Geliştirme Modunda Çalıştırma (Development)
```bash
npm run dev
```
> Sunucu **http://localhost:3000** üzerinde `tsx server.ts` ile ayağa kalkar. Express sunucusu geliştirme ortamında Vite'ı bir ara yazılım (`middlewareMode: true`) olarak çalıştırır.

### 4.5. Üretime Hazırlama ve Başlatma (Production Build)
```bash
npm run build
npm start
```
`npm run build`, `dist/` klasörüne optimize edilmiş statik dosyaları ve PWA service worker'ını üretir. `npm start` ise Express üzerinden `dist/` dosyalarını servis eder.

### 4.6. Tip Kontrolü (Linting)
```bash
npm run lint
```

---

## 5. Veri Akışı, State Yönetimi ve Temel Modüller

### 5.1. Senaryo Veri Modeli (`src/types.ts`)
Her senaryo, atomik `ScreenplayElement` parçalarından meydana gelir:
- `scene`: Sahne Başlığı (`İÇ. EV - GECE`)
- `action`: Eylem / Betimleme paragrafı
- `character`: Konuşan karakter adı (Büyük harf)
- `dialogue`: Karakterin repliği
- `parenthetical`: Parantez içi yönlendirme (`(gülerek)`)
- `transition`: Geçiş efekti (`KESME:`, `SAHNE SONU`)
- `note`: Yazarın özel notu / sahne yorumu

### 5.2. Akıllı Metin Ayrıştırma (Parse Engine - `src/App.tsx`)
`parseTextToElements(text)` fonksiyonu, dışarıdan yapıştırılan veya yüklenen (.txt, .docx, .fountain, .md) ham metinleri analiz eder:
- Girinti (Indentation) genişliğini hesaplar (Courier 10pt standart girintileri).
- Büyük harf bloklarını, parantez içi ifadeleri ve `İÇ./DIŞ./EXT./INT.` kalıplarını regex ile tespit ederek otomatik olarak doğru `ElementType`'a dönüştürür.

### 5.3. Google Drive ve OAuth Akışı
1. Kullanıcı `TopBar` üzerinden "Google Drive'a Bağlan" butonuna tıklar.
2. `/api/auth/url` endpoint'i Google OAuth onay ekranı URL'ini üretir (`drive.file` kapsamı ile).
3. Açılan popup penceresi yetkilendirmeyi tamamlar, `/auth/callback` token'ları alır ve ana pencereye `BroadcastChannel` ve `window.postMessage` ile iletir.
4. Senaryo kaydedilirken `/api/drive/upload` endpoint'i üzerinden DOCX formatında `multipart/related` isteği ile Google Drive'a doğrudan yüklenir.

### 5.4. Dışa Aktarma (Export) Motorları
- **PDF:** `html2pdf.js` ile A4/Letter sayfa yapısına ve Courier Prime font standartlarına uygun vektörel çıktı.
- **DOCX:** `docx` kütüphanesi kullanılarak her elementin sol/sağ girintileri (US/FR formatına göre santimetre/inch hassasiyetinde) hesaplanıp Microsoft Word belgesi olarak paketlenir.
- **Final Draft (.fdx):** Final Draft XML şemasına uygun Scene, Action, Character, Dialogue tag'leri üretilir.
- **Fountain / Markdown / Celtx:** Saf metin veya HTML tabanlı endüstri standardı biçimlendirmeler oluşturulur.

### 5.5. Çevrimdışı ve PWA Stratejisi
`vite-plugin-pwa` ve `workbox` yapılandırması:
- Uygulamanın tüm JS/CSS/HTML varlıkları ile Google Fonts dosyaları yerel Cache Storage'da saklanır.
- İnternet bağlantısı olmasa dahi uygulama anında yüklenir ve çalışır.
- `navigator.onLine` dinleyicileriyle çevrimdışı durumu algılanır ve kullanıcıya yumuşak bildirimler sunulur.

---

## 6. Sık Kullanılan Klavye Kısayolları

| Kısayol | İşlev |
| :--- | :--- |
| **Tab** | Bir sonraki mantıksal element tipine geçiş (Örn: Eylem -> Karakter -> Diyalog) |
| **Enter** | Otomatik akıllı geçiş (Sahne Başlığından sonra Eyleme, Karakterden sonra Diyaloğa) |
| **Ctrl + S / Cmd + S** | Senaryoyu yerel depolamaya ve varsa Drive'a kaydeder |
| **Ctrl + F / Cmd + F** | Bul ve Değiştir penceresini açar |
| **F11 / Esc** | Tam ekran Zen (Odaklanma) moduna girer / çıkar |
| **Ctrl + Z / Ctrl + Y** | Geri al (Undo) / İleri al (Redo) |

---

## 7. Geliştirici İçin Önemli Notlar ve İpuçları
1. **Port Yapılandırması:** Geliştirme ortamında dev server `3000` portuna bağlıdır (`server.ts` içinde tanımlıdır).
2. **HMR Yönetimi:** Bulut konteyner ortamlarında dosya çakışmalarını önlemek için `vite.config.ts` içinde `process.env.DISABLE_HMR` kontrolü mevcuttur.
3. **Yeni Element Tipi Eklerken:** `src/types.ts`, `src/components/Editor.tsx`, `src/components/Toolbar.tsx` ve `src/App.tsx` içindeki `parseTextToElements` ve `handleExport*` fonksiyonlarının güncellenmesi gerekir.
