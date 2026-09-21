import React, { useState, useMemo } from 'react';
import { 
  Mic2, X, Search, Volume2, Clock, MessageSquare, 
  ExternalLink, Eye, EyeOff, Download, FileText, CheckCircle2, ChevronRight, User
} from 'lucide-react';
import { ScreenplayElement } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Table as TableIcon } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { printStyledDocument, downloadUtf8File, escapeHtml } from '../lib/exportUtils';

interface DialogueTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScreenplayElement[];
  onChangeElement: (id: string, newContent: string) => void;
  onJumpToElement: (id: string) => void;
  theme: 'dark' | 'light';
}

interface CharacterDialogueEntry {
  dialogueElement: ScreenplayElement;
  characterElement: ScreenplayElement;
  parenthetical?: ScreenplayElement;
  previousCue?: { character: string; dialogue: string };
  sceneHeading: string;
  sceneNumber: number | string;
}

export default function DialogueTunerModal({
  isOpen,
  onClose,
  elements,
  onChangeElement,
  onJumpToElement,
  theme
}: DialogueTunerModalProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [charSearchQuery, setCharSearchQuery] = useState('');
  const [dialogueSearchQuery, setDialogueSearchQuery] = useState('');
  const [showContext, setShowContext] = useState(true);

  // Clean character name helper
  const cleanCharName = (name: string) => {
    return name
      .replace(/\(.*\)/g, '')
      .trim()
      .toLocaleUpperCase('tr-TR');
  };

  // Aggregate characters and calculate stats
  const characterStats = useMemo(() => {
    const map: Record<string, { lines: number; words: number; displayName: string }> = {};
    let totalLines = 0;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (el.type === 'character') {
        const rawName = el.content.trim();
        const cleaned = cleanCharName(rawName);
        if (!cleaned) continue;

        if (!map[cleaned]) {
          map[cleaned] = { lines: 0, words: 0, displayName: cleaned };
        }

        // Check subsequent elements for dialogue words
        let j = i + 1;
        while (j < elements.length && (elements[j].type === 'parenthetical' || elements[j].type === 'dialogue')) {
          if (elements[j].type === 'dialogue') {
            map[cleaned].lines += 1;
            totalLines += 1;
            const words = elements[j].content.trim().split(/\s+/).filter(Boolean).length;
            map[cleaned].words += words;
          }
          j++;
        }
      }
    }

    const list = Object.values(map).map(c => ({
      ...c,
      percentage: totalLines > 0 ? Math.round((c.lines / totalLines) * 100) : 0,
      // Average spoken speech ~ 130 words per minute
      estMinutes: Math.floor(c.words / 130),
      estSeconds: Math.round(((c.words % 130) / 130) * 60)
    }));

    list.sort((a, b) => b.lines - a.lines);
    return list;
  }, [elements]);

  // Set default selected character
  React.useEffect(() => {
    if (!selectedCharacter && characterStats.length > 0) {
      setSelectedCharacter(characterStats[0].displayName);
    } else if (selectedCharacter && !characterStats.some(c => c.displayName === selectedCharacter)) {
      if (characterStats.length > 0) {
        setSelectedCharacter(characterStats[0].displayName);
      }
    }
  }, [characterStats, selectedCharacter]);

  // Extract all dialogue entries for the currently selected character
  const isolatedDialogues = useMemo(() => {
    if (!selectedCharacter) return [];

    const entries: CharacterDialogueEntry[] = [];
    let currentSceneTitle = 'GİRİŞ SAHNESİ';
    let currentSceneNum: number | string = 1;
    let lastSpokenChar = '';
    let lastSpokenDialogue = '';

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (el.type === 'scene') {
        currentSceneTitle = el.content;
        currentSceneNum = el.sceneNumber !== undefined ? el.sceneNumber : (typeof currentSceneNum === 'number' ? currentSceneNum + 1 : currentSceneNum);
        lastSpokenChar = '';
        lastSpokenDialogue = '';
      } else if (el.type === 'character') {
        const rawName = el.content.trim();
        const cleaned = cleanCharName(rawName);

        let parentheticalEl: ScreenplayElement | undefined;
        let dialogueEl: ScreenplayElement | undefined;

        let j = i + 1;
        while (j < elements.length && (elements[j].type === 'parenthetical' || elements[j].type === 'dialogue')) {
          if (elements[j].type === 'parenthetical') {
            parentheticalEl = elements[j];
          } else if (elements[j].type === 'dialogue') {
            dialogueEl = elements[j];
            break;
          }
          j++;
        }

        if (cleaned === selectedCharacter && dialogueEl) {
          entries.push({
            dialogueElement: dialogueEl,
            characterElement: el,
            parenthetical: parentheticalEl,
            previousCue: lastSpokenChar ? { character: lastSpokenChar, dialogue: lastSpokenDialogue } : undefined,
            sceneHeading: currentSceneTitle,
            sceneNumber: currentSceneNum
          });
        }

        if (dialogueEl) {
          lastSpokenChar = cleaned;
          lastSpokenDialogue = dialogueEl.content;
        }
      }
    }

    if (!dialogueSearchQuery.trim()) return entries;
    const query = dialogueSearchQuery.toLowerCase();
    return entries.filter(e => 
      e.dialogueElement.content.toLowerCase().includes(query) ||
      e.sceneHeading.toLowerCase().includes(query)
    );
  }, [elements, selectedCharacter, dialogueSearchQuery]);

  // Export sides / isolated dialogue
  const handleExportSidesPDF = () => {
    if (!selectedCharacter || isolatedDialogues.length === 0) return;

    let bodyHtml = `
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-val">${selectedCharacter}</div>
          <div class="stat-lbl">Karakter Adı</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${isolatedDialogues.length}</div>
          <div class="stat-lbl">Toplam Replik</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">Rol Kağıdı</div>
          <div class="stat-lbl">Sides Formatı</div>
        </div>
      </div>

      <div class="section-title">Karakter Replikleri ve Sahne Akışı</div>
    `;

    isolatedDialogues.forEach(item => {
      bodyHtml += `
        <div class="card">
          <div class="card-header">
            <div class="card-title">SAHNE ${item.sceneNumber}: ${escapeHtml(item.sceneHeading)}</div>
            <div class="card-badge">Sahne ${item.sceneNumber}</div>
          </div>
          <div style="padding: 6px 0;">
            ${item.parenthetical ? `<div style="font-style: italic; color: #64748b; font-size: 9pt; margin-bottom: 4px; font-family: 'Courier Prime', monospace;">${escapeHtml(item.parenthetical.content)}</div>` : ''}
            <div style="font-family: 'Courier Prime', Courier, monospace; font-size: 10.5pt; line-height: 1.5; color: #0f172a; font-weight: 500;">
              ${escapeHtml(item.dialogueElement.content)}
            </div>
          </div>
        </div>
      `;
    });

    printStyledDocument({
      title: `${selectedCharacter} - Rol Kağıdı (Sides)`,
      categoryBadge: 'Oyuncu Rol Kağıdı',
      subtitle: `${isolatedDialogues.length} Replik • ScriptHive Dialogue Tuner`,
      bodyHtml,
      accentColor: '#2563eb'
    });
  };

  const handleExportSidesDOCX = async () => {
    if (!selectedCharacter || isolatedDialogues.length === 0) return;

    try {
      const docChildren: any[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: `${selectedCharacter} - ROL KAĞIDI (SIDES)`,
              bold: true,
              size: 32,
              font: "Courier Prime"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Toplam Replik: ${isolatedDialogues.length}  |  Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
              italics: true,
              size: 20,
              color: "64748B",
              font: "Courier Prime"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      ];

      isolatedDialogues.forEach(item => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `SAHNE ${item.sceneNumber}: ${item.sceneHeading.toUpperCase()}`,
                bold: true,
                size: 22,
                font: "Courier Prime",
                color: "1E40AF"
              })
            ],
            spacing: { before: 200, after: 80 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: selectedCharacter,
                bold: true,
                size: 22,
                font: "Courier Prime"
              })
            ],
            indent: { left: 2.2 * 1440 },
            spacing: { after: 40 }
          })
        );

        if (item.parenthetical) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: item.parenthetical.content,
                  italics: true,
                  size: 22,
                  font: "Courier Prime"
                })
              ],
              indent: { left: 2.0 * 1440 },
              spacing: { after: 40 }
            })
          );
        }

        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: item.dialogueElement.content,
                size: 22,
                font: "Courier Prime"
              })
            ],
            indent: { left: 1.5 * 1440, right: 1.5 * 1440 },
            spacing: { after: 180 }
          })
        );
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
          },
          children: docChildren
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${selectedCharacter}_Sides.docx`);
    } catch (err: any) {
      console.error(err);
      alert('Word dosyası oluşturulurken hata oluştu: ' + (err.message || String(err)));
    }
  };

  const handleExportSidesMD = () => {
    if (!selectedCharacter || isolatedDialogues.length === 0) return;
    let md = `# ${selectedCharacter} - Rol Kağıdı (Sides)\n\n`;
    md += `* **Karakter:** ${selectedCharacter}\n`;
    md += `* **Toplam Replik Sayısı:** ${isolatedDialogues.length}\n`;
    md += `* **Oluşturulma Tarihi:** ${new Date().toLocaleDateString('tr-TR')}\n\n---\n\n`;

    isolatedDialogues.forEach(item => {
      md += `### SAHNE ${item.sceneNumber}: ${item.sceneHeading}\n\n`;
      if (item.parenthetical) {
        md += `*${item.parenthetical.content}*\n\n`;
      }
      md += `**${selectedCharacter}:** ${item.dialogueElement.content}\n\n---\n\n`;
    });

    downloadUtf8File(md, `${selectedCharacter}_Sides.md`, 'text/markdown;charset=utf-8');
  };

  if (!isOpen) return null;

  const bgModal = theme === 'dark' ? 'bg-[#181c24] text-slate-100 border-[#2a3441]' : 'bg-[#FFFFF0] text-slate-800 border-[#c8bea8]';
  const sidebarBg = theme === 'dark' ? 'bg-[#12161c] border-[#222a35]' : 'bg-[#f4eee1] border-[#dfd6c5]';
  const cardBg = theme === 'dark' ? 'bg-[#202732] border-[#2d3847] hover:border-blue-500/50' : 'bg-white border-[#e0d6c3] hover:border-blue-400';
  const selectedCharStats = characterStats.find(c => c.displayName === selectedCharacter);

  const filteredCharStats = characterStats.filter(c => 
    c.displayName.toLowerCase().includes(charSearchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${bgModal}`}
        >
          {/* TOP HEADER */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-800 bg-[#141820]' : 'border-[#dfd6c5] bg-[#ece4d6]'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-600/15 text-blue-700'}`}>
                <Mic2 size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">Dialogue Tuner (Karakter Sesi İzolasyonu)</h2>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>
                    Sektör Standardı
                  </span>
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Karakterin jargonunu, ritmini ve konuşma tutarlılığını tek seferde baştan sona inceleyin ve düzenleyin.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-black'}`}
                title="Kapat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* MAIN CONTENT SPLIT */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT: CHARACTER SELECTOR SIDEBAR */}
            <div className={`w-72 sm:w-80 border-r flex flex-col ${sidebarBg}`}>
              <div className="p-3 border-b border-inherit">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                  <input
                    type="text"
                    placeholder="Karakter ara..."
                    value={charSearchQuery}
                    onChange={(e) => setCharSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#1b212b] border-[#2c3746] text-slate-200 focus:border-blue-500' 
                        : 'bg-white border-[#d8cdba] text-slate-800 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                {filteredCharStats.length === 0 ? (
                  <div className="p-6 text-center text-xs opacity-50">
                    Karakter bulunamadı.
                  </div>
                ) : (
                  filteredCharStats.map((char) => {
                    const isSelected = selectedCharacter === char.displayName;
                    return (
                      <button
                        key={char.displayName}
                        onClick={() => setSelectedCharacter(char.displayName)}
                        className={`w-full p-3 rounded-xl text-left transition-all border flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-[0.99]'
                            : theme === 'dark'
                            ? 'bg-[#181e28]/70 text-slate-300 border-transparent hover:bg-[#202735] hover:border-slate-700'
                            : 'bg-white/80 text-slate-800 border-transparent hover:bg-white hover:border-[#cfc4b0]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {char.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs truncate">{char.displayName}</div>
                            <div className={`text-[11px] opacity-75 flex items-center gap-2`}>
                              <span>{char.lines} replik</span>
                              <span>•</span>
                              <span>{char.words} kelime</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white/20' : 'bg-slate-500/10'
                          }`}>
                            %{char.percentage}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: ISOLATED DIALOGUES VIEW */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* SUB HEADER: SELECTED CHARACTER METRICS & TOOLS */}
              {selectedCharacter && (
                <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${theme === 'dark' ? 'bg-[#161b23] border-[#222a35]' : 'bg-[#faf6ed] border-[#dfd6c5]'}`}>
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className={`text-base font-bold tracking-tight flex items-center gap-2 ${theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'}`}>
                        {selectedCharacter}
                        <span className={`text-xs font-normal px-2 py-0.5 rounded-md ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-blue-50 text-blue-800 border border-blue-200/50'}`}>
                          {isolatedDialogues.length} Replik Bulundu
                        </span>
                      </h3>
                      {selectedCharStats && (
                        <div className="flex items-center gap-3 text-xs opacity-70 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Tahmini Konuşma Süresi: ~{selectedCharStats.estMinutes > 0 ? `${selectedCharStats.estMinutes} dk ` : ''}{selectedCharStats.estSeconds} sn
                          </span>
                          <span>•</span>
                          <span>{selectedCharStats.words} Toplam Kelime</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search inside dialogues */}
                    <div className="relative w-44 sm:w-56">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
                      <input
                        type="text"
                        placeholder="Repliklerde ara..."
                        value={dialogueSearchQuery}
                        onChange={(e) => setDialogueSearchQuery(e.target.value)}
                        className={`w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border outline-none ${
                          theme === 'dark' 
                            ? 'bg-[#1f2631] border-[#2e3b4b] text-slate-200 focus:border-[#6ba3e8]' 
                            : 'bg-white border-[#d8cdba] text-slate-800 focus:border-blue-600'
                        }`}
                      />
                    </div>

                    {/* Toggle Context */}
                    <button
                      onClick={() => setShowContext(!showContext)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        showContext
                          ? (theme === 'dark' ? 'bg-[#6ba3e8]/15 border-[#6ba3e8]/30 text-[#6ba3e8]' : 'bg-blue-50 border-blue-300 text-blue-700')
                          : theme === 'dark'
                          ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                          : 'bg-stone-200/60 border-stone-300 text-stone-600'
                      }`}
                      title="Önceki replik ve parantez içi bağlamını göster/gizle"
                    >
                      {showContext ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>Bağlam</span>
                    </button>

                    {/* Sides Export Options */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleExportSidesMD}
                        className={`p-1.5 rounded-lg text-xs border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-stone-300 hover:bg-stone-200'} transition-colors`}
                        title="Markdown Olarak İndir"
                      >
                        <FileText size={14} />
                      </button>
                      <button
                        onClick={handleExportSidesDOCX}
                        className={`p-1.5 rounded-lg text-xs border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-[#6ba3e8]' : 'border-stone-300 hover:bg-stone-200 text-blue-700'} transition-colors`}
                        title="Word (.docx) Olarak İndir"
                      >
                        <TableIcon size={14} />
                      </button>
                      <button
                        onClick={handleExportSidesPDF}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 hover:bg-[#82b4f0] font-bold' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                        title="Bu karaktere özel Rol Kağıdı (Sides) PDF / Yazdır"
                      >
                        <Download size={13} />
                        <span>Sides (PDF)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DIALOGUE LIST */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                {isolatedDialogues.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                    <MessageSquare size={40} className="mb-3 text-slate-400 animate-bounce" />
                    <p className="text-sm font-semibold">Bu karaktere ait diyalog bulunamadı.</p>
                    <p className="text-xs max-w-sm mt-1">Lütfen sol listeden başka bir karakter seçin veya arama filtrenizi temizleyin.</p>
                  </div>
                ) : (
                  isolatedDialogues.map((item, idx) => (
                    <div
                      key={item.dialogueElement.id}
                      className={`p-4 rounded-xl border transition-all ${cardBg} shadow-sm group`}
                    >
                      {/* CARD HEADER: SCENE INFO & JUMP TO SCRIPT */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit/40 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-500 text-[11px]">
                            SAHNE #{item.sceneNumber}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.sceneHeading}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            onJumpToElement(item.dialogueElement.id);
                            onClose();
                          }}
                          className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-all opacity-80 group-hover:opacity-100 ${
                            theme === 'dark'
                              ? 'text-sky-400 hover:bg-sky-500/10'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Senaryoda bu sahneye git"
                        >
                          <span>Senaryoda Git</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>

                      {/* CONTEXT SNIPPET (PREVIOUS SPEAKER) */}
                      {showContext && item.previousCue && (
                        <div className={`mb-3 p-2.5 rounded-lg text-xs border-l-2 border-amber-500 ${
                          theme === 'dark' ? 'bg-[#151922] text-slate-400' : 'bg-amber-50/70 text-slate-600'
                        }`}>
                          <div className="font-bold text-[10px] uppercase text-amber-500 tracking-wider">
                            ÖNCEKİ: {item.previousCue.character}
                          </div>
                          <div className="italic mt-0.5 line-clamp-2">
                            "{item.previousCue.dialogue}"
                          </div>
                        </div>
                      )}

                      {/* PARENTHETICAL IF PRESENT */}
                      {item.parenthetical && (
                        <div className="text-xs italic text-slate-500 dark:text-slate-400 mb-1.5 pl-2">
                          {item.parenthetical.content}
                        </div>
                      )}

                      {/* LIVE EDITABLE DIALOGUE TEXTAREA */}
                      <div className="relative">
                        <textarea
                          value={item.dialogueElement.content}
                          onChange={(e) => onChangeElement(item.dialogueElement.id, e.target.value)}
                          rows={Math.max(2, Math.ceil(item.dialogueElement.content.length / 70))}
                          className={`w-full p-2.5 text-sm font-mono rounded-lg border outline-none resize-y transition-colors leading-relaxed ${
                            theme === 'dark'
                              ? 'bg-[#171b23] border-[#2a3443] text-slate-100 focus:border-blue-500 focus:bg-[#1a202a]'
                              : 'bg-[#fffef7] border-[#d9cebc] text-slate-900 focus:border-blue-500'
                          }`}
                          placeholder="Diyalog metnini düzenleyin..."
                        />
                        <div className="flex items-center justify-between text-[10px] opacity-40 mt-1 px-1 font-mono">
                          <span>Replik #{idx + 1} / {isolatedDialogues.length}</span>
                          <span>Değişiklikler anında senaryoya kaydedilir</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
