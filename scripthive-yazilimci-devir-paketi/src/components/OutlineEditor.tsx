import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, ChevronUp, ChevronDown, Compass, Layers, Film, Tv, 
  CheckCircle2, Sparkles, Sliders, Eye, EyeOff, MapPin, 
  HelpCircle, ArrowRight, Bookmark, BookOpen, Clock,
  Columns2, Rows2, ArrowUpDown, ArrowLeftRight, Search, 
  ChevronRight, Hash, Tag, Activity, ListFilter, AlignLeft
} from 'lucide-react';
import { ScreenplayElement } from '../types';
import { STORY_TEMPLATES, StoryTemplate, BeatDefinition } from './StoryBeatsModal';

interface OutlineEditorProps {
  isOpen: boolean;
  onClose: () => void;
  orientation?: 'horizontal' | 'vertical';
  onToggleOrientation?: () => void;
  elements: ScreenplayElement[];
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  theme: 'dark' | 'light';
  selectedTemplateId?: string;
  onSelectTemplate?: (templateId: string) => void;
  onOpenStoryBeats?: () => void;
  beatAnswers?: Record<string, string>;
  targetPageCount?: number;
}

export default function OutlineEditor({
  isOpen,
  onClose,
  orientation: propOrientation,
  onToggleOrientation,
  elements,
  focusedId,
  setFocusedId,
  theme,
  selectedTemplateId = 'save_the_cat',
  onSelectTemplate,
  onOpenStoryBeats,
  beatAnswers = {},
  targetPageCount = 110
}: OutlineEditorProps) {
  // Local orientation state fallback if not controlled from parent
  const [localOrientation, setLocalOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const orientation = propOrientation || localOrientation;

  const handleToggle = () => {
    if (onToggleOrientation) {
      onToggleOrientation();
    } else {
      setLocalOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
    }
  };

  // Horizontal lanes toggles
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showActsLane, setShowActsLane] = useState(true);
  const [showBeatsLane, setShowBeatsLane] = useState(true);
  const [showScenesLane, setShowScenesLane] = useState(true);

  // Vertical view options
  const [searchQuery, setSearchQuery] = useState('');
  const [verticalFilter, setVerticalFilter] = useState<'all' | 'scenes' | 'beats'>('all');
  const [collapsedActs, setCollapsedActs] = useState<Record<string, boolean>>({});

  // Tooltips
  const [hoveredBeat, setHoveredBeat] = useState<{ beat: BeatDefinition; x: number; y: number } | null>(null);
  const [hoveredScene, setHoveredScene] = useState<{ scene: ScreenplayElement; index: number; page: number; preview: string; x: number; y: number } | null>(null);

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const verticalContainerRef = useRef<HTMLDivElement>(null);

  // Active Story Template
  const activeTemplate = useMemo(() => {
    return STORY_TEMPLATES.find(t => t.id === selectedTemplateId) || STORY_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Total Estimated Script Pages
  const totalScriptPages = useMemo(() => {
    return Math.max(1, Math.ceil(elements.length / 45));
  }, [elements.length]);

  const maxTimelinePages = useMemo(() => {
    return Math.max(targetPageCount, totalScriptPages, 10);
  }, [targetPageCount, totalScriptPages]);

  // Strip HTML utility
  const stripHtml = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  // Extract Scene Elements
  const sceneElements = useMemo(() => {
    let sceneCounter = 0;
    return elements
      .map((el, originalIndex) => {
        if (el.type === 'scene') {
          sceneCounter++;
          // Find next action or dialogue line as snippet
          let snippet = '';
          for (let i = originalIndex + 1; i < Math.min(originalIndex + 4, elements.length); i++) {
            if (elements[i].type === 'scene') break;
            const plain = stripHtml(elements[i].content || '');
            if (plain) {
              snippet = plain;
              break;
            }
          }
          const approxPage = Math.max(1, Math.round(((originalIndex + 1) / Math.max(1, elements.length)) * totalScriptPages * 10) / 10);
          const percent = Math.min(100, Math.max(0, (approxPage / maxTimelinePages) * 100));
          const cleanHeading = stripHtml(el.content || `SAHNE ${sceneCounter}`);

          return {
            element: el,
            sceneNumber: el.sceneNumber || sceneCounter,
            cleanHeading,
            originalIndex,
            approxPage,
            percent,
            snippet
          };
        }
        return null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [elements, totalScriptPages, maxTimelinePages]);

  // Current Focused Element Playhead Position (% along timeline)
  const playheadPercent = useMemo(() => {
    if (!focusedId || elements.length === 0) return null;
    const idx = elements.findIndex(e => e.id === focusedId);
    if (idx === -1) return null;
    const curPage = ((idx + 1) / elements.length) * totalScriptPages;
    return Math.min(100, Math.max(0, (curPage / maxTimelinePages) * 100));
  }, [focusedId, elements, totalScriptPages, maxTimelinePages]);

  const currentPlayheadPage = useMemo(() => {
    if (!focusedId || elements.length === 0) return 1;
    const idx = elements.findIndex(e => e.id === focusedId);
    if (idx === -1) return 1;
    return Math.max(1, Math.round(((idx + 1) / elements.length) * totalScriptPages * 10) / 10);
  }, [focusedId, elements, totalScriptPages]);

  // Derive Acts Blocks from Active Template
  const actBlocks = useMemo(() => {
    if (activeTemplate.beats.length === 0) {
      return [
        { name: '1. Perde (Kurulum)', startPercent: 0, endPercent: 25 },
        { name: '2. Perde A (Gelişme)', startPercent: 25, endPercent: 50 },
        { name: '2. Perde B (Kriz)', startPercent: 50, endPercent: 75 },
        { name: '3. Perde (Çözüm)', startPercent: 75, endPercent: 100 }
      ];
    }

    const uniqueActs: { name: string; startPercent: number; endPercent: number }[] = [];
    let currentAct = '';
    let startP = 0;

    activeTemplate.beats.forEach((b, idx) => {
      const actName = b.act.split('(')[0].trim();
      if (idx === 0) {
        currentAct = actName;
        startP = 0;
      } else if (actName !== currentAct) {
        uniqueActs.push({
          name: currentAct,
          startPercent: startP,
          endPercent: b.targetPercent
        });
        currentAct = actName;
        startP = b.targetPercent;
      }

      if (idx === activeTemplate.beats.length - 1) {
        uniqueActs.push({
          name: currentAct,
          startPercent: startP,
          endPercent: 100
        });
      }
    });

    return uniqueActs.length > 0 ? uniqueActs : [
      { name: '1. Perde', startPercent: 0, endPercent: 25 },
      { name: '2. Perde A', startPercent: 25, endPercent: 50 },
      { name: '2. Perde B', startPercent: 50, endPercent: 75 },
      { name: '3. Perde', startPercent: 75, endPercent: 100 }
    ];
  }, [activeTemplate]);

  // Group acts, beats, and scenes for the Vertical Tree breakdown
  const actSections = useMemo(() => {
    return actBlocks.map((act, actIndex) => {
      const startPage = Math.max(1, Math.round((act.startPercent / 100) * maxTimelinePages));
      const endPage = Math.max(1, Math.round((act.endPercent / 100) * maxTimelinePages));

      // Beats in this act
      const beatsInAct = activeTemplate.beats.filter(b => {
        const actName = b.act.split('(')[0].trim();
        return actName.toLowerCase() === act.name.toLowerCase() || 
          (b.targetPercent >= act.startPercent && (actIndex === actBlocks.length - 1 ? b.targetPercent <= act.endPercent : b.targetPercent < act.endPercent));
      });

      // Scenes in this act
      const scenesInAct = sceneElements.filter(s => {
        if (actIndex === actBlocks.length - 1) {
          return s.percent >= act.startPercent && s.percent <= 100;
        }
        return s.percent >= act.startPercent && s.percent < act.endPercent;
      });

      return {
        act,
        actIndex,
        startPage,
        endPage,
        beats: beatsInAct,
        scenes: scenesInAct
      };
    });
  }, [actBlocks, activeTemplate, sceneElements, maxTimelinePages]);

  // Filter scenes and beats if search query is active in vertical mode
  const filteredActSections = useMemo(() => {
    if (!searchQuery.trim()) return actSections;
    const q = searchQuery.toLocaleLowerCase('tr-TR');

    return actSections.map(sec => {
      const filteredScenes = sec.scenes.filter(s => 
        s.cleanHeading.toLocaleLowerCase('tr-TR').includes(q) || 
        s.snippet.toLocaleLowerCase('tr-TR').includes(q) ||
        String(s.sceneNumber).includes(q)
      );
      const filteredBeats = sec.beats.filter(b => 
        b.name.toLocaleLowerCase('tr-TR').includes(q) ||
        b.description.toLocaleLowerCase('tr-TR').includes(q) ||
        (beatAnswers[b.id] && beatAnswers[b.id].toLocaleLowerCase('tr-TR').includes(q))
      );
      return {
        ...sec,
        scenes: filteredScenes,
        beats: filteredBeats
      };
    });
  }, [actSections, searchQuery, beatAnswers]);

  // Jump to specific scene in editor
  const handleJumpToScene = (sceneId: string) => {
    setFocusedId(sceneId);
    setTimeout(() => {
      const node = document.getElementById(`element-${sceneId}`);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const toggleActCollapse = (actName: string) => {
    setCollapsedActs(prev => ({
      ...prev,
      [actName]: !prev[actName]
    }));
  };

  if (!isOpen) return null;

  // Canonical Theme styles
  const isDark = theme === 'dark';
  const containerBg = isDark 
    ? 'bg-[#1a1f25] border-[#2d3640] text-slate-200' 
    : 'bg-[#fcfbf8] border-[#c8bea8] text-slate-800';
  const headerBg = isDark 
    ? 'bg-[#15191f] border-[#2d3640]' 
    : 'bg-[#e8e0d5] border-[#c8bea8]';
  const laneBg = isDark ? 'bg-[#14181f]/90' : 'bg-[#f8f5ee]';
  const tickBorder = isDark ? 'border-[#2d3640]' : 'border-[#dcd4c4]';

  // =========================================================================
  // VERTICAL OUTLINE EDITOR (DİKEY ŞABLON & SAHNE AKIŞ PANELİ)
  // =========================================================================
  if (orientation === 'vertical') {
    return (
      <div 
        ref={verticalContainerRef}
        className={`w-80 sm:w-88 md:w-96 shrink-0 border-r flex flex-col h-full overflow-hidden select-none z-30 shadow-lg ${containerBg}`}
      >
        {/* TOP HEADER */}
        <div className={`px-4 py-3 flex items-center justify-between gap-2 border-b ${headerBg}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-lg flex items-center gap-1 font-bold shrink-0 ${
              isDark ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-600/15 text-blue-700'
            }`}>
              <Compass size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono truncate">
                OUTLINE CETVELİ
              </h3>
              <button
                onClick={onOpenStoryBeats}
                className={`text-[10px] font-semibold flex items-center gap-1 truncate hover:underline ${
                  isDark ? 'text-[#6ba3e8]' : 'text-blue-700'
                }`}
                title="Şablonu Değiştir / Beat Notlarını Aç"
              >
                <span className="truncate">{activeTemplate.title}</span>
                <span className="opacity-60 font-mono">({activeTemplate.beats.length} Beat)</span>
              </button>
            </div>
          </div>

          {/* Controls: Orientation Toggle, Close */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Switch to Horizontal Mode */}
            <button
              onClick={handleToggle}
              className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                isDark 
                  ? 'bg-[#20272e] hover:bg-[#28323c] border-[#2d3640] text-slate-200' 
                  : 'bg-white hover:bg-slate-50 border-[#c8bea8] text-slate-800 shadow-xs'
              }`}
              title="Yatay Zaman Şeridi Cetveli Moduna Geç"
            >
              <Rows2 size={12} className={isDark ? 'text-[#6ba3e8]' : 'text-blue-700'} />
              <span>Yatay Yap</span>
            </button>

            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'
              }`}
              title="Kapat"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className={`p-3 border-b space-y-2 text-xs ${isDark ? 'bg-[#171c22] border-[#2d3640]' : 'bg-[#f4efe4] border-[#c8bea8]'}`}>
          {/* Search bar */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sahne veya Beat ara..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none transition-all ${
                isDark 
                  ? 'bg-[#1a1f25] border-[#2d3640] text-slate-100 focus:border-[#6ba3e8]' 
                  : 'bg-white border-[#c8bea8] text-slate-900 focus:border-blue-700'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills & Summary */}
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVerticalFilter('all')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  verticalFilter === 'all'
                    ? (isDark ? 'bg-[#6ba3e8] text-slate-950 font-bold' : 'bg-blue-700 text-white font-bold')
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setVerticalFilter('scenes')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  verticalFilter === 'scenes'
                    ? (isDark ? 'bg-[#6ba3e8] text-slate-950 font-bold' : 'bg-blue-700 text-white font-bold')
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                Sahneler ({sceneElements.length})
              </button>
              <button
                onClick={() => setVerticalFilter('beats')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  verticalFilter === 'beats'
                    ? (isDark ? 'bg-[#6ba3e8] text-slate-950 font-bold' : 'bg-blue-700 text-white font-bold')
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                Beat'ler ({activeTemplate.beats.length})
              </button>
            </div>

            <span className="text-[10px] font-mono opacity-60 shrink-0">
              ~{totalScriptPages} sf.
            </span>
          </div>
        </div>

        {/* SCROLLABLE VERTICAL TIMELINE / TREE */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2d3640]/40 dark:divide-[#2d3640]/50 divide-dashed custom-scrollbar">
          {filteredActSections.map((sec, i) => {
            const isActCollapsed = !!collapsedActs[sec.act.name];

            return (
              <div 
                key={sec.act.name}
                className="transition-colors"
              >
                {/* ACT SECTION ACCORDION HEADER */}
                <button
                  type="button"
                  onClick={() => toggleActCollapse(sec.act.name)}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left font-mono text-xs transition-colors ${
                    isDark 
                      ? 'bg-[#181d24] hover:bg-[#1e242d] text-slate-100' 
                      : 'bg-[#ece4d6] hover:bg-[#e4dcce] text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-emerald-500' : i === 2 ? 'bg-amber-500' : 'bg-purple-500'
                    }`} />
                    <span className="font-bold truncate text-[11px] uppercase tracking-wider">{sec.act.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[10px] opacity-75">
                    <span className="font-mono">sf. {sec.startPage}-{sec.endPage}</span>
                    <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                      isDark ? 'bg-black/25 text-slate-300' : 'bg-black/5 text-slate-700'
                    }`}>
                      {sec.scenes.length} Sahne
                    </span>
                    {isActCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </div>
                </button>

                {/* ACT CONTENT BODY */}
                {!isActCollapsed && (
                  <div className="p-2 space-y-2">
                    {/* 1. BEATS IN THIS ACT */}
                    {(verticalFilter === 'all' || verticalFilter === 'beats') && sec.beats.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1 font-mono px-2 pt-1">
                          <Bookmark size={11} className={isDark ? 'text-[#6ba3e8]' : 'text-blue-700'} />
                          <span>Hikaye Beat'leri ({sec.beats.length})</span>
                        </div>

                        <div className="space-y-1">
                          {sec.beats.map((beat) => {
                            const isAnswered = !!beatAnswers[beat.id]?.trim();
                            const beatPage = Math.max(1, Math.round((beat.targetPercent / 100) * maxTimelinePages));

                            return (
                              <div
                                key={beat.id}
                                onClick={onOpenStoryBeats}
                                className={`p-2 rounded-lg text-xs cursor-pointer transition-all border ${
                                  isAnswered
                                    ? (isDark ? 'bg-[#202834] border-[#2b3a4e] text-slate-100' : 'bg-blue-50/60 border-blue-200 text-blue-950')
                                    : (isDark ? 'bg-[#15191f] border-transparent hover:border-[#2d3640] text-slate-300' : 'bg-white border-transparent hover:border-[#c8bea8] text-slate-800')
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                  <div className="flex items-center gap-1.5 truncate">
                                    {isAnswered ? (
                                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="w-2 h-2 rounded-full border border-current opacity-40 shrink-0" />
                                    )}
                                    <span className="font-bold text-[11px] truncate">
                                      {beat.name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono opacity-60 shrink-0">
                                    ~{beatPage}. sf (%{beat.targetPercent})
                                  </span>
                                </div>

                                <p className="text-[10px] opacity-70 line-clamp-2 leading-tight pl-3.5">
                                  {beat.description}
                                </p>

                                {beatAnswers[beat.id] && (
                                  <div className={`mt-1.5 ml-3.5 p-1.5 rounded text-[10px] font-mono leading-tight ${
                                    isDark ? 'bg-black/25 text-emerald-300' : 'bg-white/80 text-emerald-900 border border-emerald-200/60'
                                  }`}>
                                    <span className="font-bold">Not: </span>
                                    <span className="line-clamp-2">{beatAnswers[beat.id]}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. SCENES IN THIS ACT */}
                    {(verticalFilter === 'all' || verticalFilter === 'scenes') && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1 font-mono px-2">
                          <Film size={11} className={isDark ? 'text-[#6ba3e8]' : 'text-blue-700'} />
                          <span>Sahneler ({sec.scenes.length})</span>
                        </div>

                        {sec.scenes.length === 0 ? (
                          <div className="p-2.5 text-center text-[10px] font-mono opacity-40">
                            Bu perde aralığına henüz sahne eklenmedi.
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {sec.scenes.map((scene) => {
                              const isCurrent = focusedId === scene.element.id;

                              return (
                                <div
                                  key={scene.element.id}
                                  onClick={() => handleJumpToScene(scene.element.id)}
                                  className={`p-2 rounded-lg cursor-pointer transition-all border ${
                                    isCurrent
                                      ? (isDark 
                                          ? 'bg-[#253040] border-[#6ba3e8] text-white shadow-xs' 
                                          : 'bg-blue-50 border-blue-600 text-slate-950 shadow-xs')
                                      : (isDark 
                                          ? 'bg-[#15191f] hover:bg-[#20272e] border-transparent text-slate-300' 
                                          : 'bg-white hover:bg-[#ede5d6] border-transparent text-slate-900')
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                    <div className="flex items-center gap-1.5 truncate">
                                      {scene.element.colorTag && (
                                        <div 
                                          className="w-2 h-2 rounded-full shrink-0 shadow-xs" 
                                          style={{ backgroundColor: scene.element.colorTag }}
                                        />
                                      )}
                                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                                        isDark ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-700 text-white'
                                      }`}>
                                        #{scene.sceneNumber}
                                      </span>
                                      <span className="font-bold text-[11px] truncate tracking-tight" title={scene.cleanHeading}>
                                        {scene.cleanHeading}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono opacity-60">
                                      <span>~{scene.approxPage}. sf</span>
                                    </div>
                                  </div>

                                  {scene.snippet && (
                                    <p className="text-[10px] opacity-70 italic line-clamp-1 font-mono pl-2 border-l-2 border-inherit">
                                      "{scene.snippet}"
                                    </p>
                                  )}

                                  {isCurrent && (
                                    <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-amber-500 dark:text-amber-400 pl-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      <span>Editörde Açık Sahne</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM STATUS STRIP */}
        <div className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] font-mono opacity-80 ${headerBg}`}>
          <div className="flex items-center gap-2">
            <Layers size={13} className="opacity-60" />
            <span>Toplam <b>{sceneElements.length}</b> Sahne</span>
          </div>
          <button
            onClick={onOpenStoryBeats}
            className={`font-semibold flex items-center gap-1 hover:underline ${
              isDark ? 'text-[#6ba3e8]' : 'text-blue-700'
            }`}
          >
            <span>Şablon Rehberi</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // HORIZONTAL OUTLINE EDITOR (YATAY ZAMAN ŞERİDİ & CETVEL)
  // =========================================================================
  return (
    <div className={`w-full border-b select-none transition-all relative z-30 shadow-md ${containerBg}`}>
      {/* ============================================================ */}
      {/* TOP COMPACT TOOLBAR */}
      {/* ============================================================ */}
      <div className={`px-4 py-2 flex items-center justify-between gap-3 text-xs border-b ${headerBg}`}>
        {/* Left: Branding & Model Selector */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-lg flex items-center gap-1 font-bold ${
            isDark ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-600/15 text-blue-700'
          }`}>
            <Compass size={15} />
            <span className="text-[11px] font-mono uppercase tracking-wider hidden sm:inline">OUTLINE EDITOR</span>
          </div>

          {/* Active Template Quick Link */}
          <button
            onClick={onOpenStoryBeats}
            className={`px-2.5 py-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all truncate ${
              isDark 
                ? 'bg-[#1e2532] hover:bg-[#283243] border-[#2d3848] text-slate-200' 
                : 'bg-white hover:bg-slate-50 border-[#cfc4b0] text-slate-800 shadow-xs'
            }`}
            title="Hikaye Geliştirici & Şablonları Aç"
          >
            <span className="truncate max-w-[140px] sm:max-w-[220px]">{activeTemplate.title}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
              {activeTemplate.beats.length} Beat
            </span>
          </button>
        </div>

        {/* Center: Live Script Metrics */}
        <div className="hidden md:flex items-center gap-3 text-[11px] opacity-80 font-mono">
          <span className="flex items-center gap-1">
            <Layers size={13} className="opacity-60" />
            <b>{sceneElements.length}</b> Sahne
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock size={13} className="opacity-60" />
            Tahmini: <b>~{totalScriptPages}</b> / {maxTimelinePages} sf.
          </span>
          {playheadPercent !== null && (
            <>
              <span>•</span>
              <span className={`font-semibold ${isDark ? 'text-[#6ba3e8]' : 'text-blue-700'}`}>
                İmleç: ~{currentPlayheadPage}. sf
              </span>
            </>
          )}
        </div>

        {/* Right: Orientation Switcher, Lane Filter Toggles, Collapse & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Switch to Vertical Mode Button */}
          <button
            onClick={handleToggle}
            className={`px-2 py-1 rounded-md border text-xs font-bold flex items-center gap-1 transition-all mr-1 ${
              isDark 
                ? 'bg-[#1e2532] hover:bg-[#283243] border-[#2d3848] text-slate-200' 
                : 'bg-white hover:bg-slate-50 border-[#cfc4b0] text-slate-800 shadow-xs'
            }`}
            title="Dikey Şablon & Sahne Listesi Paneli Moduna Geç"
          >
            <Columns2 size={13} className={isDark ? 'text-[#6ba3e8]' : 'text-blue-700'} />
            <span className="hidden sm:inline">Dikey Yap</span>
          </button>

          {/* Lane Visibility Toggles (Only when expanded) */}
          {!isCollapsed && (
            <div className="hidden lg:flex items-center gap-1 mr-1 p-0.5 rounded-lg border border-inherit bg-black/5 dark:bg-white/5">
              <button
                onClick={() => setShowActsLane(!showActsLane)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  showActsLane 
                    ? (isDark ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-700 text-white')
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                Perdeler
              </button>
              <button
                onClick={() => setShowBeatsLane(!showBeatsLane)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  showBeatsLane 
                    ? (isDark ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-700 text-white')
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                Beat'ler
              </button>
              <button
                onClick={() => setShowScenesLane(!showScenesLane)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  showScenesLane 
                    ? (isDark ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-700 text-white')
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                Sahneler
              </button>
            </div>
          )}

          {/* Collapse / Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' : 'hover:bg-slate-200 text-slate-600 hover:text-black'
            }`}
            title={isCollapsed ? "Outline Şeridini Genişlet" : "Outline Şeridini Daralt"}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' : 'hover:bg-slate-200 text-slate-600 hover:text-black'
            }`}
            title="Outline Editor'ü Kapat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TIMELINE RIBBON CONTAINER (EXPANDED) */}
      {/* ============================================================ */}
      {!isCollapsed && (
        <div 
          ref={timelineContainerRef}
          className="p-3 sm:px-5 sm:py-3.5 space-y-2 relative overflow-x-auto"
        >
          {/* 1. LANE: ACTS (PERDELER / AKTLAR ŞERİDİ) */}
          {showActsLane && (
            <div className="relative w-full h-6 rounded-md overflow-hidden flex border border-inherit shadow-xs font-mono text-[10px]">
              {actBlocks.map((act, i) => {
                const widthPercent = Math.max(2, act.endPercent - act.startPercent);
                const startPage = Math.max(1, Math.round((act.startPercent / 100) * maxTimelinePages));
                const endPage = Math.max(1, Math.round((act.endPercent / 100) * maxTimelinePages));
                
                // Calm alternate background shades
                const actBg = isDark 
                  ? (i % 2 === 0 ? 'bg-[#20272e] text-slate-200' : 'bg-[#1a1f25] text-slate-300')
                  : (i % 2 === 0 ? 'bg-[#e8e0d5] text-slate-800' : 'bg-[#dfd7ca] text-slate-900');

                return (
                  <div
                    key={i}
                    style={{ width: `${widthPercent}%` }}
                    className={`h-full flex items-center justify-between px-2 border-r last:border-r-0 border-inherit shrink-0 transition-all group overflow-hidden ${actBg}`}
                    title={`${act.name} (sf. ${startPage} - ${endPage} | %${act.startPercent} - %${act.endPercent})`}
                  >
                    <span className="font-bold truncate text-[10px]">{act.name}</span>
                    <span className="text-[9px] opacity-60 shrink-0 font-mono hidden sm:inline">
                      sf. {startPage}-{endPage}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. LANE: STORY BEATS (HİKAYE BEAT'LERİ İŞARETÇİLERİ) */}
          {showBeatsLane && activeTemplate.beats.length > 0 && (
            <div className={`relative w-full h-8 rounded-md border border-dashed border-inherit flex items-center px-1 ${laneBg}`}>
              {activeTemplate.beats.map((beat, i) => {
                const isAnswered = !!beatAnswers[beat.id]?.trim();
                const beatPage = Math.max(1, Math.round((beat.targetPercent / 100) * maxTimelinePages));
                const leftPercent = Math.min(98, Math.max(1, beat.targetPercent));

                return (
                  <div
                    key={beat.id}
                    style={{ left: `${leftPercent}%` }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredBeat({ beat, x: rect.left, y: rect.bottom });
                    }}
                    onMouseLeave={() => setHoveredBeat(null)}
                    onClick={onOpenStoryBeats}
                    className={`absolute -translate-x-1/2 cursor-pointer flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[9px] font-mono font-bold transition-all hover:scale-110 shadow-xs z-10 ${
                      isAnswered
                        ? (isDark ? 'bg-[#6ba3e8] text-slate-950 border-[#6ba3e8]' : 'bg-blue-700 text-white border-blue-700')
                        : (isDark ? 'bg-[#20272e] text-slate-300 border-[#2d3640] hover:border-slate-500' : 'bg-white text-slate-700 border-[#c8bea8] hover:border-slate-500')
                    }`}
                  >
                    {isAnswered ? <CheckCircle2 size={10} /> : <span className="opacity-70">{i + 1}</span>}
                    <span className="hidden xl:inline truncate max-w-[80px]">
                      {beat.name.split('(')[0].replace(/^\d+\.\s*/, '')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. LANE: SCENES (SENARYODAKİ GERÇEK SAHNELER ŞERİDİ) */}
          {showScenesLane && (
            <div className={`relative w-full min-h-[34px] rounded-md border border-inherit p-1 flex items-center ${laneBg}`}>
              {sceneElements.length === 0 ? (
                <div className="w-full text-center text-[10px] opacity-60 font-mono py-1">
                  Henüz bir sahne başlığı eklenmedi (Örn: İÇ. ODA - GÜN).
                </div>
              ) : (
                sceneElements.map((item) => {
                  const isCurrent = focusedId === item.element.id;
                  const cleanHeading = item.cleanHeading
                    .replace(/^\d+[\.\-\s]+/, '')
                    .replace(/^(İÇ|IÇ|DIŞ|DIS|INT|EXT)[\.\s\-\/]*/i, '')
                    .trim();

                  return (
                    <button
                      key={item.element.id}
                      style={{ left: `${item.percent}%` }}
                      onClick={() => handleJumpToScene(item.element.id)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredScene({
                          scene: item.element,
                          index: item.sceneNumber,
                          page: item.approxPage,
                          preview: item.snippet,
                          x: rect.left,
                          y: rect.bottom
                        });
                      }}
                      onMouseLeave={() => setHoveredScene(null)}
                      className={`absolute -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 border transition-all hover:scale-110 shadow-xs z-10 truncate max-w-[110px] ${
                        isCurrent
                          ? (isDark ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/40' : 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-500/30')
                          : (isDark ? 'bg-[#20272e] hover:bg-[#28323c] text-slate-200 border-[#2d3640]' : 'bg-[#e8e0d5] hover:bg-[#dfd7ca] text-slate-900 border-[#c8bea8]')
                      }`}
                      title={`${item.sceneNumber}. ${item.cleanHeading} (~${item.approxPage}. sf)`}
                    >
                      <span className="opacity-70">#{item.sceneNumber}</span>
                      <span className="truncate">{cleanHeading || item.cleanHeading}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* BOTTOM RULER & PLAYHEAD LINE */}
          {/* ============================================================ */}
          <div className="relative w-full pt-1">
            {/* Playhead vertical indicator line */}
            {playheadPercent !== null && (
              <div
                style={{ left: `${playheadPercent}%` }}
                className="absolute top-0 bottom-0 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center"
              >
                <div className={`w-2.5 h-2.5 rotate-45 -mt-1 shadow-sm ${
                  isDark ? 'bg-[#6ba3e8] border border-white' : 'bg-blue-600 border border-white'
                }`} />
                <div className={`w-[2px] h-full ${
                  isDark ? 'bg-[#6ba3e8]/70 shadow-[0_0_8px_rgba(107,163,232,0.8)]' : 'bg-blue-600/70 shadow-[0_0_8px_rgba(37,99,235,0.8)]'
                }`} />
              </div>
            )}

            {/* Page Tick Marks */}
            <div className={`flex justify-between items-center text-[9px] font-mono opacity-60 border-t ${tickBorder} pt-1`}>
              <span>0 sf.</span>
              <span>~{Math.round(maxTimelinePages * 0.25)} sf.</span>
              <span className="font-bold text-amber-500/90">
                MIDPOINT (~{Math.round(maxTimelinePages * 0.5)} sf.)
              </span>
              <span>~{Math.round(maxTimelinePages * 0.75)} sf.</span>
              <span>{maxTimelinePages} sf.</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* HOVER TOOLTIP: STORY BEAT PREVIEW */}
      {/* ============================================================ */}
      {hoveredBeat && (
        <div
          style={{ 
            left: Math.min(Math.max(16, hoveredBeat.x - 120), window.innerWidth - 300), 
            top: hoveredBeat.y + 8 
          }}
          className={`fixed z-50 w-72 p-3 rounded-xl shadow-2xl border text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-100 ${
            isDark ? 'bg-[#20272e] border-[#2d3640] text-slate-100' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-inherit">
            <span className="font-bold truncate text-[#6ba3e8] dark:text-[#6ba3e8]">
              {hoveredBeat.beat.name}
            </span>
            <span className="font-mono text-[10px] opacity-70 shrink-0">
              ~{Math.max(1, Math.round((hoveredBeat.beat.targetPercent / 100) * maxTimelinePages))}. sf (%{hoveredBeat.beat.targetPercent})
            </span>
          </div>
          <p className="text-[11px] opacity-80 mb-2 leading-relaxed">
            {hoveredBeat.beat.description}
          </p>
          {beatAnswers[hoveredBeat.beat.id] ? (
            <div className={`p-2 rounded-lg text-[10px] font-mono leading-snug ${
              isDark ? 'bg-black/25 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'
            }`}>
              <span className="font-bold text-emerald-400 block mb-0.5">✓ Yazarın Notu:</span>
              <p className="opacity-90 line-clamp-3">{beatAnswers[hoveredBeat.beat.id]}</p>
            </div>
          ) : (
            <div className="text-[10px] opacity-50 italic">
              Henüz bu beat için bir not yazılmadı. Tıklayarak düzenleyin.
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* HOVER TOOLTIP: SCENE PREVIEW */}
      {/* ============================================================ */}
      {hoveredScene && (
        <div
          style={{ 
            left: Math.min(Math.max(16, hoveredScene.x - 100), window.innerWidth - 280), 
            top: hoveredScene.y + 8 
          }}
          className={`fixed z-50 w-64 p-3 rounded-xl shadow-2xl border text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-100 ${
            isDark ? 'bg-[#20272e] border-[#2d3640] text-slate-100' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-inherit">
            <span className="font-bold truncate">
              {hoveredScene.index}. {hoveredScene.scene.content}
            </span>
            <span className="font-mono text-[10px] opacity-70 shrink-0">
              ~{hoveredScene.page}. sf
            </span>
          </div>
          {hoveredScene.preview ? (
            <p className="text-[11px] opacity-75 line-clamp-3 italic leading-relaxed">
              "{hoveredScene.preview}"
            </p>
          ) : (
            <p className="text-[10px] opacity-50 italic">
              Aksiyon veya diyalog satırı yok.
            </p>
          )}
          <div className="mt-2 text-[9px] text-[#6ba3e8] font-bold flex items-center gap-1">
            <span>Tıkla ve Sahneye Git</span>
            <ArrowRight size={10} />
          </div>
        </div>
      )}
    </div>
  );
}
