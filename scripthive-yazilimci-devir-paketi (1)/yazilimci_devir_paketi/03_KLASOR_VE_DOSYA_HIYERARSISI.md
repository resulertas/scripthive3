# ScriptHive - Klasör ve Dosya Hiyerarşisi

```
├── .env.example              # Gerekli ortam değişkenleri şablonu
├── ARCHITECTURE.md           # Sistem mimarisi ve teknik API dokümantasyonu
├── README.md                 # Proje ana tanıtım ve dokümantasyon dosyası
├── index.html                # PWA meta etiketleri, favicon ve font tanımları
├── metadata.json             # AI Studio ve uygulama meta verileri
├── package.json              # Paket bağımlılıkları ve npm scriptleri
├── server.ts                 # Express backend sunucusu (OAuth, Drive proxy, SPA fallback)
├── tsconfig.json             # TypeScript yapılandırması
├── vite.config.ts            # Vite, PWA, Tailwind v4 ve proxy ayarları
├── yazilimci_devir_paketi/   # 📁 Yazılımcı devir dokümanları ve rehberleri
├── public/                   # Statik varlıklar (icon.svg, apple-touch-icon.png, sesler)
└── src/
    ├── main.tsx              # React DOM entry point
    ├── App.tsx               # Ana uygulama omurgası, senaryo parse/export motoru ve state
    ├── index.css             # Tailwind v4 import ve genel stil tanımları
    ├── types.ts              # Tüm TypeScript tipleri, arayüzler ve font sabitleri
    ├── vite-env.d.ts         # Vite ortam tipi bildirimleri
    ├── lib/
    │   └── storage.ts        # Güvenli localStorage erişim katmanı (safeStorage)
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
