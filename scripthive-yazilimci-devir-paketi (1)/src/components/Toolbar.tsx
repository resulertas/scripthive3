import React, { useState, useEffect, useRef } from 'react';
import { Undo2, Redo2, Bold, Italic, ChevronDown, Minus, Plus, Columns2, Type, Check, X } from 'lucide-react';
import { ElementType, GOOGLE_FONTS_LIST } from '../types';

interface ToolbarProps {
  currentElementType?: ElementType;
  changeCurrentElementType: (type: ElementType) => void;
  theme: 'dark' | 'light';
  fontFamily: string;
  fontSize: number;
  fontColor?: string;
  handleStyleChange: (prop: 'fontFamily' | 'fontSize' | 'fontColor', value: any) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDualDialogue?: boolean;
  onToggleDualDialogue?: () => void;
  onOpenFontPicker?: () => void;
  onClose?: () => void;
}

const FONT_SIZES = [
  2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
  22, 24, 26, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 88, 96, 99
];

const TEXT_COLOR_PALETTE = [
  { label: 'Varsayılan', value: '', color: '#94a3b8' },
  { label: 'Kırmızı', value: '#ef4444', color: '#ef4444' },
  { label: 'Bordo / Koyu Kırmızı', value: '#991b1b', color: '#991b1b' },
  { label: 'Turuncu', value: '#f97316', color: '#f97316' },
  { label: 'Sarı / Altın', value: '#eab308', color: '#eab308' },
  { label: 'Yeşil', value: '#22c55e', color: '#22c55e' },
  { label: 'Zümrüt Yeşili', value: '#059669', color: '#059669' },
  { label: 'Camgöbeği', value: '#06b6d4', color: '#06b6d4' },
  { label: 'Mavi', value: '#3b82f6', color: '#3b82f6' },
  { label: 'Lacivert', value: '#1d4ed8', color: '#1d4ed8' },
  { label: 'Mor', value: '#a855f7', color: '#a855f7' },
  { label: 'Pembe', value: '#ec4899', color: '#ec4899' },
  { label: 'Gri / Soluk', value: '#64748b', color: '#64748b' },
  { label: 'Siyah', value: '#000000', color: '#000000' },
];

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

export default function Toolbar({ 
  currentElementType = 'action',
  changeCurrentElementType,
  theme,
  fontFamily,
  fontSize,
  fontColor = '',
  handleStyleChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDualDialogue,
  onToggleDualDialogue,
  onOpenFontPicker,
  onClose,
}: ToolbarProps) {
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [sizeInputText, setSizeInputText] = useState<string>(fontSize.toString());
  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSizeInputText(fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sizeDropdownRef.current && e.target && !sizeDropdownRef.current.contains(e.target as Node)) {
        setIsSizeDropdownOpen(false);
      }
      if (colorDropdownRef.current && e.target && !colorDropdownRef.current.contains(e.target as Node)) {
        setIsColorDropdownOpen(false);
      }
    };
    if (isSizeDropdownOpen || isColorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSizeDropdownOpen, isColorDropdownOpen]);

  const commitFontSize = (rawVal: string) => {
    const parsed = parseInt(rawVal.trim(), 10);
    if (!isNaN(parsed)) {
      const clamped = Math.min(99, Math.max(2, parsed));
      handleStyleChange('fontSize', clamped);
      setSizeInputText(clamped.toString());
    } else {
      setSizeInputText(fontSize.toString());
    }
    setIsSizeDropdownOpen(false);
  };

  const elementTypes: { label: string, type: ElementType }[] = [
    { label: 'Sahne', type: 'scene' },
    { label: 'Eylem', type: 'action' },
    { label: 'Karakter', type: 'character' },
    { label: 'Diyalog', type: 'dialogue' },
    { label: 'Parantez', type: 'parenthetical' },
    { label: 'Geçiş', type: 'transition' },
    { label: 'Not', type: 'note' }
  ];

  const barBg = theme === 'dark' 
    ? 'bg-[#20272e]/95 border-[#2d3640] text-slate-300 shadow-xl backdrop-blur-md' 
    : 'bg-[#FFFFF0]/95 border-[#c8bea8] text-slate-800 shadow-md backdrop-blur-md';
  const dividerClass = theme === 'dark' ? 'bg-[#2d3640]' : 'bg-[#c8bea8]';
  const btnHover = theme === 'dark' ? 'hover:text-white hover:bg-[#2d3640]/60' : 'hover:text-black hover:bg-[#e8e0d5]';

  const normalizedFontColor = normalizeColor(fontColor);

  return (
    <div className={`flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm no-print select-none transition-all ${barBg}`}>
      {/* 1. Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`p-1.5 rounded-lg transition-colors ${canUndo ? btnHover : 'opacity-30 cursor-not-allowed'}`}
          title="Geri Al (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button 
          onClick={onRedo} 
          disabled={!canRedo}
          className={`p-1.5 rounded-lg transition-colors ${canRedo ? btnHover : 'opacity-30 cursor-not-allowed'}`}
          title="İleri Al (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Separator */}
      <div className={`w-px h-4 mx-1 ${dividerClass}`} />

      {/* 2. Bold / Italic */}
      <div className="flex items-center gap-0.5">
        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('bold')} 
          className={`p-1.5 rounded-lg font-bold transition-colors ${btnHover}`}
          title="Kalın (Ctrl+B)"
        >
          <Bold size={15} />
        </button>
        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('italic')} 
          className={`p-1.5 rounded-lg italic transition-colors ${btnHover}`}
          title="İtalik (Ctrl+I)"
        >
          <Italic size={15} />
        </button>
      </div>

      {/* Separator */}
      <div className={`w-px h-4 mx-1 ${dividerClass}`} />

      {/* 3. Element Types */}
      <div className="flex items-center gap-0.5 sm:gap-1.5">
        {elementTypes.map((item) => {
          const isActive = currentElementType === item.type;
          return (
            <button 
              key={item.type} 
              onClick={() => changeCurrentElementType(item.type)}
              className={`px-2 py-1 rounded-md text-[11px] sm:text-xs transition-all ${
                isActive 
                  ? (theme === 'dark' 
                      ? 'text-[#6ba3e8] font-bold bg-[#6ba3e8]/15 shadow-xs' 
                      : 'text-blue-700 font-bold bg-blue-500/15 shadow-xs')
                  : (theme === 'dark' 
                      ? `text-slate-400 font-normal ${btnHover}` 
                      : `text-slate-700 font-medium ${btnHover}`)
              }`}
            >
              {item.label}
            </button>
          );
        })}

        {onToggleDualDialogue && (
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onToggleDualDialogue?.()}
            className={`px-2 py-1 rounded-md text-[11px] sm:text-xs transition-all flex items-center gap-1 ${
              isDualDialogue 
                ? (theme === 'dark' 
                    ? 'text-[#6ba3e8] font-bold bg-[#6ba3e8]/15 shadow-xs' 
                    : 'text-blue-700 font-bold bg-blue-500/15 shadow-xs')
                : (theme === 'dark' 
                    ? `text-slate-400 font-normal ${btnHover}` 
                    : `text-slate-700 font-medium ${btnHover}`)
            }`}
            title={isDualDialogue ? "Çift Diyaloğu Tek Sütuna Çevir" : "Çift Diyalog Yap (Yan Yana Aynı Anda Konuşma - Ctrl+Shift+D)"}
          >
            <Columns2 size={13} />
            <span className="hidden lg:inline">Çift Diyalog</span>
          </button>
        )}
      </div>

      {/* Separator */}
      <div className={`w-px h-4 mx-1 ${dividerClass}`} />

      {/* 4. Font Family Dropdown & Gallery Button */}
      <div className="relative flex items-center gap-1">
        <div className="relative flex items-center">
          <select 
            value={GOOGLE_FONTS_LIST.find(f => 
              fontFamily === f.value || 
              fontFamily.toLowerCase().includes(f.name.toLowerCase()) || 
              f.value.toLowerCase().includes(fontFamily.toLowerCase())
            )?.value || fontFamily} 
            onChange={(e) => {
              if (e.target.value === '__OPEN_PICKER__') {
                onOpenFontPicker?.();
              } else {
                handleStyleChange('fontFamily', e.target.value);
              }
            }}
            className={`appearance-none bg-transparent pr-5 pl-1.5 py-1 text-xs outline-none cursor-pointer transition-colors font-mono max-w-[110px] sm:max-w-[130px] truncate ${
              theme === 'dark' ? 'text-slate-200 hover:text-white' : 'text-slate-800 hover:text-black font-semibold'
            }`}
            style={{ fontFamily }}
            title="Yazı Tipi / Font Karakteri (Seçili metne veya bloğa uygular)"
          >
            <optgroup label="Standart / Daktilo">
              {GOOGLE_FONTS_LIST.filter(f => f.category === 'monospace' || !f.category).slice(0, 8).map((font) => (
                <option 
                  key={font.name} 
                  value={font.value}
                  className="text-slate-900 bg-[#FFFFF0] dark:bg-slate-800 dark:text-slate-100"
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </option>
              ))}
            </optgroup>
            
            <optgroup label="Serif (Klasik & Edebi)">
              {GOOGLE_FONTS_LIST.filter(f => f.category === 'serif').slice(0, 6).map((font) => (
                <option 
                  key={font.name} 
                  value={font.value}
                  className="text-slate-900 bg-[#FFFFF0] dark:bg-slate-800 dark:text-slate-100"
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Sans-Serif (Modern)">
              {GOOGLE_FONTS_LIST.filter(f => f.category === 'sans').slice(0, 6).map((font) => (
                <option 
                  key={font.name} 
                  value={font.value}
                  className="text-slate-900 bg-[#FFFFF0] dark:bg-slate-800 dark:text-slate-100"
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Sistem Fontları">
              {GOOGLE_FONTS_LIST.filter(f => f.category === 'system').slice(0, 5).map((font) => (
                <option 
                  key={font.name} 
                  value={font.value}
                  className="text-slate-900 bg-[#FFFFF0] dark:bg-slate-800 dark:text-slate-100"
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </option>
              ))}
            </optgroup>

            <option value="__OPEN_PICKER__" className="text-blue-600 dark:text-sky-400 font-bold bg-blue-50 dark:bg-slate-900">
              🔍 Tüm Fontları Gör & Ara...
            </option>
          </select>
          <ChevronDown size={12} className={`absolute right-0.5 pointer-events-none ${theme === 'dark' ? 'opacity-50' : 'opacity-70 text-slate-700'}`} />
        </div>

        {/* Quick Open Font Picker Modal Button */}
        {onOpenFontPicker && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onOpenFontPicker}
            className={`p-1 rounded transition-colors ${
              theme === 'dark' ? 'hover:bg-slate-700/60 text-slate-400 hover:text-white' : 'hover:bg-[#e4dcce] text-slate-600 hover:text-black'
            }`}
            title="Yazı Tipi Galerisini Aç (Tüm Google Fonts & Sistem Fontları)"
          >
            <Type size={13} />
          </button>
        )}
      </div>

      {/* Separator */}
      <div className={`w-px h-4 mx-1 ${dividerClass}`} />

      {/* 5. Font Size Picker & Stepper (2 to 99 pt) */}
      <div ref={sizeDropdownRef} className={`relative flex items-center gap-0.5 font-mono text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>
        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleStyleChange('fontSize', 'decrement')}
          className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-slate-700/50 text-slate-300' : 'hover:bg-[#e8e0d5] text-slate-800'}`}
          title="Yazı Boyutunu Küçült (-) (Seçili metin veya blok)"
        >
          <Minus size={13} />
        </button>

        <div className="relative flex items-center">
          <input
            type="text"
            inputMode="numeric"
            value={sizeInputText}
            onChange={(e) => setSizeInputText(e.target.value)}
            onFocus={() => setIsSizeDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitFontSize(sizeInputText);
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setSizeInputText(fontSize.toString());
                setIsSizeDropdownOpen(false);
                e.currentTarget.blur();
              }
            }}
            onBlur={() => commitFontSize(sizeInputText)}
            className={`w-7 sm:w-8 text-center font-bold text-xs py-0.5 px-0.5 rounded border outline-none transition-all ${
              theme === 'dark' 
                ? 'bg-[#1a1f25] border-slate-700 text-slate-100 focus:border-[#6ba3e8]' 
                : 'bg-white border-[#c8bea8] text-slate-900 focus:border-blue-600'
            }`}
            title="Yazı Boyutu (2-99 pt) - Doğrudan yazabilir veya listeden seçebilirsiniz"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsSizeDropdownOpen(prev => !prev)}
            className={`p-0.5 -ml-1 rounded hover:opacity-100 opacity-60 transition-opacity ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
            title="Yazı Boyutu Listesi"
          >
            <ChevronDown size={11} />
          </button>

          {/* Dropdown Menu (2 to 99 pt) */}
          {isSizeDropdownOpen && (
            <div 
              className={`absolute top-full left-0 mt-1.5 w-16 max-h-48 overflow-y-auto rounded-lg shadow-xl border z-50 py-1 text-xs select-none ${
                theme === 'dark' 
                  ? 'bg-[#20272e] border-slate-700 text-slate-200 shadow-black/50' 
                  : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-800 shadow-slate-300'
              }`}
            >
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    handleStyleChange('fontSize', size);
                    setSizeInputText(size.toString());
                    setIsSizeDropdownOpen(false);
                  }}
                  className={`w-full text-center px-2 py-1 font-mono hover:bg-blue-600 hover:text-white transition-colors ${
                    fontSize === size 
                      ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8] font-bold' : 'bg-blue-50 text-blue-700 font-bold') 
                      : ''
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleStyleChange('fontSize', 'increment')}
          className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-slate-700/50 text-slate-300' : 'hover:bg-[#e8e0d5] text-slate-800'}`}
          title="Yazı Boyutunu Büyüt (+) (Seçili metin veya blok)"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Separator */}
      <div className={`w-px h-4 mx-1 ${dividerClass}`} />

      {/* 6. Text Color Picker (Seçili Metin veya Blok Rengi) */}
      <div ref={colorDropdownRef} className="relative flex items-center">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsColorDropdownOpen(prev => !prev)}
          className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${btnHover}`}
          title="Yazı Rengi / Seçili Metin Rengi (Metni seçip dilediğiniz rengi uygulayın)"
        >
          <div className="flex flex-col items-center justify-center relative">
            <span className="font-bold text-xs leading-none font-serif">A</span>
            <span 
              className="w-3.5 h-1 rounded-sm mt-0.5 shadow-xs border border-black/20"
              style={{ backgroundColor: normalizedFontColor || (theme === 'dark' ? '#cbd5e1' : '#1e293b') }}
            />
          </div>
          <ChevronDown size={10} className="opacity-60" />
        </button>

        {isColorDropdownOpen && (
          <div 
            className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-52 p-3 rounded-xl shadow-2xl border z-50 select-none animate-in fade-in zoom-in-95 duration-150 ${
              theme === 'dark' 
                ? 'bg-[#20272e] border-slate-700 text-slate-200 shadow-black/70' 
                : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-800 shadow-slate-400/40'
            }`}
          >
            <div className="text-[11px] font-bold opacity-80 mb-2 px-0.5 flex items-center justify-between">
              <span>Yazı Rengi</span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  handleStyleChange('fontColor', '');
                  setIsColorDropdownOpen(false);
                }}
                className="text-[10px] text-blue-500 hover:underline cursor-pointer font-medium"
                title="Rengi varsayılana sıfırla"
              >
                Sıfırla
              </button>
            </div>

            {/* Color Swatches */}
            <div className="grid grid-cols-7 gap-1.5 mb-2.5">
              {TEXT_COLOR_PALETTE.map(c => {
                const isSelected = (c.value === '' && !normalizedFontColor) || (c.value !== '' && normalizedFontColor === c.value.toLowerCase());
                return (
                  <button
                    key={c.label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      handleStyleChange('fontColor', c.value);
                      setIsColorDropdownOpen(false);
                    }}
                    className={`w-5 h-5 rounded-full border transition-all hover:scale-125 flex items-center justify-center cursor-pointer ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-1 border-white scale-110 shadow-sm' : 'border-black/20 dark:border-white/20'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  >
                    {isSelected && (
                      <Check size={11} className={c.color === '#ffffff' || c.color === '#f1f5f9' || c.color === '#eab308' ? 'text-black stroke-[3]' : 'text-white stroke-[3]'} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="pt-2 border-t border-slate-500/20 flex items-center gap-2">
              <label className="flex items-center gap-2 text-[11px] cursor-pointer w-full hover:opacity-90">
                <input
                  type="color"
                  value={normalizedFontColor && normalizedFontColor.startsWith('#') ? normalizedFontColor : '#000000'}
                  onChange={(e) => {
                    handleStyleChange('fontColor', e.target.value);
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-[11px] font-medium opacity-80">Özel Renk Seç...</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Separator & Close (X) Button */}
      {onClose && (
        <>
          <div className={`w-px h-4 mx-0.5 ${dividerClass}`} />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors opacity-60 hover:opacity-100 ${btnHover}`}
            title="Araç Çubuğunu Gizle (Biçim menüsünden tekrar açabilirsiniz)"
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
}
