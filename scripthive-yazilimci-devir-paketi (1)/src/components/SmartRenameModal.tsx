import React, { useState, useMemo } from 'react';
import { 
  Replace, X, Check, AlertCircle, ArrowRight, User, 
  MapPin, CheckSquare, Square, RefreshCw, Sparkles, Filter
} from 'lucide-react';
import { ScreenplayElement, ElementType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SmartRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScreenplayElement[];
  onApplyRename: (updatedElements: ScreenplayElement[], renamed?: { type: 'character' | 'location'; oldName: string; newName: string }) => void;
  theme: 'dark' | 'light';
  characterBibleNames?: string[];
  onUpdateCharacterBibleName?: (oldName: string, newName: string) => void;
}

interface RenameMatchItem {
  id: string; // element id
  elementIndex: number;
  elementType: ElementType;
  sceneNumber: number | string;
  sceneHeading: string;
  originalText: string;
  newText: string;
  matchType: 'character_cue' | 'scene_heading' | 'action_reference' | 'dialogue_mention' | 'parenthetical';
}

export default function SmartRenameModal({
  isOpen,
  onClose,
  elements,
  onApplyRename,
  theme,
  characterBibleNames = [],
  onUpdateCharacterBibleName
}: SmartRenameModalProps) {
  const [entityType, setEntityType] = useState<'character' | 'location'>('character');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [targetName, setTargetName] = useState<string>('');
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
  const [syncCharacterBible, setSyncCharacterBible] = useState(true);

  // Helper to extract character list
  const characterList = useMemo(() => {
    const set = new Set<string>();
    elements.forEach(el => {
      if (el.type === 'character') {
        const cleaned = el.content.replace(/\(.*\)/g, '').trim().toLocaleUpperCase('tr-TR');
        if (cleaned) set.add(cleaned);
      }
    });
    return Array.from(set).sort();
  }, [elements]);

  // Helper to extract location list
  const locationList = useMemo(() => {
    const set = new Set<string>();
    elements.forEach(el => {
      if (el.type === 'scene') {
        let locRaw = el.content.split('-')[0].trim();
        locRaw = locRaw.replace(/^(İÇ|DIŞ|İÇ\/DIŞ|DAHİLİ|HARİCİ)\.?\s*/i, '').trim();
        locRaw = locRaw.replace(/[.,:;]$/, '').trim();
        const upper = locRaw.toLocaleUpperCase('tr-TR');
        if (upper) set.add(upper);
      }
    });
    return Array.from(set).sort();
  }, [elements]);

  // Auto-select first item when entity type changes
  React.useEffect(() => {
    if (entityType === 'character' && characterList.length > 0) {
      setSelectedSource(characterList[0]);
    } else if (entityType === 'location' && locationList.length > 0) {
      setSelectedSource(locationList[0]);
    } else {
      setSelectedSource('');
    }
    setTargetName('');
  }, [entityType, characterList, locationList]);

  // Capitalization helpers for Turkish text
  const toTitleCase = (str: string) => {
    return str.toLocaleLowerCase('tr-TR').replace(/(^|\s)\S/g, l => l.toLocaleUpperCase('tr-TR'));
  };

  // Perform smart replacement calculation and generate diff list
  const matches = useMemo(() => {
    if (!selectedSource.trim() || !targetName.trim()) return [];

    const sourceUpper = selectedSource.trim().toLocaleUpperCase('tr-TR');
    const sourceTitle = toTitleCase(selectedSource.trim());
    const sourceLower = selectedSource.trim().toLocaleLowerCase('tr-TR');

    const targetUpper = targetName.trim().toLocaleUpperCase('tr-TR');
    const targetTitle = toTitleCase(targetName.trim());
    const targetLower = targetName.trim().toLocaleLowerCase('tr-TR');

    const list: RenameMatchItem[] = [];
    let currentSceneNum: number | string = 1;
    let currentSceneHeading = 'GİRİŞ';

    elements.forEach((el, index) => {
      if (el.type === 'scene') {
        currentSceneNum = el.sceneNumber !== undefined ? el.sceneNumber : (typeof currentSceneNum === 'number' ? currentSceneNum + 1 : currentSceneNum);
        currentSceneHeading = el.content;
      }

      let content = el.content;
      let hasMatch = false;
      let newContent = content;
      let matchType: RenameMatchItem['matchType'] = 'action_reference';

      if (entityType === 'character') {
        if (el.type === 'character') {
          // Exact character cue replacement
          const cleaned = el.content.replace(/\(.*\)/g, '').trim().toLocaleUpperCase('tr-TR');
          if (cleaned === sourceUpper) {
            hasMatch = true;
            matchType = 'character_cue';
            // Preserve parenthetical if attached e.g. "MURAT (V.O.)" -> "CAN (V.O.)"
            newContent = el.content.replace(new RegExp(`\\b${escapeRegExp(sourceUpper)}\\b`, 'gi'), targetUpper);
          }
        } else {
          // Check action, dialogue, or parenthetical for references
          // Replace word boundaries with suffix support
          const regexUpper = new RegExp(`\\b${escapeRegExp(sourceUpper)}\\b`, 'g');
          const regexTitle = new RegExp(`\\b${escapeRegExp(sourceTitle)}\\b`, 'g');
          const regexLower = new RegExp(`\\b${escapeRegExp(sourceLower)}\\b`, 'g');

          let temp = content;
          if (regexUpper.test(temp)) {
            temp = temp.replace(regexUpper, targetUpper);
            hasMatch = true;
          }
          if (regexTitle.test(temp)) {
            temp = temp.replace(regexTitle, targetTitle);
            hasMatch = true;
          }
          if (regexLower.test(temp)) {
            temp = temp.replace(regexLower, targetLower);
            hasMatch = true;
          }

          if (hasMatch) {
            newContent = temp;
            if (el.type === 'dialogue') matchType = 'dialogue_mention';
            else if (el.type === 'parenthetical') matchType = 'parenthetical';
            else matchType = 'action_reference';
          }
        }
      } else if (entityType === 'location') {
        if (el.type === 'scene') {
          const regex = new RegExp(escapeRegExp(sourceUpper), 'gi');
          if (regex.test(content)) {
            hasMatch = true;
            matchType = 'scene_heading';
            newContent = content.replace(regex, targetUpper);
          }
        } else {
          // Mention in actions
          const regexUpper = new RegExp(`\\b${escapeRegExp(sourceUpper)}\\b`, 'g');
          const regexTitle = new RegExp(`\\b${escapeRegExp(sourceTitle)}\\b`, 'g');
          let temp = content;
          if (regexUpper.test(temp)) {
            temp = temp.replace(regexUpper, targetUpper);
            hasMatch = true;
          }
          if (regexTitle.test(temp)) {
            temp = temp.replace(regexTitle, targetTitle);
            hasMatch = true;
          }
          if (hasMatch) {
            newContent = temp;
            matchType = 'action_reference';
          }
        }
      }

      if (hasMatch) {
        list.push({
          id: el.id,
          elementIndex: index,
          elementType: el.type,
          sceneNumber: currentSceneNum,
          sceneHeading: currentSceneHeading,
          originalText: content,
          newText: newContent,
          matchType
        });
      }
    });

    return list;
  }, [elements, entityType, selectedSource, targetName]);

  // Select all by default whenever matches change
  React.useEffect(() => {
    setSelectedMatchIds(new Set(matches.map(m => m.id)));
  }, [matches]);

  const toggleSelectMatch = (id: string) => {
    const next = new Set(selectedMatchIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMatchIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedMatchIds.size === matches.length) {
      setSelectedMatchIds(new Set());
    } else {
      setSelectedMatchIds(new Set(matches.map(m => m.id)));
    }
  };

  const handleApply = () => {
    if (selectedMatchIds.size === 0) return;

    const matchMap = new Map<string, string>();
    matches.forEach(m => {
      if (selectedMatchIds.has(m.id)) {
        matchMap.set(m.id, m.newText);
      }
    });

    const updatedElements = elements.map(el => {
      if (matchMap.has(el.id)) {
        return {
          ...el,
          content: matchMap.get(el.id)!
        };
      }
      return el;
    });

    if (entityType === 'character' && syncCharacterBible && onUpdateCharacterBibleName) {
      onUpdateCharacterBibleName(selectedSource, targetName.trim().toLocaleUpperCase('tr-TR'));
    }

    onApplyRename(updatedElements, {
      type: entityType,
      oldName: selectedSource,
      newName: targetName.trim().toLocaleUpperCase('tr-TR')
    });
    onClose();
  };

  if (!isOpen) return null;

  const bgModal = theme === 'dark' ? 'bg-[#181c24] text-slate-100 border-[#2a3441]' : 'bg-[#FFFFF0] text-slate-800 border-[#c8bea8]';
  const cardBg = theme === 'dark' ? 'bg-[#202732] border-[#2d3847]' : 'bg-white border-[#e0d6c3]';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-4xl h-[88vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${bgModal}`}
        >
          {/* HEADER */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-800 bg-[#141820]' : 'border-[#dfd6c5] bg-[#ece4d6]'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-600/15 text-blue-700'}`}>
                <Replace size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">Akıllı Toplu Değiştirme (Smart Rename)</h2>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>
                    Büyük/Küçük Harf Duyarlı
                  </span>
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Karakter ve mekan adlarını senaryo başlıklarında, eylemlerde ve diyaloglarda ek uyumuyla tek tıkla güncelleyin.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-black'}`}
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>

          {/* CONTROLS BAR */}
          <div className={`p-4 sm:p-6 border-b space-y-4 ${theme === 'dark' ? 'bg-[#151922] border-[#222a35]' : 'bg-[#faf5ec] border-[#dfd6c5]'}`}>
            {/* Entity Type Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold opacity-70">Değiştirilecek Varlık:</span>
              <div className="inline-flex p-1 rounded-xl bg-slate-500/10 border border-inherit">
                <button
                  onClick={() => setEntityType('character')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    entityType === 'character'
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <User size={13} />
                  <span>Karakter İsmi</span>
                </button>
                <button
                  onClick={() => setEntityType('location')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    entityType === 'location'
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <MapPin size={13} />
                  <span>Mekan Adı</span>
                </button>
              </div>
            </div>

            {/* Source & Target Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Mevcut {entityType === 'character' ? 'Karakter' : 'Mekan'}:
                </label>
                <div className="relative">
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-bold transition-all ${
                      theme === 'dark'
                        ? 'bg-[#1c222d] border-[#2c3746] text-slate-100 focus:border-blue-500'
                        : 'bg-white border-[#d8cdba] text-slate-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Seçiniz...</option>
                    {(entityType === 'character' ? characterList : locationList).map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Yeni İsim / Başlık:
                </label>
                <input
                  type="text"
                  placeholder={entityType === 'character' ? 'Örn: CAN' : 'Örn: KAFE'}
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-bold uppercase transition-all ${
                    theme === 'dark'
                      ? 'bg-[#1c222d] border-[#2c3746] text-slate-100 focus:border-blue-500'
                      : 'bg-white border-[#d8cdba] text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Options */}
            {entityType === 'character' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="syncBible"
                  checked={syncCharacterBible}
                  onChange={(e) => setSyncCharacterBible(e.target.checked)}
                  className="rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="syncBible" className="opacity-80 cursor-pointer">
                  Karakter Rehberi'ndeki (Character Bible) profil adını da senkronize güncelle
                </label>
              </div>
            )}
          </div>

          {/* DIFF PREVIEW & CHECKLIST */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`px-6 py-2.5 border-b flex items-center justify-between text-xs font-medium ${theme === 'dark' ? 'bg-[#141820] border-[#222a35]' : 'bg-[#f5efe3] border-[#dfd6c5]'}`}>
              <div className="flex items-center gap-2">
                <span className="font-bold">Değişiklik Önizleme</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 font-bold text-[11px]">
                  {matches.length} Satır Bulundu ({selectedMatchIds.size} Seçili)
                </span>
              </div>

              {matches.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-blue-500 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                >
                  {selectedMatchIds.size === matches.length ? <CheckSquare size={13} /> : <Square size={13} />}
                  <span>{selectedMatchIds.size === matches.length ? 'Tüm Seçimleri Kaldır' : 'Tümünü Seç'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
              {!selectedSource || !targetName.trim() ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <Replace size={38} className="mb-2 text-slate-400" />
                  <p className="text-sm font-semibold">Önizleme oluşturmak için yukarıdan kaynak ve hedef isimleri girin.</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <AlertCircle size={38} className="mb-2 text-amber-500" />
                  <p className="text-sm font-semibold">"{selectedSource}" için senaryoda eşleşen satır bulunamadı.</p>
                </div>
              ) : (
                matches.map((item, idx) => {
                  const isChecked = selectedMatchIds.has(item.id);
                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      onClick={() => toggleSelectMatch(item.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isChecked 
                          ? `${cardBg} shadow-sm border-blue-500/40` 
                          : 'opacity-50 border-dashed border-slate-400/30'
                      }`}
                    >
                      <div className="pt-0.5">
                        {isChecked ? (
                          <CheckSquare size={17} className="text-blue-500" />
                        ) : (
                          <Square size={17} className="text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap text-[11px]">
                          <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-500/10">
                            SAHNE #{item.sceneNumber}
                          </span>
                          <span className="font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 uppercase text-[10px]">
                            {item.matchType === 'character_cue' ? 'Karakter Başlığı' :
                             item.matchType === 'scene_heading' ? 'Sahne Başlığı' :
                             item.matchType === 'dialogue_mention' ? 'Diyalog İçi' :
                             item.matchType === 'parenthetical' ? 'Parantez İçi' : 'Aksiyon / Eylem'}
                          </span>
                          <span className="opacity-60 truncate">{item.sceneHeading}</span>
                        </div>

                        {/* DIFF TEXT VIEW */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs font-mono">
                          <div className={`p-2 rounded-lg border line-through opacity-70 ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {item.originalText}
                          </div>
                          <div className={`p-2 rounded-lg border font-semibold ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                            {item.newText}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className={`px-6 py-3.5 border-t flex items-center justify-between ${theme === 'dark' ? 'border-slate-800 bg-[#141820]' : 'border-[#dfd6c5] bg-[#ece4d6]'}`}>
            <div className="text-xs opacity-70">
              {selectedMatchIds.size > 0 && `${selectedMatchIds.size} değişiklik uygulanacak`}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
              >
                Vazgeç
              </button>
              <button
                onClick={handleApply}
                disabled={selectedMatchIds.size === 0}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                  selectedMatchIds.size > 0
                    ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer active:scale-95'
                    : 'bg-slate-500/30 cursor-not-allowed opacity-50'
                }`}
              >
                <Check size={14} />
                <span>Değişiklikleri Uygula ({selectedMatchIds.size})</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
