import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ScreenplayElement } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Pencil, Check, FileText, Trash2, Maximize2, X, Tag, 
  Clock, Type, Pin, ExternalLink, Sparkles, MessageSquare, 
  Film, AlignLeft, CornerDownLeft, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CorkboardProps {
  elements: ScreenplayElement[];
  onReorderScenesArray: (newOrder: ScreenplayElement[]) => void;
  onUpdateSceneText: (sceneId: string, newText: string) => void;
  onUpdateElement?: (id: string, updates: Partial<ScreenplayElement>) => void;
  onRemoveElement?: (id: string) => void;
  theme: 'dark' | 'light';
  setFocusedId: (id: string) => void;
  setViewMode: (mode: 'editor' | 'cards') => void;
}

interface SceneGroup {
  id: string;
  heading: ScreenplayElement;
  children: ScreenplayElement[];
}

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

const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
};

const serializeSceneChildrenToText = (children: ScreenplayElement[]): string => {
  if (!children || children.length === 0) return '';
  const lines: string[] = [];
  let lastType: string = '';

  for (const child of children) {
    if (!child) continue;
    const plain = stripHtml(child.content || '');
    if (!plain) continue;

    if (child.type === 'character') {
      if (lines.length > 0 && lastType !== 'parenthetical') {
        lines.push('');
      }
      lines.push(plain.toLocaleUpperCase('tr-TR'));
      lastType = 'character';
    } else if (child.type === 'parenthetical') {
      const parenText = (plain.startsWith('(') && plain.endsWith(')')) ? plain : `(${plain})`;
      lines.push(parenText);
      lastType = 'parenthetical';
    } else if (child.type === 'dialogue') {
      lines.push(plain);
      lastType = 'dialogue';
    } else if (child.type === 'transition') {
      if (lines.length > 0) lines.push('');
      lines.push(plain.toLocaleUpperCase('tr-TR'));
      lastType = 'transition';
    } else {
      if (lines.length > 0) lines.push('');
      lines.push(plain);
      lastType = 'action';
    }
  }

  return lines.join('\n');
};

interface SortableCardProps {
  scene: SceneGroup;
  sceneIndex: number;
  theme: 'dark' | 'light';
  onOpenEnlarged: () => void;
  onOpenInScript: () => void;
  onRemoveElement?: (id: string) => void;
}

const SortableCard: React.FC<SortableCardProps> = ({ 
  scene, 
  sceneIndex,
  theme, 
  onOpenEnlarged, 
  onOpenInScript, 
  onRemoveElement 
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: scene.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  const bgClass = theme === 'dark' 
    ? 'bg-[#252c33] border-[#2d3640] text-slate-200 hover:border-[#6ba3e8]/60' 
    : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900 hover:border-blue-700/60';
    
  const shadowClass = isDragging 
    ? (theme === 'dark' ? 'shadow-2xl scale-105 rotate-1 ring-2 ring-[#6ba3e8]' : 'shadow-2xl scale-105 rotate-1 ring-2 ring-blue-700') 
    : 'shadow-sm hover:shadow-md hover:-translate-y-0.5';

  const headingText = stripHtml(scene.heading?.content || `SAHNE ${sceneIndex + 1}`);

  const snippetItems = useMemo(() => {
    return (scene.children || [])
      .filter(c => c && stripHtml(c.content || '').length > 0 && c.type !== 'transition')
      .slice(0, 6);
  }, [scene.children]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative flex flex-col p-3.5 sm:p-4 rounded-2xl border ${bgClass} ${shadowClass} transition-all duration-200 group select-none min-h-[220px] max-h-[280px] overflow-hidden`}
    >
      {/* Top drag handle indicator */}
      <div 
        {...listeners}
        className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b cursor-grab active:cursor-grabbing border-inherit"
        title="Sürükleyip Yeniden Sırala"
      >
        <div className="flex items-center gap-1.5 truncate flex-1 pr-1">
          {scene.heading?.colorTag && (
            <div 
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
              style={{ backgroundColor: scene.heading.colorTag }}
            />
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
            theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-700 text-white'
          }`}>
            #{scene.heading?.sceneNumber || sceneIndex + 1}
          </span>
          <span className="truncate font-bold tracking-tight text-xs" title={headingText}>
            {headingText}
          </span>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenEnlarged(); }} 
            className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-[#6ba3e8]' : 'hover:bg-black/10 text-blue-700'}`} 
            title="Post-iti Büyüt ve Rahatça Yaz"
          >
            <Maximize2 size={13} />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenInScript(); }} 
            className="p-1 rounded opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10" 
            title="Senaryo Editöründe Aç"
          >
            <FileText size={13} />
          </button>
          {onRemoveElement && (
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (window.confirm('Bu sahneyi silmek istediğinize emin misiniz?')) {
                  onRemoveElement(scene.id); 
                }
              }} 
              className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors" 
              title="Sahneyi Sil"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Clickable Card Body snippet */}
      <div 
        onClick={onOpenEnlarged}
        className="flex-1 flex flex-col cursor-pointer overflow-hidden relative"
      >
        {snippetItems.length > 0 ? (
          <div className="text-[11px] font-mono leading-relaxed opacity-85 space-y-1 overflow-hidden">
            {snippetItems.map((item, idx) => {
              const text = stripHtml(item.content || '');
              if (item.type === 'character') {
                return (
                  <div key={idx} className={`font-bold mt-1 truncate ${theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-900'}`}>
                    {text.toLocaleUpperCase('tr-TR')}
                  </div>
                );
              }
              if (item.type === 'dialogue') {
                return (
                  <div key={idx} className="pl-2 italic opacity-90 truncate">
                    "{text}"
                  </div>
                );
              }
              return (
                <div key={idx} className="opacity-75 truncate">
                  {text}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 opacity-40 hover:opacity-75 transition-opacity border border-dashed rounded-xl border-inherit">
            <Pencil size={16} className={`mb-1 ${theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'}`} />
            <span className="text-[11px]">Yazmak için tıklayın</span>
          </div>
        )}

        {/* Hover click-to-enlarge banner */}
        <div className={`absolute inset-x-0 bottom-0 pt-4 pb-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[10px] font-semibold ${
          theme === 'dark' ? 'bg-gradient-to-t from-[#252c33] text-[#6ba3e8]' : 'bg-gradient-to-t from-[#FFFFF0] text-blue-700'
        }`}>
          <Maximize2 size={11} />
          <span>Tıkla & Büyüt</span>
        </div>
      </div>
    </div>
  );
};

interface EnlargedPostItModalProps {
  scene: SceneGroup;
  sceneIndex: number;
  theme: 'dark' | 'light';
  onClose: () => void;
  onSave: (sceneId: string, newText: string, newHeading: string, colorTag: string) => void;
  onOpenInScript: (sceneId: string) => void;
}

const EnlargedPostItModal: React.FC<EnlargedPostItModalProps> = ({
  scene,
  sceneIndex,
  theme,
  onClose,
  onSave,
  onOpenInScript,
}) => {
  const [bodyText, setBodyText] = useState(() => serializeSceneChildrenToText(scene.children));
  const [headingText, setHeadingText] = useState(() => stripHtml(scene.heading?.content || `SAHNE ${sceneIndex + 1}`));
  const [colorTag, setColorTag] = useState<string>(() => scene.heading?.colorTag || '');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Focus textarea on modal mount
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut listener: Cmd/Ctrl+Enter to save, Escape to close & save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSaveAndClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bodyText, headingText, colorTag]);

  const handleSaveAndClose = () => {
    onSave(scene.id, bodyText, headingText, colorTag);
    onClose();
  };

  const handleInsertHelper = (helperType: 'character' | 'dialogue' | 'action' | 'parenthetical' | 'uppercase') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = bodyText.substring(start, end);

    let insertion = '';
    let newCursorPos = start;

    if (helperType === 'character') {
      insertion = (start > 0 && bodyText[start - 1] !== '\n' ? '\n\n' : '') + 'KARAKTER ADI\n';
      newCursorPos = start + insertion.length;
    } else if (helperType === 'parenthetical') {
      insertion = '(fısıldar)\n';
      newCursorPos = start + insertion.length;
    } else if (helperType === 'action') {
      insertion = (start > 0 && bodyText[start - 1] !== '\n' ? '\n\n' : '') + 'Sahne aksiyonunu ve ortam detaylarını buraya yazın.\n';
      newCursorPos = start + insertion.length;
    } else if (helperType === 'uppercase') {
      if (selectedText) {
        insertion = selectedText.toLocaleUpperCase('tr-TR');
        const nextText = bodyText.substring(0, start) + insertion + bodyText.substring(end);
        setBodyText(nextText);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start, start + insertion.length);
        }, 10);
        return;
      } else {
        insertion = 'BÜYÜK HARF';
        newCursorPos = start + insertion.length;
      }
    }

    const nextText = bodyText.substring(0, start) + insertion + bodyText.substring(end);
    setBodyText(nextText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab key to insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const nextText = bodyText.substring(0, start) + '  ' + bodyText.substring(end);
      setBodyText(nextText);
      setTimeout(() => {
        el.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  // Metrics
  const wordsCount = useMemo(() => {
    const trimmed = bodyText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [bodyText]);

  const charsCount = bodyText.length;
  const linesCount = bodyText.split('\n').length;
  const estSeconds = Math.max(10, Math.round(wordsCount / 2.5));

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to save and close */}
      <div className="absolute inset-0" onClick={handleSaveAndClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`relative z-10 w-full max-w-4xl h-[86vh] max-h-[820px] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
          isDark 
            ? 'bg-[#20272e] border-[#2d3640] text-slate-100 shadow-black/80' 
            : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#1a1f25] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]'
        }`}>
          {/* Left: Scene Number + Editable Heading + Color Tag */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
            <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs shrink-0 ${
              isDark ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-700 text-white'
            }`}>
              SAHNE #{scene.heading?.sceneNumber || sceneIndex + 1}
            </span>

            {/* Editable Scene Heading input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={headingText}
                onChange={(e) => setHeadingText(e.target.value.toLocaleUpperCase('tr-TR'))}
                placeholder="İÇ. MEKAN - GÜN"
                className={`w-full font-bold text-sm px-3 py-1.5 rounded-xl border outline-none font-mono uppercase tracking-wide transition-all ${
                  isDark 
                    ? 'bg-[#14181c] border-[#2d3640] text-slate-100 focus:border-[#6ba3e8] focus:ring-1 focus:ring-[#6ba3e8]' 
                    : 'bg-white border-[#c8bea8] text-slate-900 focus:border-blue-700 focus:ring-1 focus:ring-blue-700'
                }`}
                title="Sahne Başlığı (Düzenleyebilirsiniz)"
              />
            </div>

            {/* Color Tag Picker */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                className={`p-2 rounded-xl border flex items-center gap-1.5 transition-colors ${
                  isDark ? 'border-[#2d3640] bg-[#14181c] hover:bg-[#252c33]' : 'border-[#c8bea8] bg-white hover:bg-[#dfd7ca]'
                }`}
                title="Post-It Etiket Rengi"
              >
                <div 
                  className={`w-3.5 h-3.5 rounded-full ${!colorTag ? 'border border-dashed border-slate-400' : 'shadow-sm'}`}
                  style={{ backgroundColor: colorTag || 'transparent' }}
                />
                <Tag size={13} className="opacity-60" />
              </button>

              {colorPickerOpen && (
                <div className={`absolute top-full mt-2 left-0 z-30 p-2.5 rounded-2xl shadow-xl border flex items-center gap-2 ${
                  isDark ? 'bg-[#20272e] border-[#2d3640]' : 'bg-[#FFFFF0] border-[#c8bea8]'
                }`}>
                  {TAG_COLORS.map(c => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => {
                        setColorTag(c.value);
                        setColorPickerOpen(false);
                      }}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-125 flex items-center justify-center"
                      style={{ backgroundColor: c.value || '#cbd5e1' }}
                      title={c.label}
                    >
                      {colorTag === c.value && <Check size={12} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                handleSaveAndClose();
                onOpenInScript(scene.id);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isDark 
                  ? 'border-[#2d3640] bg-[#14181c] text-slate-300 hover:bg-[#252c33] hover:text-white' 
                  : 'border-[#c8bea8] bg-white text-slate-700 hover:bg-[#dfd7ca]'
              }`}
              title="Senaryo Editöründe Bu Sahneye Git"
            >
              <FileText size={14} className={isDark ? 'text-[#6ba3e8]' : 'text-blue-700'} />
              <span className="hidden sm:inline">Senaryoda Aç</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
              }`}
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={handleSaveAndClose}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isDark 
                  ? 'bg-[#6ba3e8] hover:bg-[#5a92d7] text-slate-950' 
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              <Check size={14} />
              <span>Kaydet ve Kapat</span>
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">⌘+Enter</kbd>
            </button>
          </div>
        </div>

        {/* Formatting Quick-Toolbar */}
        <div className={`px-5 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
          isDark ? 'bg-[#181d22] border-[#2d3640]' : 'bg-[#f0e8dc] border-[#c8bea8]'
        }`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold opacity-60 mr-1 flex items-center gap-1">
              <Sparkles size={12} className={isDark ? 'text-[#6ba3e8]' : 'text-blue-700'} /> Hızlı Ekle:
            </span>
            <button
              type="button"
              onClick={() => handleInsertHelper('character')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold font-mono transition-colors ${
                isDark ? 'border-[#2d3640] bg-[#20272e] hover:bg-[#252c33] text-[#6ba3e8]' : 'border-[#c8bea8] bg-white hover:bg-[#dfd7ca] text-blue-900'
              }`}
            >
              + KARAKTER
            </button>
            <button
              type="button"
              onClick={() => handleInsertHelper('parenthetical')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                isDark ? 'border-[#2d3640] bg-[#20272e] hover:bg-[#252c33] text-slate-300' : 'border-[#c8bea8] bg-white hover:bg-[#dfd7ca] text-slate-800'
              }`}
            >
              + (Parantez)
            </button>
            <button
              type="button"
              onClick={() => handleInsertHelper('action')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                isDark ? 'border-[#2d3640] bg-[#20272e] hover:bg-[#252c33] text-slate-300' : 'border-[#c8bea8] bg-white hover:bg-[#dfd7ca] text-slate-800'
              }`}
            >
              + Aksiyon
            </button>
            <button
              type="button"
              onClick={() => handleInsertHelper('uppercase')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold font-mono transition-colors ${
                isDark ? 'border-[#2d3640] bg-[#20272e] hover:bg-[#252c33] text-slate-300' : 'border-[#c8bea8] bg-white hover:bg-[#dfd7ca] text-slate-800'
              }`}
              title="Seçili metni BÜYÜK HARFE çevir"
            >
              BÜYÜK HARF
            </button>
          </div>

          <div className="text-[11px] opacity-60 hidden lg:flex items-center gap-1.5 font-sans">
            <CornerDownLeft size={11} />
            <span>Karakter adını büyük harfle yazıp altına repliğini girebilirsiniz.</span>
          </div>
        </div>

        {/* Main Spacious Writing Canvas */}
        <div className="flex-1 p-5 sm:p-7 flex flex-col overflow-hidden relative">
          <textarea
            ref={textareaRef}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={`Sahne aksiyonunu ve diyaloglarını buraya rahatça yazın...\n\nÖrnek:\nAHMET odadaki eski sandığı dikkatle açar.\n\nAHMET\n(fısıldayarak)\nSonunda buldum.\n\nMEHMET\nEmin misin?`}
            className={`w-full flex-1 resize-none bg-transparent outline-none font-mono text-sm sm:text-base leading-[1.8] p-3 rounded-2xl border-none custom-scrollbar ${
              isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
            }`}
            style={{ fontFamily: '"Courier Prime", Courier, monospace' }}
            spellCheck={false}
          />
        </div>

        {/* Bottom Status & Info Bar */}
        <div className={`px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-[#1a1f25] border-[#2d3640] text-slate-400' : 'bg-[#e8e0d5] border-[#c8bea8] text-slate-600'
        }`}>
          {/* Left stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <Type size={13} className={isDark ? 'text-[#6ba3e8]' : 'text-blue-700'} />
              <strong>{wordsCount}</strong> kelime
            </span>
            <span className="flex items-center gap-1 font-mono">
              <AlignLeft size={13} className={isDark ? 'text-[#6ba3e8]' : 'text-blue-700'} />
              <strong>{linesCount}</strong> satır
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock size={13} className="text-emerald-500" />
              Tahmini: <strong>~{estSeconds} sn</strong>
            </span>
          </div>

          {/* Right helper buttons */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] opacity-60">
              <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">Esc</kbd> veya <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">⌘+Enter</kbd> ile kaydedip kapatabilirsiniz
            </span>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#6ba3e8] hover:bg-[#5a92d7] text-slate-950' 
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              Tamamla
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function Corkboard({ 
  elements = [], 
  onReorderScenesArray, 
  onUpdateSceneText, 
  onUpdateElement,
  onRemoveElement,
  theme, 
  setFocusedId, 
  setViewMode 
}: CorkboardProps) {
  const [enlargedSceneId, setEnlargedSceneId] = useState<string | null>(null);

  const scenes = useMemo(() => {
    const groups: SceneGroup[] = [];
    let currentGroup: SceneGroup | null = null;

    if (!Array.isArray(elements)) return [];

    elements.forEach(el => {
      if (!el) return;
      if (el.type === 'scene') {
        currentGroup = { id: el.id, heading: el, children: [] };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.children.push(el);
      }
    });

    return groups;
  }, [elements]);

  const activeSceneIndex = useMemo(() => {
    if (!enlargedSceneId) return -1;
    return scenes.findIndex(s => s.id === enlargedSceneId);
  }, [scenes, enlargedSceneId]);

  const activeScene = useMemo(() => {
    if (activeSceneIndex === -1) return null;
    return scenes[activeSceneIndex];
  }, [scenes, activeSceneIndex]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = scenes.findIndex(s => s.id === active.id);
      const newIndex = scenes.findIndex(s => s.id === over.id);
      
      const newOrder = arrayMove<SceneGroup>(scenes, oldIndex, newIndex).map(s => s.heading);
      onReorderScenesArray(newOrder);
    }
  };

  const handleSaveScene = (sceneId: string, newText: string, newHeading: string, colorTag: string) => {
    onUpdateSceneText(sceneId, newText);
    if (onUpdateElement) {
      onUpdateElement(sceneId, { 
        content: newHeading || undefined, 
        colorTag 
      });
    }
  };

  const handleOpenInScript = (id: string) => {
    setFocusedId(id);
    setViewMode('editor');
  };

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25]' : 'bg-[#e2d9cc]';

  return (
    <div className={`flex-1 overflow-y-auto p-4 sm:p-8 min-h-screen ${bgClass}`}>
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Corkboard header info strip */}
        <div className={`flex items-center justify-between gap-4 pb-2 border-b ${
          theme === 'dark' ? 'border-[#2d3640] text-slate-300' : 'border-[#c8bea8] text-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Pin size={16} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
            <h2 className="text-xs font-bold uppercase tracking-wider opacity-90">
              Mantar Pano ({scenes.length} Sahne)
            </h2>
          </div>
          <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            💡 Bir karta tıklayarak genişletip rahatça yazabilir, sürükleyerek sahneleri sıralayabilirsiniz.
          </span>
        </div>

        {/* Card Grid */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={scenes.map(s => s.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 pb-20">
              {scenes.map((scene, idx) => (
                <SortableCard 
                  key={scene.id} 
                  scene={scene} 
                  sceneIndex={idx}
                  theme={theme} 
                  onOpenEnlarged={() => setEnlargedSceneId(scene.id)}
                  onOpenInScript={() => handleOpenInScript(scene.id)}
                  onRemoveElement={onRemoveElement} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Enlarged Post-It Editor Modal */}
      <AnimatePresence>
        {activeScene && (
          <EnlargedPostItModal
            key={activeScene.id}
            scene={activeScene}
            sceneIndex={activeSceneIndex}
            theme={theme}
            onClose={() => setEnlargedSceneId(null)}
            onSave={handleSaveScene}
            onOpenInScript={handleOpenInScript}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

