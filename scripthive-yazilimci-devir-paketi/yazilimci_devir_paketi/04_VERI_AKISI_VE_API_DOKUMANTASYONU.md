# ScriptHive - Veri Akışı ve API Dokümantasyonu

## 1. Veri Modeli
ScriptHive'da bir senaryo (`Screenplay`), sıralı element dizilerinden (`ScreenplayElement[]`) oluşur:

```typescript
export type ElementType = 
  | 'scene'         // Sahne Başlığı (İÇ. OFİS - GÜN)
  | 'action'        // Eylem / Betimleme
  | 'character'     // Karakter Adı
  | 'dialogue'      // Replik
  | 'parenthetical' // Parantez İçi Yönlendirme (fısıldayarak)
  | 'transition'    // Geçiş (KESME:)
  | 'paragraph'     // Serbest Paragraf
  | 'note';         // Yazar Notu

export interface ScreenplayElement {
  id: string;
  type: ElementType;
  content: string;
  sceneNumber?: number;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  colorTag?: string;
  revisionColor?: 'blue' | 'pink' | 'yellow' | 'green' | 'goldenrod' | 'white';
}
```

---

## 2. Backend API Uç Noktaları (`server.ts`)

| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Sunucu sağlık kontrolü (`{ status: "ok" }`) |
| `GET` | `/api/auth/url` | Google OAuth2 yetkilendirme URL'i üretir |
| `GET` | `/auth/callback` | Google OAuth authorization code takası ve token teslimi |
| `POST` | `/api/drive/upload` | Multipart/related formatında Google Drive DOCX senaryo yükleme |

---

## 3. Depolama Stratejisi
- **safeStorage (`src/lib/storage.ts`):** `localStorage` üzerindeki `scripthive_current_script`, `scripthive_projects`, `scripthive_character_bible`, `scripthive_story_bible`, `scripthive_notes`, `scripthive_bin` anahtarları ile tarayıcıda kalıcı olarak saklanır.
- **Offline / Service Worker (`vite.config.ts`):** Workbox yapılandırması ile tüm statik dosyalar ve Google Fonts CDN dosyaları önbelleğe alınır.
