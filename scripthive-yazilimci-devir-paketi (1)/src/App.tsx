/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import TopBar from './components/TopBar';
import Toolbar from './components/Toolbar';
import TabletToolbar from './components/TabletToolbar';
import FindReplaceModal from './components/FindReplaceModal';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Corkboard from './components/Corkboard';
import GuideModal from './components/GuideModal';
import CharacterBibleModal, { PREDEFINED_QUESTIONS } from './components/CharacterBibleModal';
import StoryBibleModal from './components/StoryBibleModal';
import NotesModal from './components/NotesModal';
import CharacterStatsModal from './components/CharacterStatsModal';
import LocationListModal from './components/LocationListModal';
import BinModal from './components/BinModal';
import AiAssistantPanel from './components/AiAssistantPanel';
import DialogueTunerModal from './components/DialogueTunerModal';
import ActorSidesModal from './components/ActorSidesModal';
import CharacterMatrixModal from './components/CharacterMatrixModal';
import SmartRenameModal from './components/SmartRenameModal';
import TableReadModal, { TABLE_READ_PALETTE } from './components/TableReadModal';
import StoryBeatsModal from './components/StoryBeatsModal';
import DramaticArcModal from './components/DramaticArcModal';
import OutlineEditor from './components/OutlineEditor';
import FontPickerModal, { loadGoogleFontDynamically } from './components/FontPickerModal';
import SplitCompanionPanel, { SplitPanelTab } from './components/SplitCompanionPanel';
import CollaborationModal from './components/CollaborationModal';
import { sendCollabMessage, subscribeCollabMessages, connectCollabStream, disconnectCollabStream, CollabMessage } from './lib/collaborationSync';
import { ScreenplayElement, ScreenplayFormat, ElementType, CoverPageData, Screenplay, BinItem, GOOGLE_FONTS_LIST, groupElementsForRender, CollaborationSession, Collaborator, formatSceneLabel, REVISION_COLOR_LABELS } from './types';
import { safeStorage, safeSessionStorage } from './lib/storage';
import { parsePdfToScreenplay } from './lib/pdfScreenplayParser';
import { Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, Header, PageNumber } from 'docx';
import { sprintActions } from './store/sprintStore';


const getApiUrl = (path: string) => {
  const appUrl = (process.env.APP_URL as string || '').replace(/\/$/, '');
  if (appUrl && !appUrl.includes('MY_APP_URL')) {
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${appUrl}${formattedPath}`;
  }
  return path;
};

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const initialElements: ScreenplayElement[] = [
  { id: generateId(), type: 'scene', content: 'İÇ. BAR - GECE' },
  { id: generateId(), type: 'action', content: 'Mekan loş. Sigara dumanı havada asılı kalmış. MURAT (30) barın köşesinde tek başına oturuyor. Önündeki bardak yarım. Kapı açılır, soğuk rüzgar içeri dalar.' },
  { id: generateId(), type: 'character', content: 'MURAT' },
  { id: generateId(), type: 'parenthetical', content: '(Kendi kendine, fısıltıyla) Neden hep en zor olanı seçeriz ki?' },
  { id: generateId(), type: 'action', content: 'SELIN içeri girer. Üzerindeki palto sırılsıklam. Murat\'ı fark eder ama bakışlarını kaçırır. Tezgaha doğru yürür.' },
  { id: generateId(), type: 'character', content: 'SELIN' },
  { id: generateId(), type: 'dialogue', content: 'Gelmeni beklemiyordum.' },
  { id: generateId(), type: 'scene', content: 'DIŞ. SOKAK - GECE' },
  { id: generateId(), type: 'action', content: 'Yağmur şiddetini artırır. Sokak lambaları titrek bir ışık saçar. Uzaktan bir siren sesi duyulur.' },
  { id: generateId(), type: 'character', content: 'MURAT' },
  { id: generateId(), type: 'dialogue', content: 'Biliyorum. Ama buradayım işte.' },
  { id: generateId(), type: 'transition', content: 'SAHNE SONU' },
];

const cleanClipboardHtml = (html: string): string => {
  if (!html) return '';
  try {
    const formatted = html
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n');

    const parser = new DOMParser();
    const doc = parser.parseFromString(formatted, 'text/html');
    const text = doc.body.textContent || doc.body.innerText || '';
    return text
      .replace(/\u00A0/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  } catch (e) {
    return html.replace(/<[^>]*>?/gm, '');
  }
};

const isSceneHeadingText = (trimmed: string, upper: string): boolean => {
  if (trimmed.startsWith('### ')) return true;
  if (trimmed.startsWith('.') && trimmed.length > 2 && trimmed[1] !== '.' && !trimmed.startsWith('...')) return true;
  
  // Standard prefix: İÇ, IÇ, DIŞ, DIS, INT, EXT, INT./EXT., İÇ/DIŞ, etc.
  if (upper.match(/^(\d+[\.\-\s]+)?(İÇ|IÇ|DIŞ|DIS|EXT|INT|EXT\.|INT\.|I\/E|İÇ\/DIŞ|IÇ\/DIS|DIŞ\/İÇ|DIS\/IÇ)([\/\.\-\s:]|$)/i)) return true;

  // Turkish SAHNE / SCENE format
  if (upper.match(/^(\d+[\.\-\s]+)?(SAHNE|SCENE|SAH\.|SC\.)([\s\.\-:\d]|$)/i)) return true;

  // Special sluglines
  if (upper.match(/^(FLASHBACK|FLASH BACK|RÜYA SEKANSI|RÜYA|DREAM SEQUENCE|MONTAJ|MONTAGE|SERIES OF SHOTS|INSERT)[\s\.\-:\/]/i) ||
      upper === 'FLASHBACK' || upper === 'MONTAJ' || upper === 'MONTAGE') {
    return true;
  }
  return false;
};

const isTransitionText = (trimmed: string, upper: string): boolean => {
  if (trimmed.startsWith('> ') || (trimmed.startsWith('>') && !trimmed.endsWith('<') && trimmed.length < 40)) return true;
  if (upper.match(/^(KESME:|HIZLI KESME:|GEÇİŞ:|GEÇİŞİ:|ZAMAN GEÇİŞİ:|ÇAPRAZ GEÇİŞ:|CUT TO:|SMASH CUT TO:|MATCH CUT TO:|DISSOLVE TO:|JUMP CUT TO:|CROSSFADE TO:|FADE IN:|FADE OUT\.|FADE TO BLACK\.|FADE TO WHITE\.|FADE IN\.|FADE OUT:|KARARMA\.|AÇILMA\.|SAHNE SONU\.?)/i)) return true;
  if ((upper.endsWith('CUT TO:') || upper.endsWith('GEÇİŞ:') || upper.endsWith('GEÇİŞİ:') || upper.endsWith('DISSOLVE TO:') || upper.endsWith('KESME:')) && upper.length < 35) return true;
  return false;
};

const isCharacterNameText = (trimmed: string, upper: string, indentSpaces: number): boolean => {
  if (!trimmed) return false;
  if (trimmed.startsWith('@')) return true;
  if (trimmed.startsWith('**') && trimmed.endsWith('**')) return true;
  if (trimmed.endsWith(' ^') || trimmed.endsWith('^')) return true;

  if (isSceneHeadingText(trimmed, upper) || isTransitionText(trimmed, upper)) return false;
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) return false;

  // Strip parenthetical extension e.g. "MURAT (V.O.)" -> "MURAT"
  const cleanName = trimmed.replace(/\s*\([^\)]+\)$/, '').trim();
  const upperClean = cleanName.toLocaleUpperCase('tr-TR');

  if (cleanName !== upperClean) return false;
  if (cleanName.length > 40 || cleanName.length < 1) return false;

  if (cleanName.match(/[!?\,;]$/)) return false;
  if (cleanName.endsWith('.') && !cleanName.match(/^(DR|PROF|MR|MRS|MS|AV|YK|NO|NUM|GEN|KOM)\.$/i)) return false;
  if (cleanName.match(/^\d+$/)) return false;

  if (indentSpaces >= 18 && indentSpaces < 45) return true;

  const isNamePattern = /^[A-ZÇĞİÖŞÜ0-9\s\.\-\'\&\/\#\+]+$/.test(upperClean);
  if (!isNamePattern) return false;

  const commonActionWords = [
    'SESSİZLİK', 'KARANLIK', 'GÜN IŞIĞI', 'PATLAMA', 'GÜRÜLTÜ', 'ÇIĞLIK', 
    'BİR SÜRE SONRA', 'AYNI ANDA', 'DEVAM EDER', 'SON', 'THE END',
    'SILENCE', 'DARKNESS', 'BLACKOUT', 'CONTINUED', 'LATER', 'MOMENTS LATER'
  ];
  if (commonActionWords.includes(upperClean)) return false;

  return true;
};

interface SplitFrenchDialogueResult {
  character: string;
  parenthetical?: string;
  dialogue: string;
}

const splitInlineFrenchDialogue = (text: string): SplitFrenchDialogueResult | null => {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length < 3) return null;

  const upper = trimmed.toLocaleUpperCase('tr-TR');

  if (isSceneHeadingText(trimmed, upper) || isTransitionText(trimmed, upper)) {
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
      !isSceneHeadingText(rawChar, upperChar) &&
      !isTransitionText(rawChar, upperChar)
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
      !isSceneHeadingText(candChar, upperCandChar) &&
      !isTransitionText(candChar, upperCandChar)
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
};

const parseTextToElements = (text: string): ScreenplayElement[] => {
  const lines = text.split(/\r?\n/);
  const elements: ScreenplayElement[] = [];
  let lastType: ElementType = 'action';
  let isNewBlock = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      lastType = 'action';
      isNewBlock = true;
      continue;
    }
    
    // Ignore markdown artifacts like --- or meta blocks at the start naturally, or parse them clean
    if (trimmedLine === '---' || trimmedLine.startsWith('# ') || trimmedLine.startsWith('**Yazan:**') || trimmedLine.startsWith('**Sürüm:**')) {
      isNewBlock = true;
      continue;
    }

    // Measure the indentation in the original line before trimming
    const leadingWhitespace = line.match(/^([ \t]*)/)?.[0] || '';
    const indentSpaces = leadingWhitespace.split('').reduce((acc, char) => acc + (char === '\t' ? 8 : 1), 0);

    const upperLine = trimmedLine.toLocaleUpperCase('tr-TR');

    // Check for inline French / European character dialogue syntax (e.g. MURAT - Nereye gidiyorsun?, MURAT: Geldim., MURAT (fısıltıyla) Ne oldu?, MURAT Nereye gidiyorsun?)
    const frenchMatch = splitInlineFrenchDialogue(trimmedLine);
    if (frenchMatch) {
      elements.push({ id: generateId(), type: 'character', content: frenchMatch.character });
      if (frenchMatch.parenthetical) {
        elements.push({ id: generateId(), type: 'parenthetical', content: frenchMatch.parenthetical });
      }
      elements.push({ id: generateId(), type: 'dialogue', content: frenchMatch.dialogue });
      lastType = 'dialogue';
      isNewBlock = false;
      continue;
    }

    // Check for "CHARACTER:" on its own line
    const charColonOnlyMatch = trimmedLine.match(/^([A-ZÇĞİÖŞÜ0-9\s\.\-\'\&\/\#\+]+(\s*\([^\)]+\))?)\s*:$/);
    if (charColonOnlyMatch) {
      const potentialChar = charColonOnlyMatch[1].trim();
      const upperChar = potentialChar.toLocaleUpperCase('tr-TR');
      if (isCharacterNameText(potentialChar, upperChar, indentSpaces) && !isSceneHeadingText(potentialChar, upperChar) && !isTransitionText(potentialChar, upperChar)) {
        elements.push({ id: generateId(), type: 'character', content: potentialChar });
        lastType = 'character';
        isNewBlock = false;
        continue;
      }
    }

    let type: ElementType = 'action';
    
    // 1. Scene Heading
    if (isSceneHeadingText(trimmedLine, upperLine)) {
      type = 'scene';
    } 
    // 2. Transition
    else if (isTransitionText(trimmedLine, upperLine)) {
      type = 'transition';
    } 
    // 3. Parenthetical
    else if ((trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) || (trimmedLine.startsWith('*(') && trimmedLine.endsWith(')*')) || (trimmedLine.startsWith('*') && trimmedLine.endsWith('*') && !trimmedLine.startsWith('**'))) {
      type = 'parenthetical';
    } 
    // 4. Note
    else if (trimmedLine.startsWith('[[') && trimmedLine.endsWith(']]')) {
      type = 'note';
    } 
    // 5. Character
    else if (isCharacterNameText(trimmedLine, upperLine, indentSpaces)) {
      type = 'character';
    } 
    // 6. Dialogue
    else if (lastType === 'character' || lastType === 'parenthetical' || (lastType === 'dialogue' && !isNewBlock)) {
      type = 'dialogue';
    } 
    // 7. Action
    else {
      type = 'action';
    }

    lastType = type;
    
    // Clean markdown wraps if they exist
    let content = trimmedLine;
    if (content.startsWith('### ')) {
      content = content.replace(/^###\s*/, '');
    } else if (content.startsWith('**') && content.endsWith('**')) {
      content = content.replace(/^\*\*|\*\*$/g, '');
    } else if (content.startsWith('*(') && content.endsWith(')*')) {
      content = content.replace(/^\*\(/, '(').replace(/\)\*$/, ')');
    } else if (content.startsWith('*') && content.endsWith('*') && !content.startsWith('**')) {
      content = '(' + content.replace(/^\*|\*$/g, '').trim() + ')';
    } else if (content.startsWith('> ')) {
      content = content.replace(/^>\s*/, '');
    } else if (content.startsWith('[[') && content.endsWith(']]')) {
      content = content.replace(/^\[\[\s*|\s*\]\]$/g, '');
    } else if (content.startsWith('@')) {
      content = content.replace(/^@\s*/, '');
    }
    
    if (type === 'scene') {
      if (content.startsWith('.')) {
        content = content.substring(1).trim();
      }
      content = content.replace(/^\d+[\.\-\s]+/, '');
    }
    
    let isDualRight = false;
    if (type === 'character' && (content.endsWith(' ^') || content.endsWith('^'))) {
      content = content.replace(/\s*\^$/, '').trim();
      isDualRight = true;
    }

    let dualPos: 'left' | 'right' | undefined = undefined;
    if (isDualRight) {
      dualPos = 'right';
      let p = elements.length - 1;
      while (p >= 0 && (elements[p].type === 'dialogue' || elements[p].type === 'parenthetical')) {
        elements[p].dualPosition = 'left';
        p--;
      }
      if (p >= 0 && elements[p].type === 'character') {
        elements[p].dualPosition = 'left';
      }
    } else if (elements.length > 0 && elements[elements.length - 1].dualPosition === 'right' && (type === 'dialogue' || type === 'parenthetical')) {
      dualPos = 'right';
    }

    if (!isNewBlock && elements.length > 0) {
      const lastElement = elements[elements.length - 1];
      if (lastElement.type === type && (type === 'action' || type === 'dialogue')) {
        lastElement.content += '<br>' + content;
        continue;
      }
    }
    
    elements.push({ id: generateId(), type, content, ...(dualPos ? { dualPosition: dualPos } : {}) });
    isNewBlock = false;
  }
  
  return elements;
};

export default function App() {
  const [format, setFormat] = useState<ScreenplayFormat>('US');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [elements, setElements] = useState<ScreenplayElement[]>(() => {
    const saved = safeStorage.getItem('scriptHive_elements');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialElements;
  });
  const [coverPage, setCoverPage] = useState<CoverPageData | null>(() => {
    const saved = safeStorage.getItem('scriptHive_coverPage');
    if (saved && saved !== 'null' && saved !== 'undefined') {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [fontFamily, setFontFamily] = useState<string>(() => {
    return safeStorage.getItem('scriptHive_fontFamily') || "'Courier Prime', 'Courier New', Courier, monospace";
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = safeStorage.getItem('scriptHive_fontSize');
    return saved ? parseInt(saved, 10) || 12 : 12;
  });
  const [fontColor, setFontColor] = useState<string>('');
  const [zoom, setZoom] = useState<number>(100);
  const [uiMode, setUiMode] = useState<'auto' | 'desktop' | 'tablet'>(() => {
    const saved = safeStorage.getItem('scriptHive_uiMode');
    if (saved === 'desktop' || saved === 'tablet') return saved;
    return 'auto';
  });
  const [viewMode, setViewMode] = useState<'editor' | 'cards'>('editor');
  const [isZenMode, setIsZenMode] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCharacterBibleOpen, setIsCharacterBibleOpen] = useState(false);
  const [isStoryBibleOpen, setIsStoryBibleOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLocationListOpen, setIsLocationListOpen] = useState(false);
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDialogueTunerOpen, setIsDialogueTunerOpen] = useState(false);
  const [isActorSidesOpen, setIsActorSidesOpen] = useState(false);
  const [isCharacterMatrixOpen, setIsCharacterMatrixOpen] = useState(false);
  const [isSmartRenameOpen, setIsSmartRenameOpen] = useState(false);
  const [isTableReadModalOpen, setIsTableReadModalOpen] = useState(false);
  const [isStoryBeatsOpen, setIsStoryBeatsOpen] = useState(false);
  const [isDramaticArcOpen, setIsDramaticArcOpen] = useState(false);
  const [isOutlineEditorOpen, setIsOutlineEditorOpen] = useState(false);
  const [outlineOrientation, setOutlineOrientation] = useState<'horizontal' | 'vertical'>(() => {
    return (safeStorage.getItem('scriptHive_outline_orientation') as 'horizontal' | 'vertical') || 'horizontal';
  });

  const handleToggleOutlineOrientation = () => {
    setOutlineOrientation(prev => {
      const next = prev === 'horizontal' ? 'vertical' : 'horizontal';
      safeStorage.setItem('scriptHive_outline_orientation', next);
      return next;
    });
  };

  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState<boolean>(() => {
    const saved = safeStorage.getItem('scriptHive_isToolbarVisible');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleToolbar = () => {
    setIsToolbarVisible(prev => {
      const next = !prev;
      safeStorage.setItem('scriptHive_isToolbarVisible', next.toString());
      return next;
    });
  };

  // Split-Screen (Çift Panel / Yan Yana Çalışma Modu) State - Varsayılan: Kapalı (false)
  const [isSplitScreen, setIsSplitScreen] = useState<boolean>(false);
  const [splitScreenTab, setSplitScreenTab] = useState<SplitPanelTab>(() => {
    return (safeStorage.getItem('scriptHive_splitScreenTab') as SplitPanelTab) || 'cards';
  });
  const [splitScreenPosition, setSplitScreenPosition] = useState<'left' | 'right'>(() => {
    return (safeStorage.getItem('scriptHive_splitScreenPosition') as 'left' | 'right') || 'left';
  });
  const [splitScreenWidth, setSplitScreenWidth] = useState<number>(() => {
    const saved = safeStorage.getItem('scriptHive_splitScreenWidth');
    return saved ? parseInt(saved, 10) || 400 : 400;
  });

  // Daktilo Kaydırma & Zen Paragraf Karartma (Odak) State - Varsayılan: Kapalı (false)
  const [isTypewriterMode, setIsTypewriterMode] = useState<boolean>(false);
  const [isFocusDimming, setIsFocusDimming] = useState<boolean>(false);

  const handleToggleSplitScreen = () => {
    setIsSplitScreen(prev => {
      const next = !prev;
      safeStorage.setItem('scriptHive_isSplitScreen', next ? 'true' : 'false');
      return next;
    });
  };

  const handleSetSplitScreenTab = (tab: SplitPanelTab) => {
    setSplitScreenTab(tab);
    safeStorage.setItem('scriptHive_splitScreenTab', tab);
  };

  const handleToggleSplitScreenPosition = () => {
    setSplitScreenPosition(prev => {
      const next = prev === 'left' ? 'right' : 'left';
      safeStorage.setItem('scriptHive_splitScreenPosition', next);
      return next;
    });
  };

  const handleSplitScreenWidthChange = (w: number) => {
    setSplitScreenWidth(w);
    safeStorage.setItem('scriptHive_splitScreenWidth', w.toString());
  };

  const handleToggleTypewriterMode = () => {
    setIsTypewriterMode(prev => {
      const next = !prev;
      safeStorage.setItem('scriptHive_isTypewriterMode', next ? 'true' : 'false');
      return next;
    });
  };

  const handleToggleFocusDimming = () => {
    setIsFocusDimming(prev => {
      const next = !prev;
      safeStorage.setItem('scriptHive_isFocusDimming', next ? 'true' : 'false');
      return next;
    });
  };

  // Kilitlenmiş Sayfa ve Sahne Numaraları (Locked Pages & Scenes / A-Pages & A-Scenes) State
  const [isPagesLocked, setIsPagesLocked] = useState<boolean>(() => {
    return safeStorage.getItem('scriptHive_isPagesLocked') === 'true';
  });
  const [lockedAnchors, setLockedAnchors] = useState<{ elementId: string; pageNumber: number }[]>(() => {
    const saved = safeStorage.getItem('scriptHive_lockedAnchors');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [lockedSceneAnchors, setLockedSceneAnchors] = useState<{ elementId: string; sceneNumber: number | string }[]>(() => {
    const saved = safeStorage.getItem('scriptHive_lockedSceneAnchors');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const lastPageBreaksRef = useRef<Record<string, { page: number; pageLabel?: string }>>({});

  const handleTogglePageLock = () => {
    if (!isPagesLocked) {
      // 1. Snapshot Page Anchors
      const anchors: { elementId: string; pageNumber: number }[] = [];
      const currentBreaks = lastPageBreaksRef.current;
      if (currentBreaks && Object.keys(currentBreaks).length > 0) {
        Object.entries(currentBreaks).forEach(([elId, bData]) => {
          anchors.push({ elementId: elId, pageNumber: bData.page });
        });
      } else if (elements.length > 0) {
        anchors.push({ elementId: elements[0].id, pageNumber: coverPage ? 2 : 1 });
      }
      setLockedAnchors(anchors);

      // 2. Snapshot Scene Anchors (A-Scenes)
      let sceneCounter = 0;
      const sceneAnchors: { elementId: string; sceneNumber: number }[] = [];
      elements.forEach(el => {
        if (el.type === 'scene') {
          sceneCounter++;
          sceneAnchors.push({ elementId: el.id, sceneNumber: sceneCounter });
        }
      });
      setLockedSceneAnchors(sceneAnchors);

      setIsPagesLocked(true);
      safeStorage.setItem('scriptHive_isPagesLocked', 'true');
      safeStorage.setItem('scriptHive_lockedAnchors', JSON.stringify(anchors));
      safeStorage.setItem('scriptHive_lockedSceneAnchors', JSON.stringify(sceneAnchors));
    } else {
      if (window.confirm('Sayfa ve sahne kilidini açmak, sayfa ve sahne numaralarının serbestçe yeniden akmasına (1..N) neden olur. Kilidi açmak istediğinizden emin misiniz?')) {
        setIsPagesLocked(false);
        setLockedAnchors([]);
        setLockedSceneAnchors([]);
        safeStorage.setItem('scriptHive_isPagesLocked', 'false');
        safeStorage.removeItem('scriptHive_lockedAnchors');
        safeStorage.removeItem('scriptHive_lockedSceneAnchors');
      }
    }
  };

  // Ortak Yazar & Canlı Birlikte Yazım (Collaboration) State
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState(false);
  const [isSimulatingCoWriter, setIsSimulatingCoWriter] = useState(false);
  const [remotePresences, setRemotePresences] = useState<Record<string, { senderId: string; senderName: string; senderColor: string; status: 'typing' | 'idle' }>>({});
  
  const [collaborationSession, setCollaborationSession] = useState<CollaborationSession>(() => {
    // 1. If opened with invite link (?room=SH-XXXX), start in guest invite mode
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        return {
          roomId: roomParam.toUpperCase(),
          roomName: `ScriptHive Canlı Oda (${roomParam.toUpperCase()})`,
          isHost: false,
          isConnected: false,
          allowGuestEditing: true,
          requireApproval: true,
          lockActiveParagraphs: true,
          showCollaboratorCursors: true,
          userName: 'Konuk Yazar',
          userColor: '#10b981',
          collaborators: [],
          pendingRequests: []
        };
      }
    }

    const defaultSession: CollaborationSession = {
      roomId: '',
      roomName: 'ScriptHive Ortak Yazım',
      isHost: true,
      isConnected: false,
      allowGuestEditing: true,
      requireApproval: true,
      lockActiveParagraphs: true,
      showCollaboratorCursors: true,
      userName: 'Yazar 1 (Siz)',
      userColor: '#3b82f6',
      collaborators: [],
      pendingRequests: []
    };
    const saved = safeSessionStorage.getItem('scriptHive_collabSession');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...defaultSession,
            ...parsed,
            collaborators: Array.isArray(parsed.collaborators) ? parsed.collaborators : [],
            pendingRequests: Array.isArray(parsed.pendingRequests) ? parsed.pendingRequests : []
          };
        }
      } catch (e) {}
    }
    return defaultSession;
  });

  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const collabSessionRef = useRef(collaborationSession);
  collabSessionRef.current = collaborationSession;
  const isSimulatingRef = useRef(isSimulatingCoWriter);
  isSimulatingRef.current = isSimulatingCoWriter;

  // Auto-detect room in URL (e.g. ?room=SH-1234)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        const cleanRoom = roomParam.toUpperCase();
        const guestId = 'user-guest-' + Math.floor(100 + Math.random() * 900);
        setCollaborationSession(prev => {
          const next = {
            ...prev,
            userId: prev.userId || guestId,
            roomId: cleanRoom,
            isHost: false,
            isConnected: false,
            userName: prev.userName === 'Yazar 1 (Siz)' ? 'Konuk Yazar' : prev.userName,
            userColor: '#10b981'
          };
          safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(next));
          return next;
        });
        setIsCollaborationModalOpen(true);
        connectCollabStream(cleanRoom, guestId);
      }
    }
  }, []);

  // Ensure active room stream connection whenever roomId is present
  useEffect(() => {
    if (collaborationSession?.roomId) {
      connectCollabStream(
        collaborationSession.roomId,
        collaborationSession.userId || collaborationSession.userName || 'user'
      );
    }
  }, [collaborationSession?.roomId, collaborationSession?.userId, collaborationSession?.userName]);

  // Multi-window & Multi-tab Real-time Message Bus
  useEffect(() => {
    const unsubscribe = subscribeCollabMessages((msg: CollabMessage) => {
      const curSession = collabSessionRef.current;
      if (!curSession.roomId || msg.roomId !== curSession.roomId) return;

      // 1. JOIN REQUEST (Host receives this)
      if (msg.type === 'ROOM_JOIN_REQUEST') {
        if (curSession.isHost) {
          if (!curSession.requireApproval) {
            handleAcceptCollabRequest(msg.user.id, 'editor');
          } else {
            setCollaborationSession(prev => {
              const curReqs = prev.pendingRequests || [];
              if (curReqs.some(r => r.id === msg.user.id || r.name === msg.user.name)) return prev;
              const next = {
                ...prev,
                pendingRequests: [...curReqs, { id: msg.user.id, name: msg.user.name, requestedAt: Date.now() }]
              };
              safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(next));
              return next;
            });
          }
        }
      }

      // 2. JOIN ACCEPTED (Guest receives this)
      if (msg.type === 'ROOM_JOIN_ACCEPTED') {
        const curCollabs = curSession.collaborators || [];
        const isTarget =
          msg.targetUserId === '*' ||
          msg.targetUserId === curSession.userId ||
          msg.targetUserId === curSession.userName ||
          curSession.userName === 'Konuk Yazar' ||
          curCollabs.some(c => c.id === msg.targetUserId || c.name === msg.targetUserId);

        if (isTarget) {
          if (msg.elements && msg.elements.length > 0) {
            setElements(msg.elements);
          }
          if (msg.format) setFormat(msg.format);
          if (msg.coverPage !== undefined) setCoverPage(msg.coverPage || null);
          setCollaborationSession(prev => {
            const next: CollaborationSession = {
              ...prev,
              isHost: false,
              isConnected: true,
              roomId: msg.roomId,
              collaborators: Array.isArray(msg.collaborators) ? msg.collaborators : []
            };
            safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(next));
            return next;
          });
        }
      }

      // 3. JOIN REJECTED
      if (msg.type === 'ROOM_JOIN_REJECTED') {
        if (msg.targetUserId === curSession.userId || msg.targetUserId === curSession.userName) {
          setCollaborationSession(prev => ({ ...prev, isConnected: false }));
        }
      }

      // 4. SYNC_ELEMENT_CHANGE
      if (msg.type === 'SYNC_ELEMENT_CHANGE') {
        if (msg.senderName !== curSession.userName) {
          setElements(prev => prev.map(el => {
            if (el.id === msg.elementId) {
              return {
                ...el,
                content: msg.content,
                type: msg.elementType || el.type,
                dualPosition: msg.dualPosition !== undefined ? msg.dualPosition : el.dualPosition,
                revisionColor: (msg.revisionColor as any) || el.revisionColor
              };
            }
            return el;
          }));

          setRemotePresences(prev => ({
            ...prev,
            [msg.elementId]: {
              senderId: msg.senderId,
              senderName: msg.senderName,
              senderColor: msg.senderColor,
              status: 'typing'
            }
          }));

          setTimeout(() => {
            setRemotePresences(prev => {
              if (prev[msg.elementId]?.senderId === msg.senderId) {
                const copy = { ...prev };
                delete copy[msg.elementId];
                return copy;
              }
              return prev;
            });
          }, 2500);
        }
      }

      // 5. SYNC_ELEMENT_ADD
      if (msg.type === 'SYNC_ELEMENT_ADD') {
        if (msg.senderId !== curSession.userName) {
          setElements(prev => {
            if (prev.some(e => e.id === msg.newElement.id)) return prev;
            const idx = prev.findIndex(e => e.id === msg.afterId);
            if (idx === -1) return [...prev, msg.newElement];
            const copy = [...prev];
            copy.splice(idx + 1, 0, msg.newElement);
            return copy;
          });
        }
      }

      // 6. SYNC_ELEMENT_REMOVE
      if (msg.type === 'SYNC_ELEMENT_REMOVE') {
        if (msg.senderId !== curSession.userName) {
          setElements(prev => prev.filter(e => e.id !== msg.elementId));
        }
      }

      // 7. SYNC_ELEMENT_REMOVE_MULTIPLE
      if (msg.type === 'SYNC_ELEMENT_REMOVE_MULTIPLE') {
        if (msg.senderId !== curSession.userName) {
          setElements(prev => prev.filter(e => !msg.elementIds.includes(e.id)));
        }
      }

      // 8. SYNC_ELEMENT_TYPE
      if (msg.type === 'SYNC_ELEMENT_TYPE') {
        if (msg.senderId !== curSession.userName) {
          setElements(prev => prev.map(e => e.id === msg.elementId ? { ...e, type: msg.newType } : e));
        }
      }

      // 9. CURSOR PRESENCE
      if (msg.type === 'CURSOR_PRESENCE') {
        if (msg.senderName !== curSession.userName) {
          if (msg.elementId) {
            setRemotePresences(prev => ({
              ...prev,
              [msg.elementId!]: {
                senderId: msg.senderId,
                senderName: msg.senderName,
                senderColor: msg.senderColor,
                status: msg.status
              }
            }));
          }
        }
      }

      // 10. ROOM LEAVE
      if (msg.type === 'ROOM_LEAVE') {
        setCollaborationSession(prev => ({
          ...prev,
          collaborators: (prev.collaborators || []).filter(c => c.id !== msg.userId && c.name !== msg.userId)
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Live Simulated Co-Writer (Ahmet) typing loop
  useEffect(() => {
    if (!isSimulatingCoWriter) return;

    const ahmet = (collaborationSession?.collaborators || []).find(c => c.id === 'sim-writer-1' || c.name.includes('Ahmet'));
    if (!ahmet || ahmet.role === 'viewer') return;

    let isCancelled = false;
    const typingTimer = setTimeout(() => {
      if (isCancelled) return;
      
      const currentEls = elementsRef.current;
      const simElementId = generateId();

      const sampleSentences = [
        "AHMET: Harika bir sahne kurmuşsun. Şimdi tansiyonu biraz daha yükseltelim!",
        "Ahmet hızlı adımlarla odaya girer ve masadaki dosyaları inceler.",
        "AHMET: Burada duramayız, birazdan gelecekler.",
        "Kapı aniden gıcırtıyla açılır. İkisi de aynı anda arkalarına bakarlar."
      ];
      const randomText = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];

      // 1. Add Ahmet's element
      const newElem: ScreenplayElement = {
        id: simElementId,
        type: randomText.startsWith('AHMET') ? 'dialogue' : 'action',
        content: '',
        revisionColor: 'green'
      };

      setElements(prev => [...prev, newElem]);
      setRemotePresences(prev => ({
        ...prev,
        [simElementId]: {
          senderId: 'sim-writer-1',
          senderName: 'Ahmet (Konuk Yazar)',
          senderColor: '#10b981',
          status: 'typing'
        }
      }));

      // 2. Character-by-character animated typing
      let charIndex = 0;
      const charInterval = setInterval(() => {
        if (isCancelled) {
          clearInterval(charInterval);
          return;
        }
        charIndex++;
        const currentTyped = randomText.slice(0, charIndex);
        setElements(prev => prev.map(el => el.id === simElementId ? { ...el, content: currentTyped, revisionColor: 'green' } : el));

        if (charIndex >= randomText.length) {
          clearInterval(charInterval);
          setTimeout(() => {
            if (!isCancelled) {
              setRemotePresences(prev => {
                const copy = { ...prev };
                delete copy[simElementId];
                return copy;
              });
            }
          }, 2000);
        }
      }, 50);

    }, 1200);
    return () => {
      isCancelled = true;
      clearTimeout(typingTimer);
    };
  }, [isSimulatingCoWriter, collaborationSession?.collaborators]);

  const handleStartCollabSession = (roomName: string, userName: string) => {
    const newRoomId = 'SH-' + Math.floor(1000 + Math.random() * 9000);
    const hostUser: Collaborator = {
      id: 'user-host-' + Math.floor(100 + Math.random() * 900),
      name: userName || 'Ev Sahibi (Siz)',
      avatarColor: '#3b82f6',
      role: 'host',
      status: 'online',
      lastActive: Date.now()
    };
    const newSession: CollaborationSession = {
      userId: hostUser.id,
      roomId: newRoomId,
      roomName: roomName || 'ScriptHive Ortak Yazım',
      isHost: true,
      isConnected: true,
      allowGuestEditing: true,
      requireApproval: true,
      lockActiveParagraphs: true,
      showCollaboratorCursors: true,
      userName: userName || 'Ev Sahibi (Siz)',
      userColor: '#3b82f6',
      collaborators: [hostUser],
      pendingRequests: []
    };
    setCollaborationSession(newSession);
    safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(newSession));
    connectCollabStream(newRoomId, hostUser.id);
  };

  const handleJoinCollabSession = (roomId: string, userName: string) => {
    const cleanRoomId = roomId.trim().toUpperCase();
    const guestUser: Collaborator = {
      id: collaborationSession.userId || ('user-guest-' + Math.floor(100 + Math.random() * 900)),
      name: userName || 'Konuk Yazar',
      avatarColor: '#10b981',
      role: 'editor',
      status: 'online',
      lastActive: Date.now()
    };
    const newSession: CollaborationSession = {
      userId: guestUser.id,
      roomId: cleanRoomId,
      roomName: `ScriptHive Canlı Oda (${cleanRoomId})`,
      isHost: false,
      isConnected: false, // will connect when host accepts
      allowGuestEditing: true,
      requireApproval: true,
      lockActiveParagraphs: true,
      showCollaboratorCursors: true,
      userName: guestUser.name,
      userColor: '#10b981',
      collaborators: [guestUser],
      pendingRequests: []
    };
    setCollaborationSession(newSession);
    safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(newSession));
    connectCollabStream(cleanRoomId, guestUser.id);

    // Send join request broadcast to host
    sendCollabMessage({
      type: 'ROOM_JOIN_REQUEST',
      roomId: cleanRoomId,
      user: guestUser
    });
  };

  const handleLeaveCollabSession = () => {
    if (collaborationSession.roomId) {
      sendCollabMessage({
        type: 'ROOM_LEAVE',
        roomId: collaborationSession.roomId,
        userId: collaborationSession.userId || collaborationSession.userName
      });
    }
    disconnectCollabStream();
    const clearedSession: CollaborationSession = {
      ...collaborationSession,
      isConnected: false,
      roomId: '',
      collaborators: [],
      pendingRequests: []
    };
    setCollaborationSession(clearedSession);
    safeSessionStorage.removeItem('scriptHive_collabSession');
  };

  const handleUpdateCollabSession = (partial: Partial<CollaborationSession>) => {
    setCollaborationSession(prev => {
      const next = { ...prev, ...partial };
      safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(next));
      return next;
    });
  };

  const handleAcceptCollabRequest = (requestId: string, role: 'editor' | 'viewer') => {
    setCollaborationSession(prev => {
      const curReqs = prev.pendingRequests || [];
      const curCollabs = prev.collaborators || [];
      const req = curReqs.find(r => r.id === requestId);
      if (!req) return prev;
      const newCollab: Collaborator = {
        id: req.id,
        name: req.name,
        avatarColor: '#10b981',
        role: role,
        status: 'online',
        lastActive: Date.now()
      };
      const next: CollaborationSession = {
        ...prev,
        pendingRequests: curReqs.filter(r => r.id !== requestId),
        collaborators: [...curCollabs, newCollab]
      };
      safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(next));

      // Broadcast acceptance with current screenplay state so Guest gets the script!
      sendCollabMessage({
        type: 'ROOM_JOIN_ACCEPTED',
        roomId: prev.roomId,
        targetUserId: req.id,
        elements: elementsRef.current,
        format: format,
        coverPage: coverPage || null,
        collaborators: next.collaborators
      });

      return next;
    });
  };

  const handleRejectCollabRequest = (requestId: string) => {
    setCollaborationSession(prev => {
      const next: CollaborationSession = {
        ...prev,
        pendingRequests: (prev.pendingRequests || []).filter(r => r.id !== requestId)
      };
      safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(next));
      sendCollabMessage({
        type: 'ROOM_JOIN_REJECTED',
        roomId: prev.roomId,
        targetUserId: requestId
      });
      return next;
    });
  };

  const handleRemoveCollaborator = (collabId: string) => {
    setCollaborationSession(prev => {
      const next: CollaborationSession = {
        ...prev,
        collaborators: (prev.collaborators || []).filter(c => c.id !== collabId)
      };
      safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(next));
      return next;
    });
  };

  const handleToggleSimulatedCoWriter = () => {
    if (isSimulatingCoWriter) {
      setIsSimulatingCoWriter(false);
      setRemotePresences({});
      setCollaborationSession(prev => {
        const next: CollaborationSession = {
          ...prev,
          pendingRequests: (prev.pendingRequests || []).filter(r => r.id !== 'sim-writer-1'),
          collaborators: (prev.collaborators || []).filter(c => c.id !== 'sim-writer-1')
        };
        safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(next));
        return next;
      });
    } else {
      setIsSimulatingCoWriter(true);
      if (!collaborationSession.isConnected) {
        handleStartCollabSession('Canlı Senaryo Odası', 'Ev Sahibi (Siz)');
      }
      setCollaborationSession(prev => {
        const next: CollaborationSession = {
          ...prev,
          isConnected: true,
          roomId: prev.roomId || 'SH-9142',
          pendingRequests: [
            ...(prev.pendingRequests || []).filter(r => r.id !== 'sim-writer-1'),
            { id: 'sim-writer-1', name: 'Ahmet (Konuk Yazar)', requestedAt: Date.now() }
          ]
        };
        safeSessionStorage.setItem('scriptHive_collabSession', JSON.stringify(next));
        return next;
      });
    }
  };

  const [isTableReadMode, setIsTableReadMode] = useState<boolean>(() => {
    return safeStorage.getItem('scriptHive_tableReadMode') === 'true';
  });
  const [characterColors, setCharacterColors] = useState<Record<string, string>>(() => {
    const saved = safeStorage.getItem('scriptHive_characterColors');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });
  const [spotlightCharacter, setSpotlightCharacter] = useState<string | null>(null);

  const [selectedStoryTemplateId, setSelectedStoryTemplateId] = useState<string>(() => {
    return safeStorage.getItem('scriptHive_selectedStoryTemplate') || 'save_the_cat';
  });
  const [storyBeatAnswers, setStoryBeatAnswers] = useState<Record<string, string>>(() => {
    const saved = safeStorage.getItem('scriptHive_storyBeatAnswers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });
  const [targetPageCount, setTargetPageCount] = useState<number>(() => {
    const saved = safeStorage.getItem('scriptHive_targetPageCount');
    return saved ? parseInt(saved) || 110 : 110;
  });

  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && 'onLine' in navigator ? !navigator.onLine : false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const [isHealthBreakEnabled, setIsHealthBreakEnabled] = useState(() => {
    const saved = safeStorage.getItem('scriptHive_healthBreak');
    return saved !== 'false'; // Default to true
  });
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [breakTimer, setBreakTimer] = useState(30 * 60); // 30 minutes in seconds
  
  const [bin, setBin] = useState<BinItem[]>(() => {
    const saved = safeStorage.getItem('scriptHive_bin');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [isRevisionMode, setIsRevisionMode] = useState<boolean>(() => {
    const saved = safeStorage.getItem('scriptHive_isRevisionMode');
    return saved === 'true';
  });
  const [activeRevisionColor, setActiveRevisionColor] = useState<'white' | 'blue' | 'pink' | 'yellow' | 'green' | 'goldenrod'>(() => {
    const saved = safeStorage.getItem('scriptHive_activeRevisionColor');
    if (saved) return saved as any;
    return 'blue'; // Varsayılan ilk revizyon rengi Mavi (Blue Draft)
  });
  const [printRevisionMarks, setPrintRevisionMarks] = useState<boolean>(() => {
    const saved = safeStorage.getItem('scriptHive_printRevisionMarks');
    return saved !== 'false';
  });
  const [activeRevisionDate, setActiveRevisionDate] = useState<string>(() => {
    const saved = safeStorage.getItem('scriptHive_activeRevisionDate');
    if (saved) return saved;
    return new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const [toolbarVisibility, setToolbarVisibility] = useState({
    history: true,
    formatting: true,
    elements: true,
    typography: true
  });

  const [projects, setProjects] = useState<Screenplay[]>(() => {
    const saved = safeStorage.getItem('scriptHive_projects');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    const saved = safeStorage.getItem('scriptHive_currentProjectId');
    if (saved) return saved;
    return generateId();
  });
  const [driveFileId, setDriveFileId] = useState<string | undefined>(() => {
    const saved = safeStorage.getItem('scriptHive_projects');
    if (saved) {
      try {
        const projects: Screenplay[] = JSON.parse(saved);
        const currentId = safeStorage.getItem('scriptHive_currentProjectId');
        const current = projects.find(p => p.id === currentId) || projects[0];
        if (current) return current.driveFileId;
      } catch (e) {
        console.error("Error loading projects:", e);
      }
    }
    return undefined;
  });
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [shouldAutoSaveToDrive, setShouldAutoSaveToDrive] = useState(false);

  const [history, setHistory] = useState<ScreenplayElement[][]>([elements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedo = React.useRef(false);
  const [docxFileHandle, setDocxFileHandle] = useState<any>(null);
  const [rtfFileHandle, setRtfFileHandle] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);

  useEffect(() => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        if (JSON.stringify(newHistory[newHistory.length - 1]) !== JSON.stringify(elements)) {
          setHistoryIndex(newHistory.length);
          return [...newHistory, elements];
        }
        return newHistory;
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [elements, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const handleFindNext = (find: string) => {
    if (!find) return;
    const startIndex = elements.findIndex(e => e.id === focusedId);
    const start = startIndex === -1 ? 0 : startIndex;
    
    // Aramayı mevcut indeksten 1 sonrasından başlat, bulamazsa başa dön
    for (let i = 1; i <= elements.length; i++) {
      const checkIdx = (start + i) % elements.length;
      if (elements[checkIdx].content && elements[checkIdx].content.includes(find)) {
        setFocusedId(elements[checkIdx].id);
        setTimeout(() => {
          const elNode = document.getElementById(`element-${elements[checkIdx].id}`);
          if (elNode) {
            elNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight it logically here if needed
          }
        }, 50);
        break;
      }
    }
  };

  const handleReplaceOne = (find: string, replace: string) => {
    if (!find) return;
    
    const currentIdx = elements.findIndex(e => e.id === focusedId);
    if (currentIdx !== -1 && elements[currentIdx].content && elements[currentIdx].content.includes(find)) {
      setElements(prev => prev.map((el, i) => {
        if (i === currentIdx) {
          return { ...el, content: el.content.replace(find, replace) };
        }
        return el;
      }));
      setTimeout(() => handleFindNext(find), 10);
      return;
    }
    
    // Eger odakli satirda yoksa, once bul, 
    handleFindNext(find);
  };

  const handleReplaceAll = (find: string, replace: string) => {
    setElements(prev => prev.map(el => {
      const content = el.content || '';
      if (content.includes(find)) {
        // Simple string replace all occurrences
        const newContent = content.split(find).join(replace);
        return { ...el, content: newContent };
      }
      return el;
    }));
  };

  const numberedElements = useMemo(() => {
    if (!isPagesLocked || lockedSceneAnchors.length === 0) {
      let count = 0;
      return elements.map(el => {
        if (el.type === 'scene') {
          count++;
          return { ...el, sceneNumber: count };
        }
        return el;
      });
    }

    // Kilitli sahne numaralandırması (A-Sahneleri: 1, 1A, 1B, 2, 2A...)
    const sceneAnchorMap = new Map<string, number | string>();
    lockedSceneAnchors.forEach(a => sceneAnchorMap.set(a.elementId, a.sceneNumber));

    let currentBaseScene = 0;
    let currentSubSceneIndex = 0;

    return elements.map(el => {
      if (el.type === 'scene') {
        if (sceneAnchorMap.has(el.id)) {
          const lockedVal = sceneAnchorMap.get(el.id)!;
          const parsed = typeof lockedVal === 'number' ? lockedVal : parseInt(String(lockedVal), 10);
          currentBaseScene = isNaN(parsed) ? currentBaseScene + 1 : parsed;
          currentSubSceneIndex = 0;
          return { ...el, sceneNumber: lockedVal };
        } else {
          // Yeni eklenen sahne -> A-Sahnesi olarak adlandırılır (örn: 1A, 1B veya başta eklenmişse A1)
          currentSubSceneIndex++;
          const label = formatSceneLabel(currentBaseScene, currentSubSceneIndex);
          return { ...el, sceneNumber: label };
        }
      }
      return el;
    });
  }, [elements, isPagesLocked, lockedSceneAnchors]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_tableReadMode', isTableReadMode ? 'true' : 'false');
  }, [isTableReadMode]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_characterColors', JSON.stringify(characterColors));
  }, [characterColors]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_selectedStoryTemplate', selectedStoryTemplateId);
  }, [selectedStoryTemplateId]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_storyBeatAnswers', JSON.stringify(storyBeatAnswers));
  }, [storyBeatAnswers]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_targetPageCount', targetPageCount.toString());
  }, [targetPageCount]);

  const handleSaveBeatAnswer = (beatId: string, answer: string) => {
    setStoryBeatAnswers(prev => {
      const next = { ...prev, [beatId]: answer };
      safeStorage.setItem('scriptHive_storyBeatAnswers', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateSceneTension = (sceneId: string, tensionScore: number) => {
    handleUpdateElement(sceneId, { tensionScore });
  };

  const handleUpdateSceneArcData = (sceneId: string, updates: { 
    tensionScore?: number; 
    comedyScore?: number; 
    actionScore?: number; 
    horrorScore?: number;
    romanceScore?: number;
    emotionScore?: number;
    emotionTag?: string;
  }) => {
    handleUpdateElement(sceneId, updates);
  };

  const handleJumpToElementFromModal = (elementId: string) => {
    setFocusedId(elementId);
    setTimeout(() => {
      const elNode = document.getElementById(`element-${elementId}`) || document.querySelector(`[data-element-id="${elementId}"]`);
      if (elNode) {
        elNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleApplySmartRename = (updatedElements: ScreenplayElement[], renamed?: { type: 'character' | 'location'; oldName: string; newName: string }) => {
    setElements(updatedElements);
    if (renamed && renamed.type === 'character') {
      setCharacterColors(prev => {
        if (prev[renamed.oldName]) {
          const next = { ...prev, [renamed.newName]: prev[renamed.oldName] };
          delete next[renamed.oldName];
          safeStorage.setItem('scriptHive_characterColors', JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const characters = useMemo(() => {
    const chars = elements.filter(e => e.type === 'character').map(e => stripHtml(e.content || ''));
    return Array.from(new Set(chars)).filter(Boolean);
  }, [elements]);

  const scenes = useMemo(() => {
    const scns = elements.filter(e => e.type === 'scene').map(e => stripHtml(e.content || ''));
    return Array.from(new Set(scns)).filter(Boolean);
  }, [elements]);

  const handleInsertAiElement = (type: ElementType, content: string) => {
    const newId = generateId();
    setElements(els => {
      if (focusedId) {
        const idx = els.findIndex(e => e.id === focusedId);
        if (idx !== -1) {
          const next = [...els];
          next.splice(idx + 1, 0, { 
            id: newId, 
            type, 
            content,
            ...(isRevisionMode && activeRevisionColor && activeRevisionColor !== 'white' ? { revisionColor: activeRevisionColor } : {})
          });
          return next;
        }
      }
      return [...els, { 
        id: newId, 
        type, 
        content,
        ...(isRevisionMode && activeRevisionColor && activeRevisionColor !== 'white' ? { revisionColor: activeRevisionColor } : {})
      }];
    });
    setFocusedId(newId);
  };

  const handleUpdateFocusedElementContent = (newContent: string) => {
    if (!focusedId) return;
    setElements(els => els.map(e => {
      if (e.id === focusedId) {
        return {
          ...e,
          content: newContent,
          ...(isRevisionMode && activeRevisionColor && activeRevisionColor !== 'white' ? { revisionColor: activeRevisionColor } : {})
        };
      }
      return e;
    }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      safeStorage.setItem('scriptHive_elements', JSON.stringify(elements));
    }, 300);
    return () => clearTimeout(timer);
  }, [elements]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_isRevisionMode', isRevisionMode.toString());
  }, [isRevisionMode]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_activeRevisionColor', activeRevisionColor);
  }, [activeRevisionColor]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_printRevisionMarks', printRevisionMarks.toString());
  }, [printRevisionMarks]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_activeRevisionDate', activeRevisionDate);
  }, [activeRevisionDate]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_bin', JSON.stringify(bin));
  }, [bin]);

  useEffect(() => {
    if (coverPage) {
      safeStorage.setItem('scriptHive_coverPage', JSON.stringify(coverPage));
    } else {
      safeStorage.setItem('scriptHive_coverPage', 'null');
    }
  }, [coverPage]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_currentProjectId', currentProjectId);
  }, [currentProjectId]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_fontFamily', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_fontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProjects(prev => {
        const existingIndex = prev.findIndex(p => p.id === currentProjectId);
        const updatedProject: Screenplay = {
          id: currentProjectId,
          title: coverPage?.title || 'İsimsiz Senaryo',
          elements,
          format,
          coverPage: coverPage || undefined,
          isPagesLocked,
          lockedAnchors,
          lockedSceneAnchors,
          updatedAt: Date.now(),
          driveFileId
        };
        
        let newProjects = [...prev];
        if (existingIndex >= 0) {
          newProjects[existingIndex] = updatedProject;
        } else {
          newProjects.push(updatedProject);
        }
        
        newProjects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        if (newProjects.length > 5) {
          newProjects = newProjects.slice(0, 5);
        }
        
        safeStorage.setItem('scriptHive_projects', JSON.stringify(newProjects));
        return newProjects;
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [elements, coverPage, format, currentProjectId, driveFileId, isPagesLocked, lockedAnchors, lockedSceneAnchors]);

  const lastNonEmptyContentRef = React.useRef<Map<string, { content: string; type: ElementType }>>(new Map());

  const addToBin = React.useCallback((rawItem: BinItem) => {
    const plain = rawItem.element.content
      ? rawItem.element.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
      : '';
    if (!plain) return;

    setBin(prev => {
      if (prev.length > 0) {
        const top = prev[0];
        const topPlain = top.element.content
          ? top.element.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
          : '';
        // Prevent duplicate backups within 4 seconds
        if (topPlain === plain && Math.abs(Date.now() - top.deletedAt) < 4000) {
          return prev;
        }
      }
      return [rawItem, ...prev];
    });
  }, []);

  // Track peak content for every element
  useEffect(() => {
    elements.forEach(el => {
      const plain = el.content ? el.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
      if (plain.length > 0) {
        const existing = lastNonEmptyContentRef.current.get(el.id);
        const existingPlain = existing?.content ? existing.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
        if (plain.length >= existingPlain.length) {
          lastNonEmptyContentRef.current.set(el.id, { content: el.content, type: el.type });
        }
      }
    });
  }, [elements]);

  const handleElementChange = (id: string, newContent: string) => {
    const prevEl = elements.find(e => e.id === id);
    const prevPlain = prevEl?.content ? prevEl.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
    const newPlain = newContent ? newContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';

    if (prevPlain.length > 0) {
      const existing = lastNonEmptyContentRef.current.get(id);
      const existingPlain = existing?.content ? existing.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
      if (prevPlain.length >= existingPlain.length) {
        lastNonEmptyContentRef.current.set(id, { content: prevEl!.content, type: prevEl!.type });
      }
    }

    // Capture when user selects text with mouse and presses Delete/Backspace
    if (prevPlain.length > 0 && newPlain.length === 0) {
      const best = lastNonEmptyContentRef.current.get(id)?.content || prevEl!.content;
      const idx = elements.findIndex(e => e.id === id);
      addToBin({
        id: generateId(),
        type: 'deleted',
        element: { ...prevEl!, content: best },
        deletedAt: Date.now(),
        originalIndex: idx !== -1 ? idx : 0,
      });
    }

    setElements(els => els.map(e => {
      if (e.id === id) {
        if (e.content !== newContent && isRevisionMode && activeRevisionColor && activeRevisionColor !== 'white') {
          return { ...e, content: newContent, revisionColor: activeRevisionColor };
        }
        return { ...e, content: newContent };
      }
      return e;
    }));

    if (collaborationSession.isConnected && collaborationSession.roomId) {
      sendCollabMessage({
        type: 'SYNC_ELEMENT_CHANGE',
        roomId: collaborationSession.roomId,
        senderId: collaborationSession.userName,
        senderName: collaborationSession.userName,
        senderColor: collaborationSession.userColor,
        elementId: id,
        content: newContent,
        revisionColor: isRevisionMode && activeRevisionColor && activeRevisionColor !== 'white' ? activeRevisionColor : undefined
      });
    }
  };

  const handleUpdateElement = (id: string, updates: Partial<ScreenplayElement>) => {
    setElements(els => els.map(e => {
      if (e.id === id) {
        if (isRevisionMode && activeRevisionColor && activeRevisionColor !== 'white') {
          return { ...e, ...updates, revisionColor: activeRevisionColor };
        }
        return { ...e, ...updates };
      }
      return e;
    }));

    if (collaborationSession.isConnected && collaborationSession.roomId) {
      const el = elements.find(e => e.id === id);
      if (el) {
        sendCollabMessage({
          type: 'SYNC_ELEMENT_CHANGE',
          roomId: collaborationSession.roomId,
          senderId: collaborationSession.userName,
          senderName: collaborationSession.userName,
          senderColor: collaborationSession.userColor,
          elementId: id,
          content: updates.content !== undefined ? updates.content : el.content,
          elementType: updates.type || el.type,
          dualPosition: updates.dualPosition !== undefined ? updates.dualPosition : el.dualPosition,
          revisionColor: updates.revisionColor || el.revisionColor
        });
      }
    }
  };

  const handleStyleChange = (prop: 'fontFamily' | 'fontSize' | 'fontColor', value: any) => {
    if (prop === 'fontFamily') {
      setFontFamily(value);
      setElements(els => els.map(e => ({ ...e, fontFamily: value })));
    } else if (prop === 'fontSize') {
      setFontSize(value);
      setElements(els => els.map(e => ({ ...e, fontSize: value })));
    } else if (prop === 'fontColor') {
      const targetColor = (!value || value === 'default') ? '' : value;
      setFontColor(targetColor);
      setElements(els => els.map(e => ({ ...e, fontColor: targetColor })));
    }
  };

  const handleApplyStyleToAll = (prop: 'fontFamily' | 'fontSize' | 'fontColor', value: any) => {
    if (prop === 'fontFamily') setFontFamily(value);
    if (prop === 'fontSize') setFontSize(value);
    if (prop === 'fontColor') {
      const targetColor = (!value || value === 'default') ? '' : value;
      setFontColor(targetColor);
      setElements(els => els.map(e => ({ ...e, fontColor: targetColor })));
      return;
    }
    setElements(els => els.map(e => ({ ...e, [prop]: value })));
  };

  const handleFontSelected = (fontVal: string, applyToAll: boolean) => {
    loadGoogleFontDynamically(fontVal);
    if (applyToAll) {
      setFontFamily(fontVal);
      setElements(els => els.map(e => ({ ...e, fontFamily: fontVal })));
    } else {
      window.dispatchEvent(new CustomEvent('scripthive:applyFontFamily', { detail: fontVal }));
      if (focusedId) {
        setElements(els => els.map(e => e.id === focusedId ? { ...e, fontFamily: fontVal } : e));
      } else {
        setFontFamily(fontVal);
      }
    }
  };

  const handleToggleCoverPage = () => {
    if (coverPage) {
      setCoverPage(null);
    } else {
      setCoverPage({
        title: 'SENARYO ADI',
        author: 'Yazar adı',
        version: 'v.01.',
        date: new Date().toLocaleDateString('tr-TR'),
        revisionHistory: 'Mavi Revizyon: ' + new Date().toLocaleDateString('tr-TR')
      });
    }
  };

  const handleAddElement = (afterId: string, type: ElementType, initialContent: string = '') => {
    const newId = generateId();
    let createdElem: ScreenplayElement | null = null;
    setElements(els => {
      const index = els.findIndex(e => e.id === afterId);
      const prevEl = index !== -1 ? els[index] : null;
      let dualPos: 'left' | 'right' | undefined = undefined;
      if (prevEl && prevEl.dualPosition === 'left') {
        if (type === 'dialogue' || type === 'parenthetical') {
          dualPos = 'left';
        } else if (type === 'character') {
          dualPos = 'right';
        }
      } else if (prevEl && prevEl.dualPosition === 'right') {
        if (type === 'dialogue' || type === 'parenthetical') {
          dualPos = 'right';
        }
      }
      const newElem: ScreenplayElement = { 
        id: newId, 
        type, 
        content: initialContent,
        ...(dualPos ? { dualPosition: dualPos } : {}),
        ...(isRevisionMode && activeRevisionColor && activeRevisionColor !== 'white' ? { revisionColor: activeRevisionColor } : {})
      };
      createdElem = newElem;
      const newElements = [...els];
      newElements.splice(index + 1, 0, newElem);
      return newElements;
    });
    setFocusedId(newId);

    if (collaborationSession.isConnected && collaborationSession.roomId && createdElem) {
      sendCollabMessage({
        type: 'SYNC_ELEMENT_ADD',
        roomId: collaborationSession.roomId,
        senderId: collaborationSession.userName,
        afterId,
        newElement: createdElem
      });
    }
  };

  const handleToggleDualDialogue = (idToToggle?: string | any) => {
    let targetId = typeof idToToggle === 'string' && idToToggle.trim() ? idToToggle : focusedId;
    if (!targetId) {
      const charOrDial = elements.find(e => e.type === 'character' || e.type === 'dialogue');
      if (charOrDial) {
        targetId = charOrDial.id;
      } else if (elements.length > 0) {
        targetId = elements[elements.length - 1].id;
      } else {
        const c1 = generateId();
        const d1 = generateId();
        const c2 = generateId();
        const d2 = generateId();
        setElements([
          { id: c1, type: 'character', content: '', dualPosition: 'left' },
          { id: d1, type: 'dialogue', content: '', dualPosition: 'left' },
          { id: c2, type: 'character', content: '', dualPosition: 'right' },
          { id: d2, type: 'dialogue', content: '', dualPosition: 'right' },
        ]);
        setTimeout(() => setFocusedId(c1), 10);
        return;
      }
    }

    setElements(prevElements => {
      const idx = prevElements.findIndex(e => e.id === targetId);
      if (idx === -1) {
        const c1 = generateId();
        const d1 = generateId();
        const c2 = generateId();
        const d2 = generateId();
        const newDualBlocks: ScreenplayElement[] = [
          { id: c1, type: 'character', content: '', dualPosition: 'left' },
          { id: d1, type: 'dialogue', content: '', dualPosition: 'left' },
          { id: c2, type: 'character', content: '', dualPosition: 'right' },
          { id: d2, type: 'dialogue', content: '', dualPosition: 'right' }
        ];
        setTimeout(() => setFocusedId(c1), 10);
        return [...prevElements, ...newDualBlocks];
      }

      const targetEl = prevElements[idx];

      // 1. If current element is already dual dialogue, UNPAIR the entire contiguous dual group
      if (targetEl.dualPosition) {
        let start = idx;
        while (start > 0 && prevElements[start - 1].dualPosition) {
          start--;
        }
        let end = idx;
        while (end < prevElements.length - 1 && prevElements[end + 1].dualPosition) {
          end++;
        }

        const updated = [...prevElements];
        for (let i = start; i <= end; i++) {
          updated[i] = { ...updated[i], dualPosition: undefined };
        }
        return updated;
      }

      // 2. If target is an action/scene/other non-character block, insert a dual dialogue block
      if (targetEl.type !== 'character' && targetEl.type !== 'dialogue' && targetEl.type !== 'parenthetical') {
        const c1 = generateId();
        const d1 = generateId();
        const c2 = generateId();
        const d2 = generateId();
        const newDualBlocks: ScreenplayElement[] = [
          { id: c1, type: 'character', content: '', dualPosition: 'left' },
          { id: d1, type: 'dialogue', content: '', dualPosition: 'left' },
          { id: c2, type: 'character', content: '', dualPosition: 'right' },
          { id: d2, type: 'dialogue', content: '', dualPosition: 'right' }
        ];
        const updated = [...prevElements];
        const isEmptyTarget = !targetEl.content || targetEl.content.replace(/<[^>]+>/g, '').trim() === '';
        if (isEmptyTarget) {
          updated.splice(idx, 1, ...newDualBlocks);
        } else {
          updated.splice(idx + 1, 0, ...newDualBlocks);
        }
        setTimeout(() => setFocusedId(c1), 10);
        return updated;
      }

      // 3. If target is character/dialogue/parenthetical, find speaker block
      let blockStart = idx;
      if (targetEl.type === 'dialogue' || targetEl.type === 'parenthetical') {
        while (blockStart > 0 && prevElements[blockStart].type !== 'character' && (prevElements[blockStart - 1].type === 'dialogue' || prevElements[blockStart - 1].type === 'parenthetical' || prevElements[blockStart - 1].type === 'character')) {
          blockStart--;
          if (prevElements[blockStart].type === 'character') break;
        }
      }

      let blockEnd = blockStart;
      while (blockEnd < prevElements.length - 1 && (prevElements[blockEnd + 1].type === 'dialogue' || prevElements[blockEnd + 1].type === 'parenthetical')) {
        blockEnd++;
      }

      let nextBlockStart = blockEnd + 1;
      let nextBlockEnd = -1;
      if (nextBlockStart < prevElements.length && prevElements[nextBlockStart].type === 'character') {
        nextBlockEnd = nextBlockStart;
        while (nextBlockEnd < prevElements.length - 1 && (prevElements[nextBlockEnd + 1].type === 'dialogue' || prevElements[nextBlockEnd + 1].type === 'parenthetical')) {
          nextBlockEnd++;
        }
      }

      let prevBlockStart = -1;
      let prevBlockEnd = blockStart - 1;
      if (nextBlockEnd === -1 && prevBlockEnd >= 0 && (prevElements[prevBlockEnd].type === 'dialogue' || prevElements[prevBlockEnd].type === 'parenthetical' || prevElements[prevBlockEnd].type === 'character')) {
        let p = prevBlockEnd;
        while (p > 0 && prevElements[p].type !== 'character' && (prevElements[p - 1].type === 'dialogue' || prevElements[p - 1].type === 'parenthetical' || prevElements[p - 1].type === 'character')) {
          p--;
          if (prevElements[p].type === 'character') break;
        }
        if (prevElements[p].type === 'character') {
          prevBlockStart = p;
        }
      }

      const updated = [...prevElements];

      if (nextBlockEnd !== -1) {
        for (let i = blockStart; i <= blockEnd; i++) {
          updated[i] = { ...updated[i], dualPosition: 'left' };
        }
        for (let i = nextBlockStart; i <= nextBlockEnd; i++) {
          updated[i] = { ...updated[i], dualPosition: 'right' };
        }
        return updated;
      } else if (prevBlockStart !== -1) {
        for (let i = prevBlockStart; i <= prevBlockEnd; i++) {
          updated[i] = { ...updated[i], dualPosition: 'left' };
        }
        for (let i = blockStart; i <= blockEnd; i++) {
          updated[i] = { ...updated[i], dualPosition: 'right' };
        }
        return updated;
      } else {
        for (let i = blockStart; i <= blockEnd; i++) {
          updated[i] = { ...updated[i], dualPosition: 'left' };
        }
        let insertOffset = blockEnd + 1;
        if (blockEnd === blockStart) {
          const leftDialId = generateId();
          updated.splice(blockStart + 1, 0, { id: leftDialId, type: 'dialogue', content: '', dualPosition: 'left' });
          insertOffset = blockStart + 2;
        }
        const rightCharId = generateId();
        const rightDialId = generateId();
        const companionBlocks: ScreenplayElement[] = [
          { id: rightCharId, type: 'character', content: '', dualPosition: 'right' },
          { id: rightDialId, type: 'dialogue', content: '', dualPosition: 'right' }
        ];
        updated.splice(insertOffset, 0, ...companionBlocks);
        setTimeout(() => setFocusedId(rightCharId), 10);
        return updated;
      }
    });
  };

  const getBestContentForElement = (el: ScreenplayElement): string => {
    const elPlain = el.content ? el.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
    const cached = lastNonEmptyContentRef.current.get(el.id);
    const cachedPlain = cached?.content ? cached.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
    
    if (cachedPlain.length >= elPlain.length && cachedPlain.length > 0) {
      return cached!.content;
    }
    
    if (elPlain.length > 0) {
      return el.content.replace(/^(?:<br\s*\/?>)+|(?:<br\s*\/?>)+$/gi, '').trim();
    }
    
    for (let i = history.length - 1; i >= 0; i--) {
      const historicEl = history[i]?.find(e => e.id === el.id);
      if (historicEl && historicEl.content) {
        const hPlain = historicEl.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        if (hPlain !== '') {
          return historicEl.content;
        }
      }
    }
    return '';
  };

  const handleRemoveElement = (id: string, focusId: string) => {
    const elToRemove = elements.find(e => e.id === id);
    const idx = elements.findIndex(e => e.id === id);
    
    if (elToRemove) {
      const content = getBestContentForElement(elToRemove);
      if (content) {
        addToBin({
          id: generateId(),
          type: 'deleted',
          element: { ...elToRemove, content },
          deletedAt: Date.now(),
          originalIndex: idx !== -1 ? idx : 0,
        });
      }
      lastNonEmptyContentRef.current.delete(id);
    }

    setElements(els => {
      const remaining = els.filter(e => e.id !== id);
      if (remaining.length === 0) {
        const fallbackId = generateId();
        setFocusedId(fallbackId);
        return [{ id: fallbackId, type: 'scene', content: '' }];
      }
      return remaining;
    });
    setFocusedId(focusId);

    if (collaborationSession.isConnected && collaborationSession.roomId) {
      sendCollabMessage({
        type: 'SYNC_ELEMENT_REMOVE',
        roomId: collaborationSession.roomId,
        senderId: collaborationSession.userName,
        elementId: id,
        focusId
      });
    }
  };

  const handleRemoveElements = (ids: string[], focusId: string) => {
    ids.forEach(id => {
      const elToRemove = elements.find(e => e.id === id);
      const idx = elements.findIndex(e => e.id === id);
      if (elToRemove) {
        const content = getBestContentForElement(elToRemove);
        if (content) {
          addToBin({
            id: generateId(),
            type: 'deleted',
            element: { ...elToRemove, content },
            deletedAt: Date.now(),
            originalIndex: idx !== -1 ? idx : 0,
          });
        }
        lastNonEmptyContentRef.current.delete(id);
      }
    });

    setElements(els => {
      const remaining = els.filter(e => !ids.includes(e.id));
      if (remaining.length === 0) {
        const fallbackId = generateId();
        setFocusedId(fallbackId);
        return [{ id: fallbackId, type: 'scene', content: '' }];
      }
      return remaining;
    });
    setFocusedId(focusId);

    if (collaborationSession.isConnected && collaborationSession.roomId) {
      sendCollabMessage({
        type: 'SYNC_ELEMENT_REMOVE_MULTIPLE',
        roomId: collaborationSession.roomId,
        senderId: collaborationSession.userName,
        elementIds: ids,
        focusId
      });
    }
  };

  const handleReorderScenes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    setElements(els => {
      const sourceIndex = els.findIndex(e => e.id === sourceId);
      const targetIndex = els.findIndex(e => e.id === targetId);
      
      if (sourceIndex === -1 || targetIndex === -1) return els;

      // Find the end of the source scene
      let sourceEndIndex = sourceIndex + 1;
      while (sourceEndIndex < els.length && els[sourceEndIndex].type !== 'scene') {
        sourceEndIndex++;
      }

      // Extract the source scene block
      const sceneBlock = els.slice(sourceIndex, sourceEndIndex);
      
      // Remove the source scene block from elements
      const newElements = els.filter((_, i) => i < sourceIndex || i >= sourceEndIndex);
      
      // Find the new target index in the modified array
      const newTargetIndex = newElements.findIndex(e => e.id === targetId);
      
      // Insert the scene block before the target scene
      newElements.splice(newTargetIndex, 0, ...sceneBlock);
      
      return newElements;
    });
  };

  const handleReorderScenesArray = (newOrder: ScreenplayElement[]) => {
    setElements(els => {
      // We need to reconstruct the full elements array based on the new scene order.
      // Each scene in newOrder brings its following non-scene elements with it.
      const newElements: ScreenplayElement[] = [];
      
      // Keep elements before the first scene (like cover page stuff if any, though usually none)
      const firstSceneIndex = els.findIndex(e => e.type === 'scene');
      if (firstSceneIndex > 0) {
        newElements.push(...els.slice(0, firstSceneIndex));
      }

      // For each scene in the new order, find it and its following elements in the original array
      newOrder.forEach(scene => {
        const originalIndex = els.findIndex(e => e.id === scene.id);
        if (originalIndex !== -1) {
          newElements.push(els[originalIndex]);
          let i = originalIndex + 1;
          while (i < els.length && els[i].type !== 'scene') {
            newElements.push(els[i]);
            i++;
          }
        }
      });

      return newElements;
    });
  };

  const handleChangeType = (id: string, type: ElementType) => {
    setElements(els => els.map(e => e.id === id ? { 
      ...e, 
      type,
      ...(isRevisionMode && activeRevisionColor && activeRevisionColor !== 'white' ? { revisionColor: activeRevisionColor } : {})
    } : e));

    if (collaborationSession.isConnected && collaborationSession.roomId) {
      sendCollabMessage({
        type: 'SYNC_ELEMENT_TYPE',
        roomId: collaborationSession.roomId,
        senderId: collaborationSession.userName,
        elementId: id,
        newType: type
      });
    }
  };

  const changeCurrentElementType = (type: ElementType) => {
    if (focusedId) {
      handleChangeType(focusedId, type);
    }
  };

  const handleUpdateSceneText = (sceneId: string, newText: string) => {
    setElements(prev => {
      const sceneIndex = prev.findIndex(e => e.id === sceneId);
      if (sceneIndex === -1) return prev;

      let nextSceneIndex = prev.findIndex((e, i) => i > sceneIndex && e.type === 'scene');
      if (nextSceneIndex === -1) nextSceneIndex = prev.length;

      const parsedElements = parseTextToElements(newText);
      
      const newArray = [
        ...prev.slice(0, sceneIndex + 1),
        ...parsedElements,
        ...prev.slice(nextSceneIndex)
      ];
      
      return newArray;
    });
  };

  const handleClearRevisionColors = () => {
    setElements(els => els.map(e => {
      const { revisionColor, ...rest } = e;
      return rest;
    }));
  };

  const handleClearAll = () => {
    if (window.confirm('Tüm senaryoyu silmek istediğinize emin misiniz?')) {
      const newId = generateId();
      setCurrentProjectId(generateId());
      setDriveFileId(undefined);
      setElements([{ id: newId, type: 'scene', content: '' }]);
      setCoverPage(null);
      setHistory([[{ id: newId, type: 'scene', content: '' }]]);
      setHistoryIndex(0);
      setFocusedId(newId);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleOpenDOCX = () => {
    fileInputRef.current?.click();
  };

  const handleOpenRecentProject = (project: Screenplay) => {
    setCurrentProjectId(project.id);
    setElements(project.elements);
    setCoverPage(project.coverPage || null);
    setFormat(project.format || 'US');
    setDriveFileId(project.driveFileId);
    if (project.characterColors) {
      setCharacterColors(project.characterColors);
      safeStorage.setItem('scriptHive_characterColors', JSON.stringify(project.characterColors));
    }
    if (typeof project.isTableReadMode === 'boolean') {
      setIsTableReadMode(project.isTableReadMode);
      safeStorage.setItem('scriptHive_tableReadMode', project.isTableReadMode ? 'true' : 'false');
    }
    if (project.spotlightCharacter !== undefined) {
      setSpotlightCharacter(project.spotlightCharacter);
    }
    if (project.selectedStoryTemplateId) {
      setSelectedStoryTemplateId(project.selectedStoryTemplateId);
      safeStorage.setItem('scriptHive_selectedStoryTemplateId', project.selectedStoryTemplateId);
    }
    if (project.storyBeatAnswers) {
      setStoryBeatAnswers(project.storyBeatAnswers);
      safeStorage.setItem('scriptHive_storyBeatAnswers', JSON.stringify(project.storyBeatAnswers));
    }
    if (typeof project.isPagesLocked === 'boolean') {
      setIsPagesLocked(project.isPagesLocked);
      safeStorage.setItem('scriptHive_isPagesLocked', project.isPagesLocked ? 'true' : 'false');
    } else {
      setIsPagesLocked(false);
      safeStorage.setItem('scriptHive_isPagesLocked', 'false');
    }
    if (project.lockedAnchors) {
      setLockedAnchors(project.lockedAnchors);
      safeStorage.setItem('scriptHive_lockedAnchors', JSON.stringify(project.lockedAnchors));
    } else {
      setLockedAnchors([]);
      safeStorage.removeItem('scriptHive_lockedAnchors');
    }
    if (project.lockedSceneAnchors) {
      setLockedSceneAnchors(project.lockedSceneAnchors);
      safeStorage.setItem('scriptHive_lockedSceneAnchors', JSON.stringify(project.lockedSceneAnchors));
    } else {
      setLockedSceneAnchors([]);
      safeStorage.removeItem('scriptHive_lockedSceneAnchors');
    }
    setHistory([project.elements]);
    setHistoryIndex(0);
  };

  const handleFileOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    let newElements: ScreenplayElement[] = [];
    let importedCoverPage: CoverPageData | null = null;
    let importedFormat: ScreenplayFormat | null = null;

    const readFileAsText = (f: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(f);
      });
    };

    const readFileAsArrayBuffer = (f: File): Promise<ArrayBuffer> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(f);
      });
    };

    try {
      if (extension === 'pdf') {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const parsedResult = await parsePdfToScreenplay(arrayBuffer);
        newElements = parsedResult.elements;
        if (parsedResult.coverPage) {
          importedCoverPage = parsedResult.coverPage;
        }
        if (parsedResult.format) {
          importedFormat = parsedResult.format;
        }
      } else if (extension === 'docx') {
        try {
          const buffer = await readFileAsArrayBuffer(file);
          
          let parsedElementsFromMetadata = false;
          // Custom MS Word property reading via JSZip
          try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(buffer);
            
            // 1. Try to fetch metadata
            const customXmlFile = zipContent.file('docProps/custom.xml');
            if (customXmlFile) {
              const customXml = await customXmlFile.async('text');
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(customXml, 'text/xml');
              const allElements = Array.from(xmlDoc.getElementsByTagName('*'));
              const properties = allElements.filter(el => {
                const ln = el.localName || el.nodeName;
                return ln.toLowerCase() === 'property' || ln.endsWith(':property');
              });
              
              for (const prop of Array.from(properties)) {
                if (prop.getAttribute('name') === 'screenplayData') {
                  const jsonText = prop.textContent || '';
                  const data = JSON.parse(jsonText);
                  if (data.coverPage) importedCoverPage = data.coverPage;
                  if (data.format) importedFormat = data.format;
                  if (data.characterColors && typeof data.characterColors === 'object') {
                    setCharacterColors(data.characterColors);
                    safeStorage.setItem('scriptHive_characterColors', JSON.stringify(data.characterColors));
                  }
                  if (typeof data.isTableReadMode === 'boolean') {
                    setIsTableReadMode(data.isTableReadMode);
                    safeStorage.setItem('scriptHive_tableReadMode', data.isTableReadMode ? 'true' : 'false');
                  }
                  if (data.spotlightCharacter !== undefined) {
                    setSpotlightCharacter(data.spotlightCharacter);
                  }
                  if (data.selectedStoryTemplateId) {
                    setSelectedStoryTemplateId(data.selectedStoryTemplateId);
                    safeStorage.setItem('scriptHive_selectedStoryTemplateId', data.selectedStoryTemplateId);
                  }
                  if (data.storyBeatAnswers && typeof data.storyBeatAnswers === 'object') {
                    setStoryBeatAnswers(data.storyBeatAnswers);
                    safeStorage.setItem('scriptHive_storyBeatAnswers', JSON.stringify(data.storyBeatAnswers));
                  }
                  if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
                    newElements = data.elements;
                    parsedElementsFromMetadata = true;
                  }
                  break;
                }
              }
            }
            
            // 2. Try to parse document.xml for indents before falling back to mammoth
            if (!parsedElementsFromMetadata) {
              const documentXmlFile = zipContent.file('word/document.xml');
              if (documentXmlFile) {
                const documentXmlText = await documentXmlFile.async('text');
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(documentXmlText, 'text/xml');
                
                const pElements = Array.from(xmlDoc.getElementsByTagName('*')).filter(el => el.nodeName.endsWith(':p') || el.nodeName === 'p');
                
                if (pElements.length > 0) {
                  const extractedElements: ScreenplayElement[] = [];
  
                  for (const p of pElements) {
                    const tElements = Array.from(p.getElementsByTagName('*')).filter(el => el.nodeName.endsWith(':t') || el.nodeName === 't');
                    let text = '';
                    for (const t of tElements) {
                      text += t.textContent || '';
                    }
                    
                    if (!text.trim()) continue; // skip empty paragraphs
                    
                    const pPrs = Array.from(p.getElementsByTagName('*')).filter(el => el.nodeName.endsWith(':pPr') || el.nodeName === 'pPr');
                    let leftIndent = 0;
                    let isHeadingStyle = false;
                    let isCharacterStyle = false;
                    let isDialogueStyle = false;
                    let isParentheticalStyle = false;
                    let isTransitionStyle = false;
                    let isActionStyle = false;
                    let isSceneStyle = false;
                    let isNoteStyle = false;
                    
                    if (pPrs.length > 0) {
                      const pPr = pPrs[0];
                      
                      const pStyleEl = Array.from(pPr.getElementsByTagName('*')).find(el => {
                        const ln = el.localName || el.nodeName;
                        return ln.toLowerCase() === 'pstyle' || ln.endsWith(':pstyle');
                      });
                      
                      if (pStyleEl) {
                        let val = pStyleEl.getAttribute('w:val') || pStyleEl.getAttribute('val') || '';
                        if (!val) {
                          for (let attrIdx = 0; attrIdx < pStyleEl.attributes.length; attrIdx++) {
                            const attr = pStyleEl.attributes[attrIdx];
                            if (attr.nodeName.endsWith(':val') || attr.nodeName === 'val') {
                              val = attr.nodeValue || '';
                              break;
                            }
                          }
                        }
                        
                        const styleName = val.toLowerCase();
                        if (styleName.includes('heading') || styleName.includes('baslik') || styleName.includes('başlık') || styleName.includes('scene') || styleName.includes('sahne')) {
                          isSceneStyle = true;
                          isHeadingStyle = true;
                        } else if (styleName.includes('character') || styleName.includes('karakter')) {
                          isCharacterStyle = true;
                        } else if (styleName.includes('dialogue') || styleName.includes('diyalog')) {
                          isDialogueStyle = true;
                        } else if (styleName.includes('parenthetical') || styleName.includes('parantez')) {
                          isParentheticalStyle = true;
                        } else if (styleName.includes('transition') || styleName.includes('gecis') || styleName.includes('geçiş')) {
                          isTransitionStyle = true;
                        } else if (styleName.includes('action') || styleName.includes('hareket')) {
                          isActionStyle = true;
                        } else if (styleName.includes('note') || styleName.includes('not')) {
                          isNoteStyle = true;
                        }
                      }
                      
                      const indEl = Array.from(pPr.getElementsByTagName('*')).find(el => {
                        const ln = el.localName || el.nodeName;
                        return ln.toLowerCase() === 'ind' || ln.endsWith(':ind');
                      });
                      
                      if (indEl) {
                        let leftVal = indEl.getAttribute('w:left') || indEl.getAttribute('left') || '0';
                        if (leftVal === '0' || !leftVal) {
                          for (let attrIdx = 0; attrIdx < indEl.attributes.length; attrIdx++) {
                            const attr = indEl.attributes[attrIdx];
                            if (attr.nodeName.endsWith(':left') || attr.nodeName === 'left') {
                              leftVal = attr.nodeValue || '';
                              break;
                            }
                          }
                        }
                        leftIndent = parseInt(leftVal, 10) || 0;
                      }
                    }
                    
                    let isBold = false;
                    const bElements = Array.from(p.getElementsByTagName('*')).filter(el => {
                      const ln = el.localName || el.nodeName;
                      return ln.toLowerCase() === 'b' || ln.endsWith(':b');
                    });
                    if (bElements.length > 0 || p.outerHTML.includes(':b/>') || p.outerHTML.includes('<w:b/>') || p.outerHTML.includes('<b/>')) {
                      isBold = true;
                    }

                    if (!isSceneStyle && !isHeadingStyle) {
                      const frenchMatch = splitInlineFrenchDialogue(text);
                      if (frenchMatch) {
                        extractedElements.push({
                          id: generateId(),
                          type: 'character',
                          content: frenchMatch.character
                        });
                        if (frenchMatch.parenthetical) {
                          extractedElements.push({
                            id: generateId(),
                            type: 'parenthetical',
                            content: frenchMatch.parenthetical
                          });
                        }
                        extractedElements.push({
                          id: generateId(),
                          type: 'dialogue',
                          content: frenchMatch.dialogue
                        });
                        continue;
                      }
                    }
                    
                    let type: ElementType = 'action';
                    
                    if (isSceneStyle || isHeadingStyle) {
                      type = 'scene';
                    } else if (isCharacterStyle) {
                      type = 'character';
                    } else if (isDialogueStyle) {
                      type = 'dialogue';
                    } else if (isParentheticalStyle) {
                      type = 'parenthetical';
                      let tTrim = text.trim();
                      if (!tTrim.startsWith('(')) tTrim = `(${tTrim}`;
                      if (!tTrim.endsWith(')')) tTrim = `${tTrim})`;
                      text = tTrim;
                    } else if (isTransitionStyle) {
                      type = 'transition';
                    } else if (isActionStyle) {
                      type = 'action';
                    } else if (isNoteStyle) {
                      type = 'note';
                    } else if (leftIndent > 0) {
                      // Wide, robust indentation logic in dxa (1/20 of a pt)
                      if (leftIndent >= 4800) {
                        type = 'transition';
                      } else if (leftIndent >= 2605 && leftIndent < 4800) {
                        type = 'character';
                      } else if (leftIndent >= 1900 && leftIndent < 2605) {
                        type = 'parenthetical';
                        let tTrim = text.trim();
                        if (!tTrim.startsWith('(')) tTrim = `(${tTrim}`;
                        if (!tTrim.endsWith(')')) tTrim = `${tTrim})`;
                        text = tTrim;
                      } else if (leftIndent >= 1100 && leftIndent < 1900) {
                        type = 'dialogue';
                      } else {
                        type = 'action';
                      }
                    } else {
                      // Fallback content-based heuristics
                      const upperText = text.toLocaleUpperCase('tr-TR');
                      const tcMatch = upperText === text && text.length > 1;
                      
                      const isSceneFallback = 
                        text.match(/^(\d+[\.\-\s]+)?(İÇ|IÇ|DIŞ|DIS|EXT|INT|EXT\.|INT\.|SAHNE|SCENE|SAH\.|SC\.)([\/\\.\-](İÇ|IÇ|DIŞ|DIS|EXT|INT|EXT\.|INT\.|SAHNE|SCENE|SAH\.|SC\.))*[\s\.\-:\/]?/i) || 
                        text.match(/^(SAHNE|SCENE|SAH|SC)\b/i) || 
                        (text.match(/^\d+[\.\-\s]+/) && tcMatch && text.length < 80);

                      if (isSceneFallback) {
                        type = 'scene';
                      } else if (isBold && tcMatch && text.length < 80) {
                        type = 'scene';
                      } else if (text.match(/^(KESME:|GEÇİŞ:|GEÇİŞİ:|CUT TO:|FADE OUT\.|\bFADE IN\.)/i) || text.endsWith('GEÇİŞ:') || text.endsWith('GEÇİŞİ:') || text.endsWith('CUT TO:')) {
                        type = 'transition';
                      } else if (text.startsWith('(') && text.endsWith(')')) {
                        type = 'parenthetical';
                      } else if (tcMatch && text.length < 35 && !text.match(/[?!.]$/) && !text.match(/^\d+$/) && isNaN(Number(text.trim()))) {
                        type = 'character';
                      } else if (isBold && text.match(/^\s*\d+\s*$/)) {
                        // skip orphaned scene numbers
                        continue;
                      } else if (extractedElements.length > 0) {
                        const lastType = extractedElements[extractedElements.length - 1].type;
                        if (lastType === 'character' || lastType === 'parenthetical') {
                          type = 'dialogue';
                        }
                      }
                    }
                    
                    if (type === 'scene') {
                      text = text.replace(/^\d+[\.\-\s]+/, '');
                    }
                    
                    if (extractedElements.length > 0) {
                      const lastEl = extractedElements[extractedElements.length - 1];
                      if (lastEl.type === type && (type === 'action' || type === 'dialogue')) {
                         lastEl.content += '<br>' + text;
                         continue;
                      }
                    }
                    
                    extractedElements.push({
                       id: generateId(),
                       type,
                       content: text
                    });
                  }
                  
                  if (extractedElements.length > 0) {
                    newElements = extractedElements;
                    parsedElementsFromMetadata = true;
                  }
                }
              }
            }
          } catch (zipError) {
             console.error("Failed to extract structural metadata from DOCX", zipError);
          }

          if (!parsedElementsFromMetadata) {
            // @ts-ignore
            const mammothModule = await import('mammoth/mammoth.browser.js');
            const mammoth = mammothModule.default || mammothModule;
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            
            const textContent = result.value
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<br\s*[\/]?>/gi, '\n')
              .replace(/<[^>]+>/g, '');
              
            newElements = parseTextToElements(textContent);
            
            if (newElements.length === 0) {
              throw new Error("No elements found by mammoth");
            }
          }
        } catch (err) {
          console.log("Mammoth failed, falling back to basic text parsing", err);
          newElements = parseTextToElements(await readFileAsText(file));
        }
      } else if (extension === 'txt' || extension === 'rtf' || extension === 'md' || extension === 'markdown') {
        const text = await readFileAsText(file);
        const cleanText = extension === 'rtf' ? text.replace(/{\\[^}]+}/g, '').replace(/\\[a-z]+\d*\s?/g, '') : text;
        newElements = parseTextToElements(cleanText);
      } else if (extension === 'fdx') {
        const text = await readFileAsText(file);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const paragraphs = xmlDoc.querySelectorAll('Paragraph, paragraph');
        
        paragraphs.forEach(p => {
          const typeAttr = (p.getAttribute('Type') || p.getAttribute('type') || '').toLowerCase();
          let type: ElementType = 'action';
          
          if (typeAttr === 'scene heading') type = 'scene';
          else if (typeAttr === 'character') type = 'character';
          else if (typeAttr === 'dialogue') type = 'dialogue';
          else if (typeAttr === 'parenthetical') type = 'parenthetical';
          else if (typeAttr === 'transition') type = 'transition';
          else if (typeAttr === 'action') type = 'action';
          else return; // Skip other types like General, etc.
          
          const textNodes = p.querySelectorAll('Text, text');
          let content = Array.from(textNodes).map(t => t.textContent || '').join('');
          content = content.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
          
          if (content) {
            if (type === 'scene') {
              content = content.replace(/^\d+[\.\-\s]+/, '');
            }
            
            if (newElements.length > 0) {
              const lastElement = newElements[newElements.length - 1];
              if (lastElement.type === type && (type === 'action' || type === 'dialogue')) {
                lastElement.content += '<br>' + content;
                return;
              }
            }
            
            newElements.push({
              id: generateId(),
              type,
              content
            });
          }
        });
      } else if (extension === 'fountain') {
        const text = await readFileAsText(file);
        newElements = parseTextToElements(text);
      } else if (extension === 'celtx') {
        try {
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(await readFileAsArrayBuffer(file));
          const scriptFile = zipContent.file('script.html');
          if (scriptFile) {
            const html = await scriptFile.async('text');
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const paragraphs = doc.querySelectorAll('p');
            paragraphs.forEach(p => {
              const typeClass = p.className.toLowerCase();
              let type: ElementType = 'action';
              if (typeClass.includes('scene')) type = 'scene';
              else if (typeClass.includes('character')) type = 'character';
              else if (typeClass.includes('dialogue')) type = 'dialogue';
              else if (typeClass.includes('parenthetical')) type = 'parenthetical';
              else if (typeClass.includes('transition')) type = 'transition';
              
              let content = p.innerHTML.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
              if (type === 'scene') content = content.replace(/^\d+[\.\-\s]+/, '');
              content = content.replace(/\n/g, '<br>');
              
              if (content) {
                if (newElements.length > 0) {
                  const lastElement = newElements[newElements.length - 1];
                  if (lastElement.type === type && (type === 'action' || type === 'dialogue')) {
                    lastElement.content += '<br>' + content;
                    return;
                  }
                }
                newElements.push({ id: generateId(), type, content });
              }
            });
          } else {
            const text = await readFileAsText(file);
            newElements = parseTextToElements(text);
          }
        } catch (e) {
          const text = await readFileAsText(file);
          newElements = parseTextToElements(text);
        }
      } else if (extension === 'kitsp') {
        try {
          const text = await readFileAsText(file);
          const data = JSON.parse(text);
          if (data.elements && Array.isArray(data.elements)) {
            newElements = data.elements;
            if (data.coverPage) importedCoverPage = data.coverPage;
            if (data.format) importedFormat = data.format;
          } else {
            newElements = parseTextToElements(text);
          }
        } catch (e) {
          const text = await readFileAsText(file);
          newElements = parseTextToElements(text);
        }
      } else if (extension === 'doc' || extension === 'html') {
        // Our exported .doc is actually HTML
        const text = await readFileAsText(file);
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const divs = doc.querySelectorAll('div');
        
        divs.forEach(div => {
          const type = div.className as ElementType;
          if (['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'].includes(type)) {
            let content = div.innerHTML.replace(/<br\s*[\/]?>/gi, '\n');
            if (type === 'scene') {
              content = content.replace(/^\d+[\.\-\s]+/, '');
            }
            newElements.push({
              id: generateId(),
              type,
              content
            });
          }
        });

        // Fallback if it's a real binary .doc (which we can't parse easily)
        if (newElements.length === 0) {
          // Remove style and script tags before getting text content
          const docCopy = doc.cloneNode(true) as globalThis.Document;
          docCopy.querySelectorAll('style, script').forEach(el => el.remove());
          const bodyText = docCopy.body?.innerText || docCopy.body?.textContent || '';
          newElements = parseTextToElements(bodyText);
        }
      } else {
        const text = await readFileAsText(file);
        newElements = parseTextToElements(text);
      }

      if (newElements.length > 0) {
        setCurrentProjectId(generateId());
        setElements(newElements);
        if (importedFormat) setFormat(importedFormat);
        
        if (importedCoverPage) {
          setCoverPage(importedCoverPage);
        } else {
          setCoverPage(null);
        }
        setHistory([newElements]);
        setHistoryIndex(0);
        if (newElements.length > 0) {
          setFocusedId(newElements[0].id);
        }
      }
    } catch (error) {
      console.error('Error opening file:', error);
      alert('Dosya açılırken bir hata oluştu. Lütfen geçerli bir format seçin.');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateDOCXBlob = async () => {
    const docChildren: any[] = [];
    
    const hasRevisions = numberedElements.some(e => e.revisionColor && e.revisionColor !== 'white');
    const revColorLabel = (REVISION_COLOR_LABELS[activeRevisionColor] || activeRevisionColor).toLocaleLowerCase('tr-TR');
    const revDateStr = activeRevisionDate || coverPage?.date || new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const revHeaderPrefix = hasRevisions ? `${revColorLabel} revizyon (${revDateStr}) ` : '';
    
    const hasCoverPageData = !!coverPage && !!(coverPage.title?.trim() || coverPage.author?.trim() || coverPage.version?.trim() || coverPage.date?.trim() || coverPage.imageUrl);
    
    if (hasCoverPageData && coverPage) {
      const hasImage = !!coverPage.imageUrl;
      const topPadding = hasImage ? 4 : 15;
      const bottomPadding = hasImage ? 3 : 12;

      for (let i = 0; i < topPadding; i++) docChildren.push(new Paragraph({ text: "" }));
      
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: coverPage.title, bold: true, size: 40, font: "Courier Prime" })],
        alignment: AlignmentType.CENTER,
      }));
      
      docChildren.push(new Paragraph({ text: "" }));
      docChildren.push(new Paragraph({ text: "" }));
      
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: coverPage.author, size: 30, font: "Courier Prime" })],
        alignment: AlignmentType.CENTER,
      }));
      
      if (coverPage.imageUrl) {
        docChildren.push(new Paragraph({ text: "" }));
        docChildren.push(new Paragraph({ text: "" }));
        
        try {
          const pureBase64 = coverPage.imageUrl.split(',')[1] || coverPage.imageUrl;
          const binaryString = atob(pureBase64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          let imgWidth = coverPage.imageWidth || 150;
          let imgHeight = 150;
          
          const dims = await new Promise<{ width: number; height: number }>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ width: 150, height: 150 });
            img.src = coverPage.imageUrl!;
          });
          
          if (dims.width > 0) {
            const ratio = dims.height / dims.width;
            imgHeight = imgWidth * ratio;
          }
          
          docChildren.push(new Paragraph({
            children: [
              new ImageRun({
                data: bytes,
                transformation: {
                  width: imgWidth,
                  height: imgHeight,
                },
              } as any),
            ],
            alignment: AlignmentType.CENTER,
          }));
        } catch (imgError) {
          console.error("Error embedding image into docx:", imgError);
        }
      }
      
      for (let i = 0; i < bottomPadding; i++) docChildren.push(new Paragraph({ text: "" }));
      
      if (coverPage.version && coverPage.version.trim()) {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: "Sürüm: " + coverPage.version.trim(), size: 24, font: "Courier Prime" })],
          alignment: AlignmentType.LEFT,
        }));
      }
      
      if (coverPage.date && coverPage.date.trim()) {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: "Tarih: " + coverPage.date.trim(), size: 24, font: "Courier Prime" })],
          alignment: AlignmentType.LEFT,
        }));
      }

      if (coverPage.revisionHistory && coverPage.revisionHistory.trim()) {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: "Revizyon: " + coverPage.revisionHistory.trim(), size: 24, font: "Courier Prime" })],
          alignment: AlignmentType.LEFT,
        }));
      }
      
      docChildren.push(new Paragraph({
        children: [new PageBreak()],
      }));
    }
    
    const renderGroups = groupElementsForRender(numberedElements);

    let currentSpeakingChar = '';

    renderGroups.forEach(group => {
      if (group.kind === 'single') {
        const e = group.element;
        if (e.type === 'note') return;

        if (e.type === 'character') {
          currentSpeakingChar = (e.content || '').replace(/<[^>]+>/g, '').replace(/\(.*\)/g, '').replace(/&nbsp;/g, ' ').trim();
        } else if (e.type === 'scene' || e.type === 'action' || e.type === 'transition') {
          currentSpeakingChar = '';
        }

        const content = e.content || '';
        const textContent = content.replace(/<br\s*[\/]?>/gi, '\n').replace(/<div>/gi, '\n').replace(/<p>/gi, '\n').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        if (!textContent) return;
        
        let text = textContent;
        if (e.type === 'scene' && e.sceneNumber) {
          text = `${e.sceneNumber}. ${text}`;
        }
        
        const lines = text.split('\n');
        
        let indent = 0;
        let rightIndent = 0;
        let isBold = false;
        let isItalic = false;
        let isAllCaps = false;
        let spacingBefore = 0;
        let alignment = AlignmentType.LEFT;
        
        if (e.type === 'scene') {
          isBold = true;
          isAllCaps = true;
          spacingBefore = 240; // 12pt
        } else if (e.type === 'action') {
          spacingBefore = 120; // 6pt
        } else if (e.type === 'character') {
          indent = 2.2 * 1440; // 2.2 inches in twips
          isBold = true;
          isAllCaps = true;
          spacingBefore = 120;
        } else if (e.type === 'dialogue') {
          indent = 1.5 * 1440;
          rightIndent = 1.5 * 1440;
        } else if (e.type === 'parenthetical') {
          indent = 2.0 * 1440;
          rightIndent = 2.0 * 1440;
          isItalic = true;
        } else if (e.type === 'transition') {
          indent = 4.5 * 1440;
          isAllCaps = true;
          spacingBefore = 120;
        }

        // Table Read & Revision Highlighting for Single Lines in DOCX
        const revColorHexMap: Record<string, string> = {
          blue: 'E0F2FE',
          pink: 'FCE7F3',
          yellow: 'FEF9C3',
          green: 'D1FAE5',
          goldenrod: 'FEF3C7'
        };

        let docxShading: any = undefined;
        if (isTableReadMode && (e.type === 'character' || e.type === 'dialogue' || e.type === 'parenthetical')) {
          const charName = e.type === 'character' ? e.content : currentSpeakingChar;
          const cleanCharKey = (charName || '').replace(/<[^>]+>/g, '').replace(/\(.*\)/g, '').replace(/&nbsp;/g, ' ').trim().toLocaleUpperCase('tr-TR');
          if (cleanCharKey) {
            const colorId = characterColors[cleanCharKey] || 'yellow';
            const palette = TABLE_READ_PALETTE.find(p => p.id === colorId) || TABLE_READ_PALETTE[0];
            const isSpotlightMatch = !spotlightCharacter || spotlightCharacter.toLocaleUpperCase('tr-TR') === cleanCharKey;
            if (isSpotlightMatch) {
              const hexFill = palette.bgLight.replace('#', '').toUpperCase();
              docxShading = {
                fill: hexFill,
                type: ShadingType.CLEAR,
              };
            }
          }
        }

        let elementShading = docxShading;
        if (!elementShading && e.revisionColor && revColorHexMap[e.revisionColor]) {
          elementShading = {
            fill: revColorHexMap[e.revisionColor],
            type: ShadingType.CLEAR,
          };
        }
        
        lines.forEach((line, i) => {
          const textRuns: any[] = [new TextRun({ 
            text: line, 
            bold: isBold, 
            italics: isItalic, 
            allCaps: isAllCaps,
            font: "Courier Prime",
            size: 24, // 12pt
            shading: elementShading,
          })];

          if (printRevisionMarks && e.revisionColor && e.revisionColor !== 'white') {
            textRuns.push(new TextRun({
              text: "  *",
              bold: true,
              font: "Courier Prime",
              size: 24,
              color: "000000"
            }));
          }

          docChildren.push(new Paragraph({
            children: textRuns,
            indent: { left: indent, right: rightIndent },
            spacing: { before: i === 0 ? spacingBefore : 0 },
            alignment: alignment,
            heading: i === 0 && e.type === 'scene' ? HeadingLevel.HEADING_1 : undefined,
            shading: elementShading,
          }));
        });
      } else {
        const leftParagraphs: Paragraph[] = [];
        const rightParagraphs: Paragraph[] = [];

        const buildColParagraphs = (items: { element: ScreenplayElement }[], target: Paragraph[]) => {
          let colChar = '';
          items.forEach(item => {
            const e = item.element;
            if (e.type === 'note') return;
            if (e.type === 'character') {
              colChar = (e.content || '').replace(/<[^>]+>/g, '').replace(/\(.*\)/g, '').replace(/&nbsp;/g, ' ').trim();
            }
            const content = (e.content || '').replace(/<br\s*[\/]?>/gi, '\n').replace(/<div>/gi, '\n').replace(/<p>/gi, '\n').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
            if (!content) return;
            const isBold = e.type === 'character';
            const isItalic = e.type === 'parenthetical';
            const isAllCaps = e.type === 'character';
            const alignment = (e.type === 'character' || e.type === 'parenthetical') ? AlignmentType.CENTER : AlignmentType.LEFT;

            const revColorHexMap: Record<string, string> = {
              blue: 'E0F2FE',
              pink: 'FCE7F3',
              yellow: 'FEF9C3',
              green: 'D1FAE5',
              goldenrod: 'FEF3C7'
            };

            // Table Read Highlighting for Dual Dialogue in DOCX
            let docxShading: any = undefined;
            if (isTableReadMode && (e.type === 'character' || e.type === 'dialogue' || e.type === 'parenthetical')) {
              const charName = e.type === 'character' ? e.content : colChar;
              const cleanCharKey = (charName || '').replace(/<[^>]+>/g, '').replace(/\(.*\)/g, '').replace(/&nbsp;/g, ' ').trim().toLocaleUpperCase('tr-TR');
              if (cleanCharKey) {
                const colorId = characterColors[cleanCharKey] || 'yellow';
                const palette = TABLE_READ_PALETTE.find(p => p.id === colorId) || TABLE_READ_PALETTE[0];
                const isSpotlightMatch = !spotlightCharacter || spotlightCharacter.toLocaleUpperCase('tr-TR') === cleanCharKey;
                if (isSpotlightMatch) {
                  const hexFill = palette.bgLight.replace('#', '').toUpperCase();
                  docxShading = {
                    fill: hexFill,
                    type: ShadingType.CLEAR,
                  };
                }
              }
            }

            let elementShading = docxShading;
            if (!elementShading && e.revisionColor && revColorHexMap[e.revisionColor]) {
              elementShading = {
                fill: revColorHexMap[e.revisionColor],
                type: ShadingType.CLEAR,
              };
            }
            
            content.split('\n').forEach((line, i) => {
              const textRuns: any[] = [new TextRun({
                text: line,
                bold: isBold,
                italics: isItalic,
                allCaps: isAllCaps,
                font: "Courier Prime",
                size: 24,
                shading: elementShading,
              })];

              if (printRevisionMarks && e.revisionColor && e.revisionColor !== 'white') {
                textRuns.push(new TextRun({
                  text: "  *",
                  bold: true,
                  font: "Courier Prime",
                  size: 24,
                  color: "000000"
                }));
              }

              target.push(new Paragraph({
                children: textRuns,
                alignment: alignment,
                spacing: { before: (i === 0 && e.type === 'character') ? 120 : 0 },
                shading: elementShading,
              }));
            });
          });
        };

        buildColParagraphs(group.left, leftParagraphs);
        buildColParagraphs(group.right, rightParagraphs);

        docChildren.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: leftParagraphs.length > 0 ? leftParagraphs : [new Paragraph({ text: "" })],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  }
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: rightParagraphs.length > 0 ? rightParagraphs : [new Paragraph({ text: "" })],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  }
                })
              ]
            })
          ]
        }));
      }
    });
    
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              font: "Courier Prime",
              size: 24, // 12pt
              bold: true,
              color: "000000",
              allCaps: true,
            },
            paragraph: {
              spacing: { before: 240, after: 120 }, // 12pt space before, 6pt after
              keepNext: true,
            }
          }
        ]
      },
      customProperties: [
        {
          name: "screenplayData",
          value: JSON.stringify({ 
            elements: elements, 
            coverPage, 
            format, 
            characterColors,
            isTableReadMode,
            spotlightCharacter,
            selectedStoryTemplateId,
            storyBeatAnswers,
            version: 1 
          }),
        },
      ],
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 2160, // 1.5 inch
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  ...(hasRevisions ? [
                    new TextRun({
                      text: revHeaderPrefix,
                      font: "Courier Prime",
                      size: 20, // 10pt
                    })
                  ] : []),
                  new TextRun({
                    children: [PageNumber.CURRENT, "."],
                    font: "Courier Prime",
                    size: 20,
                  })
                ]
              })
            ]
          })
        },
        children: docChildren,
      }],
    });
    
    return await Packer.toBlob(doc);
  };

  const handleSaveToDrive = async (isAutoSave: boolean = false) => {
    if (!isGoogleAuth) {
      if (!isAutoSave) alert("Lütfen önce Google ile giriş yapın.");
      return;
    }
    
    const tokensStr = localStorage.getItem('google_auth_tokens');
    if (!tokensStr) {
      setIsGoogleAuth(false);
      if (!isAutoSave) alert("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
      return;
    }
    
    const tokens = JSON.parse(tokensStr);
    
    setIsSavingToDrive(true);
    try {
      const blob = await generateDOCXBlob();
      
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          if (reader.result) {
            resolve((reader.result as string).split(',')[1]);
          } else {
            reject(new Error("Drive'a kaydedilecek veriler okunamadı"));
          }
        };
        reader.onerror = () => reject(new Error("Dosya okuma hatası"));
      });
      
      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access_token}`
        },
        body: JSON.stringify({
          fileId: driveFileId,
          fileName: `${coverPage?.title || 'senaryo'}.docx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          contentBase64: base64data
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setDriveFileId(result.fileId);
        if (!isAutoSave) alert(driveFileId ? "Google Drive'da güncellendi!" : "Google Drive'a başarıyla kaydedildi!");
      } else {
        console.error("Drive upload error:", result);
        if (response.status === 401) {
          setIsGoogleAuth(false);
          localStorage.removeItem('google_auth_tokens');
          if (!isAutoSave) alert("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
        } else {
          if (!isAutoSave) alert("Kaydetme başarısız oldu: " + (result.error || "Bilinmeyen hata"));
        }
      }
    } catch (error) {
      console.error("Error saving to drive:", error);
      if (!isAutoSave) alert("Kaydetme sırasında bir hata oluştu.");
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const saveToDriveRef = useRef(handleSaveToDrive);
  useEffect(() => {
    saveToDriveRef.current = handleSaveToDrive;
  });

  useEffect(() => {
    if (!isGoogleAuth) return;
    
    const intervalId = setInterval(() => {
      // Auto-save silently every 2 minutes
      saveToDriveRef.current(true);
    }, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isGoogleAuth]);

  // Load Google Fonts dynamically when needed
  useEffect(() => {
    const fontsToLoad = new Set<string>();
    if (fontFamily) fontsToLoad.add(fontFamily);
    elements.forEach(el => {
      if (el.fontFamily) {
        fontsToLoad.add(el.fontFamily);
      }
    });
    fontsToLoad.forEach(font => {
      loadGoogleFontDynamically(font);
    });
  }, [fontFamily, elements]);

  useEffect(() => {
    if (isGoogleAuth && shouldAutoSaveToDrive) {
      setShouldAutoSaveToDrive(false);
      handleSaveToDrive();
    }
  }, [isGoogleAuth, shouldAutoSaveToDrive]);

  useEffect(() => {
    // Check auth status on load from localStorage
    const tokens = localStorage.getItem('google_auth_tokens');
    if (tokens) {
      setIsGoogleAuth(true);
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data.tokens) {
          localStorage.setItem('google_auth_tokens', JSON.stringify(event.data.tokens));
        }
        setIsGoogleAuth(true);
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('oauth_channel');
      bc.onmessage = handleMessage;
    } catch (e) {
      console.error('BroadcastChannel not supported', e);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'google_auth_trigger' || event.key === 'google_auth_tokens') {
        const tokens = localStorage.getItem('google_auth_tokens');
        if (tokens) {
          setIsGoogleAuth(true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, []);

  const handleGoogleLogin = async () => {
    let authWindow: Window | null = null;
    try {
      setShouldAutoSaveToDrive(true);
      
      // Open window synchronously to avoid popup blockers
      authWindow = window.open('', 'oauth_popup', 'width=600,height=700');
      
      if (!authWindow) {
        alert('Lütfen bu site için açılır pencerelere (pop-ups) izin verin ve tekrar deneyin.');
        return;
      }

      // Add a clean, beautiful loading state inside the synchronously opened blank popup
      try {
        authWindow.document.write(`
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Google Drive Bağlantısı Hazırlanıyor...</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f8fafc;
                  color: #1e293b;
                  text-align: center;
                }
                .spinner {
                  border: 4px solid #e2e8f0;
                  border-top: 4px solid #10b981;
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  animation: spin 1s linear infinite;
                  margin-bottom: 16px;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                h3 { margin: 0 0 8px 0; font-weight: 600; color: #0f172a; }
                p { margin: 0; color: #64748b; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="spinner"></div>
              <h3>Google Drive Bağlantısı Güvenle Açılıyor</h3>
              <p>Lütfen bekleyin...</p>
            </body>
          </html>
        `);
      } catch (docErr) {
        console.warn("Failed to write loading HTML to auth window:", docErr);
      }
      
      // Always look at the current origin the user is actually browsing
      const origin = window.location.origin;
      const redirectUri = encodeURIComponent(`${origin}/auth/callback`);
      const response = await fetch(`/api/auth/url?redirectUri=${redirectUri}`);
      
      if (!response.ok) {
        authWindow.close();
        const data = await response.json();
        if (data.error && data.error.includes('Google Client ID is not configured')) {
           alert('Google Drive entegrasyonu için ayarlar eksik. Lütfen AI Studio ayarlarından (Secrets) GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET değişkenlerini ekleyin.');
           return;
        }
        throw new Error(data.error || 'Failed to get auth URL');
      }
      
      const { url } = await response.json();
      authWindow.location.href = url;
    } catch (error: any) {
      console.error('OAuth error:', error);
      if (authWindow) {
        authWindow.close();
      }
      alert('Google ile bağlantı kurulamadı: ' + (error?.message || String(error)));
    }
  };

  const handleGoogleLogout = async () => {
    try {
      localStorage.removeItem('google_auth_tokens');
      setIsGoogleAuth(false);
      // setDriveFileId(undefined); // Do not clear driveFileId on logout so the association is remembered
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleExportDOCX = async () => {
    try {
      const blob = await generateDOCXBlob();
      let wroteFile = false;
      
      if ('showSaveFilePicker' in window) {
        try {
          let handle = docxFileHandle;
          if (!handle) {
            handle = await (window as any).showSaveFilePicker({
              suggestedName: 'senaryo.docx',
              types: [{
                description: 'Word Document',
                accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
              }],
            });
            setDocxFileHandle(handle);
          }
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          wroteFile = true;
        } catch (pickerErr: any) {
          if (pickerErr.name === 'AbortError') {
            return; // User cancelled, do nothing
          }
          console.warn('showSaveFilePicker failed, falling back to simple download:', pickerErr);
        }
      }
      
      if (!wroteFile) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${coverPage?.title || 'senaryo'}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err);
        alert('Kaydetme başarısız oldu: ' + (err.message || String(err)));
      }
    }
  };

  const handleExportMD = async () => {
    let md = '';
    
    const hasCoverPageData = !!coverPage && !!(coverPage.title?.trim() || coverPage.author?.trim() || coverPage.version?.trim() || coverPage.date?.trim());
    if (hasCoverPageData && coverPage) {
      if (coverPage.title?.trim()) md += `# ${coverPage.title.trim()}\n\n`;
      if (coverPage.author?.trim()) md += `**Yazan:** ${coverPage.author.trim()}\n\n`;
      if (coverPage.version?.trim()) {
        md += `**Sürüm:** ${coverPage.version.trim()}\n\n`;
      }
      if (coverPage.date?.trim()) {
        md += `**Tarih:** ${coverPage.date.trim()}\n\n`;
      }
      if (coverPage.revisionHistory?.trim()) {
        md += `**Revizyon:** ${coverPage.revisionHistory.trim()}\n\n`;
      }
      md += `---\n\n`;
    }
    
    const renderGroups = groupElementsForRender(numberedElements);
    renderGroups.forEach(group => {
      if (group.kind === 'single') {
        const e = group.element;
        let content = e.content || '';
        content = content.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        if (!content) return;
        
        if (e.type === 'scene') {
          md += `### ${e.sceneNumber ? e.sceneNumber + '. ' : ''}${content}\n\n`;
        } else if (e.type === 'character') {
          md += `**${content}**\n`;
        } else if (e.type === 'parenthetical') {
          md += `*${content}*\n`;
        } else if (e.type === 'dialogue') {
          md += `${content}\n\n`;
        } else if (e.type === 'transition') {
          md += `> ${content}\n\n`;
        } else if (e.type === 'note') {
          md += `[[ ${content} ]]\n\n`;
        } else {
          md += `${content}\n\n`;
        }
      } else {
        md += `\n<div class="dual-dialogue" style="display: flex; gap: 2rem;">\n<div style="flex: 1;">\n`;
        group.left.forEach(item => {
          let c = (item.element.content || '').replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
          if (!c) return;
          if (item.element.type === 'character') md += `**${c}**\n`;
          else if (item.element.type === 'parenthetical') md += `*${c}*\n`;
          else {
            md += `${c}\n\n`;
          }
        });
        md += `</div>\n<div style="flex: 1;">\n`;
        group.right.forEach(item => {
          let c = (item.element.content || '').replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
          if (!c) return;
          if (item.element.type === 'character') md += `**${c}**\n`;
          else if (item.element.type === 'parenthetical') md += `*${c}*\n`;
          else {
            md += `${c}\n\n`;
          }
        });
        md += `</div>\n</div>\n\n`;
      }
    });

    try {
      let wroteFile = false;
      if ('showSaveFilePicker' in window) {
        try {
          let handle = rtfFileHandle;
          if (!handle) {
            handle = await (window as any).showSaveFilePicker({
              suggestedName: 'senaryo.md',
              types: [{
                description: 'Markdown',
                accept: { 'text/markdown': ['.md'] },
              }],
            });
            setRtfFileHandle(handle); // Kept state name same for simplicity, though it's now md
          }
          const writable = await handle.createWritable();
          await writable.write('\ufeff' + md);
          await writable.close();
          wroteFile = true;
        } catch (pickerErr: any) {
          if (pickerErr.name === 'AbortError') {
            return; // User cancelled
          }
          console.warn('showSaveFilePicker failed, falling back to simple download:', pickerErr);
        }
      }
      
      if (!wroteFile) {
        const blob = new Blob(['\ufeff' + md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${coverPage?.title || 'senaryo'}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err);
        alert('Kaydetme başarısız oldu: ' + (err.message || String(err)));
      }
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFDX = async () => {
    const hasRevisions = numberedElements.some(e => e.revisionColor && e.revisionColor !== 'white');
    const revDateStr = activeRevisionDate || coverPage?.date || new Date().toLocaleDateString('tr-TR');
    
    let xml = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<FinalDraft DocumentType="Script" Template="No" Version="1">\n`;
    
    if (hasRevisions) {
      xml += `  <RevisionSpec CurrentRevision="1">\n`;
      xml += `    <Revision ID="1" Name="Mavi revizyon (${revDateStr})" Color="Blue" PageColor="Blue" Active="Yes" />\n`;
      xml += `    <Revision ID="2" Name="Pembe revizyon (${revDateStr})" Color="Pink" PageColor="Pink" Active="Yes" />\n`;
      xml += `    <Revision ID="3" Name="Sarı revizyon (${revDateStr})" Color="Yellow" PageColor="Yellow" Active="Yes" />\n`;
      xml += `    <Revision ID="4" Name="Yeşil revizyon (${revDateStr})" Color="Green" PageColor="Green" Active="Yes" />\n`;
      xml += `    <Revision ID="5" Name="Altın revizyon (${revDateStr})" Color="Goldenrod" PageColor="Goldenrod" Active="Yes" />\n`;
      xml += `  </RevisionSpec>\n`;
    }
    
    xml += `  <Content>\n`;
    
    const renderGroups = groupElementsForRender(numberedElements);
    
    renderGroups.forEach(group => {
      if (group.kind === 'single') {
        const e = group.element;
        let type = 'Action';
        if (e.type === 'scene') type = 'Scene Heading';
        else if (e.type === 'character') type = 'Character';
        else if (e.type === 'dialogue') type = 'Dialogue';
        else if (e.type === 'parenthetical') type = 'Parenthetical';
        else if (e.type === 'transition') type = 'Transition';
        
        const content = e.content || '';
        let text = content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        if (!text) return;
        if (e.type === 'scene' && e.sceneNumber) {
          text = `${e.sceneNumber}. ${text}`;
        }
        
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const revAttr = (e.revisionColor && e.revisionColor !== 'white') ? ` Revision="1" RevisionID="${e.revisionColor}"` : '';
        xml += `    <Paragraph Type="${type}"${revAttr}>\n      <Text${revAttr}>${text}</Text>\n    </Paragraph>\n`;
      } else {
        xml += `    <DualDialogue>\n`;
        const renderColFDX = (items: { element: ScreenplayElement }[]) => {
          items.forEach(item => {
            const e = item.element;
            let type = 'Dialogue';
            if (e.type === 'character') type = 'Character';
            else if (e.type === 'parenthetical') type = 'Parenthetical';
            const content = e.content || '';
            let text = content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
            if (!text) return;
            text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const revAttr = (e.revisionColor && e.revisionColor !== 'white') ? ` Revision="1" RevisionID="${e.revisionColor}"` : '';
            xml += `      <Paragraph Type="${type}"${revAttr}>\n        <Text${revAttr}>${text}</Text>\n      </Paragraph>\n`;
          });
        };
        renderColFDX(group.left);
        renderColFDX(group.right);
        xml += `    </DualDialogue>\n`;
      }
    });
    
    xml += `  </Content>\n</FinalDraft>`;
    
    const blob = new Blob(['\ufeff' + xml], { type: 'application/vnd.finaldraft.fdx;charset=utf-8' });
    downloadBlob(blob, `${coverPage?.title || 'senaryo'}.fdx`);
  };

  const handleExportFountain = async () => {
    let text = '';
    
    if (coverPage && (coverPage.title || coverPage.author)) {
      text += `Title: ${coverPage.title}\n`;
      text += `Author: ${coverPage.author}\n`;
      text += `Draft date: ${coverPage.date}\n`;
      text += `\n`;
    }
    
    const renderGroups = groupElementsForRender(numberedElements);

    renderGroups.forEach(group => {
      if (group.kind === 'single') {
        const e = group.element;
        const contentStr = e.content || '';
        let content = contentStr.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        if (!content) return;
        if (e.type === 'scene') {
          if (e.sceneNumber) content = `.${content} #${e.sceneNumber}#`;
          else content = `.${content}`;
          text += `\n${content}\n\n`;
        } else if (e.type === 'character') {
          text += `\n${content}\n`;
        } else if (e.type === 'dialogue') {
          text += `${content}\n`;
        } else if (e.type === 'parenthetical') {
          text += `${content}\n`;
        } else if (e.type === 'transition') {
          text += `\n> ${content}\n\n`;
        } else {
          text += `${content}\n\n`;
        }
      } else {
        group.left.forEach(item => {
          const e = item.element;
          let content = (e.content || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
          if (!content) return;
          if (e.type === 'character') text += `\n${content}\n`;
          else text += `${content}\n`;
        });
        group.right.forEach(item => {
          const e = item.element;
          let content = (e.content || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
          if (!content) return;
          if (e.type === 'character') {
            text += `\n${content} ^\n`;
          } else {
            text += `${content}\n`;
          }
        });
        text += '\n';
      }
    });
    
    const blob = new Blob(['\ufeff' + text.trim()], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${coverPage?.title || 'senaryo'}.fountain`);
  };

  const handleExportCeltx = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const rdf = `<?xml version="1.0" encoding="UTF-8"?>\n<RDF xmlns="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:cx="http://celtx.com/NS/v1/">\n  <Description about="http://celtx.com/project/1">\n    <cx:title>${coverPage?.title || 'Script'}</cx:title>\n  </Description>\n</RDF>`;
      zip.file('project.rdf', rdf);
      
      let html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n</head>\n<body>\n`;
      numberedElements.forEach(e => {
        let type = e.type;
        if (type === 'scene') type = 'sceneheading';
        const contentStr = e.content || '';
        let content = contentStr.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        if (!content) return;
        if (e.type === 'scene' && e.sceneNumber) {
          content = `${e.sceneNumber}. ${content}`;
        }
        html += `<p class="${type}">${content}</p>\n`;
      });
      html += `</body>\n</html>`;
      zip.file('script.html', html);
      
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${coverPage?.title || 'senaryo'}.celtx`);
    } catch (err) {
      console.error('Celtx export failed:', err);
      alert('Celtx dışa aktarma başarısız oldu.');
    }
  };

  const handleExportKitsp = async () => {
    const cleanCoverPage = coverPage ? {
      ...coverPage,
      imageUrl: undefined,
      imageWidth: undefined
    } : undefined;

    const data = {
      elements: numberedElements,
      coverPage: cleanCoverPage,
      version: 1,
      format: 'kitsp-json'
    };
    const blob = new Blob(['\ufeff' + JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `${coverPage?.title || 'senaryo'}.kitsp`);
  };

  useEffect(() => {
    safeStorage.setItem('scriptHive_healthBreak', isHealthBreakEnabled.toString());
  }, [isHealthBreakEnabled]);

  useEffect(() => {
    if (!isHealthBreakEnabled) return;

    const interval = setInterval(() => {
      setBreakTimer((prev) => {
        if (prev <= 1) {
          setIsBreakModalOpen(true);
          return 30 * 60; // Reset for next time
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHealthBreakEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExportMD(); // As requested, save as markdown
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (focusedId) {
          const index = elements.findIndex(el => el.id === focusedId);
          if (index !== -1) {
            const el = elements[index];
            const newEl = { ...el, id: generateId() };
            const newElements = [...elements.slice(0, index + 1), newEl, ...elements.slice(index + 1)];
            setElements(newElements);
            setFocusedId(newEl.id);
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (focusedId) {
          const index = elements.findIndex(el => el.id === focusedId);
          if (index !== -1) {
            const newEl = { id: generateId(), type: 'action' as const, content: '' };
            const newElements = [...elements.slice(0, index + 1), newEl, ...elements.slice(index + 1)];
            setElements(newElements);
            setFocusedId(newEl.id);
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        const sceneInput = window.prompt("Gitmek istediğiniz sahne numarasını veya başlığını girin:");
        if (sceneInput && sceneInput.trim()) {
          const trimmed = sceneInput.trim();
          const parsedNum = parseInt(trimmed, 10);
          
          let target = numberedElements.find(el => el.type === 'scene' && (
            String(el.sceneNumber).toLowerCase() === trimmed.toLowerCase() ||
            (!isNaN(parsedNum) && el.sceneNumber === parsedNum)
          ));
          
          if (!target) {
            target = numberedElements.find(el => el.type === 'scene' && (
              String(el.content).toLowerCase().includes(trimmed.toLowerCase()) ||
              String(el.content).startsWith(trimmed + ".")
            ));
          }
          
          if (target) {
            setFocusedId(target.id);
            setTimeout(() => {
              const elNode = document.getElementById(`element-${target.id}`);
              if (elNode) {
                elNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          } else {
            alert("Belirtilen sahne bulunamadı.");
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleClearAll();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        const printArea = document.getElementById('print-area');
        if (printArea) {
          const range = document.createRange();
          range.selectNodeContents(printArea);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        // Tarayıcı metin kopyalamayı seçili metin varsa yapar
        const sel = window.getSelection();
        if (sel && sel.isCollapsed && focusedId) {
            const el = elements.find(x => x.id === focusedId);
            if (el && el.content) {
                // Sadece nesne kopyalama (metin seçili değilse nesneyi kopyala)
                navigator.clipboard.writeText(el.content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
                e.preventDefault(); // Varsayılanı durdur çünkü biz manuel kopyalıyoruz
            }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        const sel = window.getSelection();
        if (sel && sel.isCollapsed && focusedId) {
            const index = elements.findIndex(x => x.id === focusedId);
            if (index !== -1) {
                const el = elements[index];
                navigator.clipboard.writeText(el.content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
                handleRemoveElement(el.id, elements[index > 0 ? index - 1 : 0].id);
                e.preventDefault();
            }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
         // Tarayıcı "Yapıştır" işlevi ile ilgileniyor. Metin gelince onPaste zaten tetiklenir.
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete')) {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          const printArea = document.getElementById('print-area');
          if (printArea && printArea.contains(sel.anchorNode) && printArea.contains(sel.focusNode)) {
            const getEditableParent = (node: Node | null) => {
              let curr = node;
              while (curr && curr !== printArea) {
                if (curr instanceof HTMLElement && curr.getAttribute('contenteditable') === 'true') {
                  return curr;
                }
                curr = curr.parentNode;
              }
              return null;
            };
            const anchorEditable = getEditableParent(sel.anchorNode);
            const focusEditable = getEditableParent(sel.focusNode);
            
            if (anchorEditable !== focusEditable || (!anchorEditable && !focusEditable)) {
              e.preventDefault();
              if (e.key === 'Backspace' || e.key === 'Delete') {
                handleClearAll();
              }
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, history, historyIndex, docxFileHandle, rtfFileHandle, numberedElements]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (docxFileHandle) {
        handleExportDOCX();
      }
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [elements, docxFileHandle]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>, id: string, index: number) => {
    e.preventDefault();
    const rawText = e.clipboardData.getData('text/plain') || e.clipboardData.getData('text') || '';
    const rawHtml = e.clipboardData.getData('text/html') || '';

    let textBeforeCursor = '';
    let textAfterCursor = '';

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);

      const postCaretRange = range.cloneRange();
      postCaretRange.selectNodeContents(e.currentTarget);
      postCaretRange.setStart(range.endContainer, range.endOffset);

      const div = document.createElement('div');
      div.appendChild(postCaretRange.cloneContents());
      textAfterCursor = div.innerHTML;

      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(e.currentTarget);
      preCaretRange.setEnd(range.startContainer, range.startOffset);

      const div2 = document.createElement('div');
      div2.appendChild(preCaretRange.cloneContents());
      textBeforeCursor = div2.innerHTML;
    } else {
      const el = elements.find(el => el.id === id);
      textBeforeCursor = el ? el.content : '';
    }

    // Check if HTML has native ScriptHive elements
    if (rawHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      const blocks = doc.querySelectorAll('[data-type], .scene, .action, .character, .dialogue, .parenthetical, .transition, .note');
      if (blocks.length > 1) {
        const pastedElements: ScreenplayElement[] = [];
        blocks.forEach(block => {
          let type = block.getAttribute('data-type') as ElementType;
          if (!type) {
            const className = block.className || '';
            if (className.includes('scene')) type = 'scene';
            else if (className.includes('action')) type = 'action';
            else if (className.includes('character')) type = 'character';
            else if (className.includes('dialogue')) type = 'dialogue';
            else if (className.includes('parenthetical')) type = 'parenthetical';
            else if (className.includes('transition')) type = 'transition';
            else if (className.includes('note')) type = 'note';
          }
          if (type) {
            let content = block.innerHTML.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '');
            if (type === 'scene') {
              content = content.replace(/^\d+[\.\-\s]+/, '');
            }
            if (content.trim()) {
              pastedElements.push({ id: generateId(), type, content: content.trim() });
            }
          }
        });

        if (pastedElements.length > 0) {
          setElements(els => {
            const newEls = [...els];
            if (!textBeforeCursor.trim() && !textAfterCursor.trim()) {
              newEls.splice(index, 1, ...pastedElements);
            } else if (!textBeforeCursor.trim()) {
              newEls.splice(index, 0, ...pastedElements);
            } else if (!textAfterCursor.trim()) {
              newEls.splice(index + 1, 0, ...pastedElements);
            } else {
              newEls[index] = { ...newEls[index], content: textBeforeCursor };
              const tailEl: ScreenplayElement = { id: generateId(), type: elements[index].type, content: textAfterCursor };
              newEls.splice(index + 1, 0, ...pastedElements, tailEl);
            }
            return newEls;
          });
          setFocusedId(pastedElements[pastedElements.length - 1].id);
          return;
        }
      }
    }

    // Clean source text from plain text or HTML
    let sourceText = rawText;
    if (!sourceText.trim() && rawHtml) {
      sourceText = cleanClipboardHtml(rawHtml);
    } else if (rawHtml && rawHtml.includes('<p>') && !rawText.includes('\n')) {
      const htmlText = cleanClipboardHtml(rawHtml);
      if (htmlText.includes('\n')) {
        sourceText = htmlText;
      }
    }

    if (!sourceText) return;

    // Parse with smart screenplay parser
    const parsed = parseTextToElements(sourceText);

    if (parsed.length === 0) return;

    // Check if this is a simple single-line inline paste
    const isSingleLine = !sourceText.includes('\n') && parsed.length === 1;
    const isStandardAction = parsed[0].type === 'action' && !parsed[0].content.includes('<br>');

    if (isSingleLine && isStandardAction) {
      handleElementChange(id, textBeforeCursor + sourceText + textAfterCursor);
      return;
    }

    // Multi-element / structured screenplay paste
    setElements(els => {
      const newEls = [...els];
      if (!textBeforeCursor.trim() && !textAfterCursor.trim()) {
        // Current element was empty, replace it completely
        newEls.splice(index, 1, ...parsed);
      } else if (!textBeforeCursor.trim()) {
        // Cursor at very start of current element
        newEls.splice(index, 0, ...parsed);
      } else if (!textAfterCursor.trim()) {
        // Cursor at very end of current element
        newEls.splice(index + 1, 0, ...parsed);
      } else {
        // Cursor in the middle
        newEls[index] = { ...newEls[index], content: textBeforeCursor };
        const tailEl: ScreenplayElement = { id: generateId(), type: elements[index].type, content: textAfterCursor };
        newEls.splice(index + 1, 0, ...parsed, tailEl);
      }
      return newEls;
    });

    if (parsed.length > 0) {
      setFocusedId(parsed[parsed.length - 1].id);
    }
  };

  // const handleRemoveElement = (id: string) => {
  //   saveToHistory();
  //   setElements(prev => prev.filter(e => e.id !== id));
  // };

  const handleRestoreBinItem = (item: BinItem) => {
    setElements(els => {
      const idx = item.originalIndex !== undefined ? Math.min(item.originalIndex, els.length) : els.length;
      const newElements = [...els];
      newElements.splice(idx, 0, item.element);
      return newElements;
    });
    setBin(prev => prev.filter(b => b.id !== item.id));
    setFocusedId(item.element.id);
  };

  const handleMoveToBin = (id: string, asAlternative: boolean = false) => {
    setElements(els => {
      const idx = els.findIndex(e => e.id === id);
      if (idx !== -1) {
        let content = els[idx].content ? els[idx].content.replace(/^(?:<br\s*\/?>)+|(?:<br\s*\/?>)+$/gi, '').trim() : '';
        
        if (content === '') {
          for (let i = historyIndex; i >= 0; i--) {
            const historicEl = history[i]?.find(e => e.id === id);
            if (historicEl && historicEl.content) {
              const cleaned = historicEl.content.replace(/^(?:<br\s*\/?>)+|(?:<br\s*\/?>)+$/gi, '').trim();
              if (cleaned !== '') {
                content = cleaned;
                break;
              }
            }
          }
        }

        const item: BinItem = {
          id: generateId(),
          type: asAlternative ? 'alternative' : 'deleted',
          element: { ...els[idx], content },
          deletedAt: Date.now(),
          originalIndex: idx,
        };
        setBin(prev => [item, ...prev]);
      }
      
      if (asAlternative) {
        return els; // Do not remove if it's an alternative
      }
      return els.filter(e => e.id !== id);
    });
    
    if (!asAlternative) {
      // Find a reasonable focusId
      setElements(els => {
        const idx = els.findIndex(e => e.id === id);
        if (idx !== -1) {
          const focusId = idx > 0 ? els[idx - 1].id : (els.length > 1 ? els[1].id : id);
          setTimeout(() => setFocusedId(focusId), 0);
        }
        return els;
      });
    }
  };

  const focusedIdRef = useRef(focusedId);

  useEffect(() => {
    elementsRef.current = elements;
    focusedIdRef.current = focusedId;
  }, [elements, focusedId]);

  useEffect(() => {
    let recognition: any = null;
    if (isListening) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'tr-TR';

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          const currentFocusedId = focusedIdRef.current;
          const currentElements = elementsRef.current;
          
          if (transcript.toLowerCase() === 'geç' || transcript.toLowerCase() === 'geç.') {
            if (currentFocusedId) {
              const el = currentElements.find(e => e.id === currentFocusedId);
              if (el) {
                let nextType: ElementType = 'action';
                if (el.type === 'character') nextType = 'dialogue';
                else if (el.type === 'dialogue') nextType = 'character';
                else if (el.type === 'scene') nextType = 'action';
                else if (el.type === 'transition') nextType = 'scene';
                else if (el.type === 'parenthetical') nextType = 'dialogue';
                handleAddElement(currentFocusedId, nextType);
              }
            }
          } else if (currentFocusedId) {
            setElements(els => els.map(e => {
              if (e.id === currentFocusedId) {
                const content = e.content || '';
                return { ...e, content: content + (content ? ' ' : '') + transcript };
              }
              return e;
            }));
          }
        };

        recognition.start();
      } else {
        alert('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
        setIsListening(false);
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isListening]);

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] text-slate-300' : 'bg-[#e2d9cc] text-slate-900';

  const focusedElement = elements.find(e => e.id === focusedId);
  const currentFontFamily = focusedElement?.fontFamily || fontFamily;
  const currentFontSize = focusedElement?.fontSize || fontSize;
  const currentFontColor = focusedElement?.fontColor || fontColor;

  const isTouchDevice = typeof window !== 'undefined' && (
    Boolean(window.matchMedia && window.matchMedia('(any-pointer: coarse)')?.matches) ||
    ('ontouchstart' in window) ||
    (typeof navigator !== 'undefined' && ((navigator.maxTouchPoints || 0) > 0 || ((navigator as any).msMaxTouchPoints || 0) > 0))
  );
  const activeUiMode = uiMode === 'auto' ? (isTouchDevice ? 'tablet' : 'desktop') : uiMode;

  const wordCount = useMemo(() => elements.reduce((acc, el) => acc + ((el.content || '').split(/\s+/).filter(Boolean).length), 0), [elements]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isZenMode]);

  useEffect(() => {
    sprintActions.updateQuantity(wordCount);
  }, [wordCount]);

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden ${bgClass} relative`}>
      <input 
        type="file" 
        accept="*/*,.doc,.docx,.txt,.rtf,.md,.markdown,.pdf,.html,.fdx,.fdr,.fountain,.celtx,.kitsp,.fadein,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/rtf,text/markdown,application/rtf,text/html,application/vnd.finaldraft.fdx,text/xml,application/xml,application/zip,application/x-zip-compressed"
        ref={fileInputRef} 
        onChange={handleFileOpen} 
        className="absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden whitespace-nowrap border-0 opacity-0" 
      />
      {!isZenMode && (
        <TopBar 
          elements={numberedElements} 
          theme={theme} 
          setTheme={setTheme}
          format={format}
          setFormat={setFormat}
          zoom={zoom} 
          setZoom={setZoom} 
          uiMode={uiMode}
          activeUiMode={activeUiMode}
          setUiMode={(mode) => {
            setUiMode(mode);
            safeStorage.setItem('scriptHive_uiMode', mode);
          }}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isZenMode={isZenMode}
          setIsZenMode={setIsZenMode}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenCharacterBible={() => setIsCharacterBibleOpen(true)}
          onOpenStoryBible={() => setIsStoryBibleOpen(true)}
          onOpenNotes={() => setIsNotesOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenLocationList={() => setIsLocationListOpen(true)}
          onOpenBin={() => setIsBinModalOpen(true)}
          onOpenAi={() => setIsAiModalOpen(prev => !prev)}
          isHealthBreakEnabled={isHealthBreakEnabled}
          setIsHealthBreakEnabled={setIsHealthBreakEnabled}
          isOffline={isOffline}
          canInstall={!!deferredPrompt}
          onInstallApp={handleInstallApp}
          onClearAll={handleClearAll}
          onOpen={handleOpenDOCX}
          projects={projects}
          onOpenRecent={handleOpenRecentProject}
          onExportPDF={handleExportPDF}
          onExportDOCX={handleExportDOCX}
          onExportRTF={handleExportMD}
          onExportFDX={handleExportFDX}
          onExportFountain={handleExportFountain}
          onExportCeltx={handleExportCeltx}
          onExportKitsp={handleExportKitsp}
          onOpenFindReplace={() => setIsFindReplaceOpen(true)}
          onOpenDialogueTuner={() => setIsDialogueTunerOpen(true)}
          onOpenCharacterMatrix={() => setIsCharacterMatrixOpen(true)}
          onOpenActorSides={() => setIsActorSidesOpen(true)}
          onOpenSmartRename={() => setIsSmartRenameOpen(true)}
          onOpenTableReadModal={() => setIsTableReadModalOpen(true)}
          onOpenStoryBeats={() => setIsStoryBeatsOpen(true)}
          onOpenDramaticArc={() => setIsDramaticArcOpen(true)}
          isTableReadMode={isTableReadMode}
          setIsTableReadMode={setIsTableReadMode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onToggleDualDialogue={handleToggleDualDialogue}
          isGoogleAuth={isGoogleAuth}
          isSavingToDrive={isSavingToDrive}
          onGoogleLogin={handleGoogleLogin}
          onGoogleLogout={handleGoogleLogout}
          onSaveToDrive={handleSaveToDrive}
          driveFileId={driveFileId}
          isListening={isListening}
          toggleListening={() => setIsListening(!isListening)}
          isRevisionMode={isRevisionMode}
          setIsRevisionMode={setIsRevisionMode}
          activeRevisionColor={activeRevisionColor}
          setActiveRevisionColor={setActiveRevisionColor}
          activeRevisionDate={activeRevisionDate}
          setActiveRevisionDate={setActiveRevisionDate}
          printRevisionMarks={printRevisionMarks}
          setPrintRevisionMarks={setPrintRevisionMarks}
          onClearRevisionColors={handleClearRevisionColors}
          isOutlineEditorOpen={isOutlineEditorOpen}
          onToggleOutlineEditor={() => setIsOutlineEditorOpen(prev => !prev)}
          onOpenFontPicker={() => setIsFontPickerOpen(true)}
          hasCoverPage={!!coverPage}
          onToggleCoverPage={handleToggleCoverPage}
          isToolbarVisible={isToolbarVisible}
          onToggleToolbar={handleToggleToolbar}
          isPagesLocked={isPagesLocked}
          onTogglePageLock={handleTogglePageLock}
          isSplitScreen={isSplitScreen}
          setIsSplitScreen={setIsSplitScreen}
          splitScreenTab={splitScreenTab}
          setSplitScreenTab={handleSetSplitScreenTab}
          isTypewriterMode={isTypewriterMode}
          setIsTypewriterMode={setIsTypewriterMode}
          isFocusDimming={isFocusDimming}
          setIsFocusDimming={setIsFocusDimming}
          onOpenCollaboration={() => setIsCollaborationModalOpen(true)}
          isCollaborationActive={Boolean(collaborationSession?.isConnected)}
          activeCollaboratorsCount={(collaborationSession?.collaborators || []).length}
          pendingRequestsCount={(collaborationSession?.pendingRequests || []).length}
          collaborators={collaborationSession?.collaborators || []}
          remotePresences={remotePresences}
        />
      )}
      
      <GuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        theme={theme} 
      />

      <CharacterBibleModal
        isOpen={isCharacterBibleOpen}
        onClose={() => setIsCharacterBibleOpen(false)}
        theme={theme}
      />

      <StoryBibleModal
        isOpen={isStoryBibleOpen}
        onClose={() => setIsStoryBibleOpen(false)}
        theme={theme}
      />

      <NotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        theme={theme}
      />

      <CharacterStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        elements={elements}
        theme={theme}
        projectName={coverPage?.title || "İsimsiz Senaryo"}
      />

      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="fixed top-4 right-4 z-[999] p-3 rounded-full bg-slate-800/20 hover:bg-slate-800/80 text-slate-400 hover:text-white transition-all opacity-0 hover:opacity-100 group"
          title="Odaklanma Modundan Çık (ESC)"
        >
          <div className="absolute inset-0 w-full h-full p-8 -m-4 opacity-0 z-[-1] opacity-100" />
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minimize"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
        </button>
      )}

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex flex-1 overflow-hidden flex-row">
          {!isZenMode && (
            <Sidebar 
              elements={numberedElements} 
              setFocusedId={setFocusedId} 
              theme={theme} 
              onReorderScenesArray={handleReorderScenesArray}
              onRemoveElement={(id: string) => handleRemoveElement(id, id)}
            />
          )}

          {/* Dikey Outline Editor (Sol Yan Panel Modu) */}
          {!isZenMode && isOutlineEditorOpen && outlineOrientation === 'vertical' && (
            <OutlineEditor
              isOpen={isOutlineEditorOpen}
              onClose={() => setIsOutlineEditorOpen(false)}
              orientation="vertical"
              onToggleOrientation={handleToggleOutlineOrientation}
              elements={numberedElements}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              theme={theme}
              selectedTemplateId={selectedStoryTemplateId}
              onSelectTemplate={setSelectedStoryTemplateId}
              onOpenStoryBeats={() => setIsStoryBeatsOpen(true)}
              beatAnswers={storyBeatAnswers}
              targetPageCount={targetPageCount}
            />
          )}

          {/* Çift Panel (Split-Screen Companion) - Sol Konum */}
          {!isZenMode && isSplitScreen && splitScreenPosition === 'left' && (
            <SplitCompanionPanel
              isOpen={isSplitScreen}
              onClose={() => setIsSplitScreen(false)}
              activeTab={splitScreenTab}
              setActiveTab={handleSetSplitScreenTab}
              position="left"
              onTogglePosition={handleToggleSplitScreenPosition}
              width={splitScreenWidth}
              onWidthChange={handleSplitScreenWidthChange}
              theme={theme}
              elements={numberedElements}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              onUpdateElement={handleUpdateElement}
              onReorderScenesArray={handleReorderScenesArray}
              selectedTemplateId={selectedStoryTemplateId}
              onSelectTemplate={setSelectedStoryTemplateId}
              beatAnswers={storyBeatAnswers}
              onUpdateBeatAnswer={handleSaveBeatAnswer}
              targetPageCount={targetPageCount}
            />
          )}

          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            {/* Yatay Outline Editor (Üst Cetvel Modu) */}
            {!isZenMode && isOutlineEditorOpen && outlineOrientation === 'horizontal' && (
              <OutlineEditor
                isOpen={isOutlineEditorOpen}
                onClose={() => setIsOutlineEditorOpen(false)}
                orientation="horizontal"
                onToggleOrientation={handleToggleOutlineOrientation}
                elements={numberedElements}
                focusedId={focusedId}
                setFocusedId={setFocusedId}
                theme={theme}
                selectedTemplateId={selectedStoryTemplateId}
                onSelectTemplate={setSelectedStoryTemplateId}
                onOpenStoryBeats={() => setIsStoryBeatsOpen(true)}
                beatAnswers={storyBeatAnswers}
                targetPageCount={targetPageCount}
              />
            )}
            {viewMode === 'cards' ? (
              <Corkboard 
                elements={numberedElements}
                onReorderScenesArray={handleReorderScenesArray}
                onUpdateSceneText={handleUpdateSceneText}
                theme={theme}
                setFocusedId={setFocusedId}
                setViewMode={setViewMode}
                onRemoveElement={(id: string) => handleRemoveElement(id, id)}
                onUpdateElement={handleUpdateElement}
              />
            ) : (
              <Editor 
                elements={numberedElements} 
                format={format} 
                onChange={handleElementChange}
                onAdd={handleAddElement}
                onRemove={handleRemoveElement}
                onRemoveMultiple={handleRemoveElements}
                onChangeType={handleChangeType}
                onUpdateElement={handleUpdateElement}
                onPaste={handlePaste}
                onMoveToBin={handleMoveToBin}
                focusedId={focusedId}
                setFocusedId={setFocusedId}
                characters={characters}
                scenes={scenes}
                theme={theme}
                fontFamily={fontFamily}
                fontSize={fontSize}
                fontColor={fontColor}
                zoom={zoom}
                coverPage={coverPage}
                setCoverPage={setCoverPage}
                isRevisionMode={isRevisionMode}
                activeRevisionColor={activeRevisionColor}
                activeRevisionDate={activeRevisionDate}
                printRevisionMarks={printRevisionMarks}
                currentElementType={focusedElement?.type || 'action'}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                handleStyleChange={handleStyleChange}
                isDualDialogue={!!focusedElement?.dualPosition}
                onToggleDualDialogue={handleToggleDualDialogue}
                isTableReadMode={isTableReadMode}
                characterColors={characterColors}
                spotlightCharacter={spotlightCharacter}
                onOpenTableReadModal={() => setIsTableReadModalOpen(true)}
                onOpenFontPicker={() => setIsFontPickerOpen(true)}
                isTypewriterMode={isTypewriterMode}
                onToggleTypewriterMode={handleToggleTypewriterMode}
                isFocusDimming={isFocusDimming}
                onToggleFocusDimming={handleToggleFocusDimming}
                isToolbarVisible={isToolbarVisible}
                onToggleToolbar={handleToggleToolbar}
                isPagesLocked={isPagesLocked}
                lockedAnchors={lockedAnchors}
                onPageBreaksChange={(breaks) => { lastPageBreaksRef.current = breaks; }}
                remotePresences={remotePresences}
              />
            )}
          </div>

          {/* Çift Panel (Split-Screen Companion) - Sağ Konum */}
          {!isZenMode && isSplitScreen && splitScreenPosition === 'right' && (
            <SplitCompanionPanel
              isOpen={isSplitScreen}
              onClose={() => setIsSplitScreen(false)}
              activeTab={splitScreenTab}
              setActiveTab={handleSetSplitScreenTab}
              position="right"
              onTogglePosition={handleToggleSplitScreenPosition}
              width={splitScreenWidth}
              onWidthChange={handleSplitScreenWidthChange}
              theme={theme}
              elements={numberedElements}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              onUpdateElement={handleUpdateElement}
              onReorderScenesArray={handleReorderScenesArray}
              selectedTemplateId={selectedStoryTemplateId}
              onSelectTemplate={setSelectedStoryTemplateId}
              beatAnswers={storyBeatAnswers}
              onUpdateBeatAnswer={handleSaveBeatAnswer}
              targetPageCount={targetPageCount}
            />
          )}

          {/* Right Docked AI Assistant Panel */}
          {!isZenMode && isAiModalOpen && (
            <AiAssistantPanel
              isOpen={isAiModalOpen}
              onClose={() => setIsAiModalOpen(false)}
              theme={theme}
              elements={numberedElements}
              focusedElement={focusedElement || null}
              onInsertElement={handleInsertAiElement}
              onUpdateFocusedElement={handleUpdateFocusedElementContent}
            />
          )}
        </div>
        {!isZenMode && activeUiMode === 'tablet' && (
          <div className="block shrink-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 z-50">
            <TabletToolbar 
              format={format} 
              setFormat={setFormat}
              wordCount={wordCount}
              onClearAll={handleClearAll}
              onOpen={handleOpenDOCX}
              projects={projects}
              onOpenRecent={handleOpenRecentProject}
              onExportPDF={handleExportPDF}
              onExportDOCX={handleExportDOCX}
              onExportRTF={handleExportMD}
              onExportFDX={handleExportFDX}
              onExportFountain={handleExportFountain}
              onExportCeltx={handleExportCeltx}
              onExportKitsp={handleExportKitsp}
              onOpenFindReplace={() => setIsFindReplaceOpen(true)}
              onOpenSmartRename={() => setIsSmartRenameOpen(true)}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              isGoogleAuth={isGoogleAuth}
              isSavingToDrive={isSavingToDrive}
              onGoogleLogin={handleGoogleLogin}
              onGoogleLogout={handleGoogleLogout}
              onSaveToDrive={handleSaveToDrive}
              driveFileId={driveFileId}
              isListening={isListening}
              toggleListening={() => setIsListening(!isListening)}
              changeCurrentElementType={changeCurrentElementType}
              isDualDialogue={!!focusedElement?.dualPosition}
              onToggleDualDialogue={handleToggleDualDialogue}
              theme={theme}
              setTheme={setTheme}
              onOpenCharacterBible={() => setIsCharacterBibleOpen(true)}
              onOpenStoryBible={() => setIsStoryBibleOpen(true)}
              onOpenNotes={() => setIsNotesOpen(true)}
              onOpenStats={() => setIsStatsOpen(true)}
              onOpenLocationList={() => setIsLocationListOpen(true)}
              onOpenBin={() => setIsBinModalOpen(true)}
              onOpenAi={() => setIsAiModalOpen(prev => !prev)}
              onOpenGuide={() => setIsGuideOpen(true)}
              onOpenDramaticArc={() => setIsDramaticArcOpen(true)}
              onOpenStoryBeats={() => setIsStoryBeatsOpen(true)}
              onOpenCharacterMatrix={() => setIsCharacterMatrixOpen(true)}
              onOpenActorSides={() => setIsActorSidesOpen(true)}
              onOpenDialogueTuner={() => setIsDialogueTunerOpen(true)}
              onOpenTableReadModal={() => setIsTableReadModalOpen(true)}
              isTableReadMode={isTableReadMode}
              onOpenFontPicker={() => setIsFontPickerOpen(true)}
              hasCoverPage={!!coverPage}
              onToggleCoverPage={handleToggleCoverPage}
              isHealthBreakEnabled={isHealthBreakEnabled}
              setIsHealthBreakEnabled={setIsHealthBreakEnabled}
              isOffline={isOffline}
              canInstall={!!deferredPrompt}
              onInstallApp={handleInstallApp}
              isRevisionMode={isRevisionMode}
              setIsRevisionMode={setIsRevisionMode}
              activeRevisionColor={activeRevisionColor}
              setActiveRevisionColor={setActiveRevisionColor}
              activeRevisionDate={activeRevisionDate}
              setActiveRevisionDate={setActiveRevisionDate}
              printRevisionMarks={printRevisionMarks}
              setPrintRevisionMarks={setPrintRevisionMarks}
              onClearRevisionColors={handleClearRevisionColors}
              isPagesLocked={isPagesLocked}
              onTogglePageLock={handleTogglePageLock}
              isOutlineEditorOpen={isOutlineEditorOpen}
              onToggleOutlineEditor={() => setIsOutlineEditorOpen(prev => !prev)}
              isSplitScreen={isSplitScreen}
              onToggleSplitScreen={handleToggleSplitScreen}
              isTypewriterMode={isTypewriterMode}
              onToggleTypewriterMode={handleToggleTypewriterMode}
              isFocusDimming={isFocusDimming}
              onToggleFocusDimming={handleToggleFocusDimming}
              onOpenCollaboration={() => setIsCollaborationModalOpen(true)}
              isCollaborationActive={Boolean(collaborationSession?.isConnected)}
              pendingRequestsCount={(collaborationSession?.pendingRequests || []).length}
              collaborators={collaborationSession?.collaborators || []}
              remotePresences={remotePresences}
            />
          </div>
        )}
      </div>

      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        onReplaceAll={handleReplaceAll}
        onReplaceOne={handleReplaceOne}
        onFindNext={handleFindNext}
        theme={theme}
      />

      <DialogueTunerModal
        isOpen={isDialogueTunerOpen}
        onClose={() => setIsDialogueTunerOpen(false)}
        elements={numberedElements}
        onChangeElement={handleElementChange}
        onJumpToElement={handleJumpToElementFromModal}
        theme={theme}
      />

      <ActorSidesModal
        isOpen={isActorSidesOpen}
        onClose={() => setIsActorSidesOpen(false)}
        elements={numberedElements}
        screenplayTitle={coverPage?.title || 'SENARYO'}
        format={format}
        theme={theme}
        onJumpToScene={handleJumpToElementFromModal}
      />

      <CharacterMatrixModal
        isOpen={isCharacterMatrixOpen}
        onClose={() => setIsCharacterMatrixOpen(false)}
        elements={numberedElements}
        screenplayTitle={coverPage?.title || 'SENARYO'}
        theme={theme}
        onJumpToScene={handleJumpToElementFromModal}
      />

      <SmartRenameModal
        isOpen={isSmartRenameOpen}
        onClose={() => setIsSmartRenameOpen(false)}
        elements={elements}
        onApplyRename={handleApplySmartRename}
        theme={theme}
        characterBibleNames={characters}
      />

      <TableReadModal
        isOpen={isTableReadModalOpen}
        onClose={() => setIsTableReadModalOpen(false)}
        elements={numberedElements}
        isTableReadMode={isTableReadMode}
        setIsTableReadMode={setIsTableReadMode}
        characterColors={characterColors}
        setCharacterColors={setCharacterColors}
        spotlightCharacter={spotlightCharacter}
        setSpotlightCharacter={setSpotlightCharacter}
        theme={theme}
      />

      <StoryBeatsModal
        isOpen={isStoryBeatsOpen}
        onClose={() => setIsStoryBeatsOpen(false)}
        elements={numberedElements}
        selectedTemplateId={selectedStoryTemplateId}
        onSelectTemplate={setSelectedStoryTemplateId}
        beatAnswers={storyBeatAnswers}
        onSaveBeatAnswer={handleSaveBeatAnswer}
        targetPageCount={targetPageCount}
        onUpdateTargetPageCount={setTargetPageCount}
        theme={theme}
      />

      <DramaticArcModal
        isOpen={isDramaticArcOpen}
        onClose={() => setIsDramaticArcOpen(false)}
        elements={numberedElements}
        onUpdateElementTension={handleUpdateSceneTension}
        onUpdateSceneArcData={handleUpdateSceneArcData}
        onJumpToScene={handleJumpToElementFromModal}
        onOpenInSplitPanel={() => {
          setIsSplitScreen(true);
          setSplitScreenTab('tension');
          safeStorage.setItem('scriptHive_isSplitScreen', 'true');
          safeStorage.setItem('scriptHive_splitScreenTab', 'tension');
        }}
        theme={theme}
      />

      <LocationListModal
        isOpen={isLocationListOpen}
        onClose={() => setIsLocationListOpen(false)}
        elements={numberedElements}
        theme={theme}
      />

      <BinModal
        isOpen={isBinModalOpen}
        onClose={() => setIsBinModalOpen(false)}
        bin={bin}
        setBin={setBin}
        onRestore={handleRestoreBinItem}
        theme={theme}
      />

      <FontPickerModal
        isOpen={isFontPickerOpen}
        onClose={() => setIsFontPickerOpen(false)}
        theme={theme}
        currentFont={fontFamily}
        onSelectFont={handleFontSelected}
        hasSelection={!!focusedId}
      />

      {isBreakModalOpen && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center ${theme === 'dark' ? 'bg-black/80' : 'bg-slate-800/60'} backdrop-blur-md p-4`}>
          <div className={`${theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-[#fdfcf7] border-[#dcd6cc]'} w-full max-w-md rounded-2xl shadow-2xl p-8 border text-center animate-in fade-in zoom-in-95 duration-300`}>
            <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coffee"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg>
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sağlıklı Mola Zamanı!</h2>
            <p className={`mb-8 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              30 dakikadır aralıksız çalışıyorsunuz. Gözlerinizi dinlendirmek ve biraz hareket etmek için 5 dakikalık bir mola vermeye ne dersiniz?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setIsBreakModalOpen(false); setBreakTimer(30 * 60); }} 
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20"
              >
                Tamam, Mola Veriyorum
              </button>
              <button 
                onClick={() => { setIsBreakModalOpen(false); setBreakTimer(30 * 60); }} 
                className={`w-full py-3 rounded-xl font-medium transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                Çalışmaya Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Host Approval Toast */}
      {collaborationSession?.isHost && (collaborationSession.pendingRequests || []).length > 0 && !isCollaborationModalOpen && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[99] animate-in fade-in slide-in-from-top-4 duration-300 bg-[#1a1f25] border border-amber-500/50 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs backdrop-blur-md font-sans">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-medium text-slate-200">
            👥 <strong className="text-amber-300">{collaborationSession.pendingRequests[0].name}</strong> senaryoya katılmak istiyor.
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => handleAcceptCollabRequest(collaborationSession.pendingRequests[0].id, 'editor')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Onayla
            </button>
            <button
              onClick={() => handleRejectCollabRequest(collaborationSession.pendingRequests[0].id)}
              className="px-2.5 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
            >
              Reddet
            </button>
          </div>
        </div>
      )}

      <CollaborationModal
        isOpen={isCollaborationModalOpen}
        onClose={() => setIsCollaborationModalOpen(false)}
        session={collaborationSession}
        onUpdateSession={handleUpdateCollabSession}
        onStartSession={handleStartCollabSession}
        onJoinSession={handleJoinCollabSession}
        onLeaveSession={handleLeaveCollabSession}
        onAcceptRequest={handleAcceptCollabRequest}
        onRejectRequest={handleRejectCollabRequest}
        onRemoveCollaborator={handleRemoveCollaborator}
        onToggleSimulatedCoWriter={handleToggleSimulatedCoWriter}
        isSimulating={isSimulatingCoWriter}
        theme={theme}
      />
    </div>
  );
}
