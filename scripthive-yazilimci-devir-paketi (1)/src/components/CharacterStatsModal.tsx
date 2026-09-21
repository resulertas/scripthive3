import React, { useMemo } from 'react';
import { X, Download, BarChart2, FileText, Table as TableIcon } from 'lucide-react';
import { ScreenplayElement } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, AlignmentType, WidthType, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { printStyledDocument, downloadUtf8File, escapeHtml } from '../lib/exportUtils';

interface CharacterStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScreenplayElement[];
  theme: 'dark' | 'light';
  projectName: string;
}

interface Stat {
  name: string;
  wordCount: number;
  sceneCount: number;
  estimatedTimeMin: number;
  percentage: number;
}

export default function CharacterStatsModal({ isOpen, onClose, elements, theme, projectName }: CharacterStatsModalProps) {
  
  const { stats, totalWords, totalScenes } = useMemo(() => {
    const charMap = new Map<string, { wordCount: number, scenes: Set<number> }>();
    
    let currentSceneIndex = 0;
    let currentCharacter = '';
    let runningTotalWords = 0;
    const allSceneNumbers = new Set<number>();
    
    // First pass: Find characters and their dialogue words
    elements.forEach((el) => {
      if (el.type === 'scene') {
        currentSceneIndex++;
        allSceneNumbers.add(currentSceneIndex);
        currentCharacter = '';
        return;
      }
      
      if (el.type === 'character') {
        currentCharacter = el.content.replace(/<[^>]*>?/gm, '').replace(/\([^)]*\)/g, '').trim().toLocaleUpperCase('tr-TR');
        if (!currentCharacter) return;
        
        if (!charMap.has(currentCharacter)) {
          charMap.set(currentCharacter, { wordCount: 0, scenes: new Set() });
        }
        charMap.get(currentCharacter)!.scenes.add(currentSceneIndex);
      } else if (el.type === 'dialogue') {
        if (currentCharacter) {
          const plainText = el.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');
          const words = plainText.split(/\s+/).filter(Boolean).length;
          runningTotalWords += words;
          const entry = charMap.get(currentCharacter);
          if (entry) {
             entry.wordCount += words;
             entry.scenes.add(currentSceneIndex);
          }
        }
      } else if (el.type === 'action' || el.type === 'transition') {
         currentCharacter = '';
      }
    });

    // Second pass: Find occurrences in actions
    const speakerNames = Array.from(charMap.keys()).filter(k => k.length > 2);
    
    currentSceneIndex = 0;
    elements.forEach(el => {
      if (el.type === 'scene') currentSceneIndex++;
      if (el.type === 'action') {
        const plainText = el.content.replace(/<[^>]*>?/gm, '').toLocaleUpperCase('tr-TR');
        speakerNames.forEach(name => {
          const regex = new RegExp(`\\b${name}\\b`);
          if (regex.test(plainText)) {
            charMap.get(name)!.scenes.add(currentSceneIndex);
          }
        });
      }
    });

    const safeTotalWords = Math.max(1, runningTotalWords);

    const rawStats: Stat[] = Array.from(charMap.entries()).map(([name, data]) => {
      const pct = parseFloat(((data.wordCount / safeTotalWords) * 100).toFixed(1));
      return {
        name,
        wordCount: data.wordCount,
        sceneCount: data.scenes.size,
        estimatedTimeMin: parseFloat((data.wordCount / 130).toFixed(1)),
        percentage: pct
      };
    });

    return {
      stats: rawStats.sort((a, b) => b.wordCount - a.wordCount).filter(s => s.wordCount > 0),
      totalWords: runningTotalWords,
      totalScenes: allSceneNumbers.size || currentSceneIndex
    };
  }, [elements]);

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] text-slate-100 border-[#2d3640]' : 'bg-[#FFFFF0] text-slate-900 border-[#c8bea8]';
  const overlayBg = 'bg-black/60 backdrop-blur-sm';
  const headerBorder = theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]';
  const headerBg = theme === 'dark' ? 'bg-[#20272e]' : 'bg-[#e8e0d5]';
  const chartColor = theme === 'dark' ? '#6ba3e8' : '#2563eb';

  const saveJSON = () => {
    const dataStr = JSON.stringify({ projectName, totalWords, totalScenes, stats }, null, 2);
    downloadUtf8File(dataStr, `${projectName.replace(/\s+/g, '_')}_Karakter_Ist.json`, 'application/json;charset=utf-8');
  };

  const saveMarkdown = () => {
    let md = `# KARAKTER İSTATİSTİK RAPORU: ${projectName}\n\n`;
    md += `* **Toplam Karakter Sayısı:** ${stats.length}\n`;
    md += `* **Toplam Diyalog Kelimesi:** ${totalWords}\n`;
    md += `* **Toplam Sahne Sayısı:** ${totalScenes}\n`;
    md += `* **Tahmini Toplam Konuşma Süresi:** ~${(totalWords / 130).toFixed(1)} Dakika\n`;
    md += `* **Rapor Tarihi:** ${new Date().toLocaleDateString('tr-TR')}\n\n---\n\n`;

    md += `| Karakter | Kelime Sayısı | Diyalog Payı (%) | Sahne Sayısı | Tahmini Konuşma (Dk) |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: |\n`;
    stats.forEach(s => {
      md += `| **${s.name}** | ${s.wordCount} | %${s.percentage} | ${s.sceneCount} | ~${s.estimatedTimeMin} dk |\n`;
    });

    downloadUtf8File(md, `${projectName.replace(/\s+/g, '_')}_Karakter_Ist.md`, 'text/markdown;charset=utf-8');
  };

  const saveDOCX = async () => {
    try {
      const docChildren: any[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: `KARAKTER İSTATİSTİK RAPORU: ${projectName}`,
              bold: true,
              size: 32,
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Toplam Karakter: ${stats.length}  |  Toplam Kelime: ${totalWords}  |  Toplam Sahne: ${totalScenes}  |  Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
              italics: true,
              size: 20,
              color: "64748B",
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "KARAKTER", bold: true, size: 18, font: "Arial" })] })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "KELİME", bold: true, size: 18, font: "Arial" })], alignment: AlignmentType.CENTER })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PAY (%)", bold: true, size: 18, font: "Arial" })], alignment: AlignmentType.CENTER })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SAHNE", bold: true, size: 18, font: "Arial" })], alignment: AlignmentType.CENTER })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SÜRE (DK)", bold: true, size: 18, font: "Arial" })], alignment: AlignmentType.CENTER })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
              ]
            }),
            ...stats.map(s => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.name, bold: true, size: 18, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.wordCount.toString(), size: 18, font: "Arial" })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `%${s.percentage}`, size: 18, font: "Arial" })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.sceneCount.toString(), size: 18, font: "Arial" })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `~${s.estimatedTimeMin}`, size: 18, font: "Arial" })], alignment: AlignmentType.CENTER })] }),
              ]
            }))
          ]
        })
      ];

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
      saveAs(blob, `${projectName.replace(/\s+/g, '_')}_Karakter_Ist.docx`);
    } catch (err: any) {
      console.error(err);
      alert('Word dosyası oluşturulurken hata oluştu: ' + (err.message || String(err)));
    }
  };

  const savePDF = () => {
    let bodyHtml = `
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-val">${stats.length}</div>
          <div class="stat-lbl">Toplam Karakter</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${totalWords}</div>
          <div class="stat-lbl">Diyalog Kelimesi</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${totalScenes}</div>
          <div class="stat-lbl">Toplam Sahne</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">~${(totalWords / 130).toFixed(1)} dk</div>
          <div class="stat-lbl">Tahmini Konuşma</div>
        </div>
      </div>

      <div class="section-title">Karakter Diyalog Dağılımı ve Sahne Katılımı</div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Karakter Adı</th>
            <th style="text-align: center;">Kelime Sayısı</th>
            <th style="text-align: center;">Diyalog Payı</th>
            <th style="text-align: center;">Sahne Sayısı</th>
            <th style="text-align: center;">Tahmini Süre</th>
          </tr>
        </thead>
        <tbody>
          ${stats.map(s => `
            <tr>
              <td style="font-weight: 700; color: #0f172a;">${escapeHtml(s.name)}</td>
              <td style="text-align: center; font-weight: 600; color: #2563eb;">${s.wordCount}</td>
              <td style="text-align: center;">
                <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: rgba(37,99,235,0.08); color: #2563eb; font-weight: 600; font-size: 8pt;">
                  %${s.percentage}
                </span>
              </td>
              <td style="text-align: center; color: #475569;">${s.sceneCount}</td>
              <td style="text-align: center; color: #475569;">~${s.estimatedTimeMin} dk</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p style="font-size: 8pt; color: #64748b; margin-top: 14px; font-style: italic;">
        * Ortalama konuşma hızı dakikada 130 kelime (endüstri standardı) baz alınarak hesaplanmıştır.
      </p>
    `;

    printStyledDocument({
      title: `Karakter İstatistik Raporu: ${projectName}`,
      categoryBadge: 'Senaryo Analizi',
      subtitle: `${stats.length} Karakter • ${totalWords} Kelime • ${totalScenes} Sahne`,
      bodyHtml,
      accentColor: '#2563eb'
    });
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${overlayBg} p-4 md:p-8`}>
      <div className={`w-full max-w-5xl h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${bgClass}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBorder} ${headerBg}`}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart2 size={20} className="opacity-80" />
            Karakter İstatistikleri
          </h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#252c33] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}>
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          
          {/* Sol Kısım - Grafik */}
          <div className={`flex-1 flex flex-col p-4 rounded-2xl border ${headerBorder} ${theme === 'dark' ? 'bg-[#252c33]' : 'bg-[#f4efe4]'}`}>
            <h3 className="font-semibold mb-4 opacity-80 uppercase tracking-wider text-xs">Kelime Dağılım Grafiği (Top 10)</h3>
            <div className="flex-1 w-full min-h-[300px]">
              {stats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#2d3640' : '#c8bea8'} />
                    <XAxis type="number" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                    <YAxis dataKey="name" type="category" width={80} stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} fontWeight={600} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1a1f25' : '#FFFFF0', 
                        borderColor: theme === 'dark' ? '#2d3640' : '#c8bea8',
                        color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                        borderRadius: '12px'
                      }} 
                    />
                    <Bar dataKey="wordCount" name="Kelime Sayısı" radius={[0, 4, 4, 0]}>
                      {stats.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={theme === 'dark' ? '#94a3b8' : '#475569'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full opacity-50 text-sm">
                  Karakter diyaloğu bulunamadı.
                </div>
              )}
            </div>
          </div>

          {/* Sağ Kısım - Tablo */}
          <div className="flex-[1.2] flex flex-col h-full">
            <h3 className="font-semibold mb-3 opacity-80 uppercase tracking-wider text-xs">Tüm Karakterler Listesi</h3>
            <div className={`flex-1 rounded-2xl border overflow-hidden flex flex-col ${headerBorder}`}>
              <div className={`grid grid-cols-12 gap-2 p-3 font-semibold text-xs uppercase ${headerBg} border-b ${headerBorder}`}>
                <div className="col-span-5">Karakter</div>
                <div className="col-span-2 text-center">Kelime</div>
                <div className="col-span-2 text-center">Sahne</div>
                <div className="col-span-3 text-center">Süre (Dk)</div>
              </div>
              <div className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-[#1a1f25]' : 'bg-[#FFFFF0]'}`}>
                {stats.length > 0 ? stats.map((stat, i) => (
                  <div key={i} className={`grid grid-cols-12 gap-2 p-3 items-center text-sm border-b last:border-b-0 ${headerBorder} ${theme === 'dark' ? 'hover:bg-[#252c33]' : 'hover:bg-[#f4efe4]'}`}>
                    <div className="col-span-5 font-bold truncate pr-2" title={stat.name}>{stat.name}</div>
                    <div className={`col-span-2 text-center font-medium py-1 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-slate-200' : 'bg-[#ebe3d5] text-slate-800'}`}>{stat.wordCount}</div>
                    <div className="col-span-2 text-center opacity-80">{stat.sceneCount}</div>
                    <div className="col-span-3 text-center opacity-80">~{stat.estimatedTimeMin}</div>
                  </div>
                )) : (
                  <div className="p-8 text-center opacity-50 text-sm">
                    Henüz analiz edilecek veri yok.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className={`px-6 py-4 border-t flex justify-between items-center ${headerBorder} ${headerBg}`}>
          <div className="text-xs opacity-60">
            * Ortalama konuşma hızı dakikada 130 kelime olarak baz alınmıştır.
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={saveJSON}
              disabled={stats.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#252c33] disabled:opacity-50 text-slate-300' : 'border-[#c8bea8] hover:bg-[#dfd7ca] bg-[#FFFFF0] text-slate-700 disabled:opacity-50'}`}
              title="JSON Veri Olarak İndir"
            >
              <Download size={14} /> JSON
            </button>
            <button 
              onClick={saveMarkdown}
              disabled={stats.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#252c33] disabled:opacity-50 text-slate-300' : 'border-[#c8bea8] hover:bg-[#dfd7ca] bg-[#FFFFF0] text-slate-700 disabled:opacity-50'}`}
              title="Markdown Tablosu Olarak İndir"
            >
              <FileText size={14} /> Markdown
            </button>
            <button 
              onClick={saveDOCX}
              disabled={stats.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${theme === 'dark' ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-50' : 'border-[#dfd6c5] bg-white hover:bg-stone-100 text-slate-700 disabled:opacity-50'}`}
              title="Word Belgesi (.docx) Olarak İndir"
            >
              <TableIcon size={14} /> Word (.docx)
            </button>
            <button 
              onClick={savePDF}
              disabled={stats.length === 0}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all border disabled:opacity-50 ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700'}`}
              title="Yazdır / PDF Olarak Kaydet"
            >
              <Download size={14} /> PDF / Yazdır
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
