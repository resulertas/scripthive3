import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, LayoutGrid, HelpCircle, BookOpen, ChevronDown, 
  FolderOpen, Save, Trash2, Replace, RefreshCw, Mic, Coffee, 
  WifiOff, Download, CheckCircle2, MapPin, CloudUpload, Cloud,
  MoreVertical, Focus, Monitor, Tablet, Sun, Moon, Sparkles,
  Undo, Redo, Palette, Mic2, Compass, Activity, BookMarked,
  Info, Columns2, Sliders, Scissors, Tv, Type, Target, Lightbulb,
  PanelLeft, Users, Lock, ArrowRightLeft
} from 'lucide-react';
import { ScreenplayElement, Screenplay, Collaborator } from '../types';

interface TopBarProps {
  elements: ScreenplayElement[];
  theme: 'dark' | 'light';
  setTheme?: (theme: 'dark' | 'light') => void;
  format?: 'US' | 'FR';
  setFormat?: (format: 'US' | 'FR') => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  uiMode: 'auto' | 'desktop' | 'tablet';
  activeUiMode: 'desktop' | 'tablet';
  setUiMode: (mode: 'auto' | 'desktop' | 'tablet') => void;
  viewMode: 'editor' | 'cards';
  setViewMode: (mode: 'editor' | 'cards') => void;
  isZenMode: boolean;
  setIsZenMode: (mode: boolean) => void;
  onOpenGuide: () => void;
  onOpenCharacterBible: () => void;
  onOpenStoryBible?: () => void;
  onOpenNotes: () => void;
  onOpenStats: () => void;
  onOpenLocationList: () => void;
  onOpenBin: () => void;
  onOpenAi?: () => void;
  onOpenDialogueTuner?: () => void;
  onOpenActorSides?: () => void;
  onOpenCharacterMatrix?: () => void;
  onOpenSmartRename?: () => void;
  onOpenTableReadModal?: () => void;
  onOpenStoryBeats?: () => void;
  onOpenDramaticArc?: () => void;
  onClearAll: () => void;
  onOpen: (elements: ScreenplayElement[], format: 'US' | 'FR', coverPage?: any, newDriveFileId?: string | null, characterColors?: Record<string, string>, selectedStoryTemplateId?: string, storyBeatAnswers?: Record<string, string>) => void;
  projects?: Screenplay[];
  onOpenRecent?: (project: Screenplay) => void;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  onExportRTF: () => void;
  onExportFDX: () => void;
  onExportFountain: () => void;
  onExportCeltx: () => void;
  onExportKitsp: () => void;
  onOpenFindReplace: () => void;
  isGoogleAuth?: boolean;
  isSavingToDrive?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  onSaveToDrive?: () => void;
  driveFileId?: string | null;
  isListening?: boolean;
  toggleListening?: () => void;
  isHealthBreakEnabled?: boolean;
  setIsHealthBreakEnabled?: (val: boolean) => void;
  isOffline?: boolean;
  canInstall?: boolean;
  onInstallApp?: () => void;
  isRevisionMode?: boolean;
  setIsRevisionMode?: (val: boolean) => void;
  activeRevisionColor?: string;
  setActiveRevisionColor?: (color: string) => void;
  activeRevisionDate?: string;
  setActiveRevisionDate?: (date: string) => void;
  printRevisionMarks?: boolean;
  setPrintRevisionMarks?: (val: boolean) => void;
  onClearRevisionColors?: () => void;
  isTableReadMode?: boolean;
  setIsTableReadMode?: (val: boolean) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleDualDialogue?: () => void;
  isOutlineEditorOpen?: boolean;
  onToggleOutlineEditor?: () => void;
  onOpenFontPicker?: () => void;
  hasCoverPage?: boolean;
  onToggleCoverPage?: () => void;
  isToolbarVisible?: boolean;
  onToggleToolbar?: () => void;
  isPagesLocked?: boolean;
  onTogglePageLock?: () => void;
  isSplitScreen?: boolean;
  setIsSplitScreen?: (open: boolean) => void;
  splitScreenTab?: 'cards' | 'outline' | 'characters' | 'notes' | 'bible' | 'tension';
  setSplitScreenTab?: (tab: 'cards' | 'outline' | 'characters' | 'notes' | 'bible' | 'tension') => void;
  isTypewriterMode?: boolean;
  setIsTypewriterMode?: (mode: boolean) => void;
  isFocusDimming?: boolean;
  setIsFocusDimming?: (dim: boolean) => void;
  onOpenCollaboration?: () => void;
  isCollaborationActive?: boolean;
  activeCollaboratorsCount?: number;
  pendingRequestsCount?: number;
  collaborators?: Collaborator[];
  remotePresences?: Record<string, { senderId: string; senderName: string; senderColor: string; status: 'typing' | 'idle' }>;
}

export default function TopBar({ 
  elements, theme, setTheme, format, setFormat, zoom, setZoom, uiMode, activeUiMode, setUiMode, viewMode, setViewMode, isZenMode, setIsZenMode, 
  onOpenGuide, onOpenCharacterBible, onOpenStoryBible, onOpenNotes, onOpenStats, onOpenLocationList, onOpenBin, onOpenAi,
  onOpenDialogueTuner, onOpenActorSides, onOpenCharacterMatrix, onOpenSmartRename, onOpenTableReadModal, onOpenStoryBeats, onOpenDramaticArc,
  onClearAll, onOpen, projects = [], onOpenRecent, onExportPDF, onExportRTF, onExportDOCX, onExportFDX, onExportFountain, onExportCeltx, onExportKitsp, onOpenFindReplace,
  isGoogleAuth, isSavingToDrive, onGoogleLogin, onGoogleLogout, onSaveToDrive, driveFileId, isListening, toggleListening,
  isHealthBreakEnabled, setIsHealthBreakEnabled, isOffline, canInstall, onInstallApp,
  isRevisionMode, setIsRevisionMode, activeRevisionColor, setActiveRevisionColor, activeRevisionDate, setActiveRevisionDate, printRevisionMarks, setPrintRevisionMarks, onClearRevisionColors,
  isTableReadMode, setIsTableReadMode, onUndo, onRedo, canUndo, canRedo, onToggleDualDialogue,
  isOutlineEditorOpen, onToggleOutlineEditor, onOpenFontPicker,
  hasCoverPage, onToggleCoverPage,
  isToolbarVisible = true, onToggleToolbar,
  isPagesLocked = false, onTogglePageLock,
  isSplitScreen, setIsSplitScreen, splitScreenTab, setSplitScreenTab,
  isTypewriterMode, setIsTypewriterMode, isFocusDimming, setIsFocusDimming,
  onOpenCollaboration, isCollaborationActive, activeCollaboratorsCount, pendingRequestsCount,
  collaborators = [], remotePresences = {}
}: TopBarProps) {
  const wordCount = elements.reduce((acc, el) => acc + el.content.split(/\s+/).filter(Boolean).length, 0);
  const pageCount = Math.max(1, Math.ceil(elements.length / 45));

  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'format' | 'production' | 'tools' | 'view' | 'help' | null>(null);
  const [isExportSubmenuOpen, setIsExportSubmenuOpen] = useState(false);
  const [isRevisionSubmenuOpen, setIsRevisionSubmenuOpen] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuContainerRef.current && event.target && !menuContainerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setIsExportSubmenuOpen(false);
        setIsRevisionSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeAll = () => {
    setActiveMenu(null);
    setIsExportSubmenuOpen(false);
    setIsRevisionSubmenuOpen(false);
  };

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640] text-slate-300' : 'bg-[#e8e0d5] border-[#c8bea8] text-slate-900';
  const menuBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640] text-slate-200 shadow-2xl' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900 shadow-2xl';
  const btnHover = theme === 'dark' ? 'hover:text-white hover:bg-[#2d3640]/70' : 'hover:text-black hover:bg-[#dfd7ca]';
  
  const menuBtnClass = (menuKey: typeof activeMenu) => 
    `px-2.5 py-1 rounded-md transition-colors font-medium text-xs ${
      activeMenu === menuKey 
        ? (theme === 'dark' ? 'bg-[#2d3640] text-white font-semibold' : 'bg-[#dfd7ca] text-black font-semibold')
        : (theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-[#2d3640]/50' : 'text-slate-800 hover:text-black hover:bg-[#dfd7ca]')
    }`;

  return (
    <header className={`h-12 border-b flex items-center justify-between px-3 sm:px-4 text-xs select-none no-print relative z-[60] ${bgClass}`}>
      {/* LEFT: Logo and 7 Professional Desktop Menus */}
      <div className="flex items-center gap-3 sm:gap-5" ref={menuContainerRef}>
        <div className={`font-bold text-base tracking-tight select-none cursor-default ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          ScriptHive
        </div>

        <nav className="flex items-center gap-0.5 sm:gap-1 font-medium">
          {/* 1. DOSYA (File) */}
          <div className="relative">
            <button
              onClick={() => {
                const next = activeMenu === 'file' ? null : 'file';
                closeAll();
                setActiveMenu(next);
              }}
              className={menuBtnClass('file')}
            >
              Dosya
            </button>

            {activeMenu === 'file' && (
              <div className={`absolute top-full left-0 mt-1 w-56 rounded-xl border py-1.5 z-50 ${menuBg}`}>
                <button onClick={() => { onClearAll(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <Trash2 size={14} /> Yeni (Temizle)
                </button>
                <button onClick={() => { onExportRTF(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <Save size={14} /> Markdown (.md) Olarak Kaydet
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Dışa Aktar Submenu */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsExportSubmenuOpen(true)}
                  onMouseLeave={() => setIsExportSubmenuOpen(false)}
                >
                  <button className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                    <div className="flex items-center gap-2">
                      <Download size={14} /> Dışa Aktar
                    </div>
                    <ChevronDown size={13} className="-rotate-90 opacity-60" />
                  </button>

                  {isExportSubmenuOpen && (
                    <div className="absolute top-0 left-full pl-1 w-52 z-50">
                      <div className={`rounded-xl border py-1.5 shadow-2xl ${menuBg}`}>
                        <button onClick={() => { onExportPDF(); closeAll(); }} className={`w-full text-left px-4 py-2 text-xs ${btnHover}`}>PDF olarak (.pdf)</button>
                        <button onClick={() => { onExportDOCX(); closeAll(); }} className={`w-full text-left px-4 py-2 text-xs ${btnHover}`}>Word (.docx)</button>
                        <button onClick={() => { onExportFDX(); closeAll(); }} className={`w-full text-left px-4 py-2 text-xs ${btnHover}`}>Final Draft (.fdx)</button>
                        <button onClick={() => { onExportFountain(); closeAll(); }} className={`w-full text-left px-4 py-2 text-xs ${btnHover}`}>Fountain (.fountain)</button>
                        <button onClick={() => { onExportCeltx(); closeAll(); }} className={`w-full text-left px-4 py-2 text-xs ${btnHover}`}>Celtx (.html)</button>
                        <button onClick={() => { onExportKitsp(); closeAll(); }} className={`w-full text-left px-4 py-2 text-xs ${btnHover}`}>Kitsp</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Google Drive İşlemleri */}
                {!isGoogleAuth ? (
                  <button 
                    onClick={() => { if (!isOffline && onGoogleLogin) { onGoogleLogin(); closeAll(); } }}
                    disabled={isOffline}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} ${isOffline ? 'opacity-40 cursor-not-allowed text-slate-400' : btnHover}`}
                  >
                    <RefreshCw size={14} /> Google Drive'a Bağlan
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => { if (!isOffline && onSaveToDrive) { onSaveToDrive(); closeAll(); } }} 
                      disabled={isOffline || isSavingToDrive}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${isOffline ? 'opacity-40 cursor-not-allowed text-slate-400' : isSavingToDrive ? 'opacity-50 text-blue-500' : (driveFileId ? (theme === 'dark' ? 'text-emerald-400 font-medium' : 'text-emerald-600 font-bold') : '')} ${btnHover}`}
                    >
                      {isSavingToDrive ? <RefreshCw size={14} className="animate-spin" /> : <CloudUpload size={14} />} 
                      {isSavingToDrive ? 'Kaydediliyor...' : (driveFileId ? "Drive'da Güncelle" : "Drive'a Kaydet")}
                    </button>
                    <button 
                      onClick={() => { if(onGoogleLogout) onGoogleLogout(); closeAll(); }} 
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'} ${btnHover}`}
                    >
                      <WifiOff size={14} /> Google Bağlantısını Kes
                    </button>
                  </>
                )}

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                <button onClick={() => { onOpen(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <FolderOpen size={14} /> Bilgisayardan Aç...
                </button>

                {projects.length > 0 && (
                  <>
                    <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />
                    <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
                      Son Projeler
                    </div>
                    {projects.slice(0, 5).map(p => (
                      <button 
                        key={p.id}
                        onClick={() => { onOpenRecent?.(p); closeAll(); }} 
                        className={`w-full text-left px-4 py-1.5 text-xs truncate ${btnHover}`}
                      >
                        {p.title}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 2. DÜZENLE (Edit) */}
          <div className="relative">
            <button
              onClick={() => {
                const next = activeMenu === 'edit' ? null : 'edit';
                closeAll();
                setActiveMenu(next);
              }}
              className={menuBtnClass('edit')}
            >
              Düzenle
            </button>

            {activeMenu === 'edit' && (
              <div className={`absolute top-full left-0 mt-1 w-64 rounded-xl border py-1.5 z-50 ${menuBg}`}>
                {/* Undo / Redo */}
                <button 
                  onClick={() => { onUndo?.(); closeAll(); }} 
                  disabled={!canUndo}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${!canUndo ? 'opacity-40 cursor-not-allowed' : btnHover}`}
                >
                  <div className="flex items-center gap-2"><Undo size={14} /> Geri Al</div>
                  <span className="text-[10px] opacity-50">Ctrl+Z</span>
                </button>
                <button 
                  onClick={() => { onRedo?.(); closeAll(); }} 
                  disabled={!canRedo}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${!canRedo ? 'opacity-40 cursor-not-allowed' : btnHover}`}
                >
                  <div className="flex items-center gap-2"><Redo size={14} /> Yinele</div>
                  <span className="text-[10px] opacity-50">Ctrl+Y</span>
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Bul ve Değiştir */}
                <button onClick={() => { onOpenFindReplace(); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2"><Replace size={14} /> Bul ve Değiştir</div>
                  <span className="text-[10px] opacity-50">Ctrl+F</span>
                </button>

                {/* Akıllı Toplu Değiştirme */}
                <button 
                  onClick={() => { onOpenSmartRename?.(); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <Replace size={14} />
                    <span>Akıllı Toplu Değiştir...</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>Smart</span>
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Karakter Sesi İzolasyonu (Dialogue Tuner) */}
                <button 
                  onClick={() => { onOpenDialogueTuner?.(); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <Mic2 size={14} />
                    <span>Karakter Sesi İzolasyonu</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>Tuner</span>
                </button>

                {/* Masa Okuma Modu (Table Read) */}
                <button 
                  onClick={() => { onOpenTableReadModal?.(); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <Palette size={14} />
                    <span>Masa Okuma & Renk Vurgulama</span>
                  </div>
                  {isTableReadMode && <span className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#6ba3e8]' : 'bg-blue-600'} animate-pulse`} />}
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Revizyon Modu Submenu */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsRevisionSubmenuOpen(true)}
                  onMouseLeave={() => setIsRevisionSubmenuOpen(false)}
                >
                  <button className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isRevisionMode 
                          ? (activeRevisionColor === 'blue' ? 'bg-sky-400' :
                             activeRevisionColor === 'pink' ? 'bg-pink-400' :
                             activeRevisionColor === 'yellow' ? 'bg-yellow-400' :
                             activeRevisionColor === 'green' ? 'bg-emerald-400' :
                             activeRevisionColor === 'goldenrod' ? 'bg-amber-500' : 'bg-white')
                          : (theme === 'dark' ? 'bg-slate-400' : 'bg-slate-500')
                      }`} />
                      <span>Revizyon Takibi</span>
                    </div>
                    <ChevronDown size={13} className="-rotate-90 opacity-60" />
                  </button>

                  {isRevisionSubmenuOpen && (
                    <div className="absolute top-0 left-full pl-1 w-64 z-50">
                      <div className={`rounded-xl border py-2 shadow-2xl ${menuBg}`}>
                        <div className="px-4 py-1.5 flex items-center justify-between">
                          <span className="font-semibold text-xs">Revizyon Modu</span>
                          <button 
                            onClick={() => setIsRevisionMode?.(!isRevisionMode)} 
                            className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isRevisionMode ? 'bg-sky-500' : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300')}`}
                          >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${isRevisionMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {setActiveRevisionDate && (
                          <div className="px-4 py-1.5 flex items-center justify-between gap-2">
                            <span className="text-[11px] opacity-70">Revizyon Tarihi:</span>
                            <input 
                              type="text" 
                              value={activeRevisionDate || ''}
                              onChange={(e) => setActiveRevisionDate(e.target.value)}
                              placeholder="21.09.2026"
                              className={`w-24 px-2 py-0.5 text-xs rounded font-mono text-center border outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
                            />
                          </div>
                        )}

                        <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />
                        {[
                          { key: 'white', label: 'Beyaz (Orijinal taslak)', dot: 'bg-white border border-slate-300' },
                          { key: 'blue', label: '1. Mavi (Mavi revizyon)', dot: 'bg-sky-400' },
                          { key: 'pink', label: '2. Pembe (Pembe revizyon)', dot: 'bg-pink-400' },
                          { key: 'yellow', label: '3. Sarı (Sarı revizyon)', dot: 'bg-yellow-400' },
                          { key: 'green', label: '4. Yeşil (Yeşil revizyon)', dot: 'bg-emerald-400' },
                          { key: 'goldenrod', label: '5. Altın (Altın revizyon)', dot: 'bg-amber-500' }
                        ].map(colorOpt => (
                          <button
                            key={colorOpt.key}
                            onClick={() => {
                              setActiveRevisionColor?.(colorOpt.key as any);
                              setIsRevisionMode?.(colorOpt.key !== 'white');
                              closeAll();
                            }}
                            className={`w-full flex items-center justify-between px-4 py-1.5 text-xs ${btnHover}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${colorOpt.dot}`} />
                              <span className={activeRevisionColor === colorOpt.key ? 'text-sky-400 font-bold' : ''}>{colorOpt.label}</span>
                            </div>
                            {activeRevisionColor === colorOpt.key && <span>✓</span>}
                          </button>
                        ))}

                        <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                        {setPrintRevisionMarks && (
                          <div className="px-4 py-1.5 flex items-center justify-between">
                            <span className="text-[11px] opacity-80">Baskıda Yıldızları Göster</span>
                            <input 
                              type="checkbox" 
                              checked={printRevisionMarks}
                              onChange={(e) => setPrintRevisionMarks(e.target.checked)}
                              className="h-3.5 w-3.5 accent-sky-500 rounded"
                            />
                          </div>
                        )}
                        
                        {onClearRevisionColors && (
                          <button
                            onClick={() => {
                              onClearRevisionColors();
                              closeAll();
                            }}
                            className={`w-full text-left px-4 py-1.5 text-xs text-red-400 hover:text-red-300 ${btnHover}`}
                          >
                            Revizyon İşaretlerini Temizle
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. BİÇİM (Format) */}
          <div className="relative">
            <button
              onClick={() => {
                const next = activeMenu === 'format' ? null : 'format';
                closeAll();
                setActiveMenu(next);
              }}
              className={menuBtnClass('format')}
            >
              Biçim
            </button>

            {activeMenu === 'format' && (
              <div className={`absolute top-full left-0 mt-1 w-64 rounded-xl border py-1.5 z-50 ${menuBg}`}>
                <button onClick={() => { if(setFormat) setFormat('US'); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <span>Amerikan Formatı (US)</span>
                  {format === 'US' && <span className="font-bold text-blue-500">✓</span>}
                </button>
                <button onClick={() => { if(setFormat) setFormat('FR'); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <span>Fransız Formatı (FR)</span>
                  {format === 'FR' && <span className="font-bold text-blue-500">✓</span>}
                </button>

                {/* Kapak Sayfası Ekle / Kaldır */}
                <button 
                  onClick={() => { onToggleCoverPage?.(); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className={hasCoverPage ? "text-amber-500 dark:text-amber-400" : "text-slate-400"} />
                    <span className={hasCoverPage ? "font-semibold text-amber-600 dark:text-amber-400" : ""}>
                      {hasCoverPage ? 'Kapak Sayfasını Kaldır' : 'Kapak Sayfası Ekle'}
                    </span>
                  </div>
                  {hasCoverPage && <span className="font-bold text-amber-500 dark:text-amber-400 text-xs">✓ Aktif</span>}
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Yazı Tipi & Font Galerisi */}
                <button onClick={() => { onOpenFontPicker?.(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <Type size={14} className="text-blue-500 dark:text-sky-400" />
                  <span>Yazı Tipi & Font Galerisi...</span>
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Çift Diyalog */}
                <button onClick={() => { onToggleDualDialogue?.(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <Columns2 size={14} /> Çift Diyalog (Dual Dialogue)
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Hızlı Araç Çubuğu (Toolbar) Aç / Kapat */}
                <button 
                  onClick={() => { onToggleToolbar?.(); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <Sliders size={14} className={isToolbarVisible ? "text-blue-500 dark:text-sky-400" : "text-slate-400"} />
                    <span className={isToolbarVisible ? "font-semibold text-blue-600 dark:text-sky-400" : ""}>
                      Hızlı Düzenleme Çubuğu (Toolbar)
                    </span>
                  </div>
                  {isToolbarVisible && <span className="font-bold text-blue-500 text-xs">✓ Açık</span>}
                </button>
              </div>
            )}
          </div>

          {/* 4. YAPIM (Production) */}
          <div className="relative">
            <button
              onClick={() => {
                const next = activeMenu === 'production' ? null : 'production';
                closeAll();
                setActiveMenu(next);
              }}
              className={menuBtnClass('production')}
            >
              Yapım
            </button>

            {activeMenu === 'production' && (
              <div className={`absolute top-full left-0 mt-1 w-64 rounded-xl border py-1.5 z-50 ${menuBg}`}>
                <button onClick={() => { if(onOpenLocationList) onOpenLocationList(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <MapPin size={14} /> Mekan Listesi (Breakdown)
                </button>
                <button onClick={() => { if(onOpenStats) onOpenStats(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <LayoutGrid size={14} /> Karakter İstatistikleri & Dağılımı
                </button>
                <button onClick={() => { onOpenCharacterMatrix?.(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <ArrowRightLeft size={14} /> Karakter & Mekan Matrisi
                </button>
                <button onClick={() => { onOpenActorSides?.(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <Users size={14} /> Oyuncu Set Metinleri (Actor Sides)
                </button>
                <button onClick={() => { onOpenDialogueTuner?.(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <Mic2 size={14} /> Diyalog Ayarlayıcı / Tuner
                </button>
                <button onClick={() => { if(onOpenBin) onOpenBin(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <Trash2 size={14} /> Senaryo Çöp Kutusu / Çekilmeyenler
                </button>
                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />
                <button 
                  onClick={() => { onTogglePageLock?.(); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <Lock size={14} className={isPagesLocked ? "text-amber-500" : "opacity-60"} />
                    <span className={isPagesLocked ? "font-semibold" : ""}>
                      Sayfa ve Sahneleri Kilitle (A-Sayfa & A-Sahne)
                    </span>
                  </div>
                  {isPagesLocked ? (
                    <span className="font-mono text-[10px] opacity-70">🔒 Kilitli</span>
                  ) : (
                    <span className="text-[10px] opacity-40">Açık</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 5. ARAÇLAR (Tools & Story) */}
          <div className="relative">
            <button
              onClick={() => {
                const next = activeMenu === 'tools' ? null : 'tools';
                closeAll();
                setActiveMenu(next);
              }}
              className={menuBtnClass('tools')}
            >
              Araçlar
            </button>

            {activeMenu === 'tools' && (
              <div className={`absolute top-full left-0 mt-1 w-64 rounded-xl border py-1.5 z-50 ${menuBg}`}>
                {/* Ortak Yazar (Canlı Birlikte Yazım) */}
                <button onClick={() => { if(onOpenCollaboration) onOpenCollaboration(); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2">
                    <Users size={14} className={isCollaborationActive ? 'text-emerald-500' : (theme === 'dark' ? 'text-blue-400' : 'text-blue-600')} />
                    <span className={isCollaborationActive ? 'font-bold text-emerald-500' : ''}>Ortak Yazar & Canlı Oda</span>
                  </div>
                  {isCollaborationActive ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-500 font-bold">Aktif</span>
                  ) : (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>Canlı</span>
                  )}
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Karakter Rehberi */}
                <button onClick={() => { onOpenCharacterBible(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <BookOpen size={14} /> Karakter Rehberi (Soru/Cevap)
                </button>

                {/* Hikaye Geliştirici & Şablonlar */}
                <button onClick={() => { if(onOpenStoryBeats) onOpenStoryBeats(); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2">
                    <Compass size={14} />
                    <span>Hikaye Geliştirici & Şablonlar</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>Beat</span>
                </button>

                {/* Outline Editor (Taslak Cetveli) */}
                <button 
                  onClick={() => { onToggleOutlineEditor?.(); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <Sliders size={14} className={isOutlineEditorOpen ? (theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700') : ''} />
                    <span className={isOutlineEditorOpen ? 'font-bold' : ''}>Outline Editor (Taslak Cetveli)</span>
                  </div>
                  {isOutlineEditorOpen ? (
                    <span className="font-bold text-blue-500">✓</span>
                  ) : (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>Ribbon</span>
                  )}
                </button>

                {/* Sezon Hikayesi (Dizi & Bölüm Rehberi) */}
                <button onClick={() => { if(onOpenStoryBible) onOpenStoryBible(); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2">
                    <Tv size={14} />
                    <span>Sezon Hikayesi (Bölüm Rehberi)</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>Dizi</span>
                </button>

                {/* Gerilim & Duygu Çizelgesi */}
                <button onClick={() => { onOpenDramaticArc?.(); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2">
                    <Activity size={14} />
                    <span>Gerilim & Duygu Çizelgesi</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>Arc</span>
                </button>

                {/* Not Defteri */}
                <button onClick={() => { if(onOpenNotes) onOpenNotes(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <BookMarked size={14} /> Not Defteri
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Sesle Yazma */}
                <button 
                  onClick={() => { if (toggleListening) toggleListening(); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2"><Mic size={14} /> Sesle Yazma (Dikte)</div>
                  {isListening && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </button>

                {/* Sağlık Molası */}
                <button 
                  onClick={() => { if (setIsHealthBreakEnabled) setIsHealthBreakEnabled(!isHealthBreakEnabled); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2"><Coffee size={14} /> Sağlık Molası Hatırlatıcı</div>
                  <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isHealthBreakEnabled ? 'bg-blue-600' : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300')}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${isHealthBreakEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 6. GÖRÜNÜM (View) */}
          <div className="relative">
            <button
              onClick={() => {
                const next = activeMenu === 'view' ? null : 'view';
                closeAll();
                setActiveMenu(next);
              }}
              className={menuBtnClass('view')}
            >
              Görünüm
            </button>

            {activeMenu === 'view' && (
              <div className={`absolute top-full left-0 mt-1 w-56 rounded-xl border py-1.5 z-50 ${menuBg}`}>
                <button onClick={() => { setViewMode('editor'); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2"><FileText size={14} /> Senaryo Modu</div>
                  {viewMode === 'editor' && <span className="text-blue-500 font-bold">✓</span>}
                </button>
                <button onClick={() => { setViewMode('cards'); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2"><LayoutGrid size={14} /> Kart / Mantar Pano</div>
                  {viewMode === 'cards' && <span className="text-blue-500 font-bold">✓</span>}
                </button>

                {/* Outline Editor Toggle in View menu */}
                <button 
                  onClick={() => { onToggleOutlineEditor?.(); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <Sliders size={14} />
                    <span>Outline Cetveli (Zaman Şeridi)</span>
                  </div>
                  {isOutlineEditorOpen && <span className="text-blue-500 font-bold">✓</span>}
                </button>

                {/* Çift Panel / Yan Yana Modu Toggle */}
                <button 
                  onClick={() => { setIsSplitScreen?.(!isSplitScreen); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <PanelLeft size={14} className={isSplitScreen ? (theme === 'dark' ? 'text-sky-400' : 'text-blue-600') : ''} />
                    <span className={isSplitScreen ? 'font-bold' : ''}>Çift Panel (Companion)</span>
                  </div>
                  {isSplitScreen ? (
                    <span className="text-blue-500 font-bold">✓</span>
                  ) : (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>Split</span>
                  )}
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Daktilo Kaydırma Modu */}
                <button 
                  onClick={() => { setIsTypewriterMode?.(!isTypewriterMode); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <Target size={14} className={isTypewriterMode ? (theme === 'dark' ? 'text-sky-400' : 'text-blue-600') : ''} />
                    <span className={isTypewriterMode ? 'font-bold' : ''}>Daktilo Kaydırma Modu</span>
                  </div>
                  {isTypewriterMode && <span className="text-blue-500 font-bold">✓</span>}
                </button>

                {/* Zen Paragraf Karartma Modu */}
                <button 
                  onClick={() => { setIsFocusDimming?.(!isFocusDimming); closeAll(); }} 
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb size={14} className={isFocusDimming ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600') : ''} />
                    <span className={isFocusDimming ? 'font-bold' : ''}>Zen Paragraf Karartma (Odak)</span>
                  </div>
                  {isFocusDimming && <span className="text-amber-500 font-bold">✓</span>}
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Tablet / Masaüstü Modu */}
                <button onClick={() => { setUiMode(uiMode === 'tablet' ? 'desktop' : 'tablet'); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2">
                    {uiMode === 'tablet' ? <Monitor size={14} /> : <Tablet size={14} />}
                    <span>{uiMode === 'tablet' ? 'Masaüstü Moduna Geç' : 'Tablet Moduna Geç'}</span>
                  </div>
                </button>

                {/* Zen Modu */}
                <button onClick={() => { setIsZenMode(true); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2"><Focus size={14} /> Zen (Odaklanma) Modu</div>
                  <span className="text-[10px] opacity-50">F11</span>
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />

                {/* Açık / Koyu Tema */}
                <button onClick={() => { if(setTheme) setTheme(theme === 'dark' ? 'light' : 'dark'); closeAll(); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs ${btnHover}`}>
                  <div className="flex items-center gap-2">{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} {theme === 'dark' ? 'Açık Mod' : 'Koyu Mod'}</div>
                  {theme === 'light' ? <span className="text-blue-500 font-bold">✓</span> : <span className="text-sky-400 font-bold">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* 7. YARDIM (Help) */}
          <div className="relative">
            <button
              onClick={() => {
                const next = activeMenu === 'help' ? null : 'help';
                closeAll();
                setActiveMenu(next);
              }}
              className={menuBtnClass('help')}
            >
              Yardım
            </button>

            {activeMenu === 'help' && (
              <div className={`absolute top-full left-0 mt-1 w-56 rounded-xl border py-1.5 z-50 ${menuBg}`}>
                <button onClick={() => { onOpenGuide(); closeAll(); }} className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs ${btnHover}`}>
                  <HelpCircle size={14} className="text-blue-500" /> Kullanım Rehberi & Kılavuz
                </button>
                <div className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-[#c8bea8]/50'}`} />
                <div className="px-4 py-2 text-[11px] opacity-60">
                  ScriptHive Professional v2.5
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* RIGHT: Quick Action Toggles, Google Drive, Stats, and Zen */}
      <div className={`flex items-center gap-2 sm:gap-2.5 font-mono text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
        {/* Çift Panel (Split-Screen) Quick Toggle */}
        <button 
          onClick={() => setIsSplitScreen?.(!isSplitScreen)}
          className={`p-1.5 rounded-lg transition-colors ${
            isSplitScreen
              ? (theme === 'dark' ? 'bg-sky-500/25 text-sky-400 font-bold ring-1 ring-sky-400/50' : 'bg-blue-100 text-blue-700 font-bold ring-1 ring-blue-500/50')
              : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-black hover:bg-[#dfd7ca]')
          }`}
          title={isSplitScreen ? "Çift Panel: Açık (Kapatmak için tıklayın)" : "Çift Panel / Yan Yana Çalışma Modunu Aç"}
        >
          <PanelLeft size={15} />
        </button>

        {/* Daktilo Kaydırma Quick Toggle */}
        <button 
          onClick={() => setIsTypewriterMode?.(!isTypewriterMode)}
          className={`p-1.5 rounded-lg transition-colors ${
            isTypewriterMode
              ? (theme === 'dark' ? 'bg-sky-500/25 text-sky-400 font-bold ring-1 ring-sky-400/50' : 'bg-blue-100 text-blue-700 font-bold ring-1 ring-blue-500/50')
              : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-black hover:bg-[#dfd7ca]')
          }`}
          title={isTypewriterMode ? "Daktilo Kaydırma: Aktif" : "Daktilo Kaydırma Modunu Aç (İmleci ortada sabitler)"}
        >
          <Target size={15} className={isTypewriterMode ? "animate-pulse" : ""} />
        </button>

        {/* Zen Paragraf Karartma (Odak) Quick Toggle */}
        <button 
          onClick={() => setIsFocusDimming?.(!isFocusDimming)}
          className={`p-1.5 rounded-lg transition-colors ${
            isFocusDimming
              ? (theme === 'dark' ? 'bg-amber-500/25 text-amber-400 font-bold ring-1 ring-amber-400/50' : 'bg-amber-100 text-amber-800 font-bold ring-1 ring-amber-500/50')
              : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-black hover:bg-[#dfd7ca]')
          }`}
          title={isFocusDimming ? "Zen Paragraf Karartma: Aktif" : "Zen Paragraf Karartmayı Aç (Odaklanma)"}
        >
          <Lightbulb size={15} />
        </button>

        {/* Ortak Yazar & Canlı Oda Quick Toggle */}
        {onOpenCollaboration && (
          <div className="flex items-center gap-1.5">
            <button 
              onClick={onOpenCollaboration}
              className={`p-1.5 rounded-lg transition-colors relative ${
                isCollaborationActive
                  ? (theme === 'dark' ? 'text-sky-400 bg-sky-500/15' : 'text-blue-700 bg-blue-100')
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-black hover:bg-[#dfd7ca]')
              }`}
              title={isCollaborationActive ? `Ortak Yazım Aktif (${collaborators.length || activeCollaboratorsCount || 1} Yazar)` : "Ortak Yazar & Canlı Oda"}
            >
              <Users size={15} />
              {pendingRequestsCount && pendingRequestsCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 text-black text-[8px] font-bold flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              ) : isCollaborationActive ? (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400" />
              ) : null}
            </button>

            {/* Google Docs Style Collaborator Avatars */}
            {isCollaborationActive && collaborators && collaborators.length > 0 && (
              <div className="flex items-center -space-x-1.5 mr-0.5">
                {collaborators.map(collab => {
                  const hasRemoteTyping = Object.values(remotePresences || {}).some(
                    p => (p.senderId === collab.id || p.senderName === collab.name) && p.status === 'typing'
                  );
                  const isRecent = collab.lastActive ? (Date.now() - collab.lastActive < 30000) : true;
                  const isActive = hasRemoteTyping || isRecent;
                  const initial = (collab.name || 'Y').trim().charAt(0).toUpperCase();

                  return (
                    <div
                      key={collab.id}
                      onClick={onOpenCollaboration}
                      className={`group/avatar relative cursor-pointer select-none transition-all duration-300 hover:z-20 hover:scale-110 ${
                        isActive ? 'opacity-100' : 'opacity-40 hover:opacity-90'
                      }`}
                      title={`${collab.name} (${isActive ? (hasRemoteTyping ? 'Aktif • Yazıyor...' : 'Çevrimiçi') : 'Boşta / Beklemede'})`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs border-2 ${
                          theme === 'dark' ? 'border-[#1a1f25]' : 'border-[#FFFFF0]'
                        } ${isActive ? 'ring-1.5 ring-emerald-400/80' : 'ring-1 ring-slate-400/30'}`}
                        style={{ backgroundColor: collab.avatarColor || '#38bdf8' }}
                      >
                        {initial}
                      </div>
                      {/* Active Live Indicator Pulse */}
                      {isActive && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#1a1f25] shadow-xs animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        <div className={`w-px h-3.5 ${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-400/60'}`} />

        {/* Google Drive Bağlantısı / Senkronizasyon Butonu */}
        {isGoogleAuth ? (
          <button 
            onClick={onSaveToDrive} 
            disabled={isSavingToDrive}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10' : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-bold'} transition-colors`}
            title={driveFileId ? "Google Drive'da Güncelle" : "Google Drive'a Kaydet"}
          >
            <RefreshCw size={13} className={isSavingToDrive ? 'animate-spin' : ''} />
            <span className="font-sans font-medium text-[11px] hidden sm:inline">{isSavingToDrive ? 'Kaydediliyor...' : 'Senkronize'}</span>
          </button>
        ) : (
          <button 
            onClick={onGoogleLogin} 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              theme === 'dark' 
                ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            }`}
            title="Google Drive'a Bağlan"
          >
            <CloudUpload size={13} />
            <span className="font-sans font-medium text-[11px] hidden sm:inline">Drive'a Bağlan</span>
          </button>
        )}

        {/* Cloud Icon */}
        <div className="flex items-center" title={isGoogleAuth ? "Drive Bağlı" : "Yerel Depolama"}>
          <Cloud size={15} className={isGoogleAuth ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : 'opacity-60'} />
        </div>

        {/* Separator */}
        <div className={`w-px h-3.5 ${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-400/60'}`} />

        {/* Stats */}
        <div className="flex items-center gap-2">
          <span>Kelime: <strong className={theme === 'dark' ? 'text-slate-200 font-semibold' : 'text-slate-900 font-bold'}>{wordCount}</strong></span>
          <span className="flex items-center gap-1">
            Sayfa: <strong className={theme === 'dark' ? 'text-slate-200 font-semibold' : 'text-slate-900 font-bold'}>{pageCount}</strong>
            {isPagesLocked && (
              <span 
                className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1"
                title="Sayfa ve Sahne Numaraları Kilitli (Revizyon / Prodüksiyon A-Sayfaları ve A-Sahneleri Modu)"
              >
                <Lock size={10} /> KİLİTLİ (A-SAYFA & SAHNE)
              </span>
            )}
          </span>
        </div>

        {/* Separator */}
        <div className={`w-px h-3.5 ${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-400/60'}`} />

        {/* Zen Modu */}
        <button 
          onClick={() => setIsZenMode(true)}
          className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-black hover:bg-[#dfd7ca]'}`}
          title="Zen (Odaklanma) Modu"
        >
          <Focus size={16} />
        </button>
      </div>
    </header>
  );
}
