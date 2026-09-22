import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, LayoutGrid, Compass, BookOpen, BookMarked, Tv, 
  ChevronLeft, ChevronRight, Search, Plus, Trash2, 
  Check, Sparkles, ExternalLink, Pin, Tag, Sliders, 
  Layers, ArrowRight, ArrowLeftRight, CheckCircle2,
  Film, Activity, HelpCircle, FileText, ChevronDown, 
  Maximize2, Minimize2, PanelLeftClose, PanelRightClose
} from 'lucide-react';
import { ScreenplayElement, CharacterProfile, EpisodeStory, StoryBible } from '../types';
import { STORY_TEMPLATES, StoryTemplate, BeatDefinition } from './StoryBeatsModal';
import { PREDEFINED_QUESTIONS } from './CharacterBibleModal';
import { safeStorage } from '../lib/storage';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, ReferenceLine, CartesianGrid 
} from 'recharts';

export type SplitPanelTab = 'cards' | 'outline' | 'characters' | 'notes' | 'bible' | 'tension';

interface SplitCompanionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: SplitPanelTab;
  setActiveTab: (tab: SplitPanelTab) => void;
  position: 'left' | 'right';
  onTogglePosition: () => void;
  width: number;
  onWidthChange: (w: number) => void;
  theme: 'dark' | 'light';
  elements: ScreenplayElement[];
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  onUpdateElement?: (id: string, updates: Partial<ScreenplayElement>) => void;
  onReorderScenesArray?: (newOrder: ScreenplayElement[]) => void;
  selectedTemplateId?: string;
  onSelectTemplate?: (templateId: string) => void;
  beatAnswers?: Record<string, string>;
  onUpdateBeatAnswer?: (beatId: string, answer: string) => void;
  targetPageCount?: number;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
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

export default function SplitCompanionPanel({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  position,
  onTogglePosition,
  width,
  onWidthChange,
  theme,
  elements,
  focusedId,
  setFocusedId,
  onUpdateElement,
  selectedTemplateId = 'save_the_cat',
  onSelectTemplate,
  beatAnswers = {},
  onUpdateBeatAnswer,
  targetPageCount = 110
}: SplitCompanionPanelProps) {
  // Search queries for tabs
  const [cardsSearch, setCardsSearch] = useState('');
  const [cardsTagFilter, setCardsTagFilter] = useState('');
  const [characterSearch, setCharacterSearch] = useState('');
  const [notesSearch, setNotesSearch] = useState('');
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [tensionSearch, setTensionSearch] = useState('');
  const [selectedTensionSceneId, setSelectedTensionSceneId] = useState<string | null>(null);
  const [autoAdvanceTension, setAutoAdvanceTension] = useState(true);
  const [tensionMetric, setTensionMetric] = useState<'tension' | 'comedy' | 'action' | 'horror' | 'romance' | 'emotion'>('tension');

  // Resize handling
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  // Character Bible state
  const [characters, setCharacters] = useState<CharacterProfile[]>(() => {
    const saved = safeStorage.getItem('scriptHive_characterBible');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Story Bible state
  const [storyBible, setStoryBible] = useState<StoryBible>(() => {
    const defaultBible: StoryBible = {
      seriesName: 'İsimsiz Dizi Projesi',
      episodes: [
        { id: 'ep_1', episodeName: 'Bölüm 1: Pilot / Başlangıç', storyContent: '' }
      ]
    };
    const saved = safeStorage.getItem('scriptHive_storyBible');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            seriesName: parsed.seriesName || defaultBible.seriesName,
            episodes: Array.isArray(parsed.episodes) && parsed.episodes.length > 0 ? parsed.episodes : defaultBible.episodes
          };
        }
      } catch (e) {}
    }
    return defaultBible;
  });
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('ep_1');

  // Notes state
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const defaultNotes: NoteItem[] = [
      { id: 'note_1', title: 'Genel Notlar & Fikirler', content: 'Buraya sahne fikirlerinizi, karakter repliklerini veya araştırma notlarınızı yazabilirsiniz.' }
    ];
    const saved = safeStorage.getItem('scriptHive_notebook');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.notes) && parsed.notes.length > 0) {
          return parsed.notes;
        }
      } catch (e) {}
    }
    return defaultNotes;
  });

  // Sync state changes to storage
  useEffect(() => {
    safeStorage.setItem('scriptHive_characterBible', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_storyBible', JSON.stringify(storyBible));
  }, [storyBible]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_notebook', JSON.stringify({ projectName: 'ScriptHive Notları', notes }));
  }, [notes]);

  // Handle Resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = position === 'left' 
        ? moveEvent.clientX - startXRef.current 
        : startXRef.current - moveEvent.clientX;
      const newWidth = Math.max(280, Math.min(680, startWidthRef.current + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Group elements into scenes
  const scenesList = useMemo(() => {
    const list: { heading: ScreenplayElement; index: number; page: number; preview: string; dialogueCount: number }[] = [];
    let currentHeading: ScreenplayElement | null = null;
    let previewLines: string[] = [];
    let dCount = 0;
    let lineCounter = 0;

    elements.forEach((el, idx) => {
      lineCounter++;
      if (el.type === 'scene') {
        if (currentHeading) {
          list.push({
            heading: currentHeading,
            index: idx,
            page: Math.max(1, Math.ceil(lineCounter / 45)),
            preview: previewLines.slice(0, 3).join(' • '),
            dialogueCount: dCount
          });
        }
        currentHeading = el;
        previewLines = [];
        dCount = 0;
      } else {
        const clean = el.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        if (clean && previewLines.length < 3) {
          previewLines.push(clean);
        }
        if (el.type === 'dialogue') dCount++;
      }
    });

    if (currentHeading) {
      list.push({
        heading: currentHeading,
        index: elements.length,
        page: Math.max(1, Math.ceil(lineCounter / 45)),
        preview: previewLines.slice(0, 3).join(' • '),
        dialogueCount: dCount
      });
    }

    return list;
  }, [elements]);

  // Active Story Template
  const currentTemplate = useMemo(() => {
    return STORY_TEMPLATES.find(t => t.id === selectedTemplateId) || STORY_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Character speaking line counts
  const characterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    elements.forEach(el => {
      if (el.type === 'character') {
        const name = el.content.replace(/<[^>]+>/g, '').replace(/\(.*\)/g, '').replace(/&nbsp;/g, ' ').trim().toLocaleUpperCase('tr-TR');
        if (name) counts[name] = (counts[name] || 0) + 1;
      }
    });
    return counts;
  }, [elements]);

  // Tension Scene parsing & calculations
  const tensionScenes = useMemo(() => {
    const list: Array<{
      id: string;
      sceneNumber: number | string;
      title: string;
      tension: number;
      comedy: number;
      action: number;
      horror: number;
      romance: number;
      emotion: number;
      elementIndex: number;
    }> = [];
    let counter = 0;

    elements.forEach((el, idx) => {
      if (el.type === 'scene') {
        counter++;
        const plainTitle = el.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        const estProgress = elements.length > 0 ? (idx / elements.length) : 0;
        let defaultTension = 30;
        if (estProgress < 0.25) defaultTension = Math.round(30 + (estProgress / 0.25) * 25);
        else if (estProgress < 0.50) defaultTension = Math.round(45 + ((estProgress - 0.25) / 0.25) * 30);
        else if (estProgress < 0.75) defaultTension = Math.round(70 + ((estProgress - 0.50) / 0.25) * 15);
        else if (estProgress < 0.90) defaultTension = Math.round(90 + ((estProgress - 0.75) / 0.15) * 8);
        else defaultTension = Math.round(98 - ((estProgress - 0.90) / 0.10) * 60);

        list.push({
          id: el.id,
          sceneNumber: el.sceneNumber || counter,
          title: plainTitle || 'SAHNE',
          tension: typeof el.tensionScore === 'number' ? el.tensionScore : defaultTension,
          comedy: typeof el.comedyScore === 'number' ? el.comedyScore : 40,
          action: typeof el.actionScore === 'number' ? el.actionScore : 35,
          horror: typeof el.horrorScore === 'number' ? el.horrorScore : 30,
          romance: typeof el.romanceScore === 'number' ? el.romanceScore : 30,
          emotion: typeof el.emotionScore === 'number' ? el.emotionScore : (typeof el.tensionScore === 'number' && el.tensionScore >= 70 ? 75 : 45),
          elementIndex: idx
        });
      }
    });

    return list;
  }, [elements]);

  // Find currently active scene id from focusedId
  const activeSceneId = useMemo(() => {
    if (!focusedId) return tensionScenes[0]?.id || null;
    const directScene = tensionScenes.find(s => s.id === focusedId);
    if (directScene) return directScene.id;

    const focusedIdx = elements.findIndex(e => e.id === focusedId);
    if (focusedIdx === -1) return tensionScenes[0]?.id || null;

    for (let i = focusedIdx; i >= 0; i--) {
      if (elements[i].type === 'scene') {
        return elements[i].id;
      }
    }
    return tensionScenes[0]?.id || null;
  }, [focusedId, elements, tensionScenes]);

  // Jump to scene in editor
  const jumpToScene = (sceneId: string) => {
    setFocusedId(sceneId);
    setTimeout(() => {
      const el = document.querySelector(`[data-element-id="${sceneId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  // Color styles
  const isDark = theme === 'dark';
  const panelBg = isDark ? 'bg-[#1a2026] text-slate-200 border-[#2d3748]' : 'bg-[#f7f4ed] text-slate-800 border-[#d5cbbe]';
  const headerBg = isDark ? 'bg-[#151a1f] border-[#2d3748]' : 'bg-[#ece5d8] border-[#d5cbbe]';
  const cardBg = isDark ? 'bg-[#212832] border-[#2d3748] hover:border-slate-500' : 'bg-[#FFFFF8] border-[#ded7ca] hover:border-slate-400';
  const activeCardBg = isDark ? 'bg-[#273240] border-sky-500/80 shadow-md ring-1 ring-sky-500/40' : 'bg-[#fffef5] border-blue-500 shadow-md ring-1 ring-blue-400/50';
  const inputBg = isDark ? 'bg-[#151a1f] border-[#2d3748] text-slate-200 focus:border-sky-500' : 'bg-white border-[#d5cbbe] text-slate-900 focus:border-blue-500';

  return (
    <aside 
      className={`relative flex flex-col h-full shrink-0 border-r z-30 transition-[width] duration-75 select-none no-print ${
        position === 'left' ? 'border-r' : 'border-l order-last'
      } ${panelBg}`}
      style={{ width: `${width}px` }}
    >
      {/* Resizer Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className={`absolute top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${
          position === 'left' ? '-right-1 hover:bg-sky-500/40' : '-left-1 hover:bg-sky-500/40'
        }`}
        title="Genişliği Ayarla (Sürükleyin)"
      />

      {/* Top Header Bar */}
      <div className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${headerBg}`}>
        <div className="flex items-center gap-1.5 font-semibold text-xs tracking-tight">
          <div className={`p-1 rounded-md ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-blue-500/20 text-blue-700'}`}>
            {activeTab === 'cards' && <LayoutGrid size={14} />}
            {activeTab === 'outline' && <Compass size={14} />}
            {activeTab === 'tension' && <Activity size={14} />}
            {activeTab === 'characters' && <BookOpen size={14} />}
            {activeTab === 'notes' && <BookMarked size={14} />}
            {activeTab === 'bible' && <Tv size={14} />}
          </div>
          <span>Çift Panel</span>
          <span className="text-[10px] opacity-50 font-normal">Companion</span>
        </div>

        {/* Quick Position & Width & Close Controls */}
        <div className="flex items-center gap-1 text-xs">
          {/* Width Presets */}
          <button
            onClick={() => onWidthChange(width <= 340 ? 460 : width >= 460 ? 340 : 460)}
            className={`p-1 rounded hover:bg-slate-700/30 transition-colors opacity-70 hover:opacity-100`}
            title={width > 380 ? "Kompakt Genişlik (340px)" : "Genişletilmiş Görünüm (460px)"}
          >
            {width > 380 ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Dock Left / Right Toggle */}
          <button
            onClick={onTogglePosition}
            className={`p-1 rounded hover:bg-slate-700/30 transition-colors opacity-70 hover:opacity-100`}
            title={position === 'left' ? "Sağa Sabitle" : "Sola Sabitle"}
          >
            <ArrowLeftRight size={13} />
          </button>

          {/* Close Companion */}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors opacity-70 hover:opacity-100 ml-1"
            title="Paneli Kapat"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className={`flex items-center gap-1 p-1.5 border-b shrink-0 overflow-x-auto no-scrollbar ${isDark ? 'bg-[#151a1f]/60 border-[#2d3748]' : 'bg-[#e7dfd1]/70 border-[#d5cbbe]'}`}>
        {[
          { id: 'cards', label: 'Pano', icon: LayoutGrid },
          { id: 'outline', label: 'Outline', icon: Compass },
          { id: 'tension', label: 'Gerilim', icon: Activity },
          { id: 'characters', label: 'Karakter', icon: BookOpen },
          { id: 'notes', label: 'Notlar', icon: BookMarked },
          { id: 'bible', label: 'Dizi', icon: Tv },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SplitPanelTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isActive 
                  ? (isDark ? 'bg-sky-500 text-white font-bold shadow-sm' : 'bg-blue-600 text-white font-bold shadow-sm')
                  : (isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-[#dad0c0] text-slate-700 hover:text-black')
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col min-h-0">
        
        {/* ==================================================== */}
        {/* TAB 1: MANTAR PANO (CORKBOARD CARDS) */}
        {/* ==================================================== */}
        {activeTab === 'cards' && (
          <div className="flex flex-col h-full space-y-3">
            {/* Search & Tag Filter Header */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Sahne veya mekan ara..."
                  value={cardsSearch}
                  onChange={(e) => setCardsSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border transition-all ${inputBg}`}
                />
                {cardsSearch && (
                  <button onClick={() => setCardsSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 text-xs">✕</button>
                )}
              </div>
              
              {/* Color Tag Filter */}
              <div className="flex items-center gap-1">
                {TAG_COLORS.slice(0, 6).map(color => (
                  <button
                    key={color.value}
                    onClick={() => setCardsTagFilter(cardsTagFilter === color.value ? '' : color.value)}
                    className={`w-3.5 h-3.5 rounded-full transition-transform ${
                      cardsTagFilter === color.value ? 'scale-125 ring-2 ring-white shadow-sm' : 'opacity-60 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={`${color.label} Filtresi`}
                  />
                ))}
              </div>
            </div>

            {/* Scenes Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {scenesList
                .filter(item => {
                  const plain = item.heading.content.replace(/<[^>]+>/g, '').toLowerCase();
                  const matchesSearch = !cardsSearch || plain.includes(cardsSearch.toLowerCase()) || item.preview.toLowerCase().includes(cardsSearch.toLowerCase());
                  const matchesTag = !cardsTagFilter || item.heading.colorTag === cardsTagFilter;
                  return matchesSearch && matchesTag;
                })
                .map((item, idx) => {
                  const plainSlug = item.heading.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() || `Sahne ${idx + 1}`;
                  const isFocused = focusedId === item.heading.id;
                  const colorTag = item.heading.colorTag;

                  return (
                    <div
                      key={item.heading.id}
                      onClick={() => jumpToScene(item.heading.id)}
                      className={`group relative p-3 rounded-xl border cursor-pointer transition-all ${
                        isFocused ? activeCardBg : cardBg
                      }`}
                      style={{
                        borderLeftWidth: colorTag ? '5px' : '1px',
                        borderLeftColor: colorTag || undefined
                      }}
                    >
                      {/* Card Header: Scene Number, Slugline & Page */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                            isDark ? 'bg-slate-800 text-sky-400' : 'bg-slate-200 text-blue-800'
                          }`}>
                            #{idx + 1}
                          </span>
                          <h4 className="font-bold text-xs truncate leading-tight font-mono tracking-tight" title={plainSlug}>
                            {plainSlug}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono opacity-50 shrink-0">
                          S.{item.page}
                        </span>
                      </div>

                      {/* Card Summary / Preview Lines */}
                      <p className="text-[11px] opacity-75 line-clamp-2 leading-relaxed mb-2">
                        {item.preview || <span className="italic opacity-50">Henüz diyalog veya eylem yazılmadı...</span>}
                      </p>

                      {/* Card Footer: Dialogue Count, Tension Score, Tag Palette */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-slate-700/30 text-[10px] opacity-65">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-mono">
                            <FileText size={11} /> {item.dialogueCount} replik
                          </span>
                          {item.heading.tensionScore && (
                            <span className="flex items-center gap-0.5 font-mono text-amber-500 font-bold">
                              <Activity size={10} /> %{item.heading.tensionScore}
                            </span>
                          )}
                        </div>

                        {/* Inline Tag Color Changer */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {TAG_COLORS.slice(0, 5).map(c => (
                            <button
                              key={c.value}
                              onClick={() => onUpdateElement?.(item.heading.id, { colorTag: item.heading.colorTag === c.value ? undefined : c.value })}
                              className="w-2.5 h-2.5 rounded-full hover:scale-125 transition-transform"
                              style={{ backgroundColor: c.value }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {scenesList.length === 0 && (
                <div className="text-center py-12 opacity-60 text-xs">
                  <Film size={28} className="mx-auto mb-2 opacity-40" />
                  <p>Henüz sahneler eklenmedi.</p>
                  <p className="text-[10px] mt-1">Senaryoya sahne başlığı eklediğinizde burada listelenecektir.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: OUTLINE & BEAT SHEET */}
        {/* ==================================================== */}
        {activeTab === 'outline' && (
          <div className="flex flex-col h-full space-y-3">
            {/* Story Template Selector Dropdown */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-dashed border-slate-700/40">
              <div className="flex items-center gap-1.5 min-w-0">
                <Compass size={14} className={isDark ? 'text-sky-400' : 'text-blue-600'} />
                <select
                  value={selectedTemplateId}
                  onChange={(e) => onSelectTemplate?.(e.target.value)}
                  className={`text-xs font-semibold py-1 px-2 rounded-lg border outline-none truncate ${inputBg}`}
                >
                  {STORY_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.badge})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Beats List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {currentTemplate.beats.map((beat) => {
                const targetPage = Math.max(1, Math.round((beat.targetPercent / 100) * targetPageCount));
                const isSelected = selectedBeatId === beat.id;
                const answer = beatAnswers[beat.id] || '';

                return (
                  <div
                    key={beat.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isSelected ? activeCardBg : cardBg
                    }`}
                  >
                    {/* Beat Header */}
                    <div 
                      className="flex items-start justify-between gap-2 cursor-pointer"
                      onClick={() => setSelectedBeatId(isSelected ? null : beat.id)}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                          beat.act.includes('1.') ? 'bg-amber-500/20 text-amber-500' :
                          beat.act.includes('2.') ? 'bg-sky-500/20 text-sky-400' :
                          'bg-emerald-500/20 text-emerald-500'
                        }`}>
                          {beat.act}
                        </span>
                        <h4 className="font-bold text-xs truncate leading-tight">
                          {beat.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold opacity-60 shrink-0">
                        ~S.{targetPage} (%{beat.targetPercent})
                      </span>
                    </div>

                    {/* Beat Description */}
                    <p className="text-[11px] opacity-75 mt-1.5 leading-relaxed">
                      {beat.description}
                    </p>

                    {/* Guiding Questions & Writer Answer (Expanded view) */}
                    {isSelected && (
                      <div className="mt-3 pt-2.5 border-t border-dashed border-slate-700/40 space-y-2">
                        {beat.guidingQuestions.length > 0 && (
                          <div className={`p-2 rounded-lg text-[11px] ${isDark ? 'bg-[#151a1f] text-slate-300' : 'bg-[#f0e9dc] text-slate-700'}`}>
                            <div className="font-bold text-[10px] uppercase tracking-wider opacity-60 mb-1 flex items-center gap-1">
                              <HelpCircle size={11} /> Rehber Sorular:
                            </div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {beat.guidingQuestions.map((q, qIdx) => (
                                <li key={qIdx}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Writer Note / Response Textarea */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                            Bu Beat İçin Sahne & Hikaye Notunuz:
                          </label>
                          <textarea
                            value={answer}
                            onChange={(e) => onUpdateBeatAnswer?.(beat.id, e.target.value)}
                            placeholder="Karakterin bu aşamada yaşadığı olay, verdiği karar veya sahne özeti..."
                            rows={3}
                            className={`w-full p-2 rounded-lg text-xs outline-none border resize-none transition-all ${inputBg}`}
                          />
                        </div>

                        {/* Map focused scene button */}
                        {focusedId && (
                          <button
                            onClick={() => onUpdateElement?.(focusedId, { sceneBeatId: beat.id })}
                            className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                              isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            <Pin size={12} /> Seçili Sahneyi Bu Beat'e Bağla
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: KARAKTER REHBERİ (CHARACTER BIBLE) */}
        {/* ==================================================== */}
        {activeTab === 'characters' && (
          <div className="flex flex-col h-full space-y-3">
            {/* Header: Search and Add Character Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Karakter ara..."
                  value={characterSearch}
                  onChange={(e) => setCharacterSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border transition-all ${inputBg}`}
                />
              </div>
              <button
                onClick={() => {
                  const newChar: CharacterProfile = {
                    id: Date.now().toString(),
                    name: `YENİ KARAKTER ${characters.length + 1}`,
                    answers: {},
                    customQuestions: []
                  };
                  setCharacters(prev => [...prev, newChar]);
                  setActiveCharId(newChar.id);
                }}
                className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold text-white ${
                  isDark ? 'bg-sky-600 hover:bg-sky-500' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title="Yeni Karakter Profili Ekle"
              >
                <Plus size={14} /> Ekle
              </button>
            </div>

            {/* Characters List or Active Character Detail */}
            {activeCharId ? (
              // Active Character Detail View
              (() => {
                const char = characters.find(c => c.id === activeCharId);
                if (!char) return null;

                return (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                    <button
                      onClick={() => setActiveCharId(null)}
                      className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 mb-1 font-semibold"
                    >
                      <ChevronLeft size={14} /> Tüm Karakterlere Dön
                    </button>

                    {/* Character Name Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={char.name}
                        onChange={(e) => {
                          const updated = { ...char, name: e.target.value.toLocaleUpperCase('tr-TR') };
                          setCharacters(prev => prev.map(c => c.id === char.id ? updated : c));
                        }}
                        className={`w-full font-bold text-sm uppercase px-3 py-1.5 rounded-lg border outline-none ${inputBg}`}
                        placeholder="KARAKTER ADI"
                      />
                      <button
                        onClick={() => {
                          setCharacters(prev => prev.filter(c => c.id !== char.id));
                          setActiveCharId(null);
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Karakteri Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Questions & Answers Accordion */}
                    <div className="space-y-2.5">
                      {Object.entries(PREDEFINED_QUESTIONS).map(([category, questions]) => (
                        <div key={category} className={`p-2.5 rounded-xl border ${cardBg}`}>
                          <h5 className="font-bold text-xs mb-2 opacity-90 text-sky-400 dark:text-sky-300">
                            {category}
                          </h5>
                          <div className="space-y-2">
                            {questions.map((q, qIdx) => {
                              const ans = char.answers[q] || '';
                              return (
                                <div key={qIdx} className="space-y-1">
                                  <label className="block text-[11px] font-medium opacity-80 leading-tight">
                                    {q}
                                  </label>
                                  <textarea
                                    value={ans}
                                    onChange={(e) => {
                                      const updated = {
                                        ...char,
                                        answers: { ...char.answers, [q]: e.target.value }
                                      };
                                      setCharacters(prev => prev.map(c => c.id === char.id ? updated : c));
                                    }}
                                    placeholder="Yanıtınızı yazın..."
                                    rows={2}
                                    className={`w-full p-2 text-xs rounded-lg outline-none border resize-none transition-all ${inputBg}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              // All Characters Grid / List
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {characters
                  .filter(c => !characterSearch || c.name.toLowerCase().includes(characterSearch.toLowerCase()))
                  .map(char => {
                    const lineCount = characterCounts[char.name.toLocaleUpperCase('tr-TR')] || 0;
                    const filledAnswers = Object.values(char.answers).filter(Boolean).length;

                    return (
                      <div
                        key={char.id}
                        onClick={() => setActiveCharId(char.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                              isDark ? 'bg-sky-600' : 'bg-blue-600'
                            }`}>
                              {char.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs truncate uppercase">
                                {char.name}
                              </h4>
                              <p className="text-[10px] opacity-60">
                                {filledAnswers} / 25 soru yanıtlandı
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            isDark ? 'bg-slate-800 text-sky-400' : 'bg-slate-200 text-blue-800'
                          }`}>
                            {lineCount} replik
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {characters.length === 0 && (
                  <div className="text-center py-12 opacity-60 text-xs">
                    <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                    <p>Henüz karakter profili yok.</p>
                    <p className="text-[10px] mt-1">"Ekle" butonuna basarak karakter psikolojik profili oluşturabilirsiniz.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: NOT DEFTERİ (NOTES & SCRATCHPAD) */}
        {/* ==================================================== */}
        {activeTab === 'notes' && (
          <div className="flex flex-col h-full space-y-3">
            {/* Header: Add Note & Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Notlarda ara..."
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border transition-all ${inputBg}`}
                />
              </div>
              <button
                onClick={() => {
                  const newNote: NoteItem = {
                    id: Date.now().toString(),
                    title: `Yeni Not #${notes.length + 1}`,
                    content: ''
                  };
                  setNotes(prev => [newNote, ...prev]);
                  setActiveNoteId(newNote.id);
                }}
                className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold text-white ${
                  isDark ? 'bg-sky-600 hover:bg-sky-500' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title="Yeni Not Oluştur"
              >
                <Plus size={14} /> Yeni
              </button>
            </div>

            {/* Notes List & Active Note Editor */}
            {activeNoteId ? (
              (() => {
                const note = notes.find(n => n.id === activeNoteId);
                if (!note) return null;

                return (
                  <div className="flex-1 flex flex-col space-y-2 min-h-0">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveNoteId(null)}
                        className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 font-semibold"
                      >
                        <ChevronLeft size={14} /> Not Listesi
                      </button>
                      <button
                        onClick={() => {
                          setNotes(prev => prev.filter(n => n.id !== note.id));
                          setActiveNoteId(null);
                        }}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-xs flex items-center gap-1"
                        title="Notu Sil"
                      >
                        <Trash2 size={13} /> Sil
                      </button>
                    </div>

                    <input
                      type="text"
                      value={note.title}
                      onChange={(e) => {
                        const updated = { ...note, title: e.target.value };
                        setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
                      }}
                      className={`w-full font-bold text-xs px-3 py-1.5 rounded-lg border outline-none ${inputBg}`}
                      placeholder="Not Başlığı..."
                    />

                    <textarea
                      value={note.content}
                      onChange={(e) => {
                        const updated = { ...note, content: e.target.value };
                        setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
                      }}
                      placeholder="Fikirlerinizi, araştırmalarınızı ve senaryo notlarınızı buraya yazın..."
                      className={`w-full flex-1 p-3 text-xs rounded-xl outline-none border resize-none font-mono leading-relaxed transition-all ${inputBg}`}
                    />
                  </div>
                );
              })()
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {notes
                  .filter(n => !notesSearch || n.title.toLowerCase().includes(notesSearch.toLowerCase()) || n.content.toLowerCase().includes(notesSearch.toLowerCase()))
                  .map(note => (
                    <div
                      key={note.id}
                      onClick={() => setActiveNoteId(note.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg}`}
                    >
                      <h4 className="font-bold text-xs mb-1 truncate">
                        {note.title || 'İsimsiz Not'}
                      </h4>
                      <p className="text-[11px] opacity-70 line-clamp-2 leading-relaxed">
                        {note.content || <span className="italic opacity-50">Boş not...</span>}
                      </p>
                    </div>
                  ))}

                {notes.length === 0 && (
                  <div className="text-center py-12 opacity-60 text-xs">
                    <BookMarked size={28} className="mx-auto mb-2 opacity-40" />
                    <p>Henüz kayıtlı not yok.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: DİZİ / SEZON REHBERİ (STORY BIBLE) */}
        {/* ==================================================== */}
        {activeTab === 'bible' && (
          <div className="flex flex-col h-full space-y-3">
            {/* Series Title */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                Dizi / Sezon Adı:
              </label>
              <input
                type="text"
                value={storyBible.seriesName}
                onChange={(e) => setStoryBible(prev => ({ ...prev, seriesName: e.target.value }))}
                className={`w-full font-bold text-xs px-3 py-1.5 rounded-lg border outline-none ${inputBg}`}
                placeholder="Örn: SIRÇA DÜNYASI - 1. SEZON"
              />
            </div>

            {/* Episode Tabs Header */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {storyBible.episodes.map((ep, epIdx) => (
                <button
                  key={ep.id}
                  onClick={() => setActiveEpisodeId(ep.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeEpisodeId === ep.id
                      ? (isDark ? 'bg-sky-500 text-white' : 'bg-blue-600 text-white')
                      : (isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-[#e7dfd1] text-slate-700 hover:text-black')
                  }`}
                >
                  Bölüm {epIdx + 1}
                </button>
              ))}
              <button
                onClick={() => {
                  const newEp: EpisodeStory = {
                    id: `ep_${Date.now()}`,
                    episodeName: `Bölüm ${storyBible.episodes.length + 1}: Yeni Bölüm`,
                    storyContent: ''
                  };
                  setStoryBible(prev => ({ ...prev, episodes: [...prev.episodes, newEp] }));
                  setActiveEpisodeId(newEp.id);
                }}
                className={`p-1 rounded-lg text-xs font-bold ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-sky-400' : 'bg-[#e7dfd1] hover:bg-[#dad0c0] text-blue-700'
                }`}
                title="Yeni Bölüm Ekle"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Active Episode Editor */}
            {(() => {
              const activeEp = storyBible.episodes.find(e => e.id === activeEpisodeId) || storyBible.episodes[0];
              if (!activeEp) return null;

              return (
                <div className="flex-1 flex flex-col space-y-2 min-h-0">
                  <input
                    type="text"
                    value={activeEp.episodeName}
                    onChange={(e) => {
                      const updated = { ...activeEp, episodeName: e.target.value };
                      setStoryBible(prev => ({
                        ...prev,
                        episodes: prev.episodes.map(ep => ep.id === activeEp.id ? updated : ep)
                      }));
                    }}
                    className={`w-full font-bold text-xs px-3 py-1.5 rounded-lg border outline-none ${inputBg}`}
                    placeholder="Bölüm Başlığı..."
                  />

                  <textarea
                    value={activeEp.storyContent}
                    onChange={(e) => {
                      const updated = { ...activeEp, storyContent: e.target.value };
                      setStoryBible(prev => ({
                        ...prev,
                        episodes: prev.episodes.map(ep => ep.id === activeEp.id ? updated : ep)
                      }));
                    }}
                    placeholder="Bu bölümün ana hikaye arkını, olay örgüsünü ve sezon bağlantılarını yazın..."
                    className={`w-full flex-1 p-3 text-xs rounded-xl outline-none border resize-none leading-relaxed transition-all ${inputBg}`}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: GERİLİM, KOMEDİ, AKSİYON, KORKU & ROMANTİK RİTMİ */}
        {/* ==================================================== */}
        {activeTab === 'tension' && (
          <div className="flex flex-col h-full space-y-3 overflow-hidden">
            {/* Metric Switcher Header */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className={`flex items-center p-0.5 rounded-lg border text-xs overflow-x-auto no-scrollbar ${isDark ? 'bg-[#12161f] border-slate-700/80' : 'bg-[#f0ebe0] border-[#d8cfbe]'}`}>
                {[
                  { id: 'tension', label: 'Gerilim' },
                  { id: 'comedy', label: 'Komedi' },
                  { id: 'action', label: 'Aksiyon' },
                  { id: 'horror', label: 'Korku' },
                  { id: 'romance', label: 'Romantik' },
                  { id: 'emotion', label: 'Duygu' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTensionMetric(m.id as any)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all shrink-0 ${
                      tensionMetric === m.id
                        ? (isDark ? 'bg-slate-700 text-white font-semibold' : 'bg-white text-slate-900 shadow-2xs font-semibold')
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <span className="text-[10px] font-mono opacity-50 shrink-0">{tensionScenes.length} Sahne</span>
            </div>

            {/* 1. Mini Compact Curve Chart */}
            <div className={`p-2 rounded-xl border shrink-0 ${cardBg}`}>
              <div className="w-full h-24">
                {tensionScenes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={tensionScenes}
                      onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          const targetScene = e.activePayload[0].payload;
                          setSelectedTensionSceneId(targetScene.id);
                          jumpToScene(targetScene.id);
                        }
                      }}
                      margin={{ top: 4, right: 10, left: -30, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="splitCurveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isDark ? '#94a3b8' : '#475569'} stopOpacity={0.6} />
                          <stop offset="95%" stopColor={isDark ? '#94a3b8' : '#475569'} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#26303d' : '#ede7dc'} />
                      <XAxis 
                        dataKey="sceneNumber" 
                        stroke={isDark ? '#64748b' : '#94a3b8'} 
                        tickFormatter={(v) => `${v}`}
                        fontSize={9}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke={isDark ? '#64748b' : '#94a3b8'} 
                        fontSize={9}
                        ticks={[0, 50, 100]}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const val = (data as any)[tensionMetric] || 50;
                            const label = tensionMetric === 'horror' ? 'Korku'
                              : tensionMetric === 'romance' ? 'Romantik'
                              : tensionMetric === 'action' ? 'Aksiyon'
                              : tensionMetric === 'comedy' ? 'Komedi'
                              : tensionMetric === 'emotion' ? 'Duygu'
                              : 'Gerilim';
                            return (
                              <div className={`p-2 rounded-lg shadow-lg border text-xs ${isDark ? 'bg-[#1b222d] border-[#2e3b4a] text-white' : 'bg-white border-[#d8cdba] text-slate-900'}`}>
                                <div className="font-bold text-[11px] truncate max-w-[160px]">
                                  #{data.sceneNumber}: {data.title}
                                </div>
                                <div className="text-[10px] opacity-75 mt-0.5">
                                  {label}: <strong>{val} / 100</strong>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={tensionMetric}
                        stroke={isDark ? '#94a3b8' : '#475569'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#splitCurveGrad)"
                        dot={(props: any) => {
                          const currentId = selectedTensionSceneId || activeSceneId;
                          const isCurrent = props.payload.id === currentId;
                          if (isCurrent) {
                            return (
                              <circle 
                                key={`dot-${props.payload.id}`}
                                cx={props.cx} 
                                cy={props.cy} 
                                r={4} 
                                fill={isDark ? '#f8fafc' : '#0f172a'} 
                                stroke="#ffffff" 
                                strokeWidth={2} 
                              />
                            );
                          }
                          return null;
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs opacity-50">
                    Sahne bulunamadı.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Active Scene Scoring Box */}
            {(() => {
              const currentId = selectedTensionSceneId || activeSceneId || tensionScenes[0]?.id;
              const currentScene = tensionScenes.find(s => s.id === currentId) || tensionScenes[0];
              const currentIndex = tensionScenes.findIndex(s => s.id === currentId);

              if (!currentScene) {
                return (
                  <div className={`p-4 rounded-xl border text-center text-xs opacity-60 ${cardBg}`}>
                    Puanlanacak sahne seçilmedi.
                  </div>
                );
              }

              const score = (currentScene as any)[tensionMetric] || 50;
              const metricLabel = tensionMetric === 'horror' ? 'Korku'
                : tensionMetric === 'romance' ? 'Romantik'
                : tensionMetric === 'action' ? 'Aksiyon'
                : tensionMetric === 'comedy' ? 'Komedi'
                : tensionMetric === 'emotion' ? 'Duygu'
                : 'Gerilim';

              const presets = tensionMetric === 'horror'
                ? [
                    { label: 'Tedirgin', score: 20 },
                    { label: 'Ürperti', score: 45 },
                    { label: 'Dehşet', score: 70 },
                    { label: 'Kabus', score: 95 },
                  ]
                : tensionMetric === 'romance'
                ? [
                    { label: 'Mesafeli', score: 20 },
                    { label: 'Flört', score: 45 },
                    { label: 'Tutku', score: 70 },
                    { label: 'Doruk', score: 95 },
                  ]
                : tensionMetric === 'action'
                ? [
                    { label: 'Sakin', score: 20 },
                    { label: 'Hareketli', score: 45 },
                    { label: 'Çatışma', score: 70 },
                    { label: 'Zirve', score: 95 },
                  ]
                : tensionMetric === 'comedy'
                ? [
                    { label: 'Düşük', score: 20 },
                    { label: 'Tempolu', score: 45 },
                    { label: 'Kahkaha', score: 70 },
                    { label: 'Zirve', score: 95 },
                  ]
                : tensionMetric === 'emotion'
                ? [
                    { label: 'Sakin', score: 20 },
                    { label: 'Duygusal', score: 45 },
                    { label: 'Yoğun', score: 70 },
                    { label: 'Zirve', score: 95 },
                  ]
                : [
                    { label: 'Sakin', score: 20 },
                    { label: 'Denge', score: 45 },
                    { label: 'Gerilim', score: 70 },
                    { label: 'Doruk', score: 95 },
                  ];

              const updateScore = (val: number, moveNext: boolean = false) => {
                const clamped = Math.max(1, Math.min(100, Math.round(val)));
                if (tensionMetric === 'horror') {
                  onUpdateElement?.(currentScene.id, { horrorScore: clamped });
                } else if (tensionMetric === 'romance') {
                  onUpdateElement?.(currentScene.id, { romanceScore: clamped });
                } else if (tensionMetric === 'action') {
                  onUpdateElement?.(currentScene.id, { actionScore: clamped });
                } else if (tensionMetric === 'comedy') {
                  onUpdateElement?.(currentScene.id, { comedyScore: clamped });
                } else if (tensionMetric === 'emotion') {
                  onUpdateElement?.(currentScene.id, { emotionScore: clamped });
                } else {
                  onUpdateElement?.(currentScene.id, { tensionScore: clamped });
                }
                if (moveNext && currentIndex < tensionScenes.length - 1) {
                  const nextScene = tensionScenes[currentIndex + 1];
                  setSelectedTensionSceneId(nextScene.id);
                  jumpToScene(nextScene.id);
                }
              };

              return (
                <div className={`p-3 rounded-xl border space-y-2.5 shrink-0 ${cardBg}`}>
                  {/* Scene Title & Navigation */}
                  <div className="flex items-center justify-between gap-2 border-b pb-1.5 border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-mono font-bold text-xs shrink-0 opacity-70">
                        #{currentScene.sceneNumber}
                      </span>
                      <span className="font-mono text-xs font-semibold truncate" title={currentScene.title}>
                        {currentScene.title}
                      </span>
                    </div>

                    <button
                      onClick={() => jumpToScene(currentScene.id)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors shrink-0 ${
                        isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-[#d5cbbe] hover:bg-[#ebe3d5]'
                      }`}
                      title="Bu sahneye git"
                    >
                      Metne Git ➔
                    </button>
                  </div>

                  {/* Metric Label & Score Display */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold opacity-80">
                      {metricLabel} Puanı:
                    </span>

                    <div className="font-mono font-bold text-base px-2 py-0.5 rounded border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                      {score} <span className="text-[10px] font-normal opacity-50">/ 100</span>
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    {presets.map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => updateScore(preset.score, autoAdvanceTension)}
                        className={`py-1 rounded text-xs font-mono font-medium border transition-all ${
                          score === preset.score
                            ? (isDark ? 'bg-slate-700 text-white border-slate-500 font-bold' : 'bg-[#334155] text-white border-slate-700 font-bold')
                            : (isDark ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60' : 'bg-white hover:bg-[#f0e9dc] text-slate-700 border-[#e2d9ca]')
                        }`}
                      >
                        {preset.label} <span className="text-[9px] opacity-60">{preset.score}</span>
                      </button>
                    ))}
                  </div>

                  {/* Range Slider & Fine Steppers */}
                  <div className="space-y-1 pt-0.5">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={score}
                      onChange={(e) => updateScore(parseInt(e.target.value, 10), false)}
                      className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-slate-600 dark:accent-slate-400"
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateScore(score - 10)}
                          className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#d5cbbe]'}`}
                          title="-10 Azalt"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => updateScore(score - 5)}
                          className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#d5cbbe]'}`}
                          title="-5 Azalt"
                        >
                          -5
                        </button>
                      </div>

                      <label className="flex items-center gap-1 cursor-pointer opacity-70 hover:opacity-100">
                        <input
                          type="checkbox"
                          checked={autoAdvanceTension}
                          onChange={(e) => setAutoAdvanceTension(e.target.checked)}
                          className="rounded text-xs"
                        />
                        <span>Sonrakine Geç</span>
                      </label>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateScore(score + 5)}
                          className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#d5cbbe]'}`}
                          title="+5 Arttır"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => updateScore(score + 10)}
                          className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#d5cbbe]'}`}
                          title="+10 Arttır"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Steppers */}
                  <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5 text-xs">
                    <button
                      disabled={currentIndex <= 0}
                      onClick={() => {
                        if (currentIndex > 0) {
                          const prev = tensionScenes[currentIndex - 1];
                          setSelectedTensionSceneId(prev.id);
                          jumpToScene(prev.id);
                        }
                      }}
                      className="px-2 py-1 rounded border text-[11px] disabled:opacity-30 transition-colors flex items-center gap-1 bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10"
                    >
                      <ChevronLeft size={12} /> Önceki
                    </button>

                    <span className="text-[10px] opacity-60 font-mono">
                      {currentIndex + 1} / {tensionScenes.length}
                    </span>

                    <button
                      disabled={currentIndex >= tensionScenes.length - 1}
                      onClick={() => {
                        if (currentIndex < tensionScenes.length - 1) {
                          const next = tensionScenes[currentIndex + 1];
                          setSelectedTensionSceneId(next.id);
                          jumpToScene(next.id);
                        }
                      }}
                      className="px-2 py-1 rounded border text-[11px] disabled:opacity-30 transition-colors flex items-center gap-1 bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10"
                    >
                      Sonraki <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 3. Filterable Scene List */}
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
                  <input
                    type="text"
                    placeholder="Sahne veya duygu ara..."
                    value={tensionSearch}
                    onChange={(e) => setTensionSearch(e.target.value)}
                    className={`w-full pl-7 pr-2.5 py-1 rounded-lg text-xs outline-none border transition-all ${inputBg}`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                {tensionScenes
                  .filter(s => !tensionSearch || s.title.toLowerCase().includes(tensionSearch.toLowerCase()))
                  .map((scene) => {
                    const currentId = selectedTensionSceneId || activeSceneId;
                    const isSelected = scene.id === currentId;
                    const rowScore = (scene as any)[tensionMetric] || 50;

                    return (
                      <div
                        key={scene.id}
                        onClick={() => {
                          setSelectedTensionSceneId(scene.id);
                          jumpToScene(scene.id);
                        }}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected ? (isDark ? 'bg-white/10 border-slate-600' : 'bg-black/5 border-slate-400') : cardBg
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold text-xs opacity-70 shrink-0">
                            #{scene.sceneNumber}
                          </span>
                          <span className="font-mono truncate text-[11px] opacity-90">
                            {scene.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                            {rowScore}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
