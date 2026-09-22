import React from 'react';
import { MapPin, X, Users, Clapperboard, Globe, FileDown, Table as TableIcon } from 'lucide-react';
import { ScreenplayElement } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { printStyledDocument, downloadUtf8File, escapeHtml } from '../lib/exportUtils';
import { FileText } from 'lucide-react';

interface LocationListModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScreenplayElement[];
  theme: 'dark' | 'light';
}

interface LocationInfo {
  name: string;
  scenes: {
    number: number | string;
    title: string;
    characters: string[];
  }[];
  allCharacters: string[];
}

export default function LocationListModal({ isOpen, onClose, elements, theme }: LocationListModalProps) {
  const processLocations = (): LocationInfo[] => {
    const locations: Record<string, LocationInfo> = {};
    let currentSceneTitle = '';
    let currentSceneNumber: number | string = 0;
    let currentCharacters: Set<string> = new Set();
    let currentLocationKey = '';
    let currentLocationDisplayName = '';

    const cleanCharacterName = (name: string) => {
      // Remove text inside parentheses (e.g., "(YANDAN)", "(CONT'D)")
      let cleaned = name.replace(/\(.*\)/g, '').trim().toUpperCase();
      // Remove any trailing symbols
      cleaned = cleaned.replace(/[^\w\sıİğĞüÜşŞöÖçÇ]/gi, '').trim();
      return cleaned;
    };

    const saveCurrentScene = () => {
      if (currentSceneTitle && currentLocationKey) {
        if (!locations[currentLocationKey]) {
          locations[currentLocationKey] = {
            name: currentLocationDisplayName,
            scenes: [],
            allCharacters: []
          };
        }
        
        locations[currentLocationKey].scenes.push({
          number: currentSceneNumber,
          title: currentSceneTitle,
          characters: Array.from(currentCharacters).map(cleanCharacterName).filter(Boolean)
        });
        
        currentCharacters.forEach(char => {
          const cleaned = cleanCharacterName(char);
          if (cleaned && !locations[currentLocationKey].allCharacters.includes(cleaned)) {
            locations[currentLocationKey].allCharacters.push(cleaned);
          }
        });
      }
    };

    elements.forEach((el) => {
      if (el.type === 'scene') {
        saveCurrentScene();

        // Start new scene
        currentSceneTitle = el.content;
        currentSceneNumber = el.sceneNumber || 0;
        currentCharacters = new Set();

        // Extract location name from scene title
        let locRaw = el.content.split('-')[0].trim();
        locRaw = locRaw.replace(/^(İÇ|DIŞ|İÇ\/DIŞ|DAHİLİ|HARİCİ)\.?\s*/i, '').trim();
        locRaw = locRaw.replace(/[.,:;]$/, '').trim();
        
        currentLocationKey = locRaw.toUpperCase().replace(/\s+/g, ' ');
        currentLocationDisplayName = locRaw || 'Bilinmeyen Mekan';
      } else if (el.type === 'character') {
        const charName = el.content.trim();
        if (charName) {
          currentCharacters.add(charName);
        }
      }
    });

    saveCurrentScene();
    return Object.values(locations).sort((a, b) => a.name.localeCompare(b.name));
  };

  const locationData = processLocations();
  const totalLocations = locationData.length;
  const totalUniqueScenes = locationData.reduce((acc, loc) => acc + loc.scenes.length, 0);

  const exportToMD = () => {
    let md = `# MEKAN LİSTESİ VE SAHNE DAĞILIM RAPORU\n\n`;
    md += `* **Toplam Mekan:** ${totalLocations}\n`;
    md += `* **Toplam Sahne:** ${totalUniqueScenes}\n`;
    md += `* **Rapor Tarihi:** ${new Date().toLocaleDateString('tr-TR')}\n\n---\n\n`;

    md += `| Mekan Adı | Sahneler | Karakterler |\n`;
    md += `| :--- | :--- | :--- |\n`;
    locationData.forEach(loc => {
      const scenesStr = loc.scenes.map(s => `#${s.number}`).join(', ') || '-';
      const charsStr = loc.allCharacters.join(', ') || '-';
      md += `| **${loc.name.toUpperCase()}** | ${scenesStr} | ${charsStr} |\n`;
    });

    downloadUtf8File(md, `ScriptHive_Mekan_Listesi.md`, 'text/markdown;charset=utf-8');
  };

  const exportToPDF = () => {
    let bodyHtml = `
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-val">${totalLocations}</div>
          <div class="stat-lbl">Toplam Mekan</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${totalUniqueScenes}</div>
          <div class="stat-lbl">Toplam Sahne</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">Prodüksiyon</div>
          <div class="stat-lbl">Döküm Tipi</div>
        </div>
      </div>

      <div class="section-title">Mekan ve Sahne Kadro Dökümü</div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 30%;">Mekan Adı</th>
            <th style="width: 25%;">Sahneler</th>
            <th style="width: 45%;">Karakterler</th>
          </tr>
        </thead>
        <tbody>
          ${locationData.map(loc => `
            <tr>
              <td style="font-weight: 700; color: #0f172a;">${escapeHtml(loc.name.toUpperCase())}</td>
              <td style="color: #2563eb; font-weight: 600;">${escapeHtml(loc.scenes.map(s => `#${s.number}`).join(', ') || '-')}</td>
              <td style="color: #475569;">${escapeHtml(loc.allCharacters.join(', ') || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    printStyledDocument({
      title: 'Mekan Listesi ve Sahne Dağılım Raporu',
      categoryBadge: 'Prodüksiyon Raporu',
      subtitle: `${totalLocations} Farklı Mekan • ${totalUniqueScenes} Sahne Dökümü`,
      bodyHtml,
      accentColor: '#2563eb'
    });
  };

  const exportToDOCX = async () => {
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
                children: [new TextRun({ text: "MEKAN LİSTESİ VE SAHNE DAĞILIM RAPORU", bold: true, size: 32, font: "Arial" })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 120 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Toplam Mekan: ${totalLocations}  |  Toplam Sahne: ${totalUniqueScenes}  |  Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
                    italics: true,
                    size: 20,
                    color: "64748B",
                    font: "Arial"
                  }),
                ],
                spacing: { after: 300 },
                alignment: AlignmentType.CENTER,
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MEKAN ADI", bold: true, size: 18, font: "Arial" })] })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SAHNELER", bold: true, size: 18, font: "Arial" })] })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "KARAKTERLER", bold: true, size: 18, font: "Arial" })] })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
                    ],
                  }),
                  ...locationData.map(loc => new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: loc.name.toUpperCase(), bold: true, size: 18, font: "Arial" })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: loc.scenes.map(s => `#${s.number}`).join(', ') || '-', size: 18, font: "Arial", color: "1E40AF" })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: loc.allCharacters.join(', ') || '-', size: 18, font: "Arial" })] })] }),
                    ],
                  })),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "ScriptHive_Mekan_Listesi.docx");
    } catch (err: any) {
      console.error(err);
      alert('Word dosyası oluşturulurken hata oluştu: ' + (err.message || String(err)));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col border ${
            theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640]' : 'bg-[#FFFFF0] border-[#c8bea8]'
          }`}
        >
          {/* Header */}
          <div className={`p-6 border-b flex items-center justify-between ${
            theme === 'dark' ? 'border-[#2d3640] bg-[#20272e]' : 'border-[#c8bea8] bg-[#e8e0d5]'
          }`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#6ba3e8] text-slate-950 font-bold rounded-xl shadow-lg shadow-blue-500/20">
                <MapPin size={24} />
              </div>
              <div>
                <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Mekan Raporu</h2>
                <div className={`flex items-center gap-2 mt-0.5 text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">{totalLocations} Mekan</span>
                  <span className="opacity-30">•</span>
                  <span className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">{totalUniqueScenes} Sahne</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={exportToMD}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-sm transition-all ${
                  theme === 'dark' ? 'bg-[#252c33] border border-[#2d3640] text-slate-300 hover:bg-[#2d3640]' : 'bg-[#FFFFF0] border border-[#c8bea8] text-slate-700 hover:bg-[#dfd7ca]'
                }`}
                title="Markdown Olarak İndir"
              >
                <FileText size={16} /> Markdown
              </button>
              <button 
                onClick={exportToDOCX}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-sm transition-all ${
                  theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8] hover:bg-[#6ba3e8] hover:text-slate-950' : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-700 hover:text-white'
                }`}
                title="Word (.docx) Olarak İndir"
              >
                <TableIcon size={16} /> Word (.docx)
              </button>
              <button 
                onClick={exportToPDF}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 hover:bg-[#82b4f0]' : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
                title="Yazdır / PDF Olarak Kaydet"
              >
                <FileDown size={16} /> PDF / Yazdır
              </button>
              <div className={`w-px h-8 mx-2 ${theme === 'dark' ? 'bg-[#2d3640]' : 'bg-[#c8bea8]'}`} />
              <button 
                onClick={onClose}
                className={`p-2.5 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-[#252c33] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {locationData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-slate-500/5 rounded-full flex items-center justify-center mb-6 text-slate-400">
                  <Globe size={40} className="animate-pulse" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Analiz Edilecek Veri Yok</h3>
                <p className={`max-w-md text-sm leading-relaxed opacity-60 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Senaryonuzda sahne başlıkları (İÇ. MEKAN ADI) algılanamadı. Sahneleri yazmaya başladığınızda burada kapsamlı bir prodüksiyon raporu göreceksiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locationData.map((loc, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`group p-6 rounded-2xl border flex flex-col transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'bg-[#252c33] border-[#2d3640] hover:border-[#6ba3e8]/60 shadow-lg' 
                        : 'bg-[#f4efe4] border-[#c8bea8] hover:border-blue-400 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-1 group-hover:translate-x-1 transition-transform">
                          <MapPin size={16} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
                          <h4 className={`text-lg font-black uppercase truncate tracking-tight transition-colors ${theme === 'dark' ? 'text-white group-hover:text-[#6ba3e8]' : 'text-slate-900 group-hover:text-blue-700'}`}>
                            {loc.name}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {loc.scenes.map((s, si) => (
                            <span 
                              key={si} 
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                                theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640] text-slate-300' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-700'
                              }`}
                            >
                              #{s.number}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                        theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-600/15 text-blue-800'
                      }`}>
                        {loc.scenes.length} SAHNE
                      </div>
                    </div>

                    <div className="flex-1 space-y-5">
                      {/* Characters */}
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-[#1a1f25]/60 border border-[#2d3640]' : 'bg-[#FFFFF0] border border-[#c8bea8]'}`}>
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.1em] opacity-50">
                          <Users size={12} /> Karakterler
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {loc.allCharacters.length > 0 ? (
                            loc.allCharacters.map((char, cIdx) => (
                              <span 
                                key={cIdx}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                  theme === 'dark' 
                                    ? 'bg-[#252c33] border-[#2d3640] text-slate-200' 
                                    : 'bg-[#f4efe4] border-[#c8bea8] text-slate-800'
                                }`}
                              >
                                {char}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs italic opacity-40">Sahne karakteri yok</span>
                          )}
                        </div>
                      </div>

                      {/* Scene List Summary */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5 text-[10px] font-black uppercase tracking-[0.1em] opacity-50">
                          <Clapperboard size={12} /> Sahne Başlıkları
                        </div>
                        <div className="space-y-2">
                          {loc.scenes.slice(0, 3).map((scene, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2 text-[11px] opacity-80 group/scene">
                              <span className={`font-mono font-bold shrink-0 ${theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'}`}>#{scene.number}</span>
                              <span className={`truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                {scene.title}
                              </span>
                            </div>
                          ))}
                          {loc.scenes.length > 3 && (
                            <div className="text-[10px] font-bold opacity-50 pl-6">
                              + {loc.scenes.length - 3} SAHNE DAHA...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className={`p-4 flex items-center justify-between border-t px-8 ${
            theme === 'dark' ? 'border-[#2d3640] bg-[#20272e] text-slate-400' : 'border-[#c8bea8] bg-[#e8e0d5] text-slate-600'
          }`}>
             <span className="text-xs font-medium">ScriptHive Mekan Raporlama Modülü</span>
             <span className="text-xs font-mono opacity-60 uppercase tracking-widest">{new Date().toLocaleTimeString()}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
