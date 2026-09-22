export type ElementType = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'paragraph' | 'note';

export type ScreenplayFormat = 'US' | 'FR';

export interface CoverPageData {
  title: string;
  author: string;
  version: string;
  date: string;
  revisionHistory?: string; // Sektör standardı kapak sayfası revizyon tarihçesi
  imageUrl?: string;
  imageWidth?: number;
}

export interface BinItem {
  id: string;
  type: 'deleted' | 'alternative';
  element: ScreenplayElement;
  deletedAt: number;
  originalIndex?: number;
}

export interface ScreenplayElement {
  id: string;
  type: ElementType;
  content: string;
  sceneNumber?: number | string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  colorTag?: string;
  revisionColor?: 'blue' | 'pink' | 'yellow' | 'green' | 'goldenrod' | 'white'; // Eklenen veya düzenlenen revizyonun rengi
  dualPosition?: 'left' | 'right'; // Çift diyalog (Dual Dialogue) pozisyonu
  tensionScore?: number; // Sahne gerilim seviyesi (1-100)
  comedyScore?: number; // Sahne komedi / mizah ritmi seviyesi (1-100)
  actionScore?: number; // Sahne aksiyon / tempo seviyesi (1-100)
  horrorScore?: number; // Sahne korku / dehşet ritmi (1-100)
  romanceScore?: number; // Sahne romantizm / yakınlık ritmi (1-100)
  emotionScore?: number; // Sahne duygu yoğunluğu / dramatik etki (1-100)
  emotionTag?: string; // Sahne duygu durumu etiketi (opsiyonel)
  sceneBeatId?: string; // Eşleşen Hikaye Şablonu Beat ID'si
}

export interface CharacterProfile {
  id: string;
  name: string;
  photoUrl?: string; // Base64 or Object URL
  answers: Record<string, string>;
  customQuestions: string[];
}

export interface EpisodeStory {
  id: string;
  episodeName: string;
  storyContent: string;
}

export interface StoryBible {
  seriesName: string;
  episodes: EpisodeStory[];
}

export interface StoryBeatTemplate {
  id: string;
  name: string;
  description: string;
  beats: {
    id: string;
    title: string;
    description: string;
    targetPercent: number; // örn %10, %50, %75
    guidingQuestions: string[];
  }[];
}

export interface Screenplay {
  id: string;
  title: string;
  elements: ScreenplayElement[];
  format: ScreenplayFormat;
  coverPage?: CoverPageData;
  characterColors?: Record<string, string>; // Karakter Renk Vurgulama Haritası (Karakter -> Renk)
  isTableReadMode?: boolean; // Masa Okuma Modu aktiflik durumu
  spotlightCharacter?: string | null; // Spot ışığı odaklı karakter
  selectedStoryTemplateId?: string; // Seçili hikaye şablonu (Save The Cat, Hero's Journey vb.)
  storyBeatAnswers?: Record<string, string>; // Beat ID -> Yazarın yanıtı
  targetPageCount?: number; // Hedef sayfa sayısı (varsayılan: 110)
  isPagesLocked?: boolean; // Sayfa ve sahne numaralarının kilitlenme durumu (Prodüksiyon / Revizyon)
  lockedAnchors?: { elementId: string; pageNumber: number }[]; // Kilitli sayfa başlangıç çapaları
  lockedSceneAnchors?: { elementId: string; sceneNumber: number | string }[]; // Kilitli sahne başlangıç çapaları
  updatedAt?: number;
  driveFileId?: string;
}

export interface FontOption {
  name: string;
  value: string;
  isGoogleFont: boolean;
  category?: string;
  description?: string;
}

export type RenderGroupItem = 
  | { kind: 'single'; element: ScreenplayElement; index: number }
  | { kind: 'dual'; id: string; left: { element: ScreenplayElement; index: number }[]; right: { element: ScreenplayElement; index: number }[] };

export function groupElementsForRender(elements: ScreenplayElement[]): RenderGroupItem[] {
  const items: RenderGroupItem[] = [];
  let i = 0;
  while (i < elements.length) {
    const el = elements[i];
    if (el.dualPosition === 'left') {
      const leftGroup: { element: ScreenplayElement; index: number }[] = [];
      const rightGroup: { element: ScreenplayElement; index: number }[] = [];
      
      while (i < elements.length && elements[i].dualPosition === 'left') {
        leftGroup.push({ element: elements[i], index: i });
        i++;
      }
      while (i < elements.length && elements[i].dualPosition === 'right') {
        rightGroup.push({ element: elements[i], index: i });
        i++;
      }

      if (leftGroup.length > 0 || rightGroup.length > 0) {
        items.push({
          kind: 'dual',
          id: leftGroup[0]?.element.id || rightGroup[0]?.element.id || `dual-${i}`,
          left: leftGroup,
          right: rightGroup,
        });
      }
    } else if (el.dualPosition === 'right') {
      const rightGroup: { element: ScreenplayElement; index: number }[] = [];
      while (i < elements.length && elements[i].dualPosition === 'right') {
        rightGroup.push({ element: elements[i], index: i });
        i++;
      }
      items.push({
        kind: 'dual',
        id: rightGroup[0]?.element.id || `dual-${i}`,
        left: [],
        right: rightGroup,
      });
    } else {
      items.push({ kind: 'single', element: el, index: i });
      i++;
    }
  }
  return items;
}

export const GOOGLE_FONTS_LIST: FontOption[] = [
  // 1. Monospace / Daktilo (Senaryo Standardı)
  { name: 'Courier Prime', value: "'Courier Prime', 'Courier New', Courier, monospace", isGoogleFont: true, category: 'monospace', description: 'Endüstri Standardı Senaryo Fontu' },
  { name: 'Special Elite', value: "'Special Elite', cursive, monospace", isGoogleFont: true, category: 'monospace', description: 'Vintage Daktilo Efekti' },
  { name: 'Anonymous Pro', value: "'Anonymous Pro', monospace", isGoogleFont: true, category: 'monospace', description: 'Temiz Kod & Senaryo Monospace' },
  { name: 'JetBrains Mono', value: "'JetBrains Mono', monospace", isGoogleFont: true, category: 'monospace', description: 'Modern ve Okunaklı Monospace' },
  { name: 'Fira Code', value: "'Fira Code', monospace", isGoogleFont: true, category: 'monospace', description: 'Popüler Modern Monospace' },
  { name: 'Space Mono', value: "'Space Mono', monospace", isGoogleFont: true, category: 'monospace', description: 'Geometrik Monospace' },
  { name: 'Roboto Mono', value: "'Roboto Mono', monospace", isGoogleFont: true, category: 'monospace', description: 'Google Roboto Monospace' },
  { name: 'Source Code Pro', value: "'Source Code Pro', monospace", isGoogleFont: true, category: 'monospace', description: 'Adobe Monospace Fontu' },
  { name: 'Inconsolata', value: "'Inconsolata', monospace", isGoogleFont: true, category: 'monospace', description: 'Hümanist Monospace' },
  { name: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace", isGoogleFont: true, category: 'monospace', description: 'IBM Kurumsal Monospace' },
  { name: 'Cutive Mono', value: "'Cutive Mono', monospace", isGoogleFont: true, category: 'monospace', description: 'Klasik Daktilo Fontu' },
  { name: 'Share Tech Mono', value: "'Share Tech Mono', monospace", isGoogleFont: true, category: 'monospace', description: 'Teknolojik / Bilim Kurgu Monospace' },
  { name: 'VT323', value: "'VT323', monospace", isGoogleFont: true, category: 'monospace', description: 'Retro 80\'ler Bilgisayar Ekranı' },

  // 2. Serif / Klasik & Edebi
  { name: 'Lora', value: "'Lora', serif", isGoogleFont: true, category: 'serif', description: 'Zarif Çağdaş Edebi Serif' },
  { name: 'EB Garamond', value: "'EB Garamond', serif", isGoogleFont: true, category: 'serif', description: 'Klasik Fransız Rönesans Serifi' },
  { name: 'Cormorant Garamond', value: "'Cormorant Garamond', serif", isGoogleFont: true, category: 'serif', description: 'Gösterişli & Estetik Serif' },
  { name: 'Merriweather', value: "'Merriweather', serif", isGoogleFont: true, category: 'serif', description: 'Ekranlar İçin Okunaklı Serif' },
  { name: 'Playfair Display', value: "'Playfair Display', serif", isGoogleFont: true, category: 'serif', description: 'Yüksek Kontrastlı Prestij Serifi' },
  { name: 'Cinzel', value: "'Cinzel', serif", isGoogleFont: true, category: 'serif', description: 'Roma / Tarihi / Epik Sinematik' },
  { name: 'Libre Baskerville', value: "'Libre Baskerville', serif", isGoogleFont: true, category: 'serif', description: 'Geleneksel İngiliz Baskı Fontu' },
  { name: 'Crimson Text', value: "'Crimson Text', serif", isGoogleFont: true, category: 'serif', description: 'Kitap & Roman Tipografisi' },
  { name: 'Spectral', value: "'Spectral', serif", isGoogleFont: true, category: 'serif', description: 'Modern Editoryal Serif' },
  { name: 'Noto Serif', value: "'Noto Serif', serif", isGoogleFont: true, category: 'serif', description: 'Geniş Dil Destekli Serif' },
  { name: 'Bitter', value: "'Bitter', serif", isGoogleFont: true, category: 'serif', description: 'Çağdaş Slab Serif' },
  { name: 'Bodoni Moda', value: "'Bodoni Moda', serif", isGoogleFont: true, category: 'serif', description: 'Lüks & Moda Tipografisi' },
  { name: 'Cinzel Decorative', value: "'Cinzel Decorative', serif", isGoogleFont: true, category: 'serif', description: 'Dekoratif Epik Başlık Serifi' },

  // 3. Sans-Serif / Modern & Temiz
  { name: 'Inter', value: "'Inter', sans-serif", isGoogleFont: true, category: 'sans', description: 'Mükemmel Dijital Ekran Sans-Serif' },
  { name: 'Roboto', value: "'Roboto', sans-serif", isGoogleFont: true, category: 'sans', description: 'Google Standart Sans' },
  { name: 'Montserrat', value: "'Montserrat', sans-serif", isGoogleFont: true, category: 'sans', description: 'Geometrik Şehir Tipografisi' },
  { name: 'Poppins', value: "'Poppins', sans-serif", isGoogleFont: true, category: 'sans', description: 'Yuvarlak Geometrik Sans' },
  { name: 'Open Sans', value: "'Open Sans', sans-serif", isGoogleFont: true, category: 'sans', description: 'Hümanist Nötr Sans' },
  { name: 'Lato', value: "'Lato', sans-serif", isGoogleFont: true, category: 'sans', description: 'Sıcak & Samimi Sans-Serif' },
  { name: 'Nunito', value: "'Nunito', sans-serif", isGoogleFont: true, category: 'sans', description: 'Yumuşak Kavisli Sans' },
  { name: 'Outfit', value: "'Outfit', sans-serif", isGoogleFont: true, category: 'sans', description: 'Modern Dijital Geometrik' },
  { name: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif", isGoogleFont: true, category: 'sans', description: 'Çağdaş Temiz Sans' },
  { name: 'Raleway', value: "'Raleway', sans-serif", isGoogleFont: true, category: 'sans', description: 'Zarif İnce Sans-Serif' },
  { name: 'Work Sans', value: "'Work Sans', sans-serif", isGoogleFont: true, category: 'sans', description: 'İş & Editoryal Sans' },
  { name: 'DM Sans', value: "'DM Sans', sans-serif", isGoogleFont: true, category: 'sans', description: 'Minimalist Modern Sans' },
  { name: 'Space Grotesk', value: "'Space Grotesk', sans-serif", isGoogleFont: true, category: 'sans', description: 'Fütüristik Grotesk Sans' },
  { name: 'Syne', value: "'Syne', sans-serif", isGoogleFont: true, category: 'sans', description: 'Avangart Sanatsal Sans' },
  { name: 'Oswald', value: "'Oswald', sans-serif", isGoogleFont: true, category: 'sans', description: 'Yoğunlaştırılmış Başlık Sans' },
  { name: 'Bebas Neue', value: "'Bebas Neue', sans-serif", isGoogleFont: true, category: 'sans', description: 'Cesur Film Afişi Başlığı' },
  { name: 'Rubik', value: "'Rubik', sans-serif", isGoogleFont: true, category: 'sans', description: 'Hafif Yuvarlak Çağdaş Sans' },
  { name: 'Manrope', value: "'Manrope', sans-serif", isGoogleFont: true, category: 'sans', description: 'Yarı Geometrik Modern Sans' },

  // 4. Display / Özel & Karakteristik
  { name: 'Abril Fatface', value: "'Abril Fatface', cursive", isGoogleFont: true, category: 'display', description: 'Dramatik Büyük Başlık Fontu' },
  { name: 'Alfa Slab One', value: "'Alfa Slab One', cursive", isGoogleFont: true, category: 'display', description: 'Ultra Kalın Slab Display' },
  { name: 'Righteous', value: "'Righteous', cursive", isGoogleFont: true, category: 'display', description: 'Retro Sinematik 80ler' },
  { name: 'Bungee', value: "'Bungee', cursive", isGoogleFont: true, category: 'display', description: 'Kentsel & Tabela Stili' },
  { name: 'Permanent Marker', value: "'Permanent Marker', cursive", isGoogleFont: true, category: 'display', description: 'Keçeli Kalem & Grafiti' },
  { name: 'Press Start 2P', value: "'Press Start 2P', cursive", isGoogleFont: true, category: 'display', description: '8-Bit Retro Arcade Fontu' },
  { name: 'Orbitron', value: "'Orbitron', sans-serif", isGoogleFont: true, category: 'display', description: 'Bilim Kurgu & Siberpunk' },
  { name: 'Audiowide', value: "'Audiowide', cursive", isGoogleFont: true, category: 'display', description: 'Fütüristik Teknoloji Fontu' },
  { name: 'Monoton', value: "'Monoton', cursive", isGoogleFont: true, category: 'display', description: 'Retro Çizgili Neon Başlık' },
  { name: 'UnifrakturMaguntia', value: "'UnifrakturMaguntia', cursive", isGoogleFont: true, category: 'display', description: 'Gotik Ortaçağ Kaligrafisi' },

  // 5. Handwriting / El Yazısı & Notlar
  { name: 'Caveat', value: "'Caveat', cursive", isGoogleFont: true, category: 'handwriting', description: 'Doğal & Akıcı El Yazısı' },
  { name: 'Kalam', value: "'Kalam', cursive", isGoogleFont: true, category: 'handwriting', description: 'Tükenmez Kalem El Yazısı' },
  { name: 'Shadows Into Light', value: "'Shadows Into Light', cursive", isGoogleFont: true, category: 'handwriting', description: 'Neşeli & Temiz El Notu' },
  { name: 'Indie Flower', value: "'Indie Flower', cursive", isGoogleFont: true, category: 'handwriting', description: 'Rahat & Özgün El Çizimi' },
  { name: 'Dancing Script', value: "'Dancing Script', cursive", isGoogleFont: true, category: 'handwriting', description: 'Kıvrak & Zarif Kaligrafi' },
  { name: 'Pacifico', value: "'Pacifico', cursive", isGoogleFont: true, category: 'handwriting', description: 'Retro 50ler Sörf Kaligrafisi' },
  { name: 'Satisfy', value: "'Satisfy', cursive", isGoogleFont: true, category: 'handwriting', description: 'Zarif Fırça Yazısı' },
  { name: 'Covered By Your Grace', value: "'Covered By Your Grace', cursive", isGoogleFont: true, category: 'handwriting', description: 'Serbest Senaryo Revizyon Notu' },

  // 6. Base System Fonts (Her Cihazda Yüklü Sistem Fontları)
  { name: 'Courier New', value: "'Courier New', Courier, monospace", isGoogleFont: false, category: 'system', description: 'Standart Sistem Daktilo Fontu' },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif', isGoogleFont: false, category: 'system', description: 'Standart Sistem Sans-Serif' },
  { name: 'Helvetica', value: "'Helvetica Neue', Helvetica, Arial, sans-serif", isGoogleFont: false, category: 'system', description: 'Klasik İsviçre Tipografisi' },
  { name: 'Times New Roman', value: "'Times New Roman', Times, serif", isGoogleFont: false, category: 'system', description: 'Standart Sistem Serif' },
  { name: 'Georgia', value: "Georgia, serif", isGoogleFont: false, category: 'system', description: 'Okunaklı Sistem Serifi' },
  { name: 'Garamond', value: "Garamond, serif", isGoogleFont: false, category: 'system', description: 'Klasik Sistem Garamond' },
  { name: 'Palatino', value: "'Palatino Linotype', Palatino, serif", isGoogleFont: false, category: 'system', description: 'Zarif Sistem Serifi' },
  { name: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif", isGoogleFont: false, category: 'system', description: 'Modern Sistem Sans' },
  { name: 'Verdana', value: "Verdana, Geneva, sans-serif", isGoogleFont: false, category: 'system', description: 'Geniş Karakterli Ekran Sans' },
  { name: 'Monaco', value: "Monaco, 'Courier New', monospace", isGoogleFont: false, category: 'system', description: 'macOS Sistem Monospace' },
  { name: 'Menlo', value: "Menlo, Monaco, monospace", isGoogleFont: false, category: 'system', description: 'Apple Sistem Monospace' },
  { name: 'Consolas', value: "Consolas, 'Courier New', monospace", isGoogleFont: false, category: 'system', description: 'Windows Sistem Monospace' },
  { name: 'Impact', value: "Impact, Charcoal, sans-serif", isGoogleFont: false, category: 'system', description: 'Ağır & Vurgulu Sistem Fontu' },
  { name: 'Comic Sans MS', value: "'Comic Sans MS', cursive, sans-serif", isGoogleFont: false, category: 'system', description: 'Çizgi Roman Stili' },
];

export interface Collaborator {
  id: string;
  name: string;
  avatarColor: string;
  role: 'host' | 'editor' | 'viewer';
  status: 'online' | 'typing' | 'idle';
  currentElementId?: string;
  lastActive: number;
}

export interface CollaborationSession {
  userId?: string;
  roomId: string;
  roomName: string;
  isHost: boolean;
  isConnected: boolean;
  allowGuestEditing: boolean;
  requireApproval: boolean;
  lockActiveParagraphs: boolean;
  showCollaboratorCursors: boolean;
  userName: string;
  userColor: string;
  collaborators: Collaborator[];
  pendingRequests: { id: string; name: string; requestedAt: number }[];
}

export interface ElementSplitData {
  slices: string[];
  pageNumbers: number[];
  isDialogue: boolean;
}

export interface SplitLimitData {
  charLimit: number;
  page1: number;
  page2: number;
  pageLabel1?: string;
  pageLabel2?: string;
  isDialogue: boolean;
}

/**
 * Kilitli sayfa numaralandırması için A-Sayfası etiket üreticisi (örn: 12 -> 12, subIndex 1 -> 12A, subIndex 2 -> 12B ...)
 */
export function formatPageLabel(basePage: number, subIndex: number): string {
  if (subIndex <= 0) return `${basePage}`;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (subIndex <= 26) {
    return `${basePage}${letters[subIndex - 1]}`;
  }
  const first = letters[Math.floor((subIndex - 1) / 26) - 1];
  const second = letters[(subIndex - 1) % 26];
  return `${basePage}${first}${second}`;
}

/**
 * Kilitli sahne numaralandırması için A-Sahnesi etiket üreticisi (örn: 1 -> 1, subIndex 1 -> 1A, subIndex 2 -> 1B, baseScene 0 -> A1)
 */
export function formatSceneLabel(baseScene: number, subIndex: number): string {
  if (subIndex <= 0) return `${baseScene}`;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let letterStr = '';
  if (subIndex <= 26) {
    letterStr = letters[subIndex - 1];
  } else {
    const first = letters[Math.floor((subIndex - 1) / 26) - 1];
    const second = letters[(subIndex - 1) % 26];
    letterStr = `${first}${second}`;
  }
  if (baseScene <= 0) {
    return `${letterStr}1`;
  }
  return `${baseScene}${letterStr}`;
}

export const REVISION_COLOR_LABELS: Record<string, string> = {
  blue: 'Mavi',
  pink: 'Pembe',
  yellow: 'Sarı',
  green: 'Yeşil',
  goldenrod: 'Altın',
  white: 'Beyaz'
};

/**
 * Endüstri Standardı Üst Bilgi (Header) revizyon başlığı üreticisi:
 * Revizyonlu sayfa: [Renk] revizyon ([Tarih]) [Sayfa No]. (Örn: Mavi revizyon (21.09.2026) 12.)
 * Standart sayfa: [Sayfa No]. (Örn: 12.)
 */
export function getRevisionHeaderText(pageLabel: string, revisionColor?: string, revisionDate?: string): string {
  if (!revisionColor || revisionColor === 'white') {
    return `${pageLabel}.`;
  }
  const colorName = (REVISION_COLOR_LABELS[revisionColor] || revisionColor).toLocaleLowerCase('tr-TR');
  const dateStr = revisionDate ? ` (${revisionDate})` : '';
  return `${colorName} revizyon${dateStr} ${pageLabel}.`;
}

export function splitHtmlIntoSlices(html: string, charLimits: number[]): string[] {
  if (!html || charLimits.length === 0) return [html];

  const regex = /(<[^>]+>)|(&nbsp;|&amp;|&lt;|&gt;|&quot;|&#039;)|(\s+)|([^\s<>&]+)/g;
  const tokens: { text: string; isTag: boolean; charLen: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      tokens.push({ text: match[1], isTag: true, charLen: 0 });
    } else {
      const entityOrText = match[0];
      const len = match[2] ? 1 : entityOrText.length;
      tokens.push({ text: entityOrText, isTag: false, charLen: len });
    }
  }

  if (tokens.length === 0) return [html];

  const slices: string[] = [];
  let currentTokenIdx = 0;
  let activeTags: string[] = [];

  for (let limitIdx = 0; limitIdx < charLimits.length && currentTokenIdx < tokens.length; limitIdx++) {
    const targetLimit = charLimits[limitIdx];
    let accumulatedChars = 0;
    let splitPoint = tokens.length;

    for (let i = currentTokenIdx; i < tokens.length; i++) {
      const t = tokens[i];
      accumulatedChars += t.charLen;
      if (accumulatedChars >= targetLimit) {
        let bestIdx = i;
        for (let j = i; j >= currentTokenIdx; j--) {
          if (!tokens[j].isTag && /^\s+$/.test(tokens[j].text)) {
            bestIdx = j;
            break;
          }
        }
        splitPoint = bestIdx > currentTokenIdx ? bestIdx : (i > currentTokenIdx ? i : i + 1);
        break;
      }
    }

    if (splitPoint >= tokens.length && limitIdx < charLimits.length - 1) {
      splitPoint = tokens.length;
    }

    if (splitPoint <= currentTokenIdx) {
      splitPoint = Math.min(tokens.length, currentTokenIdx + 1);
    }

    let sliceHtml = '';
    for (let j = 0; j < activeTags.length; j++) {
      sliceHtml += `<${activeTags[j]}>`;
    }

    for (let i = currentTokenIdx; i < splitPoint; i++) {
      const t = tokens[i];
      sliceHtml += t.text;
      if (t.isTag) {
        const closeMatch = t.text.match(/^<\/\s*([a-zA-Z0-9]+)/);
        const openMatch = t.text.match(/^<\s*([a-zA-Z0-9]+)[^>]*>/);
        if (closeMatch) {
          activeTags.pop();
        } else if (openMatch && !t.text.endsWith('/>')) {
          activeTags.push(openMatch[1]);
        }
      }
    }

    for (let j = activeTags.length - 1; j >= 0; j--) {
      sliceHtml += `</${activeTags[j]}>`;
    }

    const trimmed = sliceHtml.trim();
    if (trimmed) slices.push(trimmed);
    currentTokenIdx = splitPoint;
  }

  if (currentTokenIdx < tokens.length) {
    let finalSlice = '';
    for (let j = 0; j < activeTags.length; j++) {
      finalSlice += `<${activeTags[j]}>`;
    }
    for (let i = currentTokenIdx; i < tokens.length; i++) {
      finalSlice += tokens[i].text;
    }
    const trimmed = finalSlice.trim();
    if (trimmed) slices.push(trimmed);
  }

  return slices.length > 0 ? slices : [html];
}

export function joinSlices(s0: string, s1: string): string {
  if (!s0) return s1 || '';
  if (!s1) return s0 || '';
  if (/\s$/.test(s0) || /^\s/.test(s1) || /&nbsp;$/.test(s0) || /^&nbsp;/.test(s1)) {
    return s0 + s1;
  }
  return s0 + ' ' + s1;
}


