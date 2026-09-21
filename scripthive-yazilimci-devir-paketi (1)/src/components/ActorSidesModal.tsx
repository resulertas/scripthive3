import React, { useState, useMemo } from 'react';
import { 
  Users, X, Search, CheckSquare, Square, Download, FileText, 
  Printer, Sparkles, Filter, ChevronRight, Check, Eye, EyeOff,
  Film, Calendar, User, Clapperboard, MapPin, MessageSquare
} from 'lucide-react';
import { ScreenplayElement, ScreenplayFormat } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { printStyledDocument, downloadUtf8File, escapeHtml } from '../lib/exportUtils';

interface ActorSidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScreenplayElement[];
  screenplayTitle?: string;
  format?: ScreenplayFormat;
  theme: 'dark' | 'light';
  onJumpToScene?: (elementId: string) => void;
}

interface SceneGroup {
  sceneId: string;
  sceneNumber: number | string;
  heading: string;
  location: string;
  elements: ScreenplayElement[];
  characters: string[];
  characterLineCounts: Record<string, number>;
  approxPage: number;
}

export default function ActorSidesModal({
  isOpen,
  onClose,
  elements,
  screenplayTitle = 'SENARYO',
  format = 'US',
  theme,
  onJumpToScene
}: ActorSidesModalProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const [actorName, setActorName] = useState('');
  const [shootDay, setShootDay] = useState('');
  const [highlightMode, setHighlightMode] = useState<'highlight' | 'standard'>('highlight');
  const [charSearch, setCharSearch] = useState('');

  // Clean character name helper
  const cleanName = (name: string) => {
    return name
      .replace(/\(.*\)/g, '')
      .trim()
      .toLocaleUpperCase('tr-TR');
  };

  // Group elements into distinct scenes
  const { allScenes, characterList, characterSceneMap } = useMemo(() => {
    const scenes: SceneGroup[] = [];
    let currentScene: SceneGroup | null = null;
    let sceneIndex = 0;
    let runningWords = 0;
    let currentChar = '';

    const charMap: Record<string, { name: string; totalLines: number; totalWords: number; sceneCount: number }> = {};
    const charScenes: Record<string, Set<string>> = {};

    elements.forEach((el) => {
      const words = el.content.trim().split(/\s+/).filter(Boolean).length;
      runningWords += words;

      if (el.type === 'scene') {
        sceneIndex += 1;
        currentScene = {
          sceneId: el.id,
          sceneNumber: el.sceneNumber || sceneIndex,
          heading: el.content,
          location: el.content.split('-')[0].replace(/^(İÇ|DIŞ|İÇ\/DIŞ)\.?\s*/i, '').trim() || 'GENEL',
          elements: [el],
          characters: [],
          characterLineCounts: {},
          approxPage: Math.max(1, Math.ceil(runningWords / 220))
        };
        scenes.push(currentScene);
        currentChar = '';
      } else {
        if (!currentScene) {
          // Fallback if elements start before scene heading
          currentScene = {
            sceneId: 'initial',
            sceneNumber: 1,
            heading: 'GİRİŞ',
            location: 'GENEL',
            elements: [],
            characters: [],
            characterLineCounts: {},
            approxPage: 1
          };
          scenes.push(currentScene);
        }

        currentScene.elements.push(el);

        if (el.type === 'character') {
          const name = cleanName(el.content);
          if (name) {
            currentChar = name;
            if (!currentScene.characters.includes(name)) {
              currentScene.characters.push(name);
            }
          }
        } else if (el.type === 'dialogue' && currentChar) {
          currentScene.characterLineCounts[currentChar] = (currentScene.characterLineCounts[currentChar] || 0) + 1;

          if (!charMap[currentChar]) {
            charMap[currentChar] = { name: currentChar, totalLines: 0, totalWords: 0, sceneCount: 0 };
            charScenes[currentChar] = new Set();
          }
          charMap[currentChar].totalLines += 1;
          charMap[currentChar].totalWords += words;
          charScenes[currentChar].add(currentScene.sceneId);
        }
      }
    });

    // Update scene counts
    Object.keys(charScenes).forEach((c) => {
      if (charMap[c]) {
        charMap[c].sceneCount = charScenes[c].size;
      }
    });

    const chars = Object.values(charMap).sort((a, b) => b.totalLines - a.totalLines);

    return {
      allScenes: scenes,
      characterList: chars,
      characterSceneMap: charScenes
    };
  }, [elements]);

  // Default character selection
  React.useEffect(() => {
    if (characterList.length > 0 && (!selectedCharacter || !characterList.some(c => c.name === selectedCharacter))) {
      const first = characterList[0].name;
      setSelectedCharacter(first);
      const scenesWithChar = characterSceneMap[first] || new Set();
      setSelectedSceneIds(new Set(scenesWithChar));
    }
  }, [characterList, selectedCharacter, characterSceneMap]);

  // When changing character, auto-select all scenes for that character
  const handleSelectCharacter = (charName: string) => {
    setSelectedCharacter(charName);
    const scenesWithChar = characterSceneMap[charName] || new Set();
    setSelectedSceneIds(new Set(scenesWithChar));
  };

  // Scenes where the selected character appears
  const characterScenes = useMemo(() => {
    if (!selectedCharacter) return [];
    return allScenes.filter(s => (characterSceneMap[selectedCharacter] || new Set()).has(s.sceneId));
  }, [allScenes, selectedCharacter, characterSceneMap]);

  // Toggle individual scene selection
  const toggleScene = (sceneId: string) => {
    setSelectedSceneIds(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  };

  const selectAllScenes = () => {
    setSelectedSceneIds(new Set(characterScenes.map(s => s.sceneId)));
  };

  const deselectAllScenes = () => {
    setSelectedSceneIds(new Set());
  };

  // Filtered active scenes to render in preview & export
  const activeScenesToRender = useMemo(() => {
    return allScenes.filter(s => selectedSceneIds.has(s.sceneId));
  }, [allScenes, selectedSceneIds]);

  // Selected character stats in current sides selection
  const activeStats = useMemo(() => {
    let lines = 0;
    let words = 0;
    activeScenesToRender.forEach(s => {
      lines += s.characterLineCounts[selectedCharacter] || 0;
    });
    return {
      sceneCount: activeScenesToRender.length,
      linesCount: lines
    };
  }, [activeScenesToRender, selectedCharacter]);

  // PDF Export
  const handleExportPDF = () => {
    if (activeScenesToRender.length === 0) {
      alert('Lütfen en az bir sahne seçin.');
      return;
    }

    const sceneNumbers = activeScenesToRender.map(s => `#${s.sceneNumber}`).join(', ');
    const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    let bodyHtml = `
      <div style="border: 2px solid #0f172a; border-radius: 8px; padding: 18px 24px; margin-bottom: 28px; background: #f8fafc;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 10pt; font-weight: 800; color: #dc2626; letter-spacing: 1.5px; text-transform: uppercase;">OYUNCU SET METNİ • ACTOR SIDES</div>
            <div style="font-size: 18pt; font-weight: 800; color: #0f172a; margin-top: 2px;">${escapeHtml(selectedCharacter)}</div>
            ${actorName ? `<div style="font-size: 11pt; font-weight: 600; color: #475569; margin-top: 2px;">Oyuncu: ${escapeHtml(actorName)}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12pt; font-weight: 700; color: #0f172a;">${escapeHtml(screenplayTitle)}</div>
            <div style="font-size: 9pt; color: #64748b; margin-top: 2px;">${shootDay ? `${escapeHtml(shootDay)} • ` : ''}${dateStr}</div>
          </div>
        </div>
        <div style="display: flex; gap: 24px; font-size: 9.5pt; color: #334155;">
          <div><strong>Sahneler (${activeStats.sceneCount}):</strong> ${sceneNumbers}</div>
          <div><strong>Toplam Replik:</strong> ${activeStats.linesCount}</div>
        </div>
      </div>

      <div style="font-family: 'Courier Prime', Courier, monospace; font-size: 11pt; line-height: 1.35; color: #000000;">
    `;

    activeScenesToRender.forEach((scene) => {
      bodyHtml += `<div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #94a3b8; page-break-inside: avoid;">`;

      let currentSpeaker = '';
      scene.elements.forEach((el) => {
        if (el.type === 'scene') {
          bodyHtml += `
            <div style="font-weight: bold; text-transform: uppercase; margin-top: 12px; margin-bottom: 8px;">
              ${el.sceneNumber ? `<span style="display: inline-block; width: 40px;">${el.sceneNumber}.</span>` : ''}${escapeHtml(el.content)}
            </div>
          `;
        } else if (el.type === 'action') {
          bodyHtml += `<div style="margin-bottom: 8px; max-width: 600px;">${el.content}</div>`;
        } else if (el.type === 'character') {
          const charName = cleanName(el.content);
          currentSpeaker = charName;
          const isTarget = charName === selectedCharacter;

          bodyHtml += `
            <div style="
              text-align: center; 
              width: 320px; 
              margin: 14px auto 2px auto; 
              font-weight: bold; 
              text-transform: uppercase;
              ${isTarget ? 'background: rgba(220, 38, 38, 0.12); color: #b91c1c; padding: 2px 8px; border-radius: 4px; display: inline-block; width: auto;' : ''}
            ">
              ${escapeHtml(el.content)} ${isTarget ? '★' : ''}
            </div>
          `;
        } else if (el.type === 'parenthetical') {
          bodyHtml += `<div style="text-align: center; width: 240px; margin: 0 auto 2px auto; font-style: italic;">${escapeHtml(el.content)}</div>`;
        } else if (el.type === 'dialogue') {
          const isTarget = currentSpeaker === selectedCharacter;
          bodyHtml += `
            <div style="
              width: 340px; 
              margin: 0 auto 10px auto;
              ${isTarget ? 'background: rgba(254, 243, 199, 0.5); border-left: 3px solid #f59e0b; padding: 2px 8px;' : ''}
            ">
              ${el.content}
            </div>
          `;
        } else if (el.type === 'transition') {
          bodyHtml += `<div style="text-align: right; text-transform: uppercase; font-weight: bold; margin: 8px 0;">${escapeHtml(el.content)}</div>`;
        }
      });

      bodyHtml += `</div>`;
    });

    bodyHtml += `</div>`;

    printStyledDocument({
      title: `${selectedCharacter} - Oyuncu Set Metni (Sides)`,
      categoryBadge: 'Oyuncu Set Metni (Sides)',
      subtitle: `${screenplayTitle} • ${activeStats.sceneCount} Sahne • ${activeStats.linesCount} Replik`,
      bodyHtml,
      accentColor: '#dc2626'
    });
  };

  // Word Export (.docx)
  const handleExportDOCX = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
              }
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "OYUNCU SET METNİ (ACTOR SIDES)", bold: true, size: 28, font: "Courier Prime", color: "DC2626" })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 80 }
              }),
              new Paragraph({
                children: [new TextRun({ text: selectedCharacter, bold: true, size: 36, font: "Courier Prime" })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Senaryo: ${screenplayTitle}   |   ${shootDay ? `${shootDay}   |   ` : ''}Tarih: ${new Date().toLocaleDateString('tr-TR')}`, italics: true, size: 20, color: "64748B", font: "Courier Prime" })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
              }),
              ...activeScenesToRender.flatMap((scene) => {
                let currentSpeaker = '';
                return [
                  new Paragraph({
                    children: [new TextRun({ text: `------------------------------------------------------------`, color: "CBD5E1" })],
                    spacing: { before: 200, after: 100 }
                  }),
                  ...scene.elements.map((el) => {
                    if (el.type === 'scene') {
                      return new Paragraph({
                        children: [new TextRun({ text: `${el.sceneNumber ? `${el.sceneNumber}. ` : ''}${el.content.replace(/<[^>]+>/g, '')}`, bold: true, font: "Courier Prime", size: 22 })],
                        spacing: { before: 150, after: 100 }
                      });
                    } else if (el.type === 'action') {
                      return new Paragraph({
                        children: [new TextRun({ text: el.content.replace(/<[^>]+>/g, ''), font: "Courier Prime", size: 20 })],
                        spacing: { after: 100 }
                      });
                    } else if (el.type === 'character') {
                      const cName = cleanName(el.content);
                      currentSpeaker = cName;
                      const isTarget = cName === selectedCharacter;
                      return new Paragraph({
                        children: [new TextRun({ text: el.content.replace(/<[^>]+>/g, '') + (isTarget ? ' ★' : ''), bold: true, font: "Courier Prime", size: 20, color: isTarget ? "DC2626" : "000000" })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 40 }
                      });
                    } else if (el.type === 'parenthetical') {
                      return new Paragraph({
                        children: [new TextRun({ text: el.content.replace(/<[^>]+>/g, ''), italics: true, font: "Courier Prime", size: 20 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 40 }
                      });
                    } else if (el.type === 'dialogue') {
                      const isTarget = currentSpeaker === selectedCharacter;
                      return new Paragraph({
                        children: [new TextRun({ text: el.content.replace(/<[^>]+>/g, ''), font: "Courier Prime", size: 20, bold: isTarget })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 }
                      });
                    } else {
                      return new Paragraph({
                        children: [new TextRun({ text: el.content.replace(/<[^>]+>/g, ''), font: "Courier Prime", size: 20 })],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 80 }
                      });
                    }
                  })
                ];
              })
            ]
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${selectedCharacter}_Sides.docx`);
    } catch (err: any) {
      console.error(err);
      alert('Word dosyası oluşturulurken hata: ' + (err.message || String(err)));
    }
  };

  // Markdown Export
  const handleExportMD = () => {
    let md = `# OYUNCU SET METNİ (ACTOR SIDES): ${selectedCharacter}\n\n`;
    md += `* **Senaryo:** ${screenplayTitle}\n`;
    if (actorName) md += `* **Oyuncu:** ${actorName}\n`;
    if (shootDay) md += `* **Çekim Günü:** ${shootDay}\n`;
    md += `* **Toplam Sahne:** ${activeStats.sceneCount}\n`;
    md += `* **Toplam Replik:** ${activeStats.linesCount}\n`;
    md += `* **Tarih:** ${new Date().toLocaleDateString('tr-TR')}\n\n---\n\n`;

    activeScenesToRender.forEach((scene) => {
      let currentSpeaker = '';
      scene.elements.forEach((el) => {
        const text = el.content.replace(/<[^>]+>/g, '');
        if (el.type === 'scene') {
          md += `\n### ${el.sceneNumber ? `${el.sceneNumber}. ` : ''}${text}\n\n`;
        } else if (el.type === 'action') {
          md += `${text}\n\n`;
        } else if (el.type === 'character') {
          currentSpeaker = cleanName(text);
          const isTarget = currentSpeaker === selectedCharacter;
          md += `**${text}${isTarget ? ' ★' : ''}**\n`;
        } else if (el.type === 'parenthetical') {
          md += `*${text}*\n`;
        } else if (el.type === 'dialogue') {
          const isTarget = currentSpeaker === selectedCharacter;
          md += `${isTarget ? `> **${text}**` : `> ${text}`}\n\n`;
        } else if (el.type === 'transition') {
          md += `_${text}_\n\n`;
        }
      });
    });

    downloadUtf8File(md, `${selectedCharacter}_Sides.md`, "text/markdown;charset=utf-8");
  };

  if (!isOpen) return null;

  const bgModal = theme === 'dark' ? 'bg-[#1c222a] text-slate-100 border-[#2d3640]' : 'bg-[#FFFFF0] text-slate-800 border-[#c8bea8]';
  const cardBg = theme === 'dark' ? 'bg-[#141920] border-[#252f3d]' : 'bg-white border-[#ded5c5]';
  const btnHover = theme === 'dark' ? 'hover:bg-slate-700/60 text-slate-300 hover:text-white' : 'hover:bg-[#ebe3d5] text-slate-700 hover:text-black';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-6xl h-[94vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${bgModal}`}
        >
          {/* HEADER */}
          <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'border-[#2d3640] bg-[#161c24]' : 'border-[#c8bea8] bg-[#e8e0d5]'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20">
                <Clapperboard size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight">Oyuncu Set Metinleri (Actor Sides)</h2>
                </div>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Seçilen karakterin sahnelerini filtreleyin ve sete hazır formatta dışa aktarın.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-700/60 text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>

          {/* MAIN 3-COLUMN / SPLIT WORKSPACE */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* LEFT COLUMN: CHARACTER & SCENE PICKER */}
            <div className={`w-full md:w-80 border-r flex flex-col shrink-0 ${theme === 'dark' ? 'border-[#252f3d] bg-[#141920]' : 'border-[#ded5c5] bg-[#f7f3eb]'}`}>
              
              {/* 1. Character Search & List */}
              <div className="p-3 border-b border-black/10 dark:border-white/10 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Karakter Seçin</span>
                  <span className="text-[10px] opacity-60 font-mono">{characterList.length} Karakter</span>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 opacity-50 pointer-events-none" />
                  <input
                    type="text"
                    value={charSearch}
                    onChange={(e) => setCharSearch(e.target.value)}
                    placeholder="Karakter ara..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none ${
                      theme === 'dark' ? 'bg-[#10141a] border-slate-700 text-slate-200' : 'bg-white border-[#dcd4c4] text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Character Badges */}
              <div className="h-44 overflow-y-auto p-2 space-y-1 border-b border-black/10 dark:border-white/10 shrink-0">
                {characterList
                  .filter(c => c.name.toLowerCase().includes(charSearch.toLowerCase()))
                  .map((char) => {
                    const isSelected = char.name === selectedCharacter;
                    return (
                      <button
                        key={char.name}
                        onClick={() => handleSelectCharacter(char.name)}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition-all ${
                          isSelected 
                            ? `${theme === 'dark' ? 'bg-slate-700 text-white font-bold' : 'bg-[#e0d6c4] text-slate-900 font-bold'}` 
                            : `${theme === 'dark' ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-[#ebe3d5] text-slate-700'}`
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isSelected 
                              ? (theme === 'dark' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white')
                              : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                          }`}>
                            {char.name.charAt(0)}
                          </div>
                          <span className="truncate">{char.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] opacity-80 shrink-0 font-mono">
                          <span>{char.sceneCount} S.</span>
                          <span>•</span>
                          <span>{char.totalLines} R.</span>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* 2. Scene Checklist */}
              <div className="p-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Sahneler</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">
                    {selectedSceneIds.size} / {characterScenes.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <button onClick={selectAllScenes} className="hover:underline font-semibold">Tümü</button>
                  <span>•</span>
                  <button onClick={deselectAllScenes} className="opacity-60 hover:underline">Temizle</button>
                </div>
              </div>

              {/* Scene Checklist Items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {characterScenes.map((scene) => {
                  const isChecked = selectedSceneIds.has(scene.sceneId);
                  const lines = scene.characterLineCounts[selectedCharacter] || 0;
                  return (
                    <div
                      key={scene.sceneId}
                      onClick={() => toggleScene(scene.sceneId)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs cursor-pointer transition-all ${
                        isChecked 
                          ? (theme === 'dark' ? 'bg-slate-800/80 border-slate-600 text-slate-100' : 'bg-[#e4dcce] border-[#c8bea8] text-slate-900')
                          : 'opacity-50 hover:opacity-100 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isChecked ? <CheckSquare size={14} className="opacity-80 shrink-0" /> : <Square size={14} className="opacity-40 shrink-0" />}
                        <span className="font-mono font-bold shrink-0">#{scene.sceneNumber}</span>
                        <span className="truncate">{scene.heading}</span>
                      </div>
                      <span className="text-[10px] opacity-70 font-mono shrink-0">{lines} Replik</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: PRODUCTION CONTROLS & SCRIPT PREVIEW */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Production Options Strip */}
              <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${theme === 'dark' ? 'bg-[#181e28] border-[#252f3d]' : 'bg-[#f4efe6] border-[#ded5c5]'}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="opacity-60" />
                    <input
                      type="text"
                      value={actorName}
                      onChange={(e) => setActorName(e.target.value)}
                      placeholder="Oyuncu Adı (Opsiyonel)"
                      className={`px-2.5 py-1 rounded-lg text-xs border outline-none ${
                        theme === 'dark' ? 'bg-[#10141a] border-slate-700 text-slate-200' : 'bg-white border-[#dcd4c4] text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="opacity-60" />
                    <input
                      type="text"
                      value={shootDay}
                      onChange={(e) => setShootDay(e.target.value)}
                      placeholder="Çekim Günü (Örn: Gün 1)"
                      className={`px-2.5 py-1 rounded-lg text-xs border outline-none ${
                        theme === 'dark' ? 'bg-[#10141a] border-slate-700 text-slate-200' : 'bg-white border-[#dcd4c4] text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Summary Info */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono opacity-80">
                    {selectedCharacter} ({activeStats.sceneCount} Sahne • {activeStats.linesCount} Replik)
                  </span>
                </div>
              </div>

              {/* Live Formatted Script Preview */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-black/10 dark:bg-black/30">
                <div className={`w-full max-w-3xl p-6 sm:p-10 rounded-2xl shadow-xl border ${cardBg} font-mono text-xs sm:text-sm leading-relaxed select-text`}>
                  
                  {/* Sides Cover Sheet Header */}
                  <div className="border border-slate-400 dark:border-slate-600 rounded-xl p-5 mb-8 bg-slate-500/5">
                    <div className="flex justify-between items-start border-b pb-3 mb-3 border-slate-300 dark:border-slate-700">
                      <div>
                        <div className="text-xs font-bold opacity-60 uppercase tracking-widest">OYUNCU SET METNİ • SIDES</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{selectedCharacter}</div>
                        {actorName && <div className="text-xs font-semibold opacity-80 mt-0.5">Oyuncu: {actorName}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{screenplayTitle}</div>
                        <div className="text-xs opacity-70 mt-0.5">{shootDay ? `${shootDay} • ` : ''}{new Date().toLocaleDateString('tr-TR')}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs opacity-80">
                      <div><strong>Sahneler:</strong> {activeScenesToRender.map(s => `#${s.sceneNumber}`).join(', ') || 'Seçilmedi'}</div>
                      <div><strong>Toplam Replik:</strong> {activeStats.linesCount}</div>
                    </div>
                  </div>

                  {/* Render Scenes */}
                  {activeScenesToRender.length === 0 ? (
                    <div className="p-12 text-center opacity-60">
                      Soldaki listeden sahne seçiniz.
                    </div>
                  ) : (
                    activeScenesToRender.map((scene) => {
                      let currentSpeaker = '';
                      return (
                        <div key={scene.sceneId} className="mb-8 pt-4 border-t border-dashed border-slate-300 dark:border-slate-700">
                          {scene.elements.map((el) => {
                            if (el.type === 'scene') {
                              return (
                                <div key={el.id} className="font-bold uppercase my-3 flex items-baseline gap-2">
                                  {el.sceneNumber && <span className="opacity-70">{el.sceneNumber}.</span>}
                                  <span>{el.content}</span>
                                </div>
                              );
                            } else if (el.type === 'action') {
                              return (
                                <div key={el.id} className="my-2 max-w-[560px] opacity-90">
                                  <div dangerouslySetInnerHTML={{ __html: el.content }} />
                                </div>
                              );
                            } else if (el.type === 'character') {
                              const cName = cleanName(el.content);
                              currentSpeaker = cName;
                              const isTarget = cName === selectedCharacter;
                              return (
                                <div 
                                  key={el.id} 
                                  className={`font-bold uppercase mt-4 mb-0.5 text-center ${
                                    isTarget 
                                      ? 'border border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-0.5 px-3 rounded-md w-fit mx-auto' 
                                      : 'w-fit mx-auto opacity-70'
                                  }`}
                                >
                                  {el.content} {isTarget && '★'}
                                </div>
                              );
                            } else if (el.type === 'parenthetical') {
                              return (
                                <div key={el.id} className="text-center italic opacity-75 my-0.5 max-w-[240px] mx-auto">
                                  {el.content}
                                </div>
                              );
                            } else if (el.type === 'dialogue') {
                              const isTarget = currentSpeaker === selectedCharacter;
                              return (
                                <div 
                                  key={el.id} 
                                  className={`max-w-[340px] mx-auto mb-3 px-2 py-0.5 rounded transition-colors ${
                                    isTarget 
                                      ? 'bg-slate-200/70 dark:bg-slate-800/80 border-l-3 border-slate-600 dark:border-slate-400 font-medium text-slate-950 dark:text-slate-100' 
                                      : 'opacity-70'
                                  }`}
                                >
                                  <div dangerouslySetInnerHTML={{ __html: el.content }} />
                                </div>
                              );
                            } else if (el.type === 'transition') {
                              return (
                                <div key={el.id} className="text-right font-bold uppercase opacity-75 my-2">
                                  {el.content}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER & EXPORT BUTTONS */}
          <div className={`px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${theme === 'dark' ? 'border-[#2d3640] bg-[#161c24]' : 'border-[#c8bea8] bg-[#ece4d6]'}`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMD}
                disabled={activeScenesToRender.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${theme === 'dark' ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300' : 'border-[#dfd6c5] bg-white hover:bg-stone-100 text-slate-700'}`}
                title="Markdown Olarak İndir"
              >
                <FileText size={14} />
                <span>Markdown</span>
              </button>
              <button
                type="button"
                onClick={handleExportDOCX}
                disabled={activeScenesToRender.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${theme === 'dark' ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300' : 'border-[#dfd6c5] bg-white hover:bg-stone-100 text-slate-700'}`}
                title="Word (.docx) Olarak İndir"
              >
                <Download size={14} />
                <span>Word (.docx)</span>
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={activeScenesToRender.length === 0}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all border ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700'}`}
                title="Yazdır / PDF Olarak Kaydet"
              >
                <Printer size={14} />
                <span>PDF / Yazdır</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
