import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Tag, Columns2, Sliders, Lock, ChevronLeft, ChevronRight, Plus, Trash2, Check, Clapperboard, ChevronDown } from 'lucide-react';
import { ScreenplayElement, ScreenplayFormat, ElementType, CoverPageData, RenderGroupItem, groupElementsForRender, SplitLimitData, splitHtmlIntoSlices, joinSlices, formatPageLabel, getRevisionHeaderText } from '../types';
import Toolbar from './Toolbar';
import { TABLE_READ_PALETTE } from './TableReadModal';

interface EditorProps {
  elements: ScreenplayElement[];
  format: ScreenplayFormat;
  onChange: (id: string, content: string) => void;
  onAdd: (afterId: string, type: ElementType, initialContent?: string) => void;
  onRemove: (id: string, focusId: string) => void;
  onRemoveMultiple: (ids: string[], focusId: string) => void;
  onChangeType: (id: string, type: ElementType) => void;
  onUpdateElement?: (id: string, updates: Partial<ScreenplayElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>, id: string, index: number) => void;
  onMoveToBin?: (id: string, asAlternative?: boolean) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  characters: string[];
  scenes: string[];
  theme: 'dark' | 'light';
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  zoom: number;
  coverPage?: CoverPageData;
  setCoverPage?: (data: CoverPageData) => void;
  isRevisionMode?: boolean;
  activeRevisionColor?: 'white' | 'blue' | 'pink' | 'yellow' | 'green' | 'goldenrod';
  activeRevisionDate?: string;
  printRevisionMarks?: boolean;
  currentElementType?: ElementType;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  handleStyleChange?: (prop: 'fontFamily' | 'fontSize' | 'fontColor', value: any) => void;
  isDualDialogue?: boolean;
  onToggleDualDialogue?: (id?: string) => void;
  isTableReadMode?: boolean;
  characterColors?: Record<string, string>;
  spotlightCharacter?: string | null;
  onOpenTableReadModal?: () => void;
  onOpenFontPicker?: () => void;
  isTypewriterMode?: boolean;
  onToggleTypewriterMode?: () => void;
  isFocusDimming?: boolean;
  onToggleFocusDimming?: () => void;
  isToolbarVisible?: boolean;
  onToggleToolbar?: () => void;
  isPagesLocked?: boolean;
  lockedAnchors?: { elementId: string; pageNumber: number }[];
  onPageCountChange?: (count: number) => void;
  onPageBreaksChange?: (breaks: Record<string, { page: number; pageLabel?: string }>) => void;
  remotePresences?: Record<string, { senderId: string; senderName: string; senderColor: string; status: 'typing' | 'idle' }>;
}

function getTextNodeAndOffset(root: Node, targetOffset: number): { node: Node; offset: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let currentOffset = 0;
  let textNode: Node | null = walker.nextNode();

  while (textNode) {
    const textLength = textNode.textContent?.length || 0;
    if (currentOffset + textLength >= targetOffset) {
      return { node: textNode, offset: targetOffset - currentOffset };
    }
    currentOffset += textLength;
    textNode = walker.nextNode();
  }

  // If target offset matches total length, pick last available text node
  if (currentOffset === targetOffset && currentOffset > 0) {
    const lastWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let lastNode: Node | null = null;
    let n = lastWalker.nextNode();
    while (n) {
      lastNode = n;
      n = lastWalker.nextNode();
    }
    if (lastNode) {
      return { node: lastNode, offset: lastNode.textContent?.length || 0 };
    }
  }

  return null;
}

function createRangeFromOffsets(root: Node, startOffset: number, endOffset: number): Range | null {
  const startObj = getTextNodeAndOffset(root, startOffset);
  const endObj = getTextNodeAndOffset(root, endOffset);

  if (!startObj || !endObj) return null;

  try {
    const range = document.createRange();
    range.setStart(startObj.node, startObj.offset);
    range.setEnd(endObj.node, endObj.offset);
    return range;
  } catch (err) {
    return null;
  }
}

function getCharacterOffsets(root: Node, range: Range): { start: number; end: number; text: string } | null {
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let currentOffset = 0;
  let start = -1;
  let end = -1;
  let node: Node | null = walker.nextNode();

  while (node) {
    const len = node.textContent?.length || 0;
    if (start === -1 && node === range.startContainer) {
      start = currentOffset + range.startOffset;
    }
    if (end === -1 && node === range.endContainer) {
      end = currentOffset + range.endOffset;
    }
    currentOffset += len;
    node = walker.nextNode();
  }

  if (start === -1 || end === -1) {
    try {
      const preStartRange = document.createRange();
      preStartRange.selectNodeContents(root);
      preStartRange.setEnd(range.startContainer, range.startOffset);
      start = preStartRange.toString().length;

      const preEndRange = document.createRange();
      preEndRange.selectNodeContents(root);
      preEndRange.setEnd(range.endContainer, range.endOffset);
      end = preEndRange.toString().length;
    } catch (e) {
      return null;
    }
  }

  return { start, end, text: range.toString() };
}

function normalizeColor(c?: string): string {
  if (!c) return '';
  if (c.startsWith('#')) return c.toLowerCase();
  const rgbMatch = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toLowerCase();
  }
  return c.toLowerCase();
}

interface FormattedChar {
  type: 'char' | 'br';
  ch: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
}

function extractFormattedChars(root: HTMLElement): FormattedChar[] {
  const result: FormattedChar[] = [];

  function walk(node: Node, inherited: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
  }) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      for (let i = 0; i < text.length; i++) {
        result.push({
          type: 'char',
          ch: text[i],
          bold: inherited.bold,
          italic: inherited.italic,
          underline: inherited.underline,
          fontFamily: inherited.fontFamily,
          fontSize: inherited.fontSize,
          fontColor: inherited.fontColor
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toUpperCase();

      if (tag === 'BR') {
        result.push({
          type: 'br',
          ch: '\n',
          bold: false,
          italic: false,
          underline: false
        });
        return;
      }

      const nextInherited = { ...inherited };

      if (tag === 'B' || tag === 'STRONG' || el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight, 10) >= 700) {
        nextInherited.bold = true;
      }
      if (tag === 'I' || tag === 'EM' || el.style.fontStyle === 'italic') {
        nextInherited.italic = true;
      }
      if (tag === 'U' || el.style.textDecoration?.includes('underline')) {
        nextInherited.underline = true;
      }

      const styleFamily = el.style.fontFamily || el.getAttribute('face');
      if (styleFamily) {
        nextInherited.fontFamily = styleFamily;
      }

      const styleSize = el.style.fontSize;
      if (styleSize) {
        const parsed = parseFloat(styleSize);
        if (!isNaN(parsed)) {
          nextInherited.fontSize = Math.round(parsed);
        }
      }

      const styleColor = el.style.color || el.getAttribute('color');
      if (styleColor) {
        const norm = normalizeColor(styleColor);
        if (norm) {
          nextInherited.fontColor = norm;
        }
      }

      for (let i = 0; i < el.childNodes.length; i++) {
        walk(el.childNodes[i], nextInherited);
      }
    }
  }

  const baseInherited = {
    bold: false,
    italic: false,
    underline: false
  };

  for (let i = 0; i < root.childNodes.length; i++) {
    walk(root.childNodes[i], baseInherited);
  }

  return result;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFormattedCharsToHtml(chars: FormattedChar[]): string {
  if (chars.length === 0) return '';

  interface Run {
    type: 'char' | 'br';
    text: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
  }

  const runs: Run[] = [];
  let currentRun: Run | null = null;

  for (const item of chars) {
    if (item.type === 'br') {
      if (currentRun) {
        runs.push(currentRun);
        currentRun = null;
      }
      runs.push({
        type: 'br',
        text: '',
        bold: false,
        italic: false,
        underline: false
      });
      continue;
    }

    if (
      currentRun &&
      currentRun.type === 'char' &&
      currentRun.bold === item.bold &&
      currentRun.italic === item.italic &&
      currentRun.underline === item.underline &&
      currentRun.fontFamily === item.fontFamily &&
      currentRun.fontSize === item.fontSize &&
      currentRun.fontColor === item.fontColor
    ) {
      currentRun.text += item.ch;
    } else {
      if (currentRun) runs.push(currentRun);
      currentRun = {
        type: 'char',
        text: item.ch,
        bold: item.bold,
        italic: item.italic,
        underline: item.underline,
        fontFamily: item.fontFamily,
        fontSize: item.fontSize,
        fontColor: item.fontColor
      };
    }
  }
  if (currentRun) runs.push(currentRun);

  return runs.map(run => {
    if (run.type === 'br') return '<br>';

    let text = escapeHtml(run.text);
    if (run.bold) text = `<b>${text}</b>`;
    if (run.italic) text = `<i>${text}</i>`;
    if (run.underline) text = `<u>${text}</u>`;

    const styles: string[] = [];
    if (run.fontFamily) styles.push(`font-family: ${run.fontFamily}`);
    if (run.fontSize) styles.push(`font-size: ${run.fontSize}pt`);
    if (run.fontColor) styles.push(`color: ${run.fontColor}`);

    if (styles.length > 0) {
      return `<span style="${styles.join('; ')}">${text}</span>`;
    }
    return text;
  }).join('');
}

function cleanAllColorsFromHtml(html: string): string {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const chars = extractFormattedChars(tempDiv);
  chars.forEach(c => {
    c.fontColor = undefined;
  });
  return renderFormattedCharsToHtml(chars);
}

function getEffectiveSelectionStyles(root: HTMLElement, range?: Range | null): {
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
} {
  let targetNode: Node | null = null;
  if (range) {
    targetNode = range.startContainer;
  } else {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      targetNode = sel.getRangeAt(0).startContainer;
    }
  }

  if (!targetNode) return {};

  let currentElem: HTMLElement | null = 
    targetNode.nodeType === Node.ELEMENT_NODE 
      ? (targetNode as HTMLElement) 
      : targetNode.parentElement;

  let foundFamily: string | undefined;
  let foundSize: number | undefined;
  let foundColor: string | undefined;

  while (currentElem && root.contains(currentElem)) {
    if (currentElem === root) break;
    
    if (!foundFamily && currentElem.style.fontFamily) {
      foundFamily = currentElem.style.fontFamily;
    }
    if (foundSize === undefined && currentElem.style.fontSize) {
      const parsed = parseFloat(currentElem.style.fontSize);
      if (!isNaN(parsed)) foundSize = Math.round(parsed);
    }
    if (!foundColor && currentElem.style.color) {
      foundColor = currentElem.style.color;
    }
    currentElem = currentElem.parentElement;
  }

  return {
    fontFamily: foundFamily,
    fontSize: foundSize,
    fontColor: foundColor
  };
}



export default function Editor({ 
  elements, format, onChange, onAdd, onRemove, onRemoveMultiple, onChangeType, onUpdateElement, onPaste, onMoveToBin,
  focusedId, setFocusedId, characters, scenes, theme, fontFamily, fontSize, fontColor, zoom,
  coverPage, setCoverPage, isRevisionMode = false, activeRevisionColor = 'white', activeRevisionDate, printRevisionMarks = true,
  currentElementType = 'action', onUndo, onRedo, canUndo = false, canRedo = false, handleStyleChange,
  isDualDialogue, onToggleDualDialogue,
  isTableReadMode = false, characterColors = {}, spotlightCharacter = null, onOpenTableReadModal,
  onOpenFontPicker,
  isTypewriterMode = false, onToggleTypewriterMode,
  isFocusDimming = false, onToggleFocusDimming,
  isToolbarVisible = true, onToggleToolbar,
  isPagesLocked = false, lockedAnchors = [], onPageCountChange, onPageBreaksChange,
  remotePresences
}: EditorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const wrapperRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [numPages, setNumPages] = useState(1);
  const [pageBreaks, setPageBreaks] = useState<Record<string, { page: number; pageLabel?: string; isCoverBreak?: boolean; isLocked?: boolean; isMore?: boolean; jump?: number }>>({});
  const [splitLimits, setSplitLimits] = useState<Record<string, SplitLimitData>>({});
  const focusedSliceIdRef = useRef<string | null>(null);
  const prevFocusedIdRef = useRef<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartId, setDragStartId] = useState<string | null>(null);
  const [dismissedSuggestionsId, setDismissedSuggestionsId] = useState<string | null>(null);
  const [activeColorMenuId, setActiveColorMenuId] = useState<string | null>(null);
  const savedSelectionRef = useRef<{ elementId: string; start: number; end: number; text: string } | null>(null);
  const [selectionStyles, setSelectionStyles] = useState<{
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
  }>({});

  // Typewriter Scrolling (Daktilo Kaydırma) Effect
  useEffect(() => {
    if (isTypewriterMode && focusedId && scrollRef.current) {
      const activeNode = wrapperRefs.current[focusedId] || inputRefs.current[focusedId];
      if (activeNode) {
        const container = scrollRef.current;
        const containerRect = container.getBoundingClientRect();
        const elemRect = activeNode.getBoundingClientRect();
        
        const currentScroll = container.scrollTop;
        const elemRelativeTop = elemRect.top - containerRect.top + currentScroll;
        const targetScroll = elemRelativeTop - (container.clientHeight * 0.44) + (elemRect.height / 2);
        
        container.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }
  }, [focusedId, isTypewriterMode]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let containerNode: Node | null = range.commonAncestorContainer;
        if (containerNode.nodeType === Node.TEXT_NODE) {
          containerNode = containerNode.parentElement;
        }
        const elementDiv = (containerNode as HTMLElement)?.closest?.('[data-element-id]') as HTMLElement | null;
        if (elementDiv) {
          const elId = elementDiv.getAttribute('data-element-id') || '';
          const offsets = getCharacterOffsets(elementDiv, range);
          if (offsets && offsets.start < offsets.end && offsets.text.length > 0) {
            savedSelectionRef.current = {
              elementId: elId,
              start: offsets.start,
              end: offsets.end,
              text: offsets.text
            };
          } else if (sel.isCollapsed) {
            savedSelectionRef.current = null;
          }

          const eff = getEffectiveSelectionStyles(elementDiv, range);
          setSelectionStyles(eff);
        }
      }
    };

    const handleApplyFontFamilyEvent = (e: any) => {
      if (e.detail) {
        handleToolbarStyleChange('fontFamily', e.detail);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('scripthive:applyFontFamily', handleApplyFontFamilyEvent);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('scripthive:applyFontFamily', handleApplyFontFamilyEvent);
    };
  }, [focusedId]);

  const TAG_COLORS = [
    { label: 'Kırmızı', value: '#ef4444' },
    { label: 'Turuncu', value: '#f97316' },
    { label: 'Sarı', value: '#eab308' },
    { label: 'Yeşil', value: '#22c55e' },
    { label: 'Mavi', value: '#3b82f6' },
    { label: 'Mor', value: '#a855f7' },
    { label: 'Pembe', value: '#ec4899' },
    { label: 'Hiçbiri', value: '' },
  ];

  const speakingCharacters = useMemo(() => {
    const map: Record<string, string> = {};
    let lastChar = '';
    elements.forEach(el => {
      if (el.type === 'character') lastChar = el.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (el.type === 'dialogue' || el.type === 'parenthetical') map[el.id] = lastChar;
    });
    return map;
  }, [elements]);

  useEffect(() => {
    setSuggestionIndex(0);
    setDismissedSuggestionsId(null);
  }, [focusedId]);

  useEffect(() => {
    try {
      document.execCommand('defaultParagraphSeparator', false, 'br');
    } catch (e) {}
    
    const handleWindowMouseUp = () => {
      setIsDragging(false);
      setDragStartId(null);
    };
    window.addEventListener('mouseup', handleWindowMouseUp);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        const isInput = activeTag === 'input' || activeTag === 'textarea';
        if (isInput) return;

        const isInsideEditor = document.activeElement?.closest('#print-area-container');
        if (!isInsideEditor || selectedIds.length > 0) {
          e.preventDefault();
          setSelectedIds(elements.map(el => el.id));
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    const handleWindowClick = () => {
      setActiveColorMenuId(null);
    };
    window.addEventListener('click', handleWindowClick);

    if (document.fonts) {
      document.fonts.ready.then(() => {
        setFontLoaded(true);
      });
    }

    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [elements, selectedIds]);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.shiftKey && focusedId) {
      const startIndex = elements.findIndex(el => el.id === focusedId);
      const currentIndex = elements.findIndex(el => el.id === id);
      if (startIndex !== -1 && currentIndex !== -1) {
        const min = Math.min(startIndex, currentIndex);
        const max = Math.max(startIndex, currentIndex);
        const newSelectedIds = elements.slice(min, max + 1).map(el => el.id);
        setSelectedIds(newSelectedIds);
      }
    } else {
      setIsDragging(true);
      setDragStartId(id);
      setSelectedIds([]);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, id: string) => {
    if (isDragging && dragStartId) {
      const startIndex = elements.findIndex(el => el.id === dragStartId);
      const currentIndex = elements.findIndex(el => el.id === id);
      if (startIndex !== -1 && currentIndex !== -1) {
        const min = Math.min(startIndex, currentIndex);
        const max = Math.max(startIndex, currentIndex);
        const newSelectedIds = elements.slice(min, max + 1).map(el => el.id);
        setSelectedIds(newSelectedIds);
      }
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    setIsDragging(false);
    setDragStartId(null);
  };

  useEffect(() => {
    if (!focusedId) return;
    if (focusedId === prevFocusedIdRef.current) return;
    prevFocusedIdRef.current = focusedId;

    let timeoutId: any = null;
    let animId: any = null;

    const performFocus = () => {
      const el = inputRefs.current[focusedId];
      if (el) {
        if (document.activeElement !== el) {
          el.focus();
        }
        if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        return true;
      }
      return false;
    };

    animId = requestAnimationFrame(() => {
      performFocus();
      timeoutId = setTimeout(performFocus, 20);
    });

    const scrollTimeout = setTimeout(() => {
      const wrapper = wrapperRefs.current[focusedId];
      const container = scrollRef.current;
      if (wrapper && container) {
        const rect = wrapper.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.bottom > containerRect.bottom - 50) {
          container.scrollBy({ top: rect.bottom - containerRect.bottom + 100, behavior: 'smooth' });
        } else if (rect.top < containerRect.top + 50) {
          container.scrollBy({ top: rect.top - containerRect.top - 100, behavior: 'smooth' });
        }
      }
    }, 50);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(scrollTimeout);
    };
  }, [focusedId]);

  useLayoutEffect(() => {
    const PAGE_HEIGHT = format === 'US' ? 1056 : 1122;
    const TOP_MARGIN = 96;
    const BOTTOM_MARGIN = 96;
    const USABLE_HEIGHT = PAGE_HEIGHT - (TOP_MARGIN + BOTTOM_MARGIN);
    
    elements.forEach(el => {
      const node = wrapperRefs.current[el.id];
      if (node) {
        node.classList.remove('print-page-break', 'visual-page-break', 'print-first-element');
        node.style.removeProperty('--visual-mt');
        node.style.removeProperty('--print-mt');
      }
    });

    const renderGroups = groupElementsForRender(elements);

    const anchorMap = new Map<string, number>();
    if (isPagesLocked && lockedAnchors && lockedAnchors.length > 0) {
      lockedAnchors.forEach(a => {
        if (a.elementId) anchorMap.set(a.elementId, a.pageNumber);
      });
    }

    let currentHeightOnPage = 0;
    let pages = 1;
    let currentBasePage = coverPage ? 2 : 1;
    let currentSubPage = 0;
    const newPageBreaks: Record<string, { page: number; pageLabel?: string; isCoverBreak?: boolean; isLocked?: boolean; isMore?: boolean }> = {};
    const newSplitLimits: Record<string, SplitLimitData> = {};

    if (coverPage) {
      pages++;
    }

    if (elements.length > 0) {
      const firstId = elements[0].id;
      const initialLockedPage = anchorMap.get(firstId) || (coverPage ? 2 : 1);
      currentBasePage = initialLockedPage;
      const firstLabel = formatPageLabel(coverPage && initialLockedPage > 1 ? initialLockedPage - 1 : initialLockedPage, 0);
      newPageBreaks[firstId] = { 
        page: initialLockedPage, 
        pageLabel: firstLabel,
        isCoverBreak: !!coverPage,
        isLocked: isPagesLocked
      };
    }

    renderGroups.forEach((group, gIdx) => {
      let blockHeight = 0;
      let firstElId = '';
      let elType: ElementType | 'dual' = 'action';

      if (group.kind === 'single') {
        const wrapperNode = wrapperRefs.current[group.element.id];
        if (wrapperNode) {
          if (currentHeightOnPage === 0) {
            const measureNodes = wrapperNode.querySelectorAll('.element-content-measure');
            blockHeight = measureNodes.length > 0 ? (measureNodes[0] as HTMLElement).offsetHeight : wrapperNode.offsetHeight;
          } else {
            // Include margin-top within document flow
            blockHeight = wrapperNode.offsetHeight;
          }
        }
        firstElId = group.element.id;
        elType = group.element.type;
      } else {
        let leftH = 0;
        let rightH = 0;
        group.left.forEach(item => {
          const node = wrapperRefs.current[item.element.id];
          leftH += node ? node.offsetHeight : 0;
        });
        group.right.forEach(item => {
          const node = wrapperRefs.current[item.element.id];
          rightH += node ? node.offsetHeight : 0;
        });
        blockHeight = Math.max(leftH, rightH);
        firstElId = group.left[0]?.element.id || group.right[0]?.element.id || '';
        elType = 'dual';
      }

      if (blockHeight === 0) blockHeight = 24;

      // A. Kilitli Çapa Noktası Kontrolü (Locked Page Anchor Point)
      // Eğer bu eleman kilitli bir sayfanın başlangıç çapasıysa, sayfa numarasını doğrudan o numaraya senkronize et
      if (isPagesLocked && gIdx > 0 && firstElId && anchorMap.has(firstElId)) {
        currentBasePage = anchorMap.get(firstElId)!;
        currentSubPage = 0;
        pages++;
        const targetBase = coverPage && currentBasePage > 1 ? currentBasePage - 1 : currentBasePage;
        const pageLabel = formatPageLabel(targetBase, 0);
        newPageBreaks[firstElId] = {
          page: currentBasePage,
          pageLabel,
          isCoverBreak: false,
          isLocked: true
        };
        const wrapperNode = wrapperRefs.current[firstElId];
        const measureNodes = wrapperNode ? wrapperNode.querySelectorAll('.element-content-measure') : [];
        currentHeightOnPage = measureNodes.length > 0 ? (measureNodes[0] as HTMLElement).offsetHeight : blockHeight;
        return;
      }

      // 1. Orphan / Widow Protection (Scene Headings, Character cues, Parentheticals)
      let orphanBuffer = 0;
      if (elType === 'scene') {
        orphanBuffer = 36; // Scene Heading requires heading line + 1 subsequent line
      } else if (elType === 'character') {
        orphanBuffer = 28; // Character cue requires cue + 1 line of dialogue
      } else if (elType === 'parenthetical') {
        orphanBuffer = 20;
      }

      // 2. Page Break & Natural Element Splitting (Industry Screenwriting Standard)
      if (currentHeightOnPage + blockHeight + orphanBuffer > USABLE_HEIGHT && gIdx > 0 && currentHeightOnPage > 0) {
        const availableSpace = USABLE_HEIGHT - currentHeightOnPage;
        const LINE_H = 21;
        const moreReserve = elType === 'dialogue' ? 24 : 0;
        const linesFitting = Math.floor((availableSpace - moreReserve) / LINE_H);
        const totalLines = Math.max(1, Math.round(blockHeight / LINE_H));
        const linesRemaining = totalLines - linesFitting;

        const canSplit = (elType === 'action' || elType === 'dialogue') 
          && group.kind === 'single'
          && linesFitting >= (elType === 'dialogue' ? 2 : 1) 
          && linesRemaining >= 1;

        const wrapperNode = wrapperRefs.current[firstElId];
        const measureNodes = wrapperNode ? wrapperNode.querySelectorAll('.element-content-measure') : [];
        const topElementHeight = measureNodes.length > 0 ? (measureNodes[0] as HTMLElement).offsetHeight : blockHeight;

        if (isPagesLocked) {
          // Kilitli Mod: A-Sayfası taşması (örn: 12A, 12B, 12C...)
          currentSubPage++;
          pages++;
          const targetBase = coverPage && currentBasePage > 1 ? currentBasePage - 1 : currentBasePage;
          const pageLabel = formatPageLabel(targetBase, currentSubPage);
          const prevPageLabel = formatPageLabel(targetBase, currentSubPage - 1);

          if (canSplit) {
            const charsPerLine = elType === 'action' ? (format === 'US' ? 60 : 55) : (format === 'US' ? 35 : 32);
            const charLimit = linesFitting * charsPerLine;
            const slices = splitHtmlIntoSlices(group.element.content, [charLimit]);

            if (slices.length >= 2) {
              newSplitLimits[firstElId] = {
                charLimit,
                page1: pages - 1,
                page2: pages,
                pageLabel1: prevPageLabel,
                pageLabel2: pageLabel,
                isDialogue: elType === 'dialogue'
              };
              const contReserve = elType === 'dialogue' ? 24 : 0;
              currentHeightOnPage = contReserve + linesRemaining * LINE_H;
            } else {
              newPageBreaks[firstElId] = { page: currentBasePage, pageLabel, isCoverBreak: false, isLocked: true };
              currentHeightOnPage = topElementHeight;
            }
          } else {
            newPageBreaks[firstElId] = { page: currentBasePage, pageLabel, isCoverBreak: false, isLocked: true };
            currentHeightOnPage = topElementHeight;
          }
        } else {
          // Normal Mod: Standart ardışık sayfalama
          pages++;
          const displayP = coverPage && pages > 1 ? pages - 1 : pages;
          const pageLabel = `${displayP}`;
          const prevDisplayP = coverPage && (pages - 1) > 1 ? (pages - 1) - 1 : (pages - 1);
          const prevPageLabel = `${prevDisplayP}`;

          if (canSplit) {
            const charsPerLine = elType === 'action' ? (format === 'US' ? 60 : 55) : (format === 'US' ? 35 : 32);
            const charLimit = linesFitting * charsPerLine;
            const slices = splitHtmlIntoSlices(group.element.content, [charLimit]);

            if (slices.length >= 2) {
              newSplitLimits[firstElId] = {
                charLimit,
                page1: pages - 1,
                page2: pages,
                pageLabel1: prevPageLabel,
                pageLabel2: pageLabel,
                isDialogue: elType === 'dialogue'
              };
              const contReserve = elType === 'dialogue' ? 24 : 0;
              currentHeightOnPage = contReserve + linesRemaining * LINE_H;
            } else {
              newPageBreaks[firstElId] = { page: pages, pageLabel, isCoverBreak: false, isLocked: false };
              currentHeightOnPage = topElementHeight;
            }
          } else {
            newPageBreaks[firstElId] = { page: pages, pageLabel, isCoverBreak: false, isLocked: false };
            currentHeightOnPage = topElementHeight;
          }
        }
      } else {
        currentHeightOnPage += blockHeight;
      }
    });
    
    // Check if newPageBreaks changed
    const breaksChanged = Object.keys(newPageBreaks).length !== Object.keys(pageBreaks).length ||
      Object.keys(newPageBreaks).some(k => 
        newPageBreaks[k]?.page !== pageBreaks[k]?.page || 
        newPageBreaks[k]?.pageLabel !== pageBreaks[k]?.pageLabel ||
        newPageBreaks[k]?.isCoverBreak !== pageBreaks[k]?.isCoverBreak ||
        newPageBreaks[k]?.isLocked !== pageBreaks[k]?.isLocked
      );

    // Check if newSplitLimits changed
    const splitsChanged = Object.keys(newSplitLimits).length !== Object.keys(splitLimits).length ||
      Object.keys(newSplitLimits).some(k => 
        newSplitLimits[k]?.charLimit !== splitLimits[k]?.charLimit ||
        newSplitLimits[k]?.page1 !== splitLimits[k]?.page1 ||
        newSplitLimits[k]?.page2 !== splitLimits[k]?.page2 ||
        newSplitLimits[k]?.pageLabel1 !== splitLimits[k]?.pageLabel1 ||
        newSplitLimits[k]?.pageLabel2 !== splitLimits[k]?.pageLabel2 ||
        newSplitLimits[k]?.isDialogue !== splitLimits[k]?.isDialogue
      );

    if (pages !== numPages) {
      setNumPages(pages);
      onPageCountChange?.(pages);
    }
    if (breaksChanged) {
      setPageBreaks(newPageBreaks);
      onPageBreaksChange?.(newPageBreaks);
    }
    if (splitsChanged) setSplitLimits(newSplitLimits);
  }, [elements, format, zoom, coverPage, fontLoaded, isPagesLocked, lockedAnchors]);

  const currentRevDate = activeRevisionDate || coverPage?.date || new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Endüstri Standardı Sayfa Revizyon Haritası (Hangi sayfada revizyon rengi var?)
  const pageRevisionMap = useMemo(() => {
    const map: Record<string, { hasRevision: boolean; revisionColor?: 'blue' | 'pink' | 'yellow' | 'green' | 'goldenrod' | 'white' }> = {};
    let currentPageLabel = '1';

    elements.forEach((el, index) => {
      const breakData = pageBreaks[el.id];
      if (breakData) {
        const pageNum = breakData.page;
        const displayPageNum = coverPage && pageNum ? pageNum - 1 : pageNum;
        currentPageLabel = breakData.pageLabel || (displayPageNum ? `${displayPageNum}` : '1');
      } else if (index === 0) {
        currentPageLabel = '1';
      }

      const limitData = splitLimits[el.id];
      if (limitData && limitData.pageLabel1 && limitData.pageLabel2) {
        if (el.revisionColor && el.revisionColor !== 'white') {
          map[limitData.pageLabel1] = { hasRevision: true, revisionColor: el.revisionColor };
          map[limitData.pageLabel2] = { hasRevision: true, revisionColor: el.revisionColor };
        }
      } else {
        if (el.revisionColor && el.revisionColor !== 'white') {
          map[currentPageLabel] = { hasRevision: true, revisionColor: el.revisionColor };
        }
      }
    });

    return map;
  }, [elements, pageBreaks, splitLimits, coverPage]);

  const handleInput = (content: string, id: string) => {
    if (dismissedSuggestionsId === id) {
      setDismissedSuggestionsId(null);
    }
    onChange(id, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number, element: ScreenplayElement) => {
    const plainContent = element.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    const matchingChars = element.type === 'character' && plainContent 
      ? characters.filter(c => c.toLowerCase().startsWith(plainContent.toLowerCase()) && c !== plainContent)
      : [];
    const matchingScenes = element.type === 'scene' && plainContent
      ? scenes.filter(s => s.toLowerCase().startsWith(plainContent.toLowerCase()) && s !== plainContent)
      : [];
    const currentSuggestions = dismissedSuggestionsId === element.id ? [] : (matchingChars.length > 0 ? matchingChars : matchingScenes);

    if (e.key === 'Escape' && currentSuggestions.length > 0) {
      e.preventDefault();
      setDismissedSuggestionsId(element.id);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      onToggleDualDialogue?.();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // If inside dual dialogue, Tab seamlessly hops between Left and Right columns!
      if (element.dualPosition === 'left') {
        const rightMatch = elements.find((elItem, i) => i > index && elItem.dualPosition === 'right');
        if (rightMatch) {
          setFocusedId(rightMatch.id);
          return;
        }
      } else if (element.dualPosition === 'right') {
        const leftMatch = elements.slice(0, index).reverse().find(elItem => elItem.dualPosition === 'left');
        if (leftMatch) {
          setFocusedId(leftMatch.id);
          return;
        }
      }

      const cycle: ElementType[] = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'];
      const nextIndex = (cycle.indexOf(element.type) + 1) % cycle.length;
      onChangeType(element.id, cycle[nextIndex]);
      return;
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const br = document.createElement('br');
          range.deleteContents();
          range.insertNode(br);
          range.setStartAfter(br);
          range.setEndAfter(br);
          sel.removeAllRanges();
          sel.addRange(range);
          
          const sanitized = DOMPurify.sanitize(e.currentTarget.innerHTML, { ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'div', 'span', 'font', 'p'], ALLOWED_ATTR: ['style', 'color', 'face', 'size', 'class'] });
          onChange(element.id, sanitized);
        }
        return;
      }
      e.preventDefault();
      
      if (currentSuggestions.length > 0) {
         const selected = currentSuggestions[suggestionIndex] || currentSuggestions[0];
         onChange(element.id, selected);
         onAdd(element.id, matchingChars.length > 0 ? 'dialogue' : 'action');
         return;
      }

      let textBeforeCursor = element.content;
      let textAfterCursor = '';

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // Extract text after cursor
        const postCaretRange = range.cloneRange();
        postCaretRange.selectNodeContents(e.currentTarget);
        postCaretRange.setStart(range.endContainer, range.endOffset);
        
        const div = document.createElement('div');
        div.appendChild(postCaretRange.cloneContents());
        textAfterCursor = div.innerHTML;

        // Extract text before cursor
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.currentTarget);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        
        const div2 = document.createElement('div');
        div2.appendChild(preCaretRange.cloneContents());
        textBeforeCursor = div2.innerHTML;
      }

      const cleanHTML = (html: string) => {
        // Remove trailing/leading br, div, p, spaces, nbsp
        let cleaned = html.replace(/^(<br\s*\/?>|<div><br><\/div>|<p><br><\/p>|\s|&nbsp;)+|(<br\s*\/?>|<div><br><\/div>|<p><br><\/p>|\s|&nbsp;)+$/gi, '');
        // If it's just empty tags, return empty string
        if (cleaned.replace(/<[^>]+>/g, '').trim() === '') {
          return '';
        }
        return cleaned;
      };

      textBeforeCursor = cleanHTML(textBeforeCursor);
      textAfterCursor = cleanHTML(textAfterCursor);

      const limitData = splitLimits[element.id];
      const sliceAttr = (e.currentTarget as HTMLElement)?.getAttribute?.('data-slice-content');

      if (limitData) {
        const slices = splitHtmlIntoSlices(element.content, [limitData.charLimit]);
        if (slices.length >= 2) {
          if (sliceAttr === '0') {
            textAfterCursor = joinSlices(textAfterCursor, slices[1]);
          } else if (sliceAttr === '1') {
            textBeforeCursor = joinSlices(slices[0], textBeforeCursor);
          }
        }
      }

      const cleanElementContent = cleanHTML(element.content);

      // Update current element with text before cursor
      if (textBeforeCursor !== element.content) {
        onChange(element.id, textBeforeCursor);
      }

      // If the current element is empty and we press Enter, we should probably just change its type
      if (cleanElementContent === '' && textBeforeCursor === '' && textAfterCursor === '') {
        const cycle: ElementType[] = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'];
        const nextIndex = (cycle.indexOf(element.type) + 1) % cycle.length;
        onChangeType(element.id, cycle[nextIndex]);
        return;
      }

      // Dual Dialogue specific Enter navigation
      if (element.dualPosition === 'left') {
        if (element.type === 'character') {
          const nextEl = elements[index + 1];
          if (nextEl && nextEl.dualPosition === 'left' && (nextEl.type === 'dialogue' || nextEl.type === 'parenthetical')) {
            setFocusedId(nextEl.id);
            return;
          }
          onAdd(element.id, 'dialogue', textAfterCursor);
          return;
        } else if (element.type === 'parenthetical') {
          const nextEl = elements[index + 1];
          if (nextEl && nextEl.dualPosition === 'left' && nextEl.type === 'dialogue') {
            setFocusedId(nextEl.id);
            return;
          }
          onAdd(element.id, 'dialogue', textAfterCursor);
          return;
        } else if (element.type === 'dialogue') {
          // Left dialogue done: hop to right character!
          const rightChar = elements.find((elItem, i) => i > index && elItem.dualPosition === 'right' && elItem.type === 'character');
          if (rightChar) {
            setFocusedId(rightChar.id);
            return;
          }
          onAdd(element.id, 'character', textAfterCursor);
          return;
        }
      } else if (element.dualPosition === 'right') {
        if (element.type === 'character') {
          const nextEl = elements[index + 1];
          if (nextEl && nextEl.dualPosition === 'right' && (nextEl.type === 'dialogue' || nextEl.type === 'parenthetical')) {
            setFocusedId(nextEl.id);
            return;
          }
          onAdd(element.id, 'dialogue', textAfterCursor);
          return;
        } else if (element.type === 'parenthetical') {
          const nextEl = elements[index + 1];
          if (nextEl && nextEl.dualPosition === 'right' && nextEl.type === 'dialogue') {
            setFocusedId(nextEl.id);
            return;
          }
          onAdd(element.id, 'dialogue', textAfterCursor);
          return;
        } else if (element.type === 'dialogue') {
          // Right dialogue done: exit dual dialogue block to next action!
          let lastDualIdx = index;
          while (lastDualIdx < elements.length - 1 && elements[lastDualIdx + 1].dualPosition === 'right') {
            lastDualIdx++;
          }
          onAdd(elements[lastDualIdx].id, 'action', textAfterCursor);
          return;
        }
      }

      let nextType: ElementType = 'action';
      if (element.type === 'character') nextType = 'dialogue';
      else if (element.type === 'dialogue') nextType = 'character';
      else if (element.type === 'scene') nextType = 'action';
      else if (element.type === 'transition') nextType = 'scene';
      else if (element.type === 'parenthetical') nextType = 'dialogue';

      onAdd(element.id, nextType, textAfterCursor);
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
      const sel = window.getSelection();
      const textLen = element.content ? element.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').length : 0;
      const selectedLen = sel ? sel.toString().length : 0;

      // If whole current element text is already selected, or if element is empty, or multiple elements selected: select ALL elements
      if (selectedLen >= textLen || selectedIds.length > 0 || textLen === 0) {
        e.preventDefault();
        setSelectedIds(elements.map(el => el.id));
        return;
      }
    } else if (selectedIds.length > 1 && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      onChange(selectedIds[0], e.key);
      onRemoveMultiple(selectedIds.slice(1), selectedIds[0]);
      setSelectedIds([]);
      
      setTimeout(() => {
        const el = inputRefs.current[selectedIds[0]];
        if (el) {
          el.focus();
          if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      }, 0);
      return;
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (selectedIds.length > 1) {
        e.preventDefault();
        const firstSelectedIndex = elements.findIndex(el => el.id === selectedIds[0]);
        const focusId = firstSelectedIndex > 0 ? elements[firstSelectedIndex - 1].id : (elements.length > selectedIds.length ? elements[selectedIds.length].id : '');
        
        onRemoveMultiple(selectedIds, focusId);
        setSelectedIds([]);
        return;
      }

      if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (sel && sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(e.currentTarget);
          preCaretRange.setEnd(range.startContainer, range.startOffset);
          
          if (preCaretRange.toString().length === 0) {
            const isSplit = !!splitLimits[element.id];
            const sliceAttr = (e.currentTarget as HTMLElement)?.getAttribute?.('data-slice-content');

            if (isSplit && sliceAttr === '1') {
              e.preventDefault();
              const slice0El = inputRefs.current[`${element.id}_0`];
              if (slice0El) {
                slice0El.focus();
                if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
                  const r = document.createRange();
                  r.selectNodeContents(slice0El);
                  r.collapse(false);
                  const s = window.getSelection();
                  s?.removeAllRanges();
                  s?.addRange(r);
                }
              }
              return;
            }

            e.preventDefault();
            if (index > 0) {
              const prevElement = elements[index - 1];
              const currentContent = element.content === '<br>' ? '' : element.content;
              const prevContent = prevElement.content === '<br>' ? '' : prevElement.content;
              const newContent = prevContent + currentContent;
              
              onChange(prevElement.id, newContent);
              onRemove(element.id, prevElement.id);
              
              // Focus previous element and set cursor to the merge point
              setTimeout(() => {
                const el = inputRefs.current[prevElement.id];
                if (el) {
                  el.focus();
                  // Try to set cursor to the end of the previous content
                  if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false); // Default to end
                    
                    // If we merged text, we ideally want to put the cursor exactly where the merge happened.
                    // For simplicity, putting it at the end of the merged text is usually acceptable,
                    // but since we are pressing backspace, the user expects the cursor at the merge point.
                    // We'll just let it go to the end for now, or if currentContent is empty, it goes to the end of prevContent.
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }
                }
              }, 0);
            }
          }
        }
      } else if (e.key === 'Delete') {
        const sel = window.getSelection();
        if (sel && sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          const postCaretRange = range.cloneRange();
          postCaretRange.selectNodeContents(e.currentTarget);
          postCaretRange.setStart(range.endContainer, range.endOffset);
          
          if (postCaretRange.toString().length === 0) {
            e.preventDefault();
            if (index < elements.length - 1) {
              const nextElement = elements[index + 1];
              const currentContent = element.content === '<br>' ? '' : element.content;
              const nextContent = nextElement.content === '<br>' ? '' : nextElement.content;
              const newContent = currentContent + nextContent;
              
              onChange(element.id, newContent);
              onRemove(nextElement.id, element.id);
            }
          }
        }
      }
    } else if (e.key === 'ArrowDown' && currentSuggestions.length > 0) {
      e.preventDefault();
      setSuggestionIndex(s => Math.min(s + 1, currentSuggestions.length - 1));
    } else if (e.key === 'ArrowUp' && currentSuggestions.length > 0) {
      e.preventDefault();
      setSuggestionIndex(s => Math.max(s - 1, 0));
    } else if (e.key === 'ArrowDown' && e.shiftKey) {
      // Shift+ArrowDown
      const sel = window.getSelection();
      if (sel && sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const postCaretRange = range.cloneRange();
        postCaretRange.selectNodeContents(e.currentTarget);
        postCaretRange.setStart(range.endContainer, range.endOffset);
        
        if (postCaretRange.toString().length === 0) {
          e.preventDefault();
          if (index < elements.length - 1) {
            const nextId = elements[index + 1].id;
            if (selectedIds.length === 0) {
              setSelectedIds([element.id, nextId]);
            } else if (!selectedIds.includes(nextId)) {
              setSelectedIds([...selectedIds, nextId]);
            }
            setFocusedId(nextId);
          }
        }
      }
    } else if (e.key === 'ArrowUp' && e.shiftKey) {
      // Shift+ArrowUp
      const sel = window.getSelection();
      if (sel && sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.currentTarget);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        
        if (preCaretRange.toString().length === 0) {
          e.preventDefault();
          if (index > 0) {
            const prevId = elements[index - 1].id;
            if (selectedIds.length === 0) {
              setSelectedIds([prevId, element.id]);
            } else if (!selectedIds.includes(prevId)) {
              setSelectedIds([prevId, ...selectedIds]);
            }
            setFocusedId(prevId);
          }
        }
      }
    } else if (!e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      if (selectedIds.length > 0) {
        setSelectedIds([]);
      }
    }
  };

  const getStyle = (type: ElementType, format: ScreenplayFormat, dualPosition?: 'left' | 'right') => {
    const placeholderColor = theme === 'dark' ? 'placeholder-slate-600' : 'placeholder-slate-400';
    const base = `bg-transparent outline-none resize-none block leading-[1.3] whitespace-pre-wrap break-words [overflow-wrap:break-word] [word-break:break-word] box-border overflow-visible ${placeholderColor}`;
    
    if (dualPosition) {
      switch (type) {
        case 'character': return `${base} uppercase font-bold mt-2 text-center w-full tracking-wide`;
        case 'parenthetical': return `${base} italic mt-0 text-center w-full text-xs sm:text-sm`;
        case 'dialogue': return `${base} w-full text-left mt-0`;
        case 'note': return `${base} w-full p-2 bg-yellow-200/50 dark:bg-yellow-900/40 rounded text-xs print:hidden`;
        default: return `${base} w-full`;
      }
    }

    if (format === 'US') {
      switch (type) {
        case 'scene': return `${base} w-full font-bold uppercase mt-5`;
        case 'action': return `${base} w-full mt-3.5`;
        case 'character': return `${base} uppercase font-bold mt-3.5 w-[336px] ml-[192px] tracking-wide`;
        case 'dialogue': return `${base} w-[336px] ml-[96px] mt-0`;
        case 'parenthetical': return `${base} w-[240px] ml-[144px] italic mt-0`;
        case 'transition': return `${base} w-full uppercase mt-3.5 text-right font-bold tracking-wider`;
        case 'note': return `${base} w-[80%] mx-auto mt-4 mb-4 p-2 bg-yellow-200/50 dark:bg-yellow-900/40 rounded-lg text-sm border-l-4 border-yellow-500/50 outline-none print:hidden`;
        default: return `${base} w-full`;
      }
    } else {
      // FR Format: Action left, Dialogue right
      switch (type) {
        case 'scene': return `${base} w-full font-bold uppercase mt-6 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-[#dcd6cc]'} pb-1`;
        case 'action': return `${base} mt-3.5 w-[45%]`;
        case 'character': return `${base} uppercase mt-3.5 w-[45%] ml-[50%] font-bold`;
        case 'dialogue': return `${base} w-[45%] ml-[50%] mt-0`;
        case 'parenthetical': return `${base} w-[45%] ml-[50%] italic mt-0`;
        case 'transition': return `${base} w-full uppercase mt-3.5 text-right font-bold`;
        case 'note': return `${base} w-[80%] mx-auto mt-4 mb-4 p-2 bg-yellow-200/50 dark:bg-yellow-900/40 rounded-lg text-sm border-l-4 border-yellow-500/50 outline-none print:hidden`;
        default: return `${base} w-full`;
      }
    }
  };

  const getPlaceholder = (type: ElementType, dualPosition?: 'left' | 'right') => {
    if (dualPosition === 'left') {
      switch(type) {
        case 'character': return '1. KARAKTER';
        case 'dialogue': return 'Sol diyalog...';
        case 'parenthetical': return '(sol parantez)';
        default: break;
      }
    } else if (dualPosition === 'right') {
      switch(type) {
        case 'character': return '2. KARAKTER';
        case 'dialogue': return 'Sağ diyalog...';
        case 'parenthetical': return '(sağ parantez)';
        default: break;
      }
    }
    switch(type) {
      case 'scene': return 'SAHNE BAŞLIĞI';
      case 'action': return 'Eylem...';
      case 'character': return 'KARAKTER';
      case 'dialogue': return 'Diyalog...';
      case 'parenthetical': return '(parantez içi)';
      case 'transition': return 'KESME:';
      case 'note': return 'Senaryo içi not... [Çıktıda gizlenir]';
      default: return '';
    }
  };

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25]' : 'bg-[#e2d9cc]';
  const paperClass = theme === 'dark' ? 'bg-[#252c33] shadow-2xl rounded-md border border-[#2d3640] text-[#e2e8f0]' : 'bg-[#FFFFF0] shadow-xl rounded-md border border-[#c8bea8] text-slate-900';
  const defaultTextColor = theme === 'dark' ? '#e2e8f0' : '#1e293b';
  const displayFontFamily = fontFamily.includes('Courier') ? "'Courier Prime', 'Courier New', Courier, monospace" : fontFamily;

  const PAGE_HEIGHT = format === 'US' ? 1056 : 1122;
  const PAGE_WIDTH = format === 'US' ? 816 : 794;
  const GAP = 0;

  const printStyles = `
    @media print {
      @page {
        size: ${format === 'US' ? 'letter' : 'a4'} portrait;
        margin-top: 1in;
        margin-bottom: 1in;
        margin-left: ${format === 'US' ? '1.5in' : '1.25in'};
        margin-right: 1in;
      }
      @page :first {
        margin: 1in;
      }
      .page-gap-spacer {
        display: none !important;
      }
      .cover-page {
        break-after: page !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        height: 8.5in !important;
        max-height: 8.5in !important;
        min-height: 0 !important;
        margin: 0 !important;
        margin-bottom: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        align-items: center !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        border: none !important;
      }
      .cover-page-inputs {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        flex: 1 1 auto !important;
        width: 100% !important;
        text-align: center !important;
        margin-top: 2.0in !important;
        margin-bottom: auto !important;
        border: none !important;
      }
      .cover-page-inputs input {
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        margin-bottom: 15px !important;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .cover-page .cover-page-bottom-info {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        text-align: left !important;
        margin-top: auto !important;
        margin-bottom: 0.2in !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        padding-bottom: 0 !important;
        box-sizing: border-box !important;
        border: none !important;
        border-bottom: none !important;
      }
      .cover-page .cover-page-bottom-info .info-row {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        width: 100% !important;
        margin-bottom: 8px !important;
        border: none !important;
        border-bottom: none !important;
        box-shadow: none !important;
      }
      .cover-page .cover-page-bottom-info .info-row span {
        width: 110px !important;
        text-align: left !important;
        font-weight: bold !important;
        font-size: 10pt !important;
        opacity: 0.7 !important;
        border: none !important;
      }
      .cover-page .cover-page-bottom-info .info-row input {
        text-align: left !important;
        display: inline-block !important;
        width: 350px !important;
        margin-bottom: 0 !important;
        font-size: 11pt !important;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #print-area-container {
        padding: 0 !important;
        margin: 0 !important;
      }
      #print-area {
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: auto !important;
        box-sizing: border-box !important;
        background: white !important;
        color: black !important;
        border: none !important;
        box-shadow: none !important;
      }
      #print-area > div {
        padding: 0 !important;
        margin: 0 !important;
      }
      .print-page-break {
        break-before: page !important;
        page-break-before: always !important;
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      .print-first-element {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      .print-break-scene, .print-break-character {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
      .print-break-parenthetical, .print-break-transition {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .print-break-dialogue, .print-break-action {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
      .scene-row {
        display: flex !important;
        flex-direction: row !important;
        align-items: baseline !important;
        width: 100% !important;
      }
      .scene-num-badge {
        display: inline-block !important;
        color: black !important;
        opacity: 1 !important;
        font-weight: bold !important;
        flex-shrink: 0 !important;
        margin-right: 8px !important;
      }
      .print-page-break .scene-row,
      .print-first-element .scene-row {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      .dual-dialogue-container {
        display: flex !important;
        flex-direction: row !important;
        gap: 24px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .dual-column-left, .dual-column-right {
        flex: 1 1 0% !important;
        min-width: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        box-sizing: border-box !important;
      }
      [contenteditable]:empty,
      [contenteditable]:empty:before,
      [contenteditable][data-placeholder]:empty:before {
        content: "" !important;
        display: none !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      .revision-star-mark {
        display: block !important;
        position: absolute !important;
        right: -20px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        font-family: 'Courier Prime', Courier, monospace !important;
        font-size: 14pt !important;
        font-weight: bold !important;
        color: #000000 !important;
        visibility: visible !important;
        opacity: 1 !important;
        line-height: 1 !important;
      }
    }
  `;

  const focusedElement = elements.find(e => e.id === focusedId);
  const activeFontFamily = selectionStyles.fontFamily || focusedElement?.fontFamily || fontFamily;
  const activeFontSize = selectionStyles.fontSize || focusedElement?.fontSize || fontSize;
  const activeFontColor = selectionStyles.fontColor || focusedElement?.fontColor || fontColor;

  const applyInlineStyle = (prop: 'fontFamily' | 'fontSize' | 'fontColor', value: any): boolean => {
    let targetElId = focusedId;
    let targetStart = 0;
    let targetEnd = 0;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      let containerNode: Node | null = range.commonAncestorContainer;
      if (containerNode.nodeType === Node.TEXT_NODE) {
        containerNode = containerNode.parentElement;
      }
      const elementDiv = (containerNode as HTMLElement)?.closest?.('[data-element-id]') as HTMLElement | null;
      if (elementDiv) {
        const elId = elementDiv.getAttribute('data-element-id');
        const offsets = getCharacterOffsets(elementDiv, range);
        if (offsets && offsets.start < offsets.end) {
          targetElId = elId || targetElId;
          targetStart = offsets.start;
          targetEnd = offsets.end;
        }
      }
    } else if (savedSelectionRef.current && savedSelectionRef.current.start < savedSelectionRef.current.end) {
      targetElId = savedSelectionRef.current.elementId || targetElId;
      targetStart = savedSelectionRef.current.start;
      targetEnd = savedSelectionRef.current.end;
    }

    if (!targetElId || targetStart >= targetEnd) {
      return false;
    }

    const elDiv = inputRefs.current[targetElId];
    if (!elDiv) return false;

    try {
      const chars = extractFormattedChars(elDiv);
      if (chars.length === 0) return false;

      const targetElement = elements.find(e => e.id === targetElId);
      const baseFontSize = targetElement?.fontSize || fontSize || 12;

      let textCharIndex = 0;
      for (let i = 0; i < chars.length; i++) {
        if (chars[i].type === 'char') {
          if (textCharIndex >= targetStart && textCharIndex < targetEnd) {
            if (prop === 'fontColor') {
              if (value && value !== 'default') {
                chars[i].fontColor = normalizeColor(value);
              } else {
                chars[i].fontColor = undefined; // Reset inline color
              }
            } else if (prop === 'fontSize') {
              if (value === 'increment') {
                const cur = chars[i].fontSize || baseFontSize;
                chars[i].fontSize = Math.min(99, cur + 1);
              } else if (value === 'decrement') {
                const cur = chars[i].fontSize || baseFontSize;
                chars[i].fontSize = Math.max(2, cur - 1);
              } else if (!value || value === 'default') {
                chars[i].fontSize = undefined;
              } else {
                const parsed = typeof value === 'number' ? value : parseInt(value, 10);
                chars[i].fontSize = !isNaN(parsed) ? Math.min(99, Math.max(2, parsed)) : undefined;
              }
            } else if (prop === 'fontFamily') {
              if (!value || value === 'default') {
                chars[i].fontFamily = undefined;
              } else {
                chars[i].fontFamily = value;
              }
            }
          }
          textCharIndex++;
        }
      }

      if (prop === 'fontColor') {
        setSelectionStyles(prev => ({ ...prev, fontColor: value && value !== 'default' ? normalizeColor(value) : undefined }));
      } else if (prop === 'fontSize') {
        const parsed = typeof value === 'number' ? value : parseInt(value, 10);
        setSelectionStyles(prev => ({ ...prev, fontSize: !isNaN(parsed) ? parsed : undefined }));
      } else if (prop === 'fontFamily') {
        setSelectionStyles(prev => ({ ...prev, fontFamily: value && value !== 'default' ? value : undefined }));
      }

      const newHtml = renderFormattedCharsToHtml(chars);
      elDiv.innerHTML = newHtml;

      // Re-apply selection over the newly formatted range
      const newRange = createRangeFromOffsets(elDiv, targetStart, targetEnd);
      if (newRange && sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
      }

      // Update savedSelectionRef with current offsets
      savedSelectionRef.current = {
        elementId: targetElId,
        start: targetStart,
        end: targetEnd,
        text: elDiv.innerText.slice(targetStart, targetEnd)
      };

      // Sanitize and notify App of change
      let sanitized = DOMPurify.sanitize(newHtml, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'div', 'span', 'font', 'p'],
        ALLOWED_ATTR: ['style', 'color', 'face', 'size', 'class']
      });
      onChange(targetElId, sanitized);
      return true;
    } catch (err) {
      console.warn('Failed to apply inline style:', err);
      return false;
    }
  };

  const handleToolbarStyleChange = (prop: 'fontFamily' | 'fontSize' | 'fontColor', value: any) => {
    // 1. If text is selected with mouse, style only that selected text
    const isInlineApplied = applyInlineStyle(prop, value);
    if (isInlineApplied) {
      return;
    }

    // 2. If multiple lines are selected (Ctrl+A or multi-selection)
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        const el = elements.find(e => e.id === id);
        if (prop === 'fontSize') {
          const cur = el?.fontSize || fontSize;
          const next = value === 'increment' ? Math.min(99, cur + 1) : value === 'decrement' ? Math.max(2, cur - 1) : value;
          onUpdateElement?.(id, { fontSize: next });
        } else if (prop === 'fontColor' && (!value || value === 'default')) {
          if (el) {
            const cleanedContent = cleanAllColorsFromHtml(el.content);
            const elDiv = inputRefs.current[id];
            if (elDiv) {
              elDiv.style.color = '';
              elDiv.innerHTML = cleanedContent;
            }
            onUpdateElement?.(id, { fontColor: '', content: cleanedContent });
            onChange?.(id, cleanedContent);
          }
        } else {
          onUpdateElement?.(id, { [prop]: value });
        }
      });
      setSelectionStyles(prev => ({ ...prev, fontColor: undefined }));
      return;
    }

    // 3. If a single element is focused
    if (focusedId) {
      const el = elements.find(e => e.id === focusedId);
      if (prop === 'fontSize') {
        const cur = el?.fontSize || fontSize;
        const next = value === 'increment' ? Math.min(99, cur + 1) : value === 'decrement' ? Math.max(2, cur - 1) : value;
        onUpdateElement?.(focusedId, { fontSize: next });
      } else if (prop === 'fontColor' && (!value || value === 'default')) {
        // Reset all color on focused element (both element-level color and inner color spans)
        if (el) {
          const cleanedContent = cleanAllColorsFromHtml(el.content);
          const elDiv = inputRefs.current[focusedId];
          if (elDiv) {
            elDiv.style.color = '';
            elDiv.innerHTML = cleanedContent;
          }
          onUpdateElement?.(focusedId, { fontColor: '', content: cleanedContent });
          onChange?.(focusedId, cleanedContent);
          setSelectionStyles(prev => ({ ...prev, fontColor: undefined }));
        }
      } else {
        onUpdateElement?.(focusedId, { [prop]: value });
      }
      return;
    }

    // 4. Default: apply globally
    handleStyleChange?.(prop, value);
  };

  return (
    <div ref={scrollRef} className={`flex-1 overflow-y-auto flex flex-col items-center px-4 pt-6 ${isTypewriterMode ? 'pb-[65vh]' : 'pb-20'} ${bgClass}`} id="print-area-container">
      <style>{printStyles}</style>

      {/* Embedded/Floating Canvas Toolbar */}
      {isToolbarVisible ? (
        <div className="sticky top-0 z-40 mb-6 shrink-0 flex justify-center w-full max-w-[820px] no-print animate-in fade-in zoom-in-95 duration-150">
          <Toolbar
            currentElementType={currentElementType}
            changeCurrentElementType={(type) => focusedId ? onChangeType(focusedId, type) : null}
            theme={theme}
            fontFamily={activeFontFamily}
            fontSize={activeFontSize}
            fontColor={activeFontColor}
            handleStyleChange={handleToolbarStyleChange}
            onUndo={onUndo || (() => {})}
            onRedo={onRedo || (() => {})}
            canUndo={canUndo}
            canRedo={canRedo}
            isDualDialogue={isDualDialogue}
            onToggleDualDialogue={onToggleDualDialogue}
            onOpenFontPicker={onOpenFontPicker}
            onClose={onToggleToolbar}
          />
        </div>
      ) : onToggleToolbar ? (
        <div className="sticky top-0 z-40 mb-2 shrink-0 flex justify-end w-full max-w-[820px] no-print">
          <button
            type="button"
            onClick={onToggleToolbar}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs shadow-md backdrop-blur-md transition-all ${
              theme === 'dark' 
                ? 'bg-[#20272e]/85 border-[#2d3640] text-slate-300 hover:text-white hover:bg-[#2d3640]' 
                : 'bg-[#FFFFF0]/85 border-[#c8bea8] text-slate-700 hover:text-black hover:bg-[#eae2d5]'
            }`}
            title="Hızlı Düzenleme Çubuğunu Aç (Biçim menüsünden de açabilirsiniz)"
          >
            <Sliders size={12} className="text-blue-500 dark:text-sky-400" />
            <span className="text-[11px] font-medium">Araç Çubuğunu Göster</span>
          </button>
        </div>
      ) : null}

      <div 
        id="print-area" 
        className={`relative shrink-0 ${paperClass}`}
        style={{ 
          width: `${PAGE_WIDTH}px`,
          transform: `scale(${zoom / 100})`, 
          transformOrigin: 'top center', 
          transition: 'transform 0.2s ease', 
          minHeight: `${PAGE_HEIGHT}px`
        }}
      >
        <div 
          className={`relative z-10 w-full pt-[96px] pb-[96px] pr-[96px] ${format === 'US' ? 'pl-[144px]' : 'pl-[120px]'}`}
        >
          {coverPage && (
            <div 
              className="cover-page w-full flex flex-col items-center justify-between"
              style={{ height: `${PAGE_HEIGHT - 192}px`, marginBottom: `${192 + GAP}px` }}
            >
              <div className="cover-page-inputs flex-1 flex flex-col items-center justify-center w-full space-y-4">
                <input
                  type="text"
                  value={coverPage.title}
                  onChange={(e) => setCoverPage?.({ ...coverPage, title: e.target.value })}
                  className="w-full text-center bg-transparent outline-none font-bold uppercase print:text-black focus:border-b focus:border-blue-500/50 tracking-widest"
                  style={{ fontSize: '22pt', fontFamily: displayFontFamily }}
                  placeholder="SIRÇA KÖŞK"
                />

                <input
                  type="text"
                  value={coverPage.author}
                  onChange={(e) => setCoverPage?.({ ...coverPage, author: e.target.value })}
                  className="w-full text-center bg-transparent outline-none print:text-black focus:border-b focus:border-blue-500/50 opacity-90"
                  style={{ fontSize: '13pt', fontFamily: displayFontFamily }}
                  placeholder="Sabahattin Ali"
                />
                
                {/* İsteğe bağlı Kapak Resmi (Yazar Adının Altında) */}
                {coverPage.imageUrl ? (
                  <div className="relative group flex flex-col items-center space-y-2 my-2 select-none w-full">
                    <img 
                      src={coverPage.imageUrl} 
                      alt="Kapak Resmi" 
                      className="max-h-[600px] object-contain transition-all"
                      style={{ width: `${coverPage.imageWidth || 150}px`, maxWidth: '100%' }}
                      referrerPolicy="no-referrer"
                    />
                    {/* Hover ile açılan kontrol paneli (baskıda gizlenir) */}
                    <div className="no-print absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/90 text-white px-3 py-2 rounded-xl shadow-2xl text-xs font-semibold backdrop-blur-md z-30">
                      <span className="shrink-0 text-[11px]">Boyut:</span>
                      <input 
                        type="range" 
                        min="50" 
                        max="1200" 
                        value={coverPage.imageWidth || 150}
                        onChange={(e) => setCoverPage?.({ ...coverPage, imageWidth: parseInt(e.target.value) })}
                        className="w-24 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="w-12 text-center text-[10px]">{coverPage.imageWidth || 150}px</span>
                      <button 
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*';
                          fileInput.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (readerEvent) => {
                                const base64 = readerEvent.target?.result as string;
                                setCoverPage?.({ ...coverPage, imageUrl: base64 });
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          fileInput.click();
                        }}
                        className="hover:text-blue-400 p-1 px-1.5 bg-slate-800 rounded transition-colors text-[10px]"
                        title="Resmi Değiştir"
                      >
                        Değiştir
                      </button>
                      <button 
                        onClick={() => setCoverPage?.({ ...coverPage, imageUrl: undefined, imageWidth: undefined })}
                        className="hover:text-red-400 p-1 px-1.5 bg-slate-800 rounded transition-colors font-bold text-[10px]"
                        title="Resmi Kaldır"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-print flex flex-col items-center py-2">
                    <button
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (readerEvent) => {
                              const base64 = readerEvent.target?.result as string;
                              setCoverPage?.({ ...coverPage, imageUrl: base64, imageWidth: 150 });
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        fileInput.click();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-700 hover:border-blue-500 rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-400 transition-all active:scale-95 bg-slate-900/20 cursor-pointer"
                    >
                      <span>🖼️</span>
                      <span>Kapak Resmi Ekle</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="cover-page-bottom-info w-full flex flex-col items-start px-8 pb-12 mt-auto space-y-2">
                <div className={`info-row flex items-center w-full border-b ${theme === 'dark' ? 'border-slate-700/40' : 'border-[#c8bea8]'} print:border-none pb-1 ${!coverPage.version?.trim() ? 'print:hidden' : ''}`}>
                  <span className={`w-24 text-[10pt] font-mono font-bold select-none uppercase tracking-wider text-left ${theme === 'dark' ? 'opacity-45 text-slate-300' : 'opacity-70 text-slate-700'}`} style={{ fontFamily: displayFontFamily }}>SÜRÜM:</span>
                  <input
                    type="text"
                    value={coverPage.version}
                    onChange={(e) => setCoverPage?.({ ...coverPage, version: e.target.value })}
                    className={`bg-transparent outline-none flex-1 text-left print:text-black font-mono ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}
                    style={{ fontSize: '11pt', fontFamily: displayFontFamily }}
                    placeholder="v.01."
                  />
                </div>
                <div className={`info-row flex items-center w-full border-b ${theme === 'dark' ? 'border-slate-700/40' : 'border-[#c8bea8]'} print:border-none pb-1 ${!coverPage.date?.trim() ? 'print:hidden' : ''}`}>
                  <span className={`w-24 text-[10pt] font-mono font-bold select-none uppercase tracking-wider text-left ${theme === 'dark' ? 'opacity-45 text-slate-300' : 'opacity-70 text-slate-700'}`} style={{ fontFamily: displayFontFamily }}>TARİH:</span>
                  <input
                    type="text"
                    value={coverPage.date}
                    onChange={(e) => setCoverPage?.({ ...coverPage, date: e.target.value })}
                    className={`bg-transparent outline-none flex-1 text-left print:text-black font-mono ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}
                    style={{ fontSize: '11pt', fontFamily: displayFontFamily }}
                    placeholder="14.07.2026"
                  />
                </div>
                {coverPage.revisionHistory && (
                  <div className={`info-row flex items-center w-full border-b ${theme === 'dark' ? 'border-slate-700/40' : 'border-[#c8bea8]'} print:border-none pb-1`}>
                    <span className={`w-24 text-[10pt] font-mono font-bold select-none uppercase tracking-wider text-left ${theme === 'dark' ? 'opacity-45 text-slate-300' : 'opacity-70 text-slate-700'}`} style={{ fontFamily: displayFontFamily }}>REVİZYON:</span>
                    <input
                      type="text"
                      value={coverPage.revisionHistory}
                      onChange={(e) => setCoverPage?.({ ...coverPage, revisionHistory: e.target.value })}
                      className={`bg-transparent outline-none flex-1 text-left print:text-black font-mono ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}
                      style={{ fontSize: '11pt', fontFamily: displayFontFamily }}
                      placeholder="Revizyon açıklaması"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {(() => {
                  const renderSingleElement = (el: ScreenplayElement, index: number, isInsideDual: boolean = false) => {
                    const plainContent = el.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
                    const matchingChars = el.type === 'character' && plainContent && focusedId === el.id
                      ? characters.filter(c => c.toLowerCase().startsWith(plainContent.toLowerCase()) && c !== plainContent)
                      : [];
                    const matchingScenes = el.type === 'scene' && plainContent && focusedId === el.id
                      ? scenes.filter(s => s.toLowerCase().startsWith(plainContent.toLowerCase()) && s !== plainContent)
                      : [];
                    const currentSuggestions = dismissedSuggestionsId === el.id ? [] : (matchingChars.length > 0 ? matchingChars : matchingScenes);
                    const safeSuggestionIndex = Math.min(suggestionIndex, Math.max(0, currentSuggestions.length - 1));

                    const suggestionMargin = el.dualPosition ? 'ml-0 w-full' : (format === 'US' ? 'ml-[40%]' : 'ml-[50%]');

                    const rawFontFamily = el.fontFamily || fontFamily;
                    const elFontFamily = rawFontFamily.includes('Courier') ? "'Courier Prime', 'Courier New', Courier, monospace" : rawFontFamily;
                    const elFontSize = el.fontSize || fontSize;
                    const elFontColor = el.fontColor || fontColor || defaultTextColor;
                    const breakData = pageBreaks[el.id];
                    const pageNum = breakData?.page;
                    const displayPageNum = coverPage && pageNum ? pageNum - 1 : pageNum;
                    const displayPageLabel = breakData?.pageLabel || (displayPageNum ? `${displayPageNum}` : '');
                    const isFirstElement = index === 0 && !isInsideDual;
                    const isPageBreak = !isInsideDual && !!breakData && (el.id !== elements[0]?.id || breakData.isCoverBreak);
                    const isVisualBreak = !isInsideDual && !!breakData && el.id !== elements[0]?.id;
                    const isBreakLocked = isPagesLocked || breakData?.isLocked;
                    
                    const breakClasses = [`print-break-${el.type}`];
                    if (isPageBreak) breakClasses.push('print-page-break');
                    if (isFirstElement && !coverPage) breakClasses.push('print-first-element');
                    if (isVisualBreak) breakClasses.push('visual-page-break');
                    
                    const textContentForEmptyCheck = el.content ? el.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() : '';
                    const isEmptyInPrint = !textContentForEmptyCheck;
                    if (isEmptyInPrint) breakClasses.push('print:hidden');
                    
                    const breakStyles: React.CSSProperties = {};

                    const isStartOfPage = isPageBreak;
                    const currentChar = el.type === 'character' ? el.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : speakingCharacters[el.id];
                    const prevChar = index > 0 ? (elements[index-1].type === 'character' ? elements[index-1].content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : speakingCharacters[elements[index-1].id]) : '';
                    
                    const isContinuation = isStartOfPage && currentChar && prevChar === currentChar;

                    const revColor = el.revisionColor;
                    let revBgClass = '';
                    let revBorderClass = '';
                    let revStar = null;

                    const hasRev = Boolean(revColor && revColor !== 'white');
                    if (hasRev) {
                      let starColorStyle = '';
                      let bgStyle = '';
                      let borderStyle = '';
                      
                      if (revColor === 'blue') {
                        bgStyle = 'bg-sky-500/10 dark:bg-sky-500/20';
                        borderStyle = 'border-l-4 border-sky-500';
                        starColorStyle = 'text-sky-600 dark:text-sky-400';
                      } else if (revColor === 'pink') {
                        bgStyle = 'bg-pink-500/10 dark:bg-pink-500/20';
                        borderStyle = 'border-l-4 border-pink-500';
                        starColorStyle = 'text-pink-600 dark:text-pink-400';
                      } else if (revColor === 'yellow') {
                        bgStyle = 'bg-yellow-500/15 dark:bg-yellow-500/25';
                        borderStyle = 'border-l-4 border-yellow-500';
                        starColorStyle = 'text-yellow-600 dark:text-yellow-400';
                      } else if (revColor === 'green') {
                        bgStyle = 'bg-emerald-500/10 dark:bg-emerald-500/20';
                        borderStyle = 'border-l-4 border-emerald-500';
                        starColorStyle = 'text-emerald-600 dark:text-emerald-400';
                      } else if (revColor === 'goldenrod') {
                        bgStyle = 'bg-amber-500/15 dark:bg-amber-500/25';
                        borderStyle = 'border-l-4 border-amber-500';
                        starColorStyle = 'text-amber-600 dark:text-amber-400';
                      }

                      revBgClass = isRevisionMode || printRevisionMarks ? `${bgStyle} ${printRevisionMarks ? `print:${bgStyle}` : 'print:bg-transparent'}` : '';
                      revBorderClass = isRevisionMode || printRevisionMarks ? `${borderStyle} -ml-1 pl-1 rounded-l-xs ${printRevisionMarks ? `print:${borderStyle}` : 'print:border-none'}` : '';
                      
                      const printStarClass = printRevisionMarks ? 'print:!block print:!text-black' : 'print:!hidden';
                      const screenStarClass = (isRevisionMode || printRevisionMarks) ? `${starColorStyle} block` : 'hidden';

                      revStar = (
                        <div 
                          className={`revision-star-mark absolute -right-7 sm:-right-9 md:-right-10 top-1/2 -translate-y-1/2 font-mono font-black text-xl md:text-2xl select-none pointer-events-none leading-none ${screenStarClass} ${printStarClass}`}
                          title={`${revColor?.toUpperCase()} REVİZYON İŞARETİ`}
                        >
                          *
                        </div>
                      );
                    }

                    // Table Read (Masa Okuma) Highlighting
                    const isTableReadActive = isTableReadMode && (el.type === 'character' || el.type === 'dialogue' || el.type === 'parenthetical');
                    let tableReadClass = '';
                    let tableReadStyle: React.CSSProperties = {};

                    if (isTableReadActive) {
                      const rawName = el.type === 'character' ? el.content : (speakingCharacters[el.id] || '');
                      const cleanCharKey = rawName.replace(/<[^>]+>/g, '').replace(/\(.*\)/g, '').replace(/&nbsp;/g, ' ').trim().toLocaleUpperCase('tr-TR');
                      if (cleanCharKey) {
                        const colorId = characterColors[cleanCharKey] || 'yellow';
                        const palette = TABLE_READ_PALETTE.find(p => p.id === colorId) || TABLE_READ_PALETTE[0];
                        const isSpotlightMatch = !spotlightCharacter || spotlightCharacter.toLocaleUpperCase('tr-TR') === cleanCharKey;

                        if (isSpotlightMatch) {
                          tableReadClass = 'table-read-active rounded-md transition-colors';
                          tableReadStyle = {
                            backgroundColor: theme === 'dark' ? `${palette.bgDark}88` : palette.bgLight,
                            borderLeft: `4px solid ${palette.border}`,
                            paddingLeft: '6px',
                            paddingRight: '6px',
                          };
                        } else {
                          tableReadClass = 'opacity-35 transition-opacity hover:opacity-100 print:opacity-100';
                        }
                      }
                    }

                    const revInfo = displayPageLabel ? pageRevisionMap[displayPageLabel] : undefined;
                    const pageHeaderText = revInfo?.hasRevision 
                      ? getRevisionHeaderText(displayPageLabel, revInfo.revisionColor, currentRevDate)
                      : (displayPageLabel ? `${displayPageLabel}.` : '');

                    const pageBreakDivider = isVisualBreak && (
                      <div className="page-break-divider no-print w-full select-none pointer-events-none my-4">
                        {breakData?.isMore && (
                          <div 
                            className="font-mono text-[11px] text-center uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 select-none"
                            style={{ 
                              fontFamily: elFontFamily,
                              marginLeft: el.dualPosition ? '0' : (format === 'US' ? '192px' : '50%'),
                              width: el.dualPosition ? '100%' : (format === 'US' ? '336px' : '45%')
                            }}
                          >
                            (MORE)
                          </div>
                        )}
                        <div className="relative flex items-center justify-center">
                          <div className={`w-full border-b border-dashed ${isBreakLocked ? (theme === 'dark' ? 'border-amber-500/50' : 'border-amber-400/60') : (theme === 'dark' ? 'border-slate-700/70' : 'border-slate-300')}`} />
                          <div className={`absolute px-3 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase shadow-xs flex items-center gap-1.5 ${
                            isBreakLocked
                              ? (theme === 'dark' ? 'bg-[#2a2415] text-amber-400 border border-amber-500/40' : 'bg-[#fef9ee] text-amber-700 border border-amber-300')
                              : (theme === 'dark' ? 'bg-[#1e252d] text-slate-400 border border-slate-700/60' : 'bg-[#f4efe6] text-slate-500 border border-[#dcd6cc]')
                          }`}>
                            {isBreakLocked && <Lock size={10} className="text-amber-500" />}
                            Sayfa {displayPageLabel}
                          </div>
                        </div>
                        <div className="flex justify-end pt-1.5 pr-1 items-center gap-2">
                          {revInfo?.hasRevision ? (
                            <span className={`font-mono text-xs select-none px-2 py-0.5 rounded font-medium ${
                              revInfo.revisionColor === 'blue' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' :
                              revInfo.revisionColor === 'pink' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' :
                              revInfo.revisionColor === 'yellow' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' :
                              revInfo.revisionColor === 'green' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {pageHeaderText}
                            </span>
                          ) : (
                            <span className={`font-mono text-xs select-none ${isBreakLocked ? 'text-amber-500 font-semibold' : (theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}`}>
                              {displayPageLabel}.
                            </span>
                          )}
                        </div>
                      </div>
                    );

                    const isDimmed = isFocusDimming && focusedId && focusedId !== el.id;
                    const focusDimClass = isDimmed ? 'opacity-25 hover:opacity-85 transition-opacity duration-200 cursor-pointer print:opacity-100' : 'transition-opacity duration-200';

                    const presence = remotePresences?.[el.id];
                    const presenceBorderClass = presence ? 'ring-1.5 ring-emerald-500/80 rounded-md' : '';

                    const limitData = !isInsideDual ? splitLimits[el.id] : undefined;
                    const splitSlices = limitData ? splitHtmlIntoSlices(el.content, [limitData.charLimit]) : null;
                    const isSplitElement = !!limitData && !!splitSlices && splitSlices.length >= 2;

                    if (isSplitElement && splitSlices) {
                      const splitPage2 = limitData.page2;
                      const displaySplitPage2 = coverPage && splitPage2 ? splitPage2 - 1 : splitPage2;
                      const displaySplitPage2Label = limitData.pageLabel2 || (displaySplitPage2 ? `${displaySplitPage2}` : '');
                      const isSplitLocked = isPagesLocked;

                      return (
                        <div 
                          key={el.id} 
                          className={`relative group flow-root ${revBgClass} ${revBorderClass} ${tableReadClass} ${focusDimClass} ${presenceBorderClass}`}
                          style={{ ...tableReadStyle }}
                          ref={ref => { wrapperRefs.current[el.id] = ref; }}
                        >
                          {/* Remote Collaborator Presence Badge */}
                          {presence && (
                            <div 
                              className="absolute -top-3 right-2 z-20 px-2 py-0.5 rounded-md text-[9px] font-sans font-medium text-white shadow-xs flex items-center gap-1 select-none pointer-events-none no-print opacity-90"
                              style={{ backgroundColor: presence.senderColor || '#38bdf8' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                              <span>{presence.senderName} {presence.status === 'typing' ? '• yazıyor' : ''}</span>
                            </div>
                          )}
                          {/* Active line indicator */}
                          {focusedId === el.id && (
                            <div 
                              className="absolute -left-6 md:-left-8 top-1 bottom-1 w-0.5 md:w-1 bg-sky-400/90 rounded-full select-none pointer-events-none no-print print:hidden shadow-xs" 
                            />
                          )}
                          {revStar}

                          {/* 1. SLICE 0 (Page N) */}
                          <div className="relative">
                            <ContentBlock
                              el={el}
                              sliceContent={splitSlices[0]}
                              sliceIndex={0}
                              inputRef={ref => {
                                if (!inputRefs.current[el.id] || focusedSliceIdRef.current === `${el.id}_0`) {
                                  inputRefs.current[el.id] = ref;
                                }
                                inputRefs.current[`${el.id}_0`] = ref;
                              }}
                              onChange={(content) => {
                                const combined = joinSlices(content, splitSlices[1]);
                                handleInput(combined, el.id);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, index, el)}
                              onPaste={(e) => onPaste(e, el.id, index)}
                              onFocus={() => {
                                setFocusedId(el.id);
                                focusedSliceIdRef.current = `${el.id}_0`;
                              }}
                              onMouseDown={(e) => handleMouseDown(e, el.id)}
                              onMouseEnter={(e) => handleMouseEnter(e, el.id)}
                              onMouseUp={handleMouseUp}
                              isSelected={selectedIds.includes(el.id)}
                              placeholder={getPlaceholder(el.type, el.dualPosition)}
                              className={`${getStyle(el.type, format, el.dualPosition)} print-break-${el.type}`}
                              style={{ 
                                fontFamily: elFontFamily, 
                                fontSize: `${elFontSize}pt`, 
                                color: elFontColor 
                              }}
                              dataType={el.type}
                              isFocused={focusedId === el.id && (focusedSliceIdRef.current === `${el.id}_0` || !focusedSliceIdRef.current)}
                            />

                            {/* (MORE) below Slice 0 on Page N if Dialogue */}
                            {limitData.isDialogue && (
                              <div 
                                className="font-mono text-[11px] text-center uppercase tracking-widest text-slate-400 dark:text-slate-500 my-1.5 select-none print:text-black"
                                style={{ 
                                  fontFamily: elFontFamily, 
                                  marginLeft: el.dualPosition ? '0' : (format === 'US' ? '192px' : '50%'),
                                  width: el.dualPosition ? '100%' : (format === 'US' ? '336px' : '45%')
                                }}
                              >
                                (MORE)
                              </div>
                            )}
                          </div>

                          {/* 2. PAGE BREAK DIVIDER (Screen) & 3. PRINT PAGE BREAK */}
                          {(() => {
                            const splitRevInfo = displaySplitPage2Label ? pageRevisionMap[displaySplitPage2Label] : undefined;
                            const splitHeaderText = splitRevInfo?.hasRevision
                              ? getRevisionHeaderText(displaySplitPage2Label, splitRevInfo.revisionColor, currentRevDate)
                              : (displaySplitPage2Label ? `${displaySplitPage2Label}.` : '');

                            return (
                              <>
                                <div className="page-break-divider no-print w-full select-none pointer-events-none my-4">
                                  <div className="relative flex items-center justify-center">
                                    <div className={`w-full border-b border-dashed ${isSplitLocked ? (theme === 'dark' ? 'border-amber-500/50' : 'border-amber-400/60') : (theme === 'dark' ? 'border-slate-700/70' : 'border-slate-300')}`} />
                                    <div className={`absolute px-3 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase shadow-xs flex items-center gap-1.5 ${
                                      isSplitLocked
                                      ? (theme === 'dark' ? 'bg-[#2a2415] text-amber-400 border border-amber-500/40' : 'bg-[#fef9ee] text-amber-700 border border-amber-300')
                                      : (theme === 'dark' ? 'bg-[#1e252d] text-slate-400 border border-slate-700/60' : 'bg-[#f4efe6] text-slate-500 border border-[#dcd6cc]')
                                    }`}>
                                      {isSplitLocked && <Lock size={10} className="text-amber-500" />}
                                      Sayfa {displaySplitPage2Label}
                                    </div>
                                  </div>
                                  <div className="flex justify-end pt-1.5 pr-1 items-center gap-2">
                                    {splitRevInfo?.hasRevision ? (
                                      <span className={`font-mono text-xs select-none px-2 py-0.5 rounded font-medium ${
                                        splitRevInfo.revisionColor === 'blue' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' :
                                        splitRevInfo.revisionColor === 'pink' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' :
                                        splitRevInfo.revisionColor === 'yellow' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' :
                                        splitRevInfo.revisionColor === 'green' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                      }`}>
                                        {splitHeaderText}
                                      </span>
                                    ) : (
                                      <span className={`font-mono text-xs select-none ${isSplitLocked ? 'text-amber-500 font-semibold' : (theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}`}>
                                        {displaySplitPage2Label}.
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 3. PRINT PAGE BREAK & PAGE NUMBER */}
                                <div className="hidden print:block print-page-break" style={{ height: 0 }} />
                                {displaySplitPage2Label && (displaySplitPage2Label !== '1' || splitRevInfo?.hasRevision) && (
                                  <div 
                                    className="font-mono text-sm hidden print:block print:text-black select-none pointer-events-none text-right mb-4"
                                    style={{ 
                                      top: '-0.4in',
                                      fontFamily: elFontFamily 
                                    }}
                                  >
                                    {splitHeaderText}
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          {/* 4. SLICE 1 (Page N+1) */}
                          <div className="relative">
                            {/* {CHARACTER} (DEVAM) above Slice 1 if Dialogue */}
                            {limitData.isDialogue && (
                              <div 
                                className="font-bold uppercase mb-1 print:text-black"
                                style={{ 
                                  fontFamily: elFontFamily, 
                                  fontSize: `${elFontSize}pt`, 
                                  color: elFontColor,
                                  marginLeft: el.dualPosition ? '0' : (format === 'US' ? '192px' : '50%'),
                                  width: el.dualPosition ? '100%' : (format === 'US' ? '336px' : '45%')
                                }}
                              >
                                {speakingCharacters[el.id] || currentChar || 'KARAKTER'} (DEVAM)
                              </div>
                            )}

                            <ContentBlock
                              el={el}
                              sliceContent={splitSlices[1]}
                              sliceIndex={1}
                              inputRef={ref => {
                                inputRefs.current[`${el.id}_1`] = ref;
                              }}
                              onChange={(content) => {
                                const combined = joinSlices(splitSlices[0], content);
                                handleInput(combined, el.id);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, index, el)}
                              onPaste={(e) => onPaste(e, el.id, index)}
                              onFocus={() => {
                                setFocusedId(el.id);
                                focusedSliceIdRef.current = `${el.id}_1`;
                              }}
                              onMouseDown={(e) => handleMouseDown(e, el.id)}
                              onMouseEnter={(e) => handleMouseEnter(e, el.id)}
                              onMouseUp={handleMouseUp}
                              isSelected={selectedIds.includes(el.id)}
                              placeholder={getPlaceholder(el.type, el.dualPosition)}
                              className={`${getStyle(el.type, format, el.dualPosition).replace(/mt-\d+/g, 'mt-1')} print-break-${el.type}`}
                              style={{ 
                                fontFamily: elFontFamily, 
                                fontSize: `${elFontSize}pt`, 
                                color: elFontColor 
                              }}
                              dataType={el.type}
                              isFocused={focusedId === el.id && focusedSliceIdRef.current === `${el.id}_1`}
                            />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <React.Fragment key={el.id}>
                        {pageBreakDivider}
                        <div 
                          key={el.id} 
                          className={`relative group flow-root ${breakClasses.join(' ')} ${revBgClass} ${revBorderClass} ${tableReadClass} ${focusDimClass} ${presenceBorderClass}`}
                          style={{ ...breakStyles, ...tableReadStyle }}
                          ref={ref => { wrapperRefs.current[el.id] = ref; }}
                        >
                        {/* Remote Collaborator Presence Badge */}
                        {presence && (
                          <div 
                            className="absolute -top-3 right-2 z-20 px-2 py-0.5 rounded-md text-[9px] font-sans font-medium text-white shadow-xs flex items-center gap-1 select-none pointer-events-none no-print opacity-90"
                            style={{ backgroundColor: presence.senderColor || '#38bdf8' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                            <span>{presence.senderName} {presence.status === 'typing' ? '• yazıyor' : ''}</span>
                          </div>
                        )}
                        {/* Active line indicator (left blue line marker) */}
                        {focusedId === el.id && (
                          <div 
                            className="absolute -left-6 md:-left-8 top-1 bottom-1 w-0.5 md:w-1 bg-sky-400/90 rounded-full select-none pointer-events-none no-print print:hidden shadow-xs" 
                            />
                        )}
                        {revStar}
                        {isContinuation && (el.type === 'dialogue' || el.type === 'parenthetical') && (
                          <div 
                            className="font-bold uppercase mb-1 print:text-black"
                            style={{ 
                              fontFamily: elFontFamily, 
                              fontSize: `${elFontSize}pt`, 
                              color: elFontColor,
                              marginLeft: el.dualPosition ? '0' : (format === 'US' ? '192px' : '50%'),
                              width: el.dualPosition ? '100%' : (format === 'US' ? '336px' : '45%')
                            }}
                          >
                            {currentChar} (DEVAM)
                          </div>
                        )}
                        {displayPageLabel && !isInsideDual && (displayPageLabel !== '1' || revInfo?.hasRevision) && (
                          <div 
                            className="absolute right-0 font-mono text-sm hidden print:block print:text-black select-none pointer-events-none"
                            style={{ 
                              top: '-0.5in',
                              fontFamily: elFontFamily 
                            }}
                          >
                            {pageHeaderText}
                          </div>
                        )}
                        {el.type === 'scene' && el.colorTag && (
                          <div 
                            className="absolute top-0 bottom-0 -left-6 md:-left-[68px] w-1 rounded-full z-10 no-print opacity-80"
                            style={{ backgroundColor: el.colorTag }}
                          />
                        )}
                        {el.type === 'scene' && focusedId === el.id && onUpdateElement && (
                          <div className="absolute -left-[54px] md:-left-[90px] top-4 hidden md:flex items-center no-print z-20">
                            <button 
                              onClick={() => setActiveColorMenuId(activeColorMenuId === el.id ? null : el.id)}
                              className="p-1.5 rounded opacity-30 hover:opacity-100 hover:bg-slate-500/10 transition-all"
                              title="Hikaye Etiketi Ekle"
                            >
                              <Tag size={13} color={el.colorTag || (theme === 'dark' ? '#94a3b8' : '#64748b')} className={el.colorTag ? 'opacity-100' : ''} />
                            </button>
                            
                            {activeColorMenuId === el.id && (
                              <div className={`absolute top-full mt-1 left-0 flex flex-wrap w-[120px] gap-1.5 p-2 rounded-xl shadow-lg border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                {TAG_COLORS.map(c => (
                                  <button
                                    key={c.label}
                                    onClick={() => {
                                      onUpdateElement(el.id, { colorTag: c.value });
                                      setActiveColorMenuId(null);
                                    }}
                                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${!c.value ? 'border border-dashed border-slate-400 dark:border-slate-600' : ''}`}
                                    style={{ backgroundColor: c.value || 'transparent' }}
                                    title={c.label}
                                  >
                                    {!c.value && <div className="w-4 h-px bg-slate-400 dark:bg-slate-600 rotate-45" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {el.type === 'scene' ? (
                          <div className="scene-row flex items-baseline w-full">
                            {el.sceneNumber ? (
                              <span 
                                className="scene-num-badge font-mono font-bold select-none shrink-0 opacity-70 print:opacity-100 print:text-black mr-2 md:mr-3 leading-[1.3] text-[12pt]"
                                style={{ fontFamily: elFontFamily, fontSize: `${elFontSize}pt`, color: elFontColor }}
                              >
                                {el.sceneNumber}.
                              </span>
                            ) : null}
                            <ContentBlock
                              el={el}
                              inputRef={ref => {
                                inputRefs.current[el.id] = ref;
                              }}
                              onChange={(content) => handleInput(content, el.id)}
                              onKeyDown={(e) => handleKeyDown(e, index, el)}
                              onPaste={(e) => onPaste(e, el.id, index)}
                              onFocus={() => setFocusedId(el.id)}
                              onMouseDown={(e) => handleMouseDown(e, el.id)}
                              onMouseEnter={(e) => handleMouseEnter(e, el.id)}
                              onMouseUp={handleMouseUp}
                              isSelected={selectedIds.includes(el.id)}
                              placeholder={getPlaceholder(el.type, el.dualPosition)}
                              className={`flex-1 ${getStyle(el.type, format, el.dualPosition)} print-break-${el.type}`}
                              style={{ 
                                fontFamily: elFontFamily, 
                                fontSize: `${elFontSize}pt`, 
                                color: elFontColor 
                              }}
                              dataType={el.type}
                              isFocused={focusedId === el.id}
                            />
                          </div>
                        ) : (
                          <ContentBlock
                            el={el}
                            inputRef={ref => {
                              inputRefs.current[el.id] = ref;
                            }}
                            onChange={(content) => handleInput(content, el.id)}
                            onKeyDown={(e) => handleKeyDown(e, index, el)}
                            onPaste={(e) => onPaste(e, el.id, index)}
                            onFocus={() => setFocusedId(el.id)}
                            onMouseDown={(e) => handleMouseDown(e, el.id)}
                            onMouseEnter={(e) => handleMouseEnter(e, el.id)}
                            onMouseUp={handleMouseUp}
                            isSelected={selectedIds.includes(el.id)}
                            placeholder={getPlaceholder(el.type, el.dualPosition)}
                            className={`${getStyle(el.type, format, el.dualPosition)} print-break-${el.type}`}
                            style={{ 
                              fontFamily: elFontFamily, 
                              fontSize: `${elFontSize}pt`, 
                              color: elFontColor 
                            }}
                            dataType={el.type}
                            suffix={isContinuation && el.type === 'character' ? ' (DEVAM)' : undefined}
                            isFocused={focusedId === el.id}
                          />
                        )}
                        
                        {index === elements.length - 1 && (
                          <div className="hidden print:block h-[96px] w-full" aria-hidden="true" />
                        )}
                        
                        {currentSuggestions.length > 0 && (
                          <div className={`absolute z-10 w-48 border rounded shadow-lg mt-1 ${matchingChars.length > 0 ? suggestionMargin : ''} ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-[#fdfcf7] border-[#dcd6cc]'}`}>
                            {currentSuggestions.map((c, i) => (
                              <div 
                                key={c} 
                                className={`px-3 py-1 text-sm cursor-pointer ${i === safeSuggestionIndex ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-[#e8e5de]')}`}
                                onClick={() => {
                                  onChange(el.id, c);
                                  onAdd(el.id, matchingChars.length > 0 ? 'dialogue' : 'action');
                                }}
                              >
                                {c}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      </React.Fragment>
                    );
                  };

                  const renderGroups = groupElementsForRender(elements);

                  return renderGroups.map(group => {
                    if (group.kind === 'single') {
                      return renderSingleElement(group.element, group.index);
                    }

                    const firstElId = group.left[0]?.element.id || group.right[0]?.element.id || '';
                    const dualBreakData = firstElId ? pageBreaks[firstElId] : undefined;
                    const isDualPageBreak = !!dualBreakData && (firstElId !== elements[0]?.id || dualBreakData.isCoverBreak);
                    const isDualVisualBreak = !!dualBreakData && firstElId !== elements[0]?.id;
                    const dualBreakClasses: string[] = [];
                    if (isDualPageBreak) dualBreakClasses.push('print-page-break');
                    if (isDualVisualBreak) dualBreakClasses.push('visual-page-break');
                    const dualBreakStyles: React.CSSProperties = {};
                    if (isDualPageBreak) (dualBreakStyles as any)['--print-mt'] = '96px';
                    if (isDualVisualBreak) (dualBreakStyles as any)['--visual-mt'] = `${dualBreakData.jump}px`;

                    const dualPageNum = dualBreakData?.page;
                    const displayDualPageNum = coverPage && dualPageNum ? dualPageNum - 1 : dualPageNum;
                    const displayDualPageLabel = dualBreakData?.pageLabel || (displayDualPageNum ? `${displayDualPageNum}` : '');
                    const isDualBreakLocked = isPagesLocked || dualBreakData?.isLocked;
                    const hasActiveChild = [...group.left, ...group.right].some(item => focusedId === item.element.id);

                    const dualRevInfo = displayDualPageLabel ? pageRevisionMap[displayDualPageLabel] : undefined;
                    const dualHeaderText = dualRevInfo?.hasRevision 
                      ? getRevisionHeaderText(displayDualPageLabel, dualRevInfo.revisionColor, currentRevDate)
                      : (displayDualPageLabel ? `${displayDualPageLabel}.` : '');

                    const dualPageBreakDivider = isDualVisualBreak && (
                      <div className="page-break-divider no-print w-full select-none pointer-events-none my-8">
                        <div className="relative flex items-center justify-center">
                          <div className={`w-full border-b border-dashed ${isDualBreakLocked ? (theme === 'dark' ? 'border-amber-500/50' : 'border-amber-400/60') : (theme === 'dark' ? 'border-slate-700/70' : 'border-slate-300')}`} />
                          <div className={`absolute px-3 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase shadow-xs flex items-center gap-1.5 ${
                            isDualBreakLocked
                              ? (theme === 'dark' ? 'bg-[#2a2415] text-amber-400 border border-amber-500/40' : 'bg-[#fef9ee] text-amber-700 border border-amber-300')
                              : (theme === 'dark' ? 'bg-[#1e252d] text-slate-400 border border-slate-700/60' : 'bg-[#f4efe6] text-slate-500 border border-[#dcd6cc]')
                          }`}>
                            {isDualBreakLocked && <Lock size={10} className="text-amber-500" />}
                            Sayfa {displayDualPageLabel}
                          </div>
                        </div>
                        <div className="flex justify-end pt-2 pr-1 items-center gap-2">
                          {dualRevInfo?.hasRevision ? (
                            <span className={`font-mono text-xs select-none px-2 py-0.5 rounded font-medium ${
                              dualRevInfo.revisionColor === 'blue' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' :
                              dualRevInfo.revisionColor === 'pink' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' :
                              dualRevInfo.revisionColor === 'yellow' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' :
                              dualRevInfo.revisionColor === 'green' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {dualHeaderText}
                            </span>
                          ) : (
                            <span className={`font-mono text-xs select-none ${isDualBreakLocked ? 'text-amber-500 font-semibold' : (theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}`}>
                              {displayDualPageLabel}.
                            </span>
                          )}
                        </div>
                      </div>
                    );

                    const isDualDimmed = isFocusDimming && focusedId && !hasActiveChild;
                    const dualFocusDimClass = isDualDimmed ? 'opacity-25 hover:opacity-85 transition-opacity duration-200 cursor-pointer print:opacity-100' : 'transition-opacity duration-200';

                    return (
                      <React.Fragment key={group.id}>
                        {dualPageBreakDivider}
                        <div 
                          key={group.id} 
                          className={`dual-dialogue-container group/dual relative my-2 p-2 sm:p-2.5 rounded-lg transition-all ${dualFocusDimClass} ${
                            hasActiveChild 
                              ? (theme === 'dark' ? 'border border-slate-700/80 bg-white/[0.015]' : 'border border-[#d0c6b6] bg-black/[0.01]') 
                              : (theme === 'dark' ? 'border border-transparent hover:border-slate-800/80' : 'border border-transparent hover:border-[#e4dcd0]/80')
                          } print:border-none print:bg-transparent print:p-0 print:my-2 ${dualBreakClasses.join(' ')}`}
                          style={dualBreakStyles}
                        >
                          {/* Dual Dialogue Visual Header / Badges (Only on screen, hidden on print - Minimalist & Sleek) */}
                          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-black/5 dark:border-white/5 text-[10px] font-mono select-none no-print print:hidden opacity-50 group-hover/dual:opacity-90 transition-opacity">
                            <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                              <Columns2 size={11} className="opacity-70" />
                              <span>Çift Diyalog</span>
                            </div>
                            {onToggleDualDialogue && (
                              <button
                                onClick={() => onToggleDualDialogue(firstElId)}
                                className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Tekrar tek sütunlu klasik diyalog formatına dönüştür"
                              >
                                ✕ Tek Sütuna Çöz
                              </button>
                            )}
                          </div>

                          {displayDualPageLabel && (displayDualPageLabel !== '1' || dualRevInfo?.hasRevision) && (
                            <div 
                              className="absolute right-0 font-mono text-sm hidden print:block print:text-black select-none pointer-events-none"
                              style={{ 
                                top: '-0.4in',
                                fontFamily: fontFamily 
                              }}
                            >
                              {dualHeaderText}
                            </div>
                          )}

                          <div className="flex flex-row gap-4 sm:gap-6 w-full items-start">
                            {/* Sol Sütun */}
                            <div className="dual-column-left flex-1 min-w-0 flex flex-col relative pr-2 sm:pr-3 border-r border-dashed border-slate-300/30 dark:border-slate-700/30 print:border-none print:pr-0">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-center text-slate-400/60 dark:text-slate-500/60 mb-1 no-print print:hidden select-none font-medium">
                                1. Konuşmacı (Sol)
                              </div>
                              {group.left.map(item => renderSingleElement(item.element, item.index, true))}
                            </div>

                            {/* Sağ Sütun */}
                            <div className="dual-column-right flex-1 min-w-0 flex flex-col relative pl-2 sm:pl-3 print:pl-0">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-center text-slate-400/60 dark:text-slate-500/60 mb-1 no-print print:hidden select-none font-semibold">
                                2. Konuşmacı (Sağ)
                              </div>
                              {group.right.map(item => renderSingleElement(item.element, item.index, true))}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()}
        </div>
      </div>
    </div>
  );
}

interface ContentBlockProps {
  el: ScreenplayElement;
  sliceContent?: string;
  sliceIndex?: number;
  onChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className: string;
  style: React.CSSProperties;
  placeholder: string;
  inputRef: (ref: HTMLDivElement | null) => void;
  dataType?: string;
  isSelected?: boolean;
  suffix?: string;
  isFocused?: boolean;
}

function ContentBlock({ 
  el, sliceContent, sliceIndex, onChange, onKeyDown, onPaste, onFocus, 
  onMouseDown, onMouseEnter, onMouseUp, className, style, placeholder, 
  inputRef, dataType, isSelected, suffix, isFocused 
}: ContentBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const activeContent = sliceContent !== undefined ? sliceContent : el.content;

  useLayoutEffect(() => {
    if (isFocused && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
      if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [isFocused]);

  useLayoutEffect(() => {
    if (ref.current) {
      let sanitized = DOMPurify.sanitize(activeContent, { ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'div', 'span', 'font', 'p'], ALLOWED_ATTR: ['style', 'color', 'face', 'size', 'class'] });
      if (suffix) {
        sanitized = sanitized.replace(/^(<br\s*\/?>|<div><br><\/div>|<p><br><\/p>|\s|&nbsp;)+|(<br\s*\/?>|<div><br><\/div>|<p><br><\/p>|\s|&nbsp;)+$/gi, '');
        if (sanitized === '') sanitized = activeContent; // fallback
      }
      
      const displayContent = suffix ? `${sanitized}${suffix}` : sanitized;

      const currentInner = ref.current.innerHTML;
      const normalize = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      if (currentInner !== displayContent && normalize(currentInner) !== normalize(displayContent)) {
        ref.current.innerHTML = displayContent;
      }
    }
  }, [activeContent, suffix]);

  return (
    <div
      ref={(r) => {
        ref.current = r;
        inputRef(r);
      }}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => {
        let val = e.currentTarget.innerHTML;
        const plainText = e.currentTarget.textContent || '';
        if (plainText.trim() === '') {
          val = '';
        }
        if (val !== activeContent) {
          onChange(val);
        }
      }}
      onBlur={(e) => {
        let sanitized = DOMPurify.sanitize(e.currentTarget.innerHTML, { ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'div', 'span', 'font', 'p'], ALLOWED_ATTR: ['style', 'color', 'face', 'size', 'class'] });
        let cleaned = sanitized.replace(/^(<br\s*\/?>|<div><br><\/div>|<p><br><\/p>|\s|&nbsp;)+|(<br\s*\/?>|<div><br><\/div>|<p><br><\/p>|\s|&nbsp;)+$/gi, '');
        if (cleaned.replace(/<[^>]+>/g, '').trim() === '') sanitized = '';
        
        if (sanitized !== activeContent) {
          onChange(sanitized);
        }
      }}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onFocus={onFocus}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      className={`element-content-measure ${className} ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30 outline-none print:bg-transparent' : ''}`}
      style={style}
      data-placeholder={placeholder}
      data-type={dataType}
      data-element-id={el.id}
      data-slice-content={sliceIndex !== undefined ? String(sliceIndex) : undefined}
    />
  );
}
