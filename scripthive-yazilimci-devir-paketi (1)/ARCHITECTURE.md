# ScriptHive - Sistem Mimarisi ve Teknik Dokümantasyon (ARCHITECTURE.md)

Bu doküman, ScriptHive projesinin iç mekanizmalarını, veri akış şemalarını, bileşen ağacını ve API spesifikasyonlarını detaylandırmaktadır.

---

## 1. Yüksek Düzey Mimari Şeması (High-Level Architecture)

```
+-------------------------------------------------------------------------------+
|                                İstemci (Browser / PWA)                        |
|                                                                               |
|  +------------------+   +-------------------+   +--------------------------+  |
|  |     TopBar       |   | Toolbar / Tablet  |   |        SprintWidget      |  |
|  +------------------+   +-------------------+   +--------------------------+  |
|  |  [Sidebar]       |   |   [Editor / Core] |   |     [RightSidebar]       |  |
|  |  Sahne Listesi   |   |   Screenplay DOM  |   |     İstatistik & Notlar  |  |
|  |  ve Dizin        |   |   ContentEditable |   |                          |  |
|  +------------------+   +-------------------+   +--------------------------+  |
|  |  Modals: Character Bible, Story Bible, Notes, Bin, Stats, Find & Replace  |  |
|  +-------------------------------------------------------------------------+  |
|  |  State: React Hooks (App.tsx) + Sprint Store (Observer) + safeStorage     |  |
+-------------------------------------------------------------------------------+
                                    │
               REST / Multipart     │  OAuth2 Auth Code & Drive Proxy
                                    ▼
+-------------------------------------------------------------------------------+
|                            Node.js / Express Backend (server.ts)              |
|                                                                               |
|  - GET  /api/auth/url           -> Google OAuth Yetkilendirme URL'i Üretimi   |
|  - GET  /auth/callback          -> Access & Refresh Token Takası              |
|  - POST /api/drive/upload       -> Multipart Google Drive Yükleme & Güncelleme|
|  - GET  /api/health             -> Servis Sağlık Kontrolü                     |
|  - Vite Middleware / Static SPA -> dist/index.html & Varlık Sunumu            |
+-------------------------------------------------------------------------------+
```

---

## 2. Bileşen Ağacı ve Sorumluluk Dağılımı

```
src/main.tsx
└── src/App.tsx (Merkezi Veri ve Durum Yöneticisi)
    ├── TopBar.tsx (Dosya, Dışa Aktarım, Görünüm Modları, Revizyon Renkleri)
    ├── Toolbar.tsx (Masaüstü Formatlama: Sahne, Eylem, Karakter, Diyalog, Font/Boyut)
    ├── TabletToolbar.tsx (Tablet & Dokunmatik Hızlı Buton Çubuğu)
    ├── Sidebar.tsx (Sol Sahne Navigasyonu, Sürükle-Bırak Yeniden Sıralama)
    ├── Editor.tsx (Senaryo Sayfa Render'ı, Klavye Olayları [Enter/Tab/Backspace], Dikte)
    ├── Corkboard.tsx (Kart Görünümü, Sahne Özetleri, Sahne Rengi Etiketleme)
    ├── RightSidebar.tsx (Karakter Listesi, Canlı İstatistikler, Hızlı Notlar)
    ├── SprintWidget.tsx (Pomodoro Sayacı, Kelime/Sayfa Hedefi İlerlemesi)
    │
    └── Modal Bileşenleri (Koşullu Render)
        ├── CharacterBibleModal.tsx (Karakter Profilleri ve Ark Soruları)
        ├── StoryBibleModal.tsx (Bölüm/Sezon Hikaye Yapısı)
        ├── CharacterStatsModal.tsx (Recharts ile Sahne/Diyalog Görselleştirme)
        ├── LocationListModal.tsx (Mekan Dağılımı ve Lokasyon Analizi)
        ├── BinModal.tsx (Silinen Elementler ve Alternatif Varyasyonlar)
        ├── FindReplaceModal.tsx (Metin Arama ve Değiştirme)
        └── GuideModal.tsx (Kullanım Rehberi ve Standartlar)
```

---

## 3. Durum Yönetimi (State Management)

### 3.1. Ana Uygulama Durumu (`src/App.tsx`)
Ana senaryo verisi ve editör durumu React hook'ları (`useState`, `useRef`, `useMemo`) ile yönetilir:
- `elements: ScreenplayElement[]`: Sahne parçalarının sıralı dizisi.
- `title: string`: Senaryo başlığı.
- `coverPage: CoverPageData`: Kapak sayfası verileri (yazar, sürüm, tarih, revizyon geçmişi, afiş resmi).
- `format: 'US' | 'FR'`: Senaryo biçimlendirme standardı.
- `theme: 'light' | 'dark'`: Tema tercihi.
- `uiMode: 'desktop' | 'tablet'`: Arayüz modu.
- `viewMode: 'editor' | 'cards'`: Editör veya Mantar Pano görünümü.
- `revisionMode & activeRevisionColor`: Revizyon modu ve aktif renk seçimi.
- `projects: Screenplay[]`: Yerel depolamadaki son projeler geçmişi.

### 3.2. Sprint ve Pomodoro Durumu (`src/store/sprintStore.ts`)
Sprint ve hedef sayacı için React dışında da yaşayan hafif bir **Observer Pattern Store** kullanılmıştır:
- `sprintActions.startPomodoro()`: 25 dakikalık geri sayım başlatır.
- `sprintActions.startQuantityGoal(type, target, currentValue)`: Kelime veya sayfa hedefi başlatır.
- `sprintActions.updateQuantity(currentValue)`: Hedefe ulaşıldığında `canvas-confetti` patlatır ve kullanıcıyı bilgilendirir.
- `useSprintStore()`: Bileşenlerin store'a reaktif olarak bağlanmasını sağlar.

---

## 4. Backend API Spesifikasyonu (`server.ts`)

### `GET /api/auth/url`
Google OAuth2 onay URL'ini döner.
- **Query Parametreleri:** `redirectUri` (isteğe bağlı)
- **Dönen Yanıt:** `{ url: "https://accounts.google.com/o/oauth2/v2/auth?..." }`

### `GET /auth/callback`
Google OAuth2 authorization code'unu işler, token takasını gerçekleştirir ve istemci penceresine `postMessage` ile `BroadcastChannel` üzerinden access token'ı iletir.

### `POST /api/drive/upload`
Google Drive v3 API'sine `multipart/related` formatında DOCX dosyasını yükler veya günceller.
- **Headers:** `Authorization: Bearer <ACCESS_TOKEN>`
- **Body:**
```json
{
  "fileId": "optional-existing-drive-file-id",
  "fileName": "Senaryo_Basligi.docx",
  "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "contentBase64": "<BASE64_ENCODED_DOCX_DATA>"
}
```
- **Dönen Yanıt:** `{ "success": true, "fileId": "...", "url": "https://docs.google.com/..." }`

---

## 5. Dışa Aktarma (Export) ve Dosya Dönüştürme Algoritmaları

1. **DOCX Export:** `docx` kütüphanesinin `Paragraph`, `TextRun`, `AlignmentType` modülleri ile her `ScreenplayElement` tipi için Amerikan veya Fransız standartlarındaki girinti marjları (Twips / Inches cinsinden) hesaplanarak eklenir.
2. **FDX (Final Draft) Export:** XML DOM ağacı oluşturulup `<FinalDraft DocumentType="Script">` kök etiketi altında `<Paragraph Type="Scene Heading | Action | Character | Dialogue | Parenthetical | Transition">` etiketleri basılır.
3. **Fountain Export:** Fountain standardına uygun olarak sahne başlıkları büyük harfle, karakterler ortalanmış, geçişler `> GEÇİŞ:` formatında düz metne dökülür.
4. **PDF Export:** HTML çıktısı görünmez bir taşıyıcıda Courier Prime yazı tipiyle render edilir ve `html2pdf.js` ile A4/Letter sayfalarına bölünerek indirilir.
