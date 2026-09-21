import React, { useState } from 'react';
import { 
  FolderOpen, Save, Type, RefreshCw, Mic, ChevronDown, 
  Trash2, Sun, Moon, Replace, HelpCircle, Clapperboard, Zap, User, 
  MessageSquare, Quote, MoveRight, BookOpen, BarChart, StickyNote, Coffee, 
  WifiOff, Download, MapPin, ArchiveRestore, Cloud, CloudUpload, Layers, 
  Sparkles, Columns2, Sliders, Target, Lightbulb, PanelLeft, Users, Lock,
  Activity, Compass, ArrowRightLeft, Mic2, Palette, Tv
} from 'lucide-react';
import { ScreenplayFormat, ElementType, Screenplay, Collaborator } from '../types';
import SprintWidget from './SprintWidget';

interface ToolbarProps {
  format: ScreenplayFormat;
  setFormat: (format: ScreenplayFormat) => void;
  wordCount: number;
  onClearAll: () => void;
  onOpen: () => void;
  projects?: Screenplay[];
  onOpenRecent?: (project: Screenplay) => void;
  onExportPDF: () => void;
  onExportRTF: () => void;
  onExportDOCX: () => void;
  onExportFDX: () => void;
  onExportFountain: () => void;
  onExportCeltx: () => void;
  onExportKitsp: () => void;
  onOpenFindReplace: () => void;
  onOpenSmartRename?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isGoogleAuth?: boolean;
  isSavingToDrive?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  onSaveToDrive?: () => void;
  driveFileId?: string;
  isListening: boolean;
  toggleListening: () => void;
  changeCurrentElementType: (type: ElementType) => void;
  isDualDialogue?: boolean;
  onToggleDualDialogue?: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onOpenCharacterBible: () => void;
  onOpenStoryBible: () => void;
  onOpenNotes: () => void;
  onOpenStats: () => void;
  onOpenLocationList: () => void;
  onOpenGuide: () => void;
  onOpenBin: () => void;
  onOpenAi?: () => void;
  onOpenDramaticArc?: () => void;
  onOpenStoryBeats?: () => void;
  onOpenCharacterMatrix?: () => void;
  onOpenActorSides?: () => void;
  onOpenDialogueTuner?: () => void;
  onOpenTableReadModal?: () => void;
  isTableReadMode?: boolean;
  onOpenFontPicker?: () => void;
  hasCoverPage?: boolean;
  onToggleCoverPage?: () => void;
  isHealthBreakEnabled?: boolean;
  setIsHealthBreakEnabled?: (enabled: boolean) => void;
  isOffline?: boolean;
  canInstall?: boolean;
  onInstallApp?: () => void;
  isRevisionMode: boolean;
  setIsRevisionMode: (mode: boolean) => void;
  activeRevisionColor: 'white' | 'blue' | 'pink' | 'yellow' | 'green' | 'goldenrod';
  setActiveRevisionColor: (color: 'white' | 'blue' | 'pink' | 'yellow' | 'green' | 'goldenrod') => void;
  activeRevisionDate?: string;
  setActiveRevisionDate?: (date: string) => void;
  printRevisionMarks: boolean;
  setPrintRevisionMarks: (print: boolean) => void;
  onClearRevisionColors?: () => void;
  isPagesLocked?: boolean;
  onTogglePageLock?: () => void;
  isOutlineEditorOpen?: boolean;
  onToggleOutlineEditor?: () => void;
  isSplitScreen?: boolean;
  onToggleSplitScreen?: () => void;
  isTypewriterMode?: boolean;
  onToggleTypewriterMode?: () => void;
  isFocusDimming?: boolean;
  onToggleFocusDimming?: () => void;
  onOpenCollaboration?: () => void;
  isCollaborationActive?: boolean;
  pendingRequestsCount?: number;
  collaborators?: Collaborator[];
  remotePresences?: Record<string, { senderId: string; senderName: string; senderColor: string; status: 'typing' | 'idle' }>;
}

export default function TabletToolbar({ 
  format, setFormat, wordCount, onClearAll, onOpen, projects = [], onOpenRecent, onExportPDF, onExportRTF, onExportDOCX, onExportFDX, onExportFountain, onExportCeltx, onExportKitsp, onOpenFindReplace, onOpenSmartRename,
  isGoogleAuth, isSavingToDrive, onGoogleLogin, onGoogleLogout, onSaveToDrive, driveFileId,
  isListening, toggleListening, changeCurrentElementType, isDualDialogue, onToggleDualDialogue,
  theme, setTheme, onOpenCharacterBible, onOpenStoryBible, onOpenNotes, onOpenStats, onOpenLocationList, onOpenGuide, onOpenBin, onOpenAi,
  onOpenDramaticArc, onOpenStoryBeats, onOpenCharacterMatrix, onOpenActorSides, onOpenDialogueTuner, onOpenTableReadModal, isTableReadMode, onOpenFontPicker,
  hasCoverPage, onToggleCoverPage,
  isHealthBreakEnabled, setIsHealthBreakEnabled, isOffline, canInstall, onInstallApp,
  isRevisionMode, setIsRevisionMode, activeRevisionColor, setActiveRevisionColor, activeRevisionDate, setActiveRevisionDate, printRevisionMarks, setPrintRevisionMarks, onClearRevisionColors,
  isPagesLocked = false, onTogglePageLock,
  isOutlineEditorOpen, onToggleOutlineEditor,
  isSplitScreen, onToggleSplitScreen,
  isTypewriterMode, onToggleTypewriterMode,
  isFocusDimming, onToggleFocusDimming,
  onOpenCollaboration, isCollaborationActive, pendingRequestsCount,
  collaborators = [], remotePresences = {}
}: ToolbarProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isOpenMenuOpen, setIsOpenMenuOpen] = useState(false);
  const [isMenuExportOpen, setIsMenuExportOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && event.target && !menuRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
        setIsOpenMenuOpen(false);
        setIsMenuExportOpen(false);
        setIsRevisionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const elementTypes = [
    { label: 'Sahne', type: 'scene', icon: Clapperboard },
    { label: 'Eylem', type: 'action', icon: Zap },
    { label: 'Karakter', type: 'character', icon: User },
    { label: 'Diyalog', type: 'dialogue', icon: MessageSquare },
    { label: 'Parantez', type: 'parenthetical', icon: Quote },
    { label: 'Geçiş', type: 'transition', icon: MoveRight },
    { label: 'Not', type: 'note', icon: StickyNote }
  ];

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640] text-slate-300' : 'bg-[#e8e0d5] border-[#c8bea8] text-slate-800';
  const cardBg = theme === 'dark' ? 'bg-[#20272e] border border-[#2d3640]' : 'bg-[#FFFFF0] border border-[#c8bea8]';
  const btnHover = theme === 'dark' ? 'hover:bg-[#2d3640] hover:text-white' : 'hover:bg-[#dfd7ca] hover:text-black';
  const popoverBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640] text-slate-200' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900 shadow-2xl';

  return (
    <div 
      ref={menuRef} 
      className={`relative z-50 flex flex-nowrap md:flex-col justify-start items-center py-2 md:py-2.5 px-1 md:px-1.5 w-full md:w-20 lg:w-24 h-auto md:h-full max-h-screen overflow-x-auto md:overflow-y-auto shrink-0 gap-1.5 md:gap-2 no-print border-l select-none ${bgClass}`}
    >
      
      {/* 1. FILE, EXPORT & EDIT ACTIONS (4 icons in 2x2 grid) */}
      <div className={`flex md:grid md:grid-cols-2 justify-center gap-1 p-1 md:p-1.5 rounded-xl w-max md:w-full shrink-0 transition-all shadow-xs ${cardBg}`}>
        {/* Dosya Menüsü */}
        <div className="relative shrink-0 flex items-center justify-center">
          <button 
            onClick={() => setIsOpenMenuOpen(!isOpenMenuOpen)} 
            className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 transition-all ${btnHover} ${isOpenMenuOpen ? (theme === 'dark' ? 'bg-[#2d3640] text-white' : 'bg-[#dfd7ca] text-black') : ''}`}
            title="Dosya & Proje İşlemleri"
          >
            <FolderOpen size={17} />
          </button>
          {isOpenMenuOpen && (
            <div className={`fixed bottom-24 left-4 md:top-1/2 md:-translate-y-1/2 md:right-22 lg:right-26 md:left-auto md:bottom-auto w-64 max-h-[85vh] overflow-y-auto flex flex-col gap-2 z-[100] p-2.5 rounded-2xl shadow-2xl border ${popoverBg}`}>
              
              {/* Dışa Aktar */}
              <button 
                onClick={() => setIsMenuExportOpen(!isMenuExportOpen)} 
                className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl flex items-center justify-between px-3 active:scale-95 transition-transform ${cardBg} ${btnHover}`}
              >
                <span className="flex items-center gap-2"><Save size={16} /> Dışa Aktar</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isMenuExportOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMenuExportOpen && (
                <div className={`flex flex-col gap-1 p-1 rounded-xl ${theme === 'dark' ? 'bg-[#1a1f25]' : 'bg-[#dfd7ca]'}`}>
                  <button onClick={() => { onExportPDF(); setIsOpenMenuOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg ${btnHover}`}>PDF olarak (.pdf)</button>
                  <button onClick={() => { onExportDOCX(); setIsOpenMenuOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg ${btnHover}`}>Word (.docx)</button>
                  <button onClick={() => { onExportRTF(); setIsOpenMenuOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg ${btnHover}`}>Markdown (.md)</button>
                  <button onClick={() => { onExportFDX(); setIsOpenMenuOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg ${btnHover}`}>Final Draft (.fdx)</button>
                  <button onClick={() => { onExportFountain(); setIsOpenMenuOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg ${btnHover}`}>Fountain (.fountain)</button>
                  <button onClick={() => { onExportCeltx(); setIsOpenMenuOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg ${btnHover}`}>Celtx (.html)</button>
                  <button onClick={() => { onExportKitsp(); setIsOpenMenuOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg ${btnHover}`}>Kitsp</button>
                </div>
              )}

              {/* Kapak Sayfası Ekle / Kaldır */}
              {onToggleCoverPage && (
                <button 
                  onClick={() => { onToggleCoverPage(); setIsOpenMenuOpen(false); }} 
                  className={`w-full text-center py-2 text-xs font-semibold rounded-xl flex items-center justify-between px-3 active:scale-95 transition-transform ${cardBg} ${btnHover}`}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={15} className={hasCoverPage ? "text-amber-500" : "opacity-60"} />
                    {hasCoverPage ? "Kapak Sayfasını Kaldır" : "Kapak Sayfası Ekle"}
                  </span>
                  {hasCoverPage && <span className="text-[10px] text-amber-500 font-bold">✓ Aktif</span>}
                </button>
              )}

              {/* Google Drive */}
              {!isGoogleAuth ? (
                <button 
                  onClick={() => { if (!isOffline) { onGoogleLogin?.(); setIsOpenMenuOpen(false); } }}
                  disabled={isOffline}
                  className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform ${isOffline ? 'opacity-50 cursor-not-allowed text-slate-400' : `${cardBg} ${btnHover}`}`}
                  title={isOffline ? "Çevrimdışı modda Google Drive bağlantısı kullanılamaz." : undefined}
                >
                  <Cloud size={16} /> {isOffline ? "Drive'a Bağlan (İnternet Gerekli)" : "Google Drive'a Bağlan"}
                </button>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <button 
                    onClick={() => { if (!isOffline) { onSaveToDrive?.(); setIsOpenMenuOpen(false); } }}
                    disabled={isOffline || isSavingToDrive}
                    className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform ${isOffline ? 'opacity-40 cursor-not-allowed text-slate-400' : isSavingToDrive ? 'opacity-50 text-blue-500' : 'text-emerald-500 dark:text-emerald-400'} ${cardBg} ${btnHover}`}
                    title={isOffline ? "Çevrimdışı modda senkronizasyon yapılamaz." : undefined}
                  >
                    {isSavingToDrive ? <RefreshCw className="animate-spin" size={16} /> : <CloudUpload size={16} />}
                    {isSavingToDrive ? 'Kaydediliyor...' : isOffline ? 'Drive Kaydı (Çevrimdışı)' : (driveFileId ? "Drive'da Güncelle" : "Drive'a Kaydet")}
                  </button>
                  <button 
                    onClick={() => { onGoogleLogout?.(); setIsOpenMenuOpen(false); }}
                    className={`w-full text-center py-1.5 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform ${cardBg} ${btnHover} text-red-500`}
                  >
                    <WifiOff size={13} /> Google Bağlantısını Kes
                  </button>
                </div>
              )}

              <div className={`my-0.5 border-t ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`}></div>

              {/* Cihazdan / Dosyadan Aç */}
              <button 
                onClick={() => { onOpen(); setIsOpenMenuOpen(false); }} 
                className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 ${cardBg} shadow-sm active:scale-95 transition-transform ${btnHover}`}
              >
                <FolderOpen size={16} /> Cihazdan / Dosyadan Aç...
              </button>

              {/* Son Projeler */}
              {projects.length > 0 && (
                <div className="flex flex-col gap-1 mt-1 border-t pt-1 border-slate-200 dark:border-slate-800">
                  <div className={`text-[10px] font-bold uppercase text-center tracking-wider py-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Son Projeler
                  </div>
                  {projects.slice(0, 8).map(p => (
                    <button 
                      key={p.id}
                      onClick={() => { onOpenRecent?.(p); setIsOpenMenuOpen(false); }} 
                      className={`w-full text-left px-3 py-1.5 text-xs truncate rounded-xl ${cardBg} shadow-sm active:scale-95 transition-transform ${btnHover}`}
                      title={p.title}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hızlı Dışa Aktar Butonu */}
        <div className="relative shrink-0 flex items-center justify-center">
          <button 
            onClick={() => setIsExportOpen(!isExportOpen)} 
            className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 transition-all ${btnHover} ${isExportOpen ? (theme === 'dark' ? 'bg-[#2d3640] text-white' : 'bg-[#dfd7ca] text-black') : ''}`}
            title="Hızlı Dışa Aktar (PDF, Word, Fountain)"
          >
            <Save size={17} />
          </button>
          {isExportOpen && (
            <div className={`fixed bottom-24 left-24 md:top-1/2 md:-translate-y-1/2 md:right-22 lg:right-26 md:left-auto md:bottom-auto w-44 flex flex-col gap-1.5 z-[100]`}>
              <button onClick={() => { onExportPDF(); setIsExportOpen(false); }} className={`w-full text-center px-3 py-2 text-xs font-semibold rounded-xl ${popoverBg} shadow-xl active:scale-95 transition-all ${btnHover}`}>PDF (.pdf)</button>
              <button onClick={() => { onExportDOCX(); setIsExportOpen(false); }} className={`w-full text-center px-3 py-2 text-xs font-semibold rounded-xl ${popoverBg} shadow-xl active:scale-95 transition-all ${btnHover}`}>Word (.docx)</button>
              <button onClick={() => { onExportRTF(); setIsExportOpen(false); }} className={`w-full text-center px-3 py-2 text-xs font-semibold rounded-xl ${popoverBg} shadow-xl active:scale-95 transition-all ${btnHover}`}>Markdown (.md)</button>
              <button onClick={() => { onExportFDX(); setIsExportOpen(false); }} className={`w-full text-center px-3 py-2 text-xs font-semibold rounded-xl ${popoverBg} shadow-xl active:scale-95 transition-all ${btnHover}`}>Final Draft (.fdx)</button>
              <button onClick={() => { onExportFountain(); setIsExportOpen(false); }} className={`w-full text-center px-3 py-2 text-xs font-semibold rounded-xl ${popoverBg} shadow-xl active:scale-95 transition-all ${btnHover}`}>Fountain</button>
            </div>
          )}
        </div>

        {/* Bul & Değiştir */}
        <button 
          onClick={onOpenFindReplace} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 transition-all ${btnHover}`}
          title="Bul ve Değiştir"
        >
          <Replace size={17} />
        </button>

        {/* Senaryoyu Temizle */}
        <button 
          onClick={onClearAll} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 transition-all ${btnHover}`} 
          title="Senaryoyu Temizle"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {/* 2. SCREENPLAY ELEMENT TYPES & DUAL DIALOGUE (8 items in 2x4 grid) */}
      <div className={`flex md:grid md:grid-cols-2 justify-center gap-1 p-1 md:p-1.5 shrink-0 rounded-xl w-max md:w-full transition-all shadow-xs ${cardBg}`}>
        {elementTypes.map((item) => {
          const Icon = item.icon as any;
          return (
            <button 
              key={item.type} 
              onClick={() => changeCurrentElementType(item.type as ElementType)}
              className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg transition-all active:scale-95 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover}`}
              title={item.label}
            >
              <Icon size={17} />
            </button>
          );
        })}
        {onToggleDualDialogue && (
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onToggleDualDialogue?.()}
            className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg transition-all active:scale-95 ${
              isDualDialogue 
                ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8] shadow-xs' : 'bg-blue-500/20 text-blue-700 shadow-xs') 
                : `${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover}`
            }`}
            title={isDualDialogue ? "Çift Diyaloğu Tek Sütuna Çevir" : "Çift Diyalog Yap (Yan Yana Aynı Anda Konuşma)"}
          >
            <Columns2 size={17} />
          </button>
        )}
      </div>

      {/* 3. CREATIVE & STORY SUITE (12 items in 2x6 grid) */}
      <div className={`flex md:grid md:grid-cols-2 justify-center gap-1 p-1 md:p-1.5 shrink-0 rounded-xl w-max md:w-full transition-all shadow-xs ${cardBg}`}>
        {/* AI Assistant */}
        <button 
          onClick={onOpenAi} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50'} active:scale-95 ${btnHover} transition-all`}
          title="Yapay Zeka Asistanı"
        >
          <Sparkles size={17} className="animate-pulse" />
        </button>

        {/* Çift Panel (Companion) */}
        {onToggleSplitScreen && (
          <button 
            onClick={onToggleSplitScreen} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg transition-all active:scale-95 ${
              isSplitScreen 
                ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8] border border-[#6ba3e8]/40 shadow-xs' : 'bg-blue-600/15 text-blue-700 border border-blue-400/40 shadow-xs') 
                : `${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover}`
            }`}
            title="Çift Panel (Companion Yan Panel)"
          >
            <PanelLeft size={17} />
          </button>
        )}

        {/* Dramatik Ritim & Gerilim/Duygu Çizelgesi */}
        {onOpenDramaticArc && (
          <button 
            onClick={onOpenDramaticArc} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
            title="Dramatik Ritim, Gerilim & Duygu Çizelgesi"
          >
            <Activity size={17} />
          </button>
        )}

        {/* Hikaye Geliştirici & Beat Şablonları */}
        {onOpenStoryBeats && (
          <button 
            onClick={onOpenStoryBeats} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
            title="Hikaye Geliştirici & Şablonlar (Story Beats)"
          >
            <Compass size={17} />
          </button>
        )}

        {/* Outline Editor (Taslak Cetveli) */}
        {onToggleOutlineEditor && (
          <button 
            onClick={onToggleOutlineEditor} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg transition-all active:scale-95 ${
              isOutlineEditorOpen 
                ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8] border border-[#6ba3e8]/40' : 'bg-blue-600/15 text-blue-700 border border-blue-400/40') 
                : `${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover}`
            }`}
            title="Outline Editor (Taslak & Zaman Cetveli)"
          >
            <Sliders size={17} />
          </button>
        )}

        {/* Daktilo Kaydırma Modu */}
        {onToggleTypewriterMode && (
          <button 
            onClick={onToggleTypewriterMode} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg transition-all active:scale-95 ${
              isTypewriterMode 
                ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8] border border-[#6ba3e8]/40 shadow-xs' : 'bg-blue-600/15 text-blue-700 border border-blue-400/40 shadow-xs') 
                : `${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover}`
            }`}
            title="Daktilo Kaydırma Modu (Typewriter)"
          >
            <Target size={17} className={isTypewriterMode ? "animate-pulse" : ""} />
          </button>
        )}

        {/* Zen Karartma (Odaklanma) */}
        {onToggleFocusDimming && (
          <button 
            onClick={onToggleFocusDimming} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg transition-all active:scale-95 ${
              isFocusDimming 
                ? (theme === 'dark' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs' : 'bg-amber-100 text-amber-800 border border-amber-400/40 shadow-xs') 
                : `${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover}`
            }`}
            title="Zen Paragraf Karartma (Odak)"
          >
            <Lightbulb size={17} />
          </button>
        )}

        {/* Karakter Rehberi */}
        <button 
          onClick={onOpenCharacterBible} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
          title="Karakter Rehberi (Bible)"
        >
          <User size={17} />
        </button>
        
        {/* Sezon & Bölüm Rehberi */}
        <button 
          onClick={onOpenStoryBible} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
          title="Sezon & Bölüm Rehberi (Story Bible)"
        >
          <Tv size={17} />
        </button>
        
        {/* Not Defteri */}
        <button 
          onClick={onOpenNotes} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
          title="Not Defteri"
        >
          <StickyNote size={17} />
        </button>
        
        {/* Karakter İstatistikleri */}
        <button 
          onClick={onOpenStats} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
          title="Karakter İstatistikleri & Dağılımı"
        >
          <BarChart size={17} />
        </button>

        {/* Karakter & Mekan Matrisi */}
        {onOpenCharacterMatrix && (
          <button 
            onClick={onOpenCharacterMatrix} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
            title="Karakter & Mekan Matrisi"
          >
            <ArrowRightLeft size={17} />
          </button>
        )}
      </div>

      {/* 4. PRODUCTION, STUDIO & UTILITY TOOLS (13 items in 2x7 grid) */}
      <div className={`flex md:grid md:grid-cols-2 justify-center gap-1 p-1 md:p-1.5 shrink-0 rounded-xl w-max md:w-full transition-all shadow-xs ${cardBg}`}>
        {/* Oyuncu Set Metinleri (Actor Sides) */}
        {onOpenActorSides && (
          <button 
            onClick={onOpenActorSides} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
            title="Oyuncu Set Metinleri (Actor Sides)"
          >
            <Users size={17} />
          </button>
        )}

        {/* Karakter Sesi İzolasyonu / Tuner */}
        {onOpenDialogueTuner && (
          <button 
            onClick={onOpenDialogueTuner} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
            title="Karakter Sesi İzolasyonu (Dialogue Tuner)"
          >
            <Mic2 size={17} />
          </button>
        )}

        {/* Masa Okuma & Renk Vurgulama */}
        {onOpenTableReadModal && (
          <button 
            onClick={onOpenTableReadModal} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg relative ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
            title="Masa Okuma Modu (Table Read)"
          >
            <Palette size={17} />
            {isTableReadMode && (
              <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#6ba3e8]' : 'bg-blue-600'} animate-pulse`} />
            )}
          </button>
        )}

        {/* Yazı Tipi & Font Galerisi */}
        {onOpenFontPicker && (
          <button 
            onClick={onOpenFontPicker} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
            title="Yazı Tipi & Font Galerisi"
          >
            <Type size={17} />
          </button>
        )}

        {/* Mekan Listesi */}
        <button 
          onClick={onOpenLocationList} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
          title="Mekan Listesi (Breakdown)"
        >
          <MapPin size={17} />
        </button>

        {/* Senaryo Çöp Kutusu */}
        <button 
          onClick={onOpenBin} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
          title="Senaryo Çöp Kutusu (Silinen Sahneler)"
        >
          <ArchiveRestore size={17} />
        </button>

        {/* Kullanım Rehberi */}
        <button 
          onClick={onOpenGuide} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
          title="Kullanım Rehberi & Kılavuz"
        >
          <HelpCircle size={17} />
        </button>

        {/* Revizyon Takibi Butonu */}
        <div className="relative shrink-0 flex items-center justify-center">
          <button 
            onClick={() => {
              setIsRevisionOpen(!isRevisionOpen);
              setIsExportOpen(false);
              setIsOpenMenuOpen(false);
            }}
            className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg transition-all active:scale-95 relative ${
              isRevisionMode 
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm' 
                : `${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover}`
            }`}
            title="Revizyon Takibi & Sayfa Kilitleme"
          >
            <Layers size={17} />
            {isRevisionMode && (
              <span className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full ring-2 ${theme === 'dark' ? 'ring-[#1a1f25]' : 'ring-[#e8e0d5]'} ${
                activeRevisionColor === 'blue' ? 'bg-sky-400' :
                activeRevisionColor === 'pink' ? 'bg-pink-400' :
                activeRevisionColor === 'yellow' ? 'bg-yellow-400' :
                activeRevisionColor === 'green' ? 'bg-emerald-400' :
                activeRevisionColor === 'goldenrod' ? 'bg-amber-500' : 'bg-slate-300'
              }`} />
            )}
          </button>
          {isRevisionOpen && (
            <div className={`fixed bottom-24 left-4 md:top-1/2 md:-translate-y-1/2 md:right-22 lg:right-26 md:left-auto md:bottom-auto w-72 rounded-2xl shadow-2xl border py-3 z-[110] text-left ${popoverBg}`}>
              {/* Revizyon Takibi Aç/Kapat */}
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Revizyon Takibi</span>
                <button 
                  onClick={() => setIsRevisionMode(!isRevisionMode)} 
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${isRevisionMode ? 'bg-amber-500' : (theme === 'dark' ? 'bg-[#1a1f25]' : 'bg-slate-300')}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${isRevisionMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {setActiveRevisionDate && (
                <div className="px-4 py-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs opacity-70">Revizyon Tarihi:</span>
                  <input 
                    type="text" 
                    value={activeRevisionDate || ''}
                    onChange={(e) => setActiveRevisionDate(e.target.value)}
                    placeholder="21.09.2026"
                    className={`w-28 px-2 py-1 text-xs rounded-lg font-mono text-center border outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
                  />
                </div>
              )}

              <div className={`my-1.5 border-t ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`}></div>

              {/* Renk Seçenekleri */}
              <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
                Aktif Revizyon Taslağı
              </div>

              {[
                { key: 'white', label: 'Beyaz (Orijinal taslak)', dotStyle: 'bg-white border border-slate-300' },
                { key: 'blue', label: '1. Mavi (Mavi revizyon)', dotStyle: 'bg-sky-400' },
                { key: 'pink', label: '2. Pembe (Pembe revizyon)', dotStyle: 'bg-pink-400' },
                { key: 'yellow', label: '3. Sarı (Sarı revizyon)', dotStyle: 'bg-yellow-400' },
                { key: 'green', label: '4. Yeşil (Yeşil revizyon)', dotStyle: 'bg-emerald-400' },
                { key: 'goldenrod', label: '5. Altın (Altın revizyon)', dotStyle: 'bg-amber-500' }
              ].map((colorOpt) => (
                <button
                  key={colorOpt.key}
                  onClick={() => {
                    setActiveRevisionColor(colorOpt.key as any);
                    if (colorOpt.key !== 'white') {
                      setIsRevisionMode(true);
                    } else {
                      setIsRevisionMode(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-1.5 text-left text-xs ${btnHover} transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${colorOpt.dotStyle} shadow-sm inline-block`}></span>
                    <span className={activeRevisionColor === colorOpt.key ? (theme === 'dark' ? 'font-semibold text-[#6ba3e8]' : 'font-bold text-blue-700') : ''}>
                      {colorOpt.label}
                    </span>
                  </div>
                  {activeRevisionColor === colorOpt.key && <span className={theme === 'dark' ? 'text-[#6ba3e8] font-bold' : 'text-blue-700 font-bold'}>✓</span>}
                </button>
              ))}

              <div className={`my-1.5 border-t ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`}></div>

              {/* PDF gösterimi */}
              <div className="px-4 py-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input 
                    type="checkbox" 
                    checked={printRevisionMarks}
                    onChange={(e) => setPrintRevisionMarks(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-blue-600 rounded"
                  />
                  <span className="text-xs leading-tight opacity-75 group-hover:opacity-100 transition-opacity">
                    PDF/Çıktıda revizyon işaretlerini göster
                  </span>
                </label>
              </div>

              {/* Sayfa Kilitleme (A-Sayfaları) */}
              {onTogglePageLock && (
                <>
                  <div className={`my-1.5 border-t ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`}></div>
                  <div className="px-4 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Lock size={14} className={isPagesLocked ? "text-amber-500" : "text-slate-400"} />
                      <span className="text-xs font-semibold">Sayfa & Sahne Kilitle</span>
                    </div>
                    <button 
                      onClick={() => onTogglePageLock()} 
                      className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isPagesLocked ? 'bg-amber-500' : (theme === 'dark' ? 'bg-[#1a1f25]' : 'bg-slate-300')}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isPagesLocked ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </>
              )}

              {onClearRevisionColors && (
                <>
                  <div className={`my-1.5 border-t ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`}></div>
                  <button 
                    onClick={() => {
                      if (confirm('Tüm paragraflardaki revizyon işaretlerini ve renklerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                        onClearRevisionColors();
                        setIsRevisionOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 font-semibold active:bg-red-500/20 transition-colors"
                  >
                    Tüm Revizyonları Temizle
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Canlı Ortak Yazım */}
        {onOpenCollaboration && (
          <button 
            onClick={onOpenCollaboration} 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg transition-all active:scale-95 relative ${
              isCollaborationActive 
                ? (theme === 'dark' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'bg-blue-100 text-blue-700 border border-blue-300') 
                : `${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover}`
            }`}
            title="Ortak Yazar & Canlı Oda"
          >
            <Users size={17} />
            {pendingRequestsCount && pendingRequestsCount > 0 ? (
              <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-500 text-black text-[8px] font-bold flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            ) : isCollaborationActive ? (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400" />
            ) : null}
          </button>
        )}

        {/* Google Drive */}
        {!isGoogleAuth ? (
          <button 
            onClick={onGoogleLogin}
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 ${btnHover} transition-all`}
            title="Google Drive'a Bağlan"
          >
            <Cloud size={17} />
          </button>
        ) : (
          <button 
            onClick={onSaveToDrive}
            disabled={isSavingToDrive}
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg transition-all active:scale-95 ${btnHover} ${isSavingToDrive ? 'opacity-50 text-blue-500' : 'text-emerald-500 dark:text-emerald-400'}`}
            title={driveFileId ? "Drive'da Güncelle" : "Drive'a Kaydet"}
          >
            {isSavingToDrive ? <RefreshCw className="animate-spin" size={17} /> : <CloudUpload size={17} />}
          </button>
        )}

        {/* Sağlık Molası */}
        <button 
          onClick={() => { if (setIsHealthBreakEnabled) setIsHealthBreakEnabled(!isHealthBreakEnabled); }} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg transition-all active:scale-95 ${isHealthBreakEnabled ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8] border border-[#6ba3e8]/30' : 'bg-blue-600/15 text-blue-700 border border-blue-400/40') : `${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover} border border-transparent`}`}
          title={isHealthBreakEnabled ? 'Sağlık Molası Açık (Kapat)' : 'Sağlık Molası Kapalı (Aç)'}
        >
          <Coffee size={17} />
        </button>

        {/* Sesle Yazma */}
        <button 
          onClick={toggleListening}
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg transition-all active:scale-95 ${isListening ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' : `${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${btnHover}`}`}
          title={isListening ? 'Dinliyor (Durdur)' : 'Sesle Yazma / Dikte'}
        >
          <Mic size={17} />
        </button>

        {/* Tema Değiştirme */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
          className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} active:scale-95 transition-all ${btnHover}`}
          title={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      {/* Bottom Widgets (Sprint, Install, Offline) */}
      <div className="flex md:flex-col items-center gap-1.5 px-1 shrink-0 pb-1">
        <SprintWidget currentWordCount={wordCount} isTablet={true} />

        {canInstall && onInstallApp && (
          <button 
            onClick={onInstallApp}
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 bg-[#6ba3e8] text-slate-950 font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-[#6ba3e8]/20`}
            title="Bilgisayara/Tablete Kur"
          >
            <Download size={17} />
          </button>
        )}

        {isOffline && (
          <div 
            className={`flex items-center justify-center p-1.5 md:p-2 shrink-0 bg-red-500 text-white rounded-lg transition-colors`}
            title="Çevrimdışı Çalışıyorsunuz"
          >
            <WifiOff size={17} />
          </div>
        )}
      </div>

    </div>
  );
}
