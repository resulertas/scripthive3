import React, { useState, useMemo } from 'react';
import { 
  Users, X, Search, Download, FileText, Printer, 
  MapPin, ChevronRight, ChevronDown, ArrowRightLeft, Sparkles, Filter, Building2
} from 'lucide-react';
import { ScreenplayElement } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { downloadUtf8File } from '../lib/exportUtils';

interface CharacterMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScreenplayElement[];
  screenplayTitle?: string;
  theme: 'dark' | 'light';
  onJumpToScene?: (elementId: string) => void;
}

interface SceneInfo {
  sceneId: string;
  sceneNumber: number | string;
  heading: string;
  location: string;
  isInterior: boolean;
  characters: string[];
}

interface CharacterPair {
  char1: string;
  char2: string;
  sharedScenes: SceneInfo[];
  sharedCount: number;
  percentage1: number;
  percentage2: number;
}

export default function CharacterMatrixModal({
  isOpen,
  onClose,
  elements,
  screenplayTitle = 'SENARYO',
  theme,
  onJumpToScene
}: CharacterMatrixModalProps) {
  const [activeTab, setActiveTab] = useState<'interactions' | 'char-locations' | 'location-chars'>('interactions');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());

  // Clean character name helper
  const cleanName = (name: string) => {
    return name
      .replace(/\(.*\)/g, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
      .toLocaleUpperCase('tr-TR');
  };

  // Parse screenplay into scenes, characters, and locations
  const { 
    scenes, 
    characterList, 
    characterSceneMap, 
    locationSceneMap, 
    characterPairs,
    zeroInteractionPairs
  } = useMemo(() => {
    const scenesList: SceneInfo[] = [];
    let currentScene: SceneInfo | null = null;
    let sceneCounter = 0;

    const charScenes: Record<string, SceneInfo[]> = {};
    const locScenes: Record<string, SceneInfo[]> = {};
    const charSceneSets: Record<string, Set<string>> = {};

    elements.forEach((el) => {
      if (el.type === 'scene') {
        sceneCounter++;
        const plainHeading = el.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        const isInt = /^(\s*İÇ|\s*INT)/i.test(plainHeading);
        const loc = plainHeading
          .split('-')[0]
          .replace(/^(İÇ\/DIŞ|İÇ|DIŞ|INT\/EXT|INT|EXT)\.?\s*/i, '')
          .trim() || 'GENEL';

        currentScene = {
          sceneId: el.id,
          sceneNumber: el.sceneNumber || sceneCounter,
          heading: plainHeading,
          location: loc,
          isInterior: isInt,
          characters: []
        };
        scenesList.push(currentScene);

        if (!locScenes[loc]) locScenes[loc] = [];
        locScenes[loc].push(currentScene);
      } else if (el.type === 'character') {
        if (!currentScene) {
          sceneCounter++;
          currentScene = {
            sceneId: 'initial',
            sceneNumber: 1,
            heading: 'GİRİŞ SAHNESİ',
            location: 'GENEL',
            isInterior: true,
            characters: []
          };
          scenesList.push(currentScene);
        }

        const name = cleanName(el.content);
        if (name && !currentScene.characters.includes(name)) {
          currentScene.characters.push(name);

          if (!charScenes[name]) charScenes[name] = [];
          if (!charSceneSets[name]) charSceneSets[name] = new Set();
          
          if (!charSceneSets[name].has(currentScene.sceneId)) {
            charSceneSets[name].add(currentScene.sceneId);
            charScenes[name].push(currentScene);
          }
        }
      }
    });

    const chars = Object.keys(charScenes).sort((a, b) => (charScenes[b]?.length || 0) - (charScenes[a]?.length || 0));

    // Calculate Pairwise Interactions
    const pairs: CharacterPair[] = [];
    const zeroPairs: { char1: string; char2: string }[] = [];

    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        const c1 = chars[i];
        const c2 = chars[j];
        const set1 = charSceneSets[c1];
        const set2 = charSceneSets[c2];

        const shared = scenesList.filter(s => set1.has(s.sceneId) && set2.has(s.sceneId));
        const total1 = set1.size || 1;
        const total2 = set2.size || 1;

        if (shared.length > 0) {
          pairs.push({
            char1: c1,
            char2: c2,
            sharedScenes: shared,
            sharedCount: shared.length,
            percentage1: Math.round((shared.length / total1) * 100),
            percentage2: Math.round((shared.length / total2) * 100)
          });
        } else if (total1 >= 2 && total2 >= 2) {
          zeroPairs.push({ char1: c1, char2: c2 });
        }
      }
    }

    pairs.sort((a, b) => b.sharedCount - a.sharedCount);

    return {
      scenes: scenesList,
      characterList: chars,
      characterSceneMap: charScenes,
      locationSceneMap: locScenes,
      characterPairs: pairs,
      zeroInteractionPairs: zeroPairs
    };
  }, [elements]);

  if (!isOpen) return null;

  const togglePairExpand = (pairKey: string) => {
    setExpandedPairs(prev => {
      const next = new Set(prev);
      if (next.has(pairKey)) next.delete(pairKey);
      else next.add(pairKey);
      return next;
    });
  };

  const filteredPairs = characterPairs.filter(p => {
    if (selectedCharacter !== 'ALL') {
      if (p.char1 !== selectedCharacter && p.char2 !== selectedCharacter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.char1.toLowerCase().includes(q) || p.char2.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredCharLocations = characterList.filter(c => {
    if (selectedCharacter !== 'ALL' && c !== selectedCharacter) return false;
    if (searchQuery.trim()) return c.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  const filteredLocations = Object.keys(locationSceneMap).filter(loc => {
    if (searchQuery.trim()) return loc.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  }).sort((a, b) => (locationSceneMap[b]?.length || 0) - (locationSceneMap[a]?.length || 0));

  // --- Export Functions ---
  const exportMarkdown = () => {
    let md = `# KARAKTER ETKİLEŞİM & MEKAN MATRİSİ: ${screenplayTitle}\n\n`;
    md += `* **Toplam Karakter:** ${characterList.length}\n`;
    md += `* **Toplam Sahne:** ${scenes.length}\n`;
    md += `* **Tarih:** ${new Date().toLocaleDateString('tr-TR')}\n\n---\n\n`;

    md += `## 1. Karakter Etkileşimleri (Ortak Sahneler)\n\n`;
    characterPairs.forEach(p => {
      md += `### ${p.char1} ↔ ${p.char2} (${p.sharedCount} Ortak Sahne)\n`;
      md += `* **Birlikte Görünme:** ${p.char1}: %${p.percentage1}, ${p.char2}: %${p.percentage2}\n`;
      md += `* **Sahneler:** ${p.sharedScenes.map(s => `Sahne ${s.sceneNumber} (${s.heading})`).join(', ')}\n\n`;
    });

    md += `\n---\n\n## 2. Karakterlerin Mekan Dağılımı\n\n`;
    characterList.forEach(c => {
      const cScenes = characterSceneMap[c] || [];
      const locCounts: Record<string, number> = {};
      cScenes.forEach(s => {
        locCounts[s.location] = (locCounts[s.location] || 0) + 1;
      });
      md += `### ${c} (Toplam ${cScenes.length} Sahne)\n`;
      Object.entries(locCounts).forEach(([loc, cnt]) => {
        md += `* **${loc}:** ${cnt} sahne\n`;
      });
      md += `\n`;
    });

    downloadUtf8File(md, `${screenplayTitle}_Etkilesim_Matrisi.md`, 'text/markdown;charset=utf-8');
  };

  const exportJSON = () => {
    const data = {
      screenplayTitle,
      totalScenes: scenes.length,
      characterCount: characterList.length,
      characterPairs: characterPairs.map(p => ({
        char1: p.char1,
        char2: p.char2,
        sharedCount: p.sharedCount,
        sharedScenes: p.sharedScenes.map(s => ({ sceneNumber: s.sceneNumber, heading: s.heading }))
      })),
      characterLocations: characterList.map(c => ({
        character: c,
        totalScenes: characterSceneMap[c]?.length || 0,
        locations: Array.from(new Set(characterSceneMap[c]?.map(s => s.location) || []))
      }))
    };
    downloadUtf8File(JSON.stringify(data, null, 2), `${screenplayTitle}_Matris.json`, 'application/json;charset=utf-8');
  };

  const exportDOCX = async () => {
    try {
      const paragraphs: any[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: `KARAKTER ETKİLEŞİM & MEKAN MATRİSİ: ${screenplayTitle}`,
              bold: true,
              size: 28,
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Toplam Karakter: ${characterList.length} | Toplam Sahne: ${scenes.length} | Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
              italics: true,
              size: 18,
              font: "Arial",
              color: "666666"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      ];

      characterPairs.forEach(p => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${p.char1} ↔ ${p.char2} (${p.sharedCount} Ortak Sahne)`,
                bold: true,
                size: 20,
                font: "Arial"
              })
            ],
            spacing: { before: 120, after: 40 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Sahneler: ${p.sharedScenes.map(s => `Sahne ${s.sceneNumber}`).join(', ')}`,
                size: 16,
                font: "Arial",
                color: "444444"
              })
            ],
            spacing: { after: 100 }
          })
        );
      });

      const doc = new Document({
        sections: [{ children: paragraphs }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${screenplayTitle}_Etkilesim_Matrisi.docx`);
    } catch (err) {
      console.error('Word export error:', err);
    }
  };

  const bgModal = theme === 'dark' ? 'bg-[#1a1f26] text-slate-100 border-[#2d3640]' : 'bg-[#FFFFF0] text-slate-900 border-[#c8bea8]';
  const cardBg = theme === 'dark' ? 'bg-[#14181f] border-[#252f3d]' : 'bg-white border-[#ded5c5]';
  const innerCardBg = theme === 'dark' ? 'bg-[#1c222b] border-[#2d3640]' : 'bg-[#faf7f0] border-[#e2dacb]';
  const btnActive = theme === 'dark' ? 'bg-slate-700 text-white font-medium' : 'bg-[#e4dcce] text-slate-900 font-semibold';
  const btnInactive = theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-[#ede6d9]';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.15 }}
          className={`w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${bgModal}`}
        >
          {/* HEADER */}
          <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'border-[#2d3640] bg-[#161c24]' : 'border-[#c8bea8] bg-[#e8e0d5]'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20">
                <ArrowRightLeft size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">Karakter Etkileşim & Mekan Matrisi</h2>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Karakterlerin birbiriyle paylaştığı ortak sahneler ve mekan dağılım analizi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 mr-2">
                <button
                  onClick={exportMarkdown}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300' : 'border-[#ded5c5] bg-white hover:bg-[#ebe3d5] text-slate-700'}`}
                  title="Markdown İndir"
                >
                  <Download size={12} /> .md
                </button>
                <button
                  onClick={exportDOCX}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300' : 'border-[#ded5c5] bg-white hover:bg-[#ebe3d5] text-slate-700'}`}
                  title="Word İndir"
                >
                  <FileText size={12} /> Word
                </button>
                <button
                  onClick={exportJSON}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300' : 'border-[#ded5c5] bg-white hover:bg-[#ebe3d5] text-slate-700'}`}
                  title="JSON İndir"
                >
                  JSON
                </button>
              </div>

              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* SUB-HEADER: TABS & FILTER */}
          <div className={`px-5 py-2.5 border-b flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${theme === 'dark' ? 'border-[#252f3d] bg-[#12161c]' : 'border-[#e4dcce] bg-[#f5efe4]'}`}>
            {/* TABS */}
            <div className={`p-0.5 rounded-xl border flex items-center gap-1 ${theme === 'dark' ? 'bg-[#181e26] border-slate-800' : 'bg-[#e8e0d4] border-[#d8cfbf]'}`}>
              <button
                onClick={() => setActiveTab('interactions')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${activeTab === 'interactions' ? btnActive : btnInactive}`}
              >
                <Users size={13} />
                <span>Karakter Etkileşimleri ({characterPairs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('char-locations')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${activeTab === 'char-locations' ? btnActive : btnInactive}`}
              >
                <Building2 size={13} />
                <span>Karakter ➔ Mekan</span>
              </button>
              <button
                onClick={() => setActiveTab('location-chars')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${activeTab === 'location-chars' ? btnActive : btnInactive}`}
              >
                <MapPin size={13} />
                <span>Mekan ➔ Karakter</span>
              </button>
            </div>

            {/* SEARCH & CHARACTER FILTER */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search size={13} className="absolute left-2.5 top-2.5 opacity-40 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ara..."
                  className={`w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border outline-none ${theme === 'dark' ? 'bg-[#161c24] border-slate-700 text-slate-200' : 'bg-white border-[#dcd4c4] text-slate-800'}`}
                />
              </div>

              {activeTab !== 'location-chars' && (
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className={`px-2.5 py-1 text-xs rounded-lg border outline-none font-mono ${theme === 'dark' ? 'bg-[#161c24] border-slate-700 text-slate-200' : 'bg-white border-[#dcd4c4] text-slate-800'}`}
                >
                  <option value="ALL">Tüm Karakterler</option>
                  {characterList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            
            {/* TAB 1: CHARACTER INTERACTIONS */}
            {activeTab === 'interactions' && (
              <div className="space-y-3">
                {filteredPairs.length === 0 ? (
                  <div className={`p-8 text-center rounded-xl border text-xs opacity-60 ${cardBg}`}>
                    Eşleşen karakter etkileşimi bulunamadı.
                  </div>
                ) : (
                  filteredPairs.map(pair => {
                    const pairKey = `${pair.char1}_${pair.char2}`;
                    const isExpanded = expandedPairs.has(pairKey);

                    return (
                      <div 
                        key={pairKey}
                        className={`rounded-xl border transition-all ${cardBg} hover:border-slate-400/40`}
                      >
                        {/* Summary Header */}
                        <div 
                          onClick={() => togglePairExpand(pairKey)}
                          className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-tight">
                              <span className="px-2 py-0.5 rounded bg-slate-500/10 border border-slate-500/20">{pair.char1}</span>
                              <span className="opacity-40 text-[11px]">↔</span>
                              <span className="px-2 py-0.5 rounded bg-slate-500/10 border border-slate-500/20">{pair.char2}</span>
                            </div>

                            <div className="hidden md:flex items-center gap-2 text-[11px] opacity-60">
                              <span>({pair.char1}: %{pair.percentage1} • {pair.char2}: %{pair.percentage2})</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20">
                              {pair.sharedCount} Ortak Sahne
                            </span>
                            <div className="opacity-40">
                              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Scene Details */}
                        {isExpanded && (
                          <div className={`p-3 border-t space-y-1.5 ${innerCardBg}`}>
                            <div className="text-[10px] uppercase font-bold opacity-60 tracking-wider mb-1">
                              Birlikte Yer Aldıkları Sahneler
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {pair.sharedScenes.map(scene => (
                                <button
                                  key={scene.sceneId}
                                  onClick={() => {
                                    onJumpToScene?.(scene.sceneId);
                                    onClose();
                                  }}
                                  className={`p-2 rounded-lg text-left text-xs border transition-colors flex items-center justify-between ${theme === 'dark' ? 'bg-[#14181f] border-slate-800 hover:border-slate-600' : 'bg-white border-[#e0d8c8] hover:border-[#b8ad98]'}`}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="font-mono font-bold shrink-0 opacity-70">
                                      {scene.sceneNumber}.
                                    </span>
                                    <span className="truncate font-mono text-[11px] opacity-90">
                                      {scene.heading}
                                    </span>
                                  </div>
                                  <span className="text-[10px] opacity-40 shrink-0 ml-2">Git ➔</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* ZERO INTERACTIONS SECTION */}
                {selectedCharacter === 'ALL' && zeroInteractionPairs.length > 0 && (
                  <div className={`mt-6 p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#12161d] border-slate-800' : 'bg-[#faf6ee] border-[#dfd7c7]'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="opacity-60" />
                      <span className="text-xs font-bold tracking-tight opacity-80 uppercase">
                        Hiç Ortak Sahnesi Olmayan Karakterler ({zeroInteractionPairs.length})
                      </span>
                    </div>
                    <p className="text-[11px] opacity-60 mb-3">
                      Senaryoda birden fazla sahnesi olup birbirleriyle hiç aynı sahnede karşılaşmayan karakter kombinasyonları:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {zeroInteractionPairs.slice(0, 16).map((zp, idx) => (
                        <div 
                          key={idx}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border ${theme === 'dark' ? 'bg-[#171d26] border-slate-700/60 opacity-75' : 'bg-white border-[#d8cfbe] opacity-80'}`}
                        >
                          {zp.char1} ↮ {zp.char2}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CHARACTER ➔ LOCATION MATRIX */}
            {activeTab === 'char-locations' && (
              <div className="space-y-4">
                {filteredCharLocations.map(charName => {
                  const charScenes = characterSceneMap[charName] || [];
                  const locMap: Record<string, SceneInfo[]> = {};
                  let intCount = 0;
                  let extCount = 0;

                  charScenes.forEach(s => {
                    if (!locMap[s.location]) locMap[s.location] = [];
                    locMap[s.location].push(s);
                    if (s.isInterior) intCount++;
                    else extCount++;
                  });

                  const sortedLocs = Object.entries(locMap).sort((a, b) => b[1].length - a[1].length);

                  return (
                    <div key={charName} className={`rounded-xl border p-4 ${cardBg}`}>
                      <div className="flex items-center justify-between mb-3 border-b pb-2.5 border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">{charName}</span>
                          <span className="text-xs font-mono opacity-60">({charScenes.length} Sahne)</span>
                        </div>
                        <div className="text-[11px] font-mono opacity-60 flex items-center gap-2">
                          <span>İÇ: {intCount}</span>
                          <span>•</span>
                          <span>DIŞ: {extCount}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {sortedLocs.map(([loc, scs]) => (
                          <div 
                            key={loc}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${innerCardBg}`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <MapPin size={12} className="opacity-50 shrink-0" />
                              <span className="font-mono truncate font-medium">{loc}</span>
                            </div>
                            <span className="font-mono text-[11px] opacity-60 shrink-0 ml-2">
                              {scs.length} sahne
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: LOCATION ➔ CHARACTER MATRIX */}
            {activeTab === 'location-chars' && (
              <div className="space-y-4">
                {filteredLocations.map(loc => {
                  const locScenes = locationSceneMap[loc] || [];
                  const charCounts: Record<string, number> = {};

                  locScenes.forEach(s => {
                    s.characters.forEach(c => {
                      charCounts[c] = (charCounts[c] || 0) + 1;
                    });
                  });

                  const sortedChars = Object.entries(charCounts).sort((a, b) => b[1] - a[1]);

                  return (
                    <div key={loc} className={`rounded-xl border p-4 ${cardBg}`}>
                      <div className="flex items-center justify-between mb-3 border-b pb-2.5 border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="opacity-60" />
                          <span className="font-mono font-bold text-sm">{loc}</span>
                        </div>
                        <span className="text-xs font-mono opacity-60">
                          {locScenes.length} Sahne
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {sortedChars.length === 0 ? (
                          <span className="text-xs opacity-50 italic">Diyaloglu karakter bulunmuyor.</span>
                        ) : (
                          sortedChars.map(([c, cnt]) => (
                            <div 
                              key={c}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${innerCardBg}`}
                            >
                              <span className="font-semibold">{c}</span>
                              <span className="text-[10px] opacity-60 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                                {cnt} sahne
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div className={`px-5 py-2.5 border-t flex items-center justify-between text-[11px] opacity-60 ${theme === 'dark' ? 'border-[#2d3640] bg-[#161c24]' : 'border-[#c8bea8] bg-[#e8e0d5]'}`}>
            <span>Toplam {characterList.length} karakter, {scenes.length} sahne incelendi.</span>
            <span>Senaryo Yapım & Analiz Modülü</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
