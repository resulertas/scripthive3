import { ScreenplayElement, ElementType, CoverPageData, ScreenplayFormat } from '../types';

interface PdfLineItem {
  text: string;
  x: number;
  y: number;
  width: number;
  rightX: number;
  page: number;
  pageWidth: number;
  pageHeight: number;
}

export interface ParsedScreenplayResult {
  elements: ScreenplayElement[];
  coverPage: CoverPageData | null;
  format?: ScreenplayFormat;
  stats: {
    totalPages: number;
    totalScenes: number;
    totalCharacters: number;
    totalElements: number;
  };
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

/**
 * Normalizes text and strips stray control characters while preserving UTF-8 Turkish letters
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if line is a Scene Heading (Slugline)
 */
function isSceneHeading(text: string, upper: string, x: number): boolean {
  if (x > 160) return false; // Scene headings are strictly left aligned
  
  // Standard prefix matches (TR & EN)
  if (upper.match(/^(\d+[\.\-\s]+)?(İÇ|IÇ|DIŞ|DIS|EXT|INT|EXT\.|INT\.|I\/E|İÇ\/DIŞ|IÇ\/DIS|DIŞ\/İÇ|DIS\/IÇ)([\/\.\-\s:]|$)/i)) return true;
  
  // SAHNE / SCENE prefix
  if (upper.match(/^(\d+[\.\-\s]+)?(SAHNE|SCENE|SAH\.|SC\.)([\s\.\-:\d]|$)/i)) return true;
  
  // Special sluglines
  if (upper.match(/^(FLASHBACK|FLASH BACK|RÜYA SEKANSI|RÜYA|DREAM SEQUENCE|MONTAJ|MONTAGE|SERIES OF SHOTS|INSERT)[\s\.\-:\/]/i) ||
      upper === 'FLASHBACK' || upper === 'MONTAJ' || upper === 'MONTAGE') {
    return true;
  }
  
  // Numbered scene heading e.g. "14. EV - GÜN" or "14  LIVING ROOM - DAY  14"
  if (text.match(/^\d+[\.\-\s]+/) && text === upper && text.length < 80 && (upper.includes(' - ') || upper.includes(' – ') || upper.includes(' GÜN') || upper.includes(' GECE') || upper.includes(' DAY') || upper.includes(' NIGHT'))) {
    return true;
  }

  return false;
}

/**
 * Checks if line is a Transition
 */
function isTransition(text: string, upper: string, x: number): boolean {
  if (upper.match(/^(KESME:|HIZLI KESME:|GEÇİŞ:|GEÇİŞİ:|ZAMAN GEÇİŞİ:|ÇAPRAZ GEÇİŞ:|CUT TO:|SMASH CUT TO:|MATCH CUT TO:|DISSOLVE TO:|JUMP CUT TO:|CROSSFADE TO:|FADE IN:|FADE OUT\.|FADE TO BLACK\.|FADE TO WHITE\.|FADE IN\.|FADE OUT:|KARARMA\.|AÇILMA\.|SAHNE SONU\.?)/i)) return true;
  if ((upper.endsWith('CUT TO:') || upper.endsWith('GEÇİŞ:') || upper.endsWith('GEÇİŞİ:') || upper.endsWith('DISSOLVE TO:') || upper.endsWith('KESME:')) && upper.length < 35) return true;
  if (x > 340 && (upper.endsWith(':') || upper.endsWith('.')) && upper.length < 30 && text === upper) return true;
  return false;
}

/**
 * Checks if line is a Character Name
 */
function isCharacter(text: string, upper: string, x: number, prevType: ElementType | null): boolean {
  if (x < 170 || x > 360) return false; // Characters are centered-indented (around 220-300pt)
  if (text.length > 45 || text.length < 1) return false;
  
  // Strip parenthetical modifiers e.g. "MURAT (V.O.)" -> "MURAT"
  const cleanName = text.replace(/\s*\([^\)]+\)$/, '').trim();
  const upperClean = cleanName.toLocaleUpperCase('tr-TR');
  
  if (cleanName !== upperClean) return false; // Must be ALL CAPS
  if (cleanName.match(/[!?\,;]$/)) return false;
  if (cleanName.endsWith('.') && !cleanName.match(/^(DR|PROF|MR|MRS|MS|AV|YK|NO|NUM|GEN|KOM)\.$/i)) return false;
  if (cleanName.match(/^\d+$/)) return false;

  const commonActionWords = [
    'SESSİZLİK', 'KARANLIK', 'GÜN IŞIĞI', 'PATLAMA', 'GÜRÜLTÜ', 'ÇIĞLIK', 
    'BİR SÜRE SONRA', 'AYNI ANDA', 'DEVAM EDER', 'SON', 'THE END',
    'SILENCE', 'DARKNESS', 'BLACKOUT', 'CONTINUED', 'LATER', 'MOMENTS LATER'
  ];
  if (commonActionWords.includes(upperClean)) return false;

  return true;
}

interface SplitFrenchDialogueResult {
  character: string;
  parenthetical?: string;
  dialogue: string;
}

function splitInlineFrenchDialogue(text: string): SplitFrenchDialogueResult | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length < 3) return null;

  const upper = trimmed.toLocaleUpperCase('tr-TR');

  if (isSceneHeading(trimmed, upper, 72) || isTransition(trimmed, upper, 72)) {
    return null;
  }

  const nonCharacterWords = new Set([
    'SESSİZLİK', 'KARANLIK', 'GÜN IŞIĞI', 'PATLAMA', 'GÜRÜLTÜ', 'ÇIĞLIK',
    'BİR SÜRE SONRA', 'AYNI ANDA', 'DEVAM EDER', 'SON', 'THE END',
    'SILENCE', 'DARKNESS', 'BLACKOUT', 'CONTINUED', 'LATER', 'MOMENTS LATER',
    'NOT', 'DİKKAT', 'AÇIKLAMA', 'UYARI', 'ÖNEMLİ', 'SAHNE', 'SCENE',
    'FLASHBACK', 'MONTAJ', 'MONTAGE', 'RÜYA', 'DREAM', 'MÜZİK', 'SES',
    'DIŞ SES', 'İÇ SES', 'KAPI', 'PENCERE', 'MASA', 'SOKAK', 'ARABA'
  ]);

  // Case 1: CHARACTER (parenthetical) [-/:] dialogue
  const parenMatch = trimmed.match(/^([A-ZÇĞİÖŞÜ0-9\s\'\&\#\+]{1,35})\s*(\([^\)]+\))\s*(?:[-–—:]|\.-|\.|\/)?\s*(.+)$/);
  if (parenMatch) {
    const rawChar = parenMatch[1].trim();
    const upperChar = rawChar.toLocaleUpperCase('tr-TR');
    const paren = parenMatch[2].trim();
    const dial = parenMatch[3].trim();

    const cleanNameOnly = rawChar.replace(/[\.\-–—/:]+$/, '').trim();
    const upperCleanName = cleanNameOnly.toLocaleUpperCase('tr-TR');

    if (cleanNameOnly === upperCleanName && cleanNameOnly.length >= 2 && !nonCharacterWords.has(upperCleanName) && dial.length > 0) {
      const isVoiceOver = /^\((V\.O\.|O\.S\.|D\.S\.|O\.C\.|DIŞ SES|İÇ SES|TELEFONDA|TEL|OFF SCREEN|VOICE OVER)\)$/i.test(paren);
      if (isVoiceOver) {
        return { character: `${cleanNameOnly} ${paren}`, dialogue: dial };
      } else {
        return { character: cleanNameOnly, parenthetical: paren, dialogue: dial };
      }
    }
  }

  // Case 2: CHARACTER - dialogue / CHARACTER: dialogue / CHARACTER. dialogue
  const sepMatch = trimmed.match(/^([A-ZÇĞİÖŞÜ0-9\s\'\&\#\+]+(?:\s*\([^\)]+\))?)\s*(?::|[-–—/]+|\.-|\.(?=\s+[A-ZÇĞİÖŞÜa-zçğıöşü]))\s*(.+)$/);
  if (sepMatch) {
    const rawChar = sepMatch[1].trim();
    const upperChar = rawChar.toLocaleUpperCase('tr-TR');
    const dial = sepMatch[2].trim();

    const cleanNameOnly = rawChar.replace(/[\.\-–—/:]+$/, '').replace(/\s*\([^\)]+\)$/, '').trim();
    const upperCleanName = cleanNameOnly.toLocaleUpperCase('tr-TR');

    if (
      cleanNameOnly === upperCleanName &&
      cleanNameOnly.length >= 2 &&
      cleanNameOnly.length <= 40 &&
      !nonCharacterWords.has(upperCleanName) &&
      dial.length > 0 &&
      !isSceneHeading(rawChar, upperChar, 72) &&
      !isTransition(rawChar, upperChar, 72)
    ) {
      return { character: rawChar.replace(/[\.\-–—/:]+$/, '').trim(), dialogue: dial };
    }
  }

  // Case 3: CHARACTER dialogue (French format without separator)
  const directMatch = trimmed.match(/^([A-ZÇĞİÖŞÜ0-9\s\'\&\#\+]{2,35})\s+([A-ZÇĞİÖŞÜa-zçğıöşü].*)$/);
  if (directMatch) {
    const candChar = directMatch[1].trim();
    const upperCandChar = candChar.toLocaleUpperCase('tr-TR');
    const dial = directMatch[2].trim();

    const charWordCount = candChar.split(/\s+/).length;
    const hasLower = /[a-zçğıöşü]/.test(dial);

    if (
      candChar === upperCandChar &&
      charWordCount >= 1 &&
      charWordCount <= 4 &&
      candChar.length >= 2 &&
      candChar.length <= 35 &&
      !nonCharacterWords.has(upperCandChar) &&
      hasLower &&
      dial.length >= 2 &&
      !isSceneHeading(candChar, upperCandChar, 72) &&
      !isTransition(candChar, upperCandChar, 72)
    ) {
      const actionStarters = [
        'BİR GÜN', 'HER ŞEY', 'O SIRADA', 'BU SIRADA', 'AYNI ZAMANDA', 'KISA BİR',
        'HERKES', 'KİMSE', 'HİÇ KİMSE', 'YAVAŞ YAVAŞ', 'ADIM ADIM', 'BİRDENBİRE',
        'GÖZLERİ', 'ELLERİ', 'YÜZÜ', 'BAŞI', 'SESİ', 'ARABANIN', 'EVE', 'ODAYA'
      ];
      if (!actionStarters.includes(upperCandChar)) {
        return { character: candChar, dialogue: dial };
      }
    }
  }

  return null;
}

/**
 * Parses a PDF ArrayBuffer into rich screenplay elements following Final Draft's precision rules
 */
export async function parsePdfToScreenplay(arrayBuffer: ArrayBuffer): Promise<ParsedScreenplayResult> {
  let pdfjsLib: any;
  if (typeof window === 'undefined') {
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    } catch {
      pdfjsLib = await import('pdfjs-dist');
    }
  } else {
    pdfjsLib = await import('pdfjs-dist');
    try {
      // @ts-ignore
      const pdfWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
      if (pdfWorker && pdfWorker.default) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;
      }
    } catch (e) {}
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const rawPages: PdfLineItem[][] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    // Group items into physical horizontal lines
    const linesMap = new Map<number, { items: { str: string; x: number; width: number }[]; y: number }>();

    textContent.items.forEach((item: any) => {
      if (!item.str) return;
      const str = item.str.normalize('NFC');
      if (!str) return;

      const x = item.transform[4];
      const y = Math.round(item.transform[5]);
      const width = item.width || 0;

      let foundY = y;
      for (const key of linesMap.keys()) {
        if (Math.abs(key - y) <= 3.5) {
          foundY = key;
          break;
        }
      }

      if (linesMap.has(foundY)) {
        linesMap.get(foundY)!.items.push({ str, x, width });
      } else {
        linesMap.set(foundY, { items: [{ str, x, width }], y: foundY });
      }
    });

    const pageLines: PdfLineItem[] = [];

    // Sort lines by vertical position: Top to Bottom (descending Y)
    const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);

    sortedY.forEach(yKey => {
      const entry = linesMap.get(yKey)!;
      // Sort items within line from Left to Right (ascending X)
      entry.items.sort((a, b) => a.x - b.x);

      let lineText = '';
      let minX = entry.items[0].x;
      let lastX = entry.items[0].x;
      let lastWidth = 0;

      entry.items.forEach((item) => {
        const distance = item.x - (lastX + lastWidth);
        const needsSpace = distance > 3.8 && 
                           lineText.length > 0 && 
                           !lineText.endsWith(' ') && 
                           !item.str.startsWith(' ');

        lineText += (needsSpace ? ' ' : '') + item.str;
        minX = Math.min(minX, item.x);
        lastX = item.x;
        lastWidth = item.width;
      });

      const trimmedText = cleanText(lineText);
      if (!trimmedText) return;

      const rightX = lastX + lastWidth;
      pageLines.push({
        text: trimmedText,
        x: minX,
        y: entry.y,
        width: rightX - minX,
        rightX,
        page: pageNum,
        pageWidth,
        pageHeight
      });
    });

    rawPages.push(pageLines);
  }

  // Detect Cover Page on Page 1
  let coverPage: CoverPageData | null = null;
  let startPageIdx = 0;

  if (rawPages.length > 1 && rawPages[0].length > 0) {
    const p1 = rawPages[0];
    const hasSlugline = p1.some(l => isSceneHeading(l.text, l.text.toLocaleUpperCase('tr-TR'), l.x));
    const isVeryShort = p1.length <= 14;

    if (!hasSlugline && isVeryShort) {
      // Treat Page 1 as Cover Page
      startPageIdx = 1;
      let title = '';
      let author = '';
      let version = '1.0';
      let date = '';
      let contact = '';

      p1.forEach((line, idx) => {
        const upper = line.text.toLocaleUpperCase('tr-TR');
        if (idx === 0 || (line.y > line.pageHeight * 0.5 && !title)) {
          title = line.text;
        } else if (upper.includes('YAZAN') || upper.includes('WRITTEN BY') || upper.includes('BY ')) {
          if (p1[idx + 1]) {
            author = p1[idx + 1].text;
          }
        } else if (!author && idx === 1 && line.text.length < 50) {
          author = line.text;
        } else if (upper.includes('TASLAK') || upper.includes('DRAFT') || upper.includes('REV') || upper.includes('SÜRÜM')) {
          version = line.text;
        } else if (line.text.match(/\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4}/)) {
          date = line.text;
        } else if (line.y < 120) {
          contact += (contact ? '\n' : '') + line.text;
        }
      });

      coverPage = {
        title: title || 'Başlıksız Senaryo',
        author: author || 'Yazar',
        version: version || '1.0',
        date: date || new Date().toLocaleDateString('tr-TR'),
        revisionHistory: contact || undefined
      };
    }
  }

  // Filter Running Headers, Footers & Page Numbers
  const filteredLines: PdfLineItem[] = [];

  for (let pIdx = startPageIdx; pIdx < rawPages.length; pIdx++) {
    const pageLines = rawPages[pIdx];

    pageLines.forEach(line => {
      const upper = line.text.toLocaleUpperCase('tr-TR');
      const distFromTop = line.pageHeight - line.y;
      const distFromBottom = line.y;

      // Top margin header/page number filter
      if (distFromTop <= 65) {
        if (line.text.match(/^(\d+[\.\)]?|page\s*\d+|p\.\s*\d+|\d+\/\d+|\-\s*\d+\s*\-)$/i)) return;
        if (line.x > 440 && line.text.match(/^\d+[\.\)]?$/)) return;
        if (upper.includes('(CONTINUED)') || upper.includes('CONTINUED:')) return;
      }

      // Bottom margin footer/page number filter
      if (distFromBottom <= 65) {
        if (line.text.match(/^(\d+[\.\)]?|page\s*\d+|p\.\s*\d+|\d+\/\d+|\-\s*\d+\s*\-)$/i)) return;
        if (upper === '(MORE)' || upper === '(CONTINUED)' || upper === 'CONTINUED:' || upper === '(DEVAMI)') return;
      }

      // Filter standalone continuation marks in middle
      if (upper === '(MORE)' || upper === 'CONTINUED:' || upper === '(CONTINUED)') return;

      filteredLines.push(line);
    });
  }

  // Element Building with Multi-Line Block Merging (Paragraph Reconstitution)
  const elements: ScreenplayElement[] = [];
  let currentElement: ScreenplayElement | null = null;
  let lastLineY: number = 0;
  let lastLinePage: number = 0;

  const pushCurrent = () => {
    if (currentElement && currentElement.content.trim()) {
      elements.push({
        ...currentElement,
        content: currentElement.content.trim()
      });
      currentElement = null;
    }
  };

  for (let i = 0; i < filteredLines.length; i++) {
    const line = filteredLines[i];
    const text = line.text;
    const upper = text.toLocaleUpperCase('tr-TR');
    const x = line.x;

    const isSamePage = line.page === lastLinePage;
    const deltaY = isSamePage ? (lastLineY - line.y) : 100;
    lastLineY = line.y;
    lastLinePage = line.page;

    // Check for inline French / European character dialogue format (e.g. "MURAT - Nereye gidiyorsun?", "MURAT: Nereye gidiyorsun?", "MURAT Nereye gidiyorsun?")
    const frenchMatch = splitInlineFrenchDialogue(text);
    if (frenchMatch) {
      pushCurrent();
      elements.push({
        id: generateId(),
        type: 'character',
        content: frenchMatch.character
      });
      if (frenchMatch.parenthetical) {
        elements.push({
          id: generateId(),
          type: 'parenthetical',
          content: frenchMatch.parenthetical
        });
      }
      currentElement = {
        id: generateId(),
        type: 'dialogue',
        content: frenchMatch.dialogue
      };
      continue;
    }

    // 1. Scene Heading
    if (isSceneHeading(text, upper, x)) {
      pushCurrent();
      let heading = text;
      let sceneNumber: number | undefined = undefined;

      // Extract leading scene number if present
      const leadingNumMatch = heading.match(/^(\d+)[\.\-\s]+(.*)$/);
      if (leadingNumMatch) {
        sceneNumber = parseInt(leadingNumMatch[1], 10);
        heading = leadingNumMatch[2].trim();
      }

      // Extract trailing scene number if present
      const trailingNumMatch = heading.match(/^(.*?)\s+(\d+)$/);
      if (trailingNumMatch && (!leadingNumMatch || parseInt(trailingNumMatch[2], 10) === sceneNumber)) {
        if (!sceneNumber) sceneNumber = parseInt(trailingNumMatch[2], 10);
        heading = trailingNumMatch[1].trim();
      }

      // Remove leading dot or SAHNE word if present
      if (heading.startsWith('.')) heading = heading.substring(1).trim();

      currentElement = {
        id: generateId(),
        type: 'scene',
        content: heading,
        ...(sceneNumber ? { sceneNumber } : {})
      };
      pushCurrent();
      continue;
    }

    // 2. Transition
    if (isTransition(text, upper, x)) {
      pushCurrent();
      currentElement = {
        id: generateId(),
        type: 'transition',
        content: text
      };
      pushCurrent();
      continue;
    }

    // 3. Parenthetical
    const isParenFormat = (text.startsWith('(') && text.endsWith(')')) || (text.startsWith('(') && !text.endsWith(')') && x > 150 && x < 280);
    if (isParenFormat) {
      if (currentElement && currentElement.type === 'parenthetical' && !currentElement.content.endsWith(')')) {
        // Multi-line parenthetical continuation
        currentElement.content += ' ' + text;
      } else {
        pushCurrent();
        currentElement = {
          id: generateId(),
          type: 'parenthetical',
          content: text
        };
      }
      continue;
    }

    // 4. Character
    const prevType = currentElement ? currentElement.type : (elements.length > 0 ? elements[elements.length - 1].type : null);
    if (isCharacter(text, upper, x, prevType)) {
      // Check if this is a Character continuation e.g. "MURAT (CONT'D)"
      let charName = text.replace(/\s*\((CONT'D|cont'd|DEVAMI|devamı)\)/g, '').trim();
      
      // Dual Dialogue detection
      const isDualRight = x > 310;

      pushCurrent();
      currentElement = {
        id: generateId(),
        type: 'character',
        content: charName,
        ...(isDualRight ? { dualPosition: 'right' as const } : {})
      };
      pushCurrent();
      continue;
    }

    // 5. Dialogue Continuation
    const lastPushedType = elements.length > 0 ? elements[elements.length - 1].type : null;
    const isAfterSpeaker = lastPushedType === 'character' || lastPushedType === 'parenthetical';

    if (isAfterSpeaker || (currentElement && currentElement.type === 'dialogue' && isSamePage && deltaY <= 19)) {
      if (currentElement && currentElement.type === 'dialogue') {
        currentElement.content += ' ' + text;
      } else {
        pushCurrent();
        currentElement = {
          id: generateId(),
          type: 'dialogue',
          content: text
        };
      }
      continue;
    }

    // 6. Action (Scene Description)
    if (currentElement && currentElement.type === 'action' && isSamePage && deltaY <= 18) {
      // Multi-line action paragraph merge
      currentElement.content += ' ' + text;
    } else {
      pushCurrent();
      currentElement = {
        id: generateId(),
        type: 'action',
        content: text
      };
    }
  }

  pushCurrent();

  // Calculate statistics
  let totalScenes = 0;
  let totalCharacters = 0;
  elements.forEach(el => {
    if (el.type === 'scene') totalScenes++;
    if (el.type === 'character') totalCharacters++;
  });

  return {
    elements,
    coverPage,
    format: 'US',
    stats: {
      totalPages: numPages,
      totalScenes,
      totalCharacters,
      totalElements: elements.length
    }
  };
}
