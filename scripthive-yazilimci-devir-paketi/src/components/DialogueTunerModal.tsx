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

  const bgModal = theme === 'dark' ? 'bg-[#1e242b] text-slate-100 border-[#2d3640]/70' : 'bg-[#fcfbf8] text-slate-800 border-[#c8bea8]/70';
  const sidebarBg = theme === 'dark' ? 'bg-[#15191f] border-[#2d3640]/70' : 'bg-[#f4eee4] border-[#c8bea8]/70';
  const cardBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640]/70' : 'bg-white border-[#c8bea8]/60';
  const selectedCharStats = characterStats.find(c => c.displayName === selectedCharacter);

  const filteredCharStats = characterStats.filter(c => 
    c.displayName.toLowerCase().includes(charSearchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.15 }}
          className={`w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${bgModal}`}
        >
          {/* TOP HEADER */}
          <div className={`px-6 py-3.5 border-b flex items-center justify-between ${theme === 'dark' ? 'border-[#2d3640]/70 bg-[#15191f]' : 'border-[#c8bea8]/70 bg-[#e8e0d5]'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-600/15 text-blue-700'}`}>
                <Mic2 size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight">Diyalog Ayarlayıcı (Karakter Sesi İzolasyonu)</h2>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>
                    Dialogue Tuner
                  </span>
                </div>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Karakterin jargonunu ve konuşma tutarlılığını tek seferde inceleyin ve düzenleyin.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#20272e] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* MAIN CONTENT SPLIT */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT: CHARACTER SELECTOR SIDEBAR */}
            <div className={`w-64 sm:w-72 border-r flex flex-col ${sidebarBg}`}>
              <div className="p-3 border-b border-inherit">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
                  <input
                    type="text"
                    placeholder="Karakter ara..."
                    value={charSearchQuery}
                    onChange={(e) => setCharSearchQuery(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#15191f] border-[#2d3640] text-slate-200 focus:border-[#6ba3e8]' 
                        : 'bg-white border-[#c8bea8] text-slate-800 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
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
                        className={`w-full px-3 py-2 rounded-lg text-left transition-all border flex items-center justify-between ${
                          isSelected
                            ? theme === 'dark' 
                              ? 'bg-[#20272e] text-[#6ba3e8] border-[#6ba3e8]/50 font-bold shadow-xs' 
                              : 'bg-[#e8e0d5] text-slate-950 border-blue-600 font-bold shadow-xs'
                            : theme === 'dark'
                            ? 'bg-transparent text-slate-300 border-transparent hover:bg-[#20272e]'
                            : 'bg-transparent text-slate-800 border-transparent hover:bg-[#ede5d6]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isSelected ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-700 text-white') : 'bg-slate-500/10'
                          }`}>
                            {char.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs truncate">{char.displayName}</div>
                            <div className={`text-[10px] opacity-60 flex items-center gap-1.5`}>
                              <span>{char.lines} replik</span>
                              <span>•</span>
                              <span>{char.words} kelime</span>
                            </div>
                          </div>
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
                <div className={`px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 ${theme === 'dark' ? 'bg-[#15191f] border-[#2d3640]/70' : 'bg-[#f4efe6] border-[#c8bea8]/70'}`}>
                  <div className="flex items-center gap-3">
                    <h3 className={`text-sm font-bold tracking-tight flex items-center gap-2 ${theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'}`}>
                      {selectedCharacter}
                      <span className={`text-[11px] font-normal px-2 py-0.2 rounded-md ${theme === 'dark' ? 'bg-[#20272e] text-slate-300' : 'bg-blue-50 text-blue-800 border border-blue-200/50'}`}>
                        {isolatedDialogues.length} Replik
                      </span>
                    </h3>
                    {selectedCharStats && (
                      <span className="text-[11px] opacity-60 font-mono hidden sm:inline">
                        ~{selectedCharStats.estMinutes > 0 ? `${selectedCharStats.estMinutes} dk ` : ''}{selectedCharStats.estSeconds} sn • {selectedCharStats.words} kelime
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search inside dialogues */}
                    <div className="relative w-36 sm:w-48">
                      <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-40" />
                      <input
                        type="text"
                        placeholder="Repliklerde ara..."
                        value={dialogueSearchQuery}
                        onChange={(e) => setDialogueSearchQuery(e.target.value)}
                        className={`w-full pl-7 pr-2 py-1 text-xs rounded-lg border outline-none ${
                          theme === 'dark' 
                            ? 'bg-[#20272e] border-[#2d3640] text-slate-200 focus:border-[#6ba3e8]' 
                            : 'bg-white border-[#c8bea8] text-slate-800 focus:border-blue-600'
                        }`}
                      />
                    </div>

                    {/* Toggle Context */}
                    <button
                      onClick={() => setShowContext(!showContext)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        showContext
                          ? (theme === 'dark' ? 'bg-[#6ba3e8]/15 border-[#6ba3e8]/30 text-[#6ba3e8]' : 'bg-blue-50 border-blue-300 text-blue-700')
                          : theme === 'dark'
                          ? 'bg-[#20272e] border-[#2d3640] text-slate-400'
                          : 'bg-white border-[#c8bea8] text-slate-600'
                      }`}
                      title="Önceki replik bağlamını göster/gizle"
                    >
                      {showContext ? <Eye size={13} /> : <EyeOff size={13} />}
                      <span className="text-[11px]">Bağlam</span>
                    </button>

                    {/* Sides Export Options */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleExportSidesMD}
                        className={`p-1 rounded-lg text-xs border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e]' : 'border-[#c8bea8] hover:bg-white'} transition-colors`}
                        title="Markdown Olarak İndir"
                      >
                        <FileText size={13} />
                      </button>
                      <button
                        onClick={handleExportSidesDOCX}
                        className={`p-1 rounded-lg text-xs border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e]' : 'border-[#c8bea8] hover:bg-white'} transition-colors`}
                        title="Word (.docx) Olarak İndir"
                      >
                        <TableIcon size={13} />
                      </button>
                      <button
                        onClick={handleExportSidesPDF}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 hover:bg-[#82b4f0] font-bold' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                        title="Sides PDF Yazdır"
                      >
                        <Download size={12} />
                        <span className="text-[11px]">Sides (PDF)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DIALOGUE LIST */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                {isolatedDialogues.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                    <MessageSquare size={36} className="mb-2.5 text-slate-400" />
                    <p className="text-xs font-semibold">Bu karaktere ait diyalog bulunamadı.</p>
                  </div>
                ) : (
                  isolatedDialogues.map((item, idx) => (
                    <div
                      key={item.dialogueElement.id}
                      className={`p-3.5 rounded-xl border transition-all ${cardBg} shadow-xs group`}
                    >
                      {/* CARD HEADER: SCENE INFO & JUMP TO SCRIPT */}
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-inherit/40 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-500 text-[10px]">
                            #{item.sceneNumber}
                          </span>
                          <span className="font-semibold truncate text-[11px]">
                            {item.sceneHeading}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            onJumpToElement(item.dialogueElement.id);
                            onClose();
                          }}
                          className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded transition-all opacity-70 group-hover:opacity-100 ${
                            theme === 'dark'
                              ? 'text-sky-400 hover:bg-sky-500/10'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Senaryoda bu sahneye git"
                        >
                          <span>Senaryoda Git</span>
                          <ExternalLink size={11} />
                        </button>
                      </div>

                      {/* CONTEXT SNIPPET (PREVIOUS SPEAKER) */}
                      {showContext && item.previousCue && (
                        <div className="mb-2 pl-2.5 border-l-2 border-amber-500/60 text-[11px] opacity-75">
                          <span className="font-bold text-[10px] uppercase text-amber-500 mr-1.5">
                            {item.previousCue.character}:
                          </span>
                          <span className="italic">
                            "{item.previousCue.dialogue}"
                          </span>
                        </div>
                      )}

                      {/* PARENTHETICAL IF PRESENT */}
                      {item.parenthetical && (
                        <div className="text-[11px] italic opacity-60 mb-1 pl-1 font-mono">
                          {item.parenthetical.content}
                        </div>
                      )}

                      {/* LIVE EDITABLE DIALOGUE TEXTAREA (SEAMLESS BORDERLESS) */}
                      <div className="relative">
                        <textarea
                          value={item.dialogueElement.content}
                          onChange={(e) => onChangeElement(item.dialogueElement.id, e.target.value)}
                          rows={Math.max(2, Math.ceil(item.dialogueElement.content.length / 75))}
                          className="w-full p-1 text-xs sm:text-sm font-mono outline-none resize-y transition-colors leading-relaxed bg-transparent border-0"
                          placeholder="Diyalog metnini düzenleyin..."
                        />
                        <div className="flex items-center justify-between text-[9px] opacity-40 mt-0.5 px-1 font-mono">
                          <span>Replik #{idx + 1} / {isolatedDialogues.length}</span>
                          <span>Otomatik kaydedilir</span>
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
