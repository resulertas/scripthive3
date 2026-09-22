import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Plus, Trash2, Download, Upload, Book, Save, Check, 
  FileText, FileCode, Loader2, Sparkles, AlertCircle 
} from 'lucide-react';
import { StoryBible, EpisodeStory } from '../types';
import { safeStorage } from '../lib/storage';
import { printStyledDocument, downloadUtf8File, escapeHtml } from '../lib/exportUtils';
import { saveAs } from 'file-saver';

interface StoryBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

// Helper to parse raw text (from Markdown, TXT, Word or PDF) into structured StoryBible
function parseTextToStoryBible(text: string, defaultName: string): StoryBible {
  const lines = text.split(/\r?\n/);
  const episodes: EpisodeStory[] = [];
  let seriesName = defaultName;
  let currentEpisode: EpisodeStory | null = null;
  let currentLines: string[] = [];

  const saveCurrent = () => {
    if (currentEpisode) {
      currentEpisode.storyContent = currentLines.join('\n').trim();
      currentLines = [];
    }
  };

  // Episode title pattern matcher:
  // e.g. "## 1. Bölüm", "1. BÖLÜM: BAŞLANGIÇ", "BÖLÜM 1", "EPISODE 1", "SEZON 1 BÖLÜM 1"
  const epHeaderRegex = /^(?:#+\s*)?(?:(\d+)[\.\s\-]+(?:BÖLÜM|BOLUM|EPISODE|BÖL|EP)|(?:BÖLÜM|BOLUM|EPISODE|BÖL|EP)\s*(\d+)|SEZON\s*\d+\s*(?:BÖLÜM|BOLUM|EPISODE)\s*\d+)(?:[\s\:\-\.]+(.*))?$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check document title in first few lines
    if (i < 5 && (trimmed.startsWith('# ') || trimmed.startsWith('**DİZİ:**') || trimmed.startsWith('PROJE:'))) {
      const candidateTitle = trimmed
        .replace(/^#\s*/, '')
        .replace(/^\*\*(?:DİZİ|PROJE|SERİES)\:\*\*\s*/i, '')
        .replace(/[\s\-_]*(?:Hikaye Rehberi|Sezon Hikayesi|Story Bible|Dizi Rehberi)[\s\-_]*/i, '')
        .trim();
      if (candidateTitle) seriesName = candidateTitle;
      continue;
    }

    const match = trimmed.match(epHeaderRegex);
    const isHeading = trimmed.startsWith('## ') || trimmed.startsWith('### ');

    if (match || isHeading) {
      saveCurrent();
      let epName = trimmed.replace(/^#+\s*/, '').trim();
      if (!epName) epName = `${episodes.length + 1}. Bölüm`;
      currentEpisode = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        episodeName: epName,
        storyContent: ''
      };
      episodes.push(currentEpisode);
    } else if (trimmed === '---') {
      // Markdown horizontal rule separator, skip
    } else if (currentEpisode) {
      currentLines.push(line);
    } else if (trimmed) {
      // Content before any explicit episode header -> Put into 1. Bölüm
      currentEpisode = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        episodeName: '1. Bölüm',
        storyContent: ''
      };
      episodes.push(currentEpisode);
      currentLines.push(line);
    }
  }
  saveCurrent();

  if (episodes.length === 0) {
    episodes.push({
      id: Date.now().toString(),
      episodeName: '1. Bölüm',
      storyContent: text.trim()
    });
  }

  return {
    seriesName: seriesName || defaultName,
    episodes
  };
}

export default function StoryBibleModal({ isOpen, onClose, theme }: StoryBibleModalProps) {
  const [bibleData, setBibleData] = useState<StoryBible>(() => {
    const defaultData: StoryBible = {
      seriesName: 'İsimsiz Dizi',
      episodes: [
        { id: 'ep_1', episodeName: '1. Bölüm', storyContent: '' }
      ]
    };
    const saved = safeStorage.getItem('scriptHive_storyBible');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            seriesName: parsed.seriesName || 'İsimsiz Dizi',
            episodes: Array.isArray(parsed.episodes) && parsed.episodes.length > 0 ? parsed.episodes : defaultData.episodes
          };
        }
      } catch (e) {}
    }
    return defaultData;
  });

  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(() => {
    return bibleData.episodes && bibleData.episodes.length > 0 ? bibleData.episodes[0].id : null;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    safeStorage.setItem('scriptHive_storyBible', JSON.stringify(bibleData));
  }, [bibleData]);

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-[#15191f]' : 'bg-[#f4eee4]';
  const modalBg = theme === 'dark' ? 'bg-[#1e242b]' : 'bg-[#fcfbf8]';
  const textClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
  const borderClass = theme === 'dark' ? 'border-[#2d3640]/70' : 'border-[#c8bea8]/70';
  const inputBg = theme === 'dark' ? 'bg-[#15191f]' : 'bg-white';
  const itemHover = theme === 'dark' ? 'hover:bg-[#20272e]' : 'hover:bg-[#ede5d6]';
  const itemActive = theme === 'dark' ? 'bg-[#20272e] text-[#6ba3e8] font-bold shadow-xs' : 'bg-[#e8e0d5] text-slate-950 font-bold shadow-xs';

  const updateSeriesName = (name: string) => {
    setBibleData(prev => ({ ...prev, seriesName: name }));
  };

  const handleAddEpisode = () => {
    const newEpisode: EpisodeStory = {
      id: Date.now().toString(),
      episodeName: `${bibleData.episodes.length + 1}. Bölüm`,
      storyContent: ''
    };
    setBibleData(prev => ({
      ...prev,
      episodes: [...prev.episodes, newEpisode]
    }));
    setActiveEpisodeId(newEpisode.id);
  };

  const handleRemoveEpisode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bu bölümü silmek istediğinize emin misiniz?")) {
      setBibleData(prev => {
        const newEpisodes = prev.episodes.filter(ep => ep.id !== id);
        if (activeEpisodeId === id) {
          setActiveEpisodeId(newEpisodes.length > 0 ? newEpisodes[0].id : null);
        }
        return { ...prev, episodes: newEpisodes };
      });
    }
  };

  const updateActiveEpisode = (updates: Partial<EpisodeStory>) => {
    setBibleData(prev => ({
      ...prev,
      episodes: prev.episodes.map(ep => 
        ep.id === activeEpisodeId ? { ...ep, ...updates } : ep
      )
    }));
  };

  const activeEpisode = bibleData.episodes.find(ep => ep.id === activeEpisodeId);

  const handleSave = () => {
    safeStorage.setItem('scriptHive_storyBible', JSON.stringify(bibleData));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // --- EXPORT HANDLERS ---
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bibleData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(bibleData.seriesName || 'Dizi').replace(/\s+/g, '_')}_Sezon_Hikayesi.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportMarkdown = () => {
    let md = `# ${bibleData.seriesName || 'İsimsiz Dizi'} - Sezon Hikayesi & Dizi Rehberi\n\n`;
    md += `*Toplam Bölüm Sayısı:* ${bibleData.episodes.length}\n`;
    md += `*Son Güncelleme:* ${new Date().toLocaleDateString('tr-TR')}\n\n---\n\n`;

    bibleData.episodes.forEach((ep, i) => {
      md += `## ${i + 1}. Bölüm: ${ep.episodeName}\n\n`;
      md += `${ep.storyContent || '(Henüz bir özet yazılmadı.)'}\n\n---\n\n`;
    });

    downloadUtf8File(md, `${(bibleData.seriesName || 'Dizi').replace(/\s+/g, '_')}_Sezon_Hikayesi.md`, 'text/markdown;charset=utf-8');
  };

  const handleExportDOCX = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      const docChildren: any[] = [
        new Paragraph({
          text: `${bibleData.seriesName || 'İsimsiz Dizi'}`,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: "SEZON HİKAYESİ VE DİZİ REHBERİ (STORY BIBLE)",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      ];

      bibleData.episodes.forEach((ep, i) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ 
                text: `${i + 1}. BÖLÜM: ${ep.episodeName.toUpperCase()}`, 
                bold: true, 
                size: 26, 
                color: "1E40AF",
                font: "Arial" 
              })
            ],
            spacing: { before: 240, after: 100 }
          })
        );
        const lines = (ep.storyContent || '(Henüz bir özet yazılmadı.)').split(/\r?\n/);
        lines.forEach(l => {
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: l, size: 20, font: "Arial", color: "1E293B" })],
              spacing: { after: 80 }
            })
          );
        });
        docChildren.push(new Paragraph({ text: "", spacing: { after: 140 } }));
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
      saveAs(blob, `${(bibleData.seriesName || 'Dizi').replace(/\s+/g, '_')}_Sezon_Hikayesi.docx`);
    } catch (e: any) {
      console.error(e);
      alert("DOCX dışa aktarma sırasında bir hata oluştu: " + (e.message || String(e)));
    }
  };

  const handleExportPDF = () => {
    let bodyHtml = `
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-val">${bibleData.episodes.length}</div>
          <div class="stat-lbl">Toplam Bölüm</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">1. Sezon</div>
          <div class="stat-lbl">Sezon Yapısı</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">Dizi Rehberi</div>
          <div class="stat-lbl">Doküman Formatı</div>
        </div>
      </div>
    `;

    bibleData.episodes.forEach((ep, i) => {
      bodyHtml += `
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <div class="card-title" style="color: #1e40af;">${i + 1}. Bölüm: ${escapeHtml(ep.episodeName)}</div>
            <div class="card-badge">Bölüm ${i + 1}</div>
          </div>
          <div class="writer-note" style="margin-top: 8px; font-size: 10pt; line-height: 1.65;">
            ${ep.storyContent ? escapeHtml(ep.storyContent) : '<em style="color: #94a3b8;">(Bu bölüm için henüz bir özet veya olay örgüsü yazılmadı.)</em>'}
          </div>
        </div>
      `;
    });

    printStyledDocument({
      title: `${bibleData.seriesName || 'İsimsiz Dizi'} - Sezon Hikayesi`,
      categoryBadge: 'Dizi İncili (Story Bible)',
      subtitle: `${bibleData.episodes.length} Bölüm Özeti ve Sezon Arkı`,
      bodyHtml,
      accentColor: '#2563eb'
    });
  };

  // --- IMPORT HANDLER FOR DOCX, PDF, MD, TXT, JSON ---
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatusMessage("Dosya okunuyor ve bölümler ayrıştırılıyor...");

    try {
      const fileName = file.name;
      const lowerName = fileName.toLowerCase();

      // 1. JSON Import
      if (lowerName.endsWith('.json')) {
        const text = await file.text();
        const importedData = JSON.parse(text);
        if (importedData && importedData.seriesName !== undefined && Array.isArray(importedData.episodes)) {
          setBibleData(importedData);
          if (importedData.episodes.length > 0) {
            setActiveEpisodeId(importedData.episodes[0].id);
          }
          setImportStatusMessage(`✓ "${importedData.seriesName}" (${importedData.episodes.length} Bölüm) başarıyla yüklendi!`);
          setTimeout(() => setImportStatusMessage(null), 3500);
          return;
        }
      }

      // 2. DOCX / DOC Import
      if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        let extractedText = '';

        try {
          // Try mammoth for rich text & headings
          const mammoth = (await import('mammoth')).default || (await import('mammoth'));
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value || '';
        } catch (mErr) {
          // Fallback to JSZip XML reading
          const JSZipModule: any = await import('jszip');
          const JSZip = JSZipModule.default || JSZipModule;
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(arrayBuffer);
          const docXml = zipContent.file('word/document.xml');
          if (docXml) {
            const xmlText = await docXml.async('text');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const pEls = xmlDoc.getElementsByTagName('w:p');
            const pTexts: string[] = [];
            for (let i = 0; i < pEls.length; i++) {
              const tEls = pEls[i].getElementsByTagName('w:t');
              let pStr = '';
              for (let j = 0; j < tEls.length; j++) {
                pStr += tEls[j].textContent || '';
              }
              if (pStr.trim()) pTexts.push(pStr);
            }
            extractedText = pTexts.join('\n\n');
          }
        }

        if (extractedText.trim()) {
          const defaultTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[\-_]/g, ' ');
          const parsedBible = parseTextToStoryBible(extractedText, defaultTitle);
          setBibleData(parsedBible);
          if (parsedBible.episodes.length > 0) {
            setActiveEpisodeId(parsedBible.episodes[0].id);
          }
          setImportStatusMessage(`✓ DOCX dosyasından ${parsedBible.episodes.length} bölüm başarıyla içe aktarıldı!`);
          setTimeout(() => setImportStatusMessage(null), 3500);
          return;
        }
      }

      // 3. PDF Import
      if (lowerName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        // @ts-ignore
        const pdfWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        let fullPdfText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const linesMap = new Map<number, string[]>();
          textContent.items.forEach((item: any) => {
            if (!item.str) return;
            const y = Math.round(item.transform[5]);
            let targetY = y;
            for (const key of linesMap.keys()) {
              if (Math.abs(key - y) <= 4) {
                targetY = key;
                break;
              }
            }
            if (!linesMap.has(targetY)) linesMap.set(targetY, []);
            linesMap.get(targetY)!.push(item.str);
          });

          const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
          const pageLines = sortedY.map(y => linesMap.get(y)!.join(' ').trim()).filter(Boolean);
          fullPdfText += pageLines.join('\n') + '\n\n';
        }

        if (fullPdfText.trim()) {
          const defaultTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[\-_]/g, ' ');
          const parsedBible = parseTextToStoryBible(fullPdfText, defaultTitle);
          setBibleData(parsedBible);
          if (parsedBible.episodes.length > 0) {
            setActiveEpisodeId(parsedBible.episodes[0].id);
          }
          setImportStatusMessage(`✓ PDF dosyasından ${parsedBible.episodes.length} bölüm başarıyla ayrıştırıldı!`);
          setTimeout(() => setImportStatusMessage(null), 3500);
          return;
        }
      }

      // 4. Markdown & Plain Text Import
      const rawText = await file.text();
      const defaultTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[\-_]/g, ' ');
      const parsedBible = parseTextToStoryBible(rawText, defaultTitle);
      setBibleData(parsedBible);
      if (parsedBible.episodes.length > 0) {
        setActiveEpisodeId(parsedBible.episodes[0].id);
      }
      setImportStatusMessage(`✓ Metin dosyasından ${parsedBible.episodes.length} bölüm başarıyla yüklendi!`);
      setTimeout(() => setImportStatusMessage(null), 3500);

    } catch (err: any) {
      console.error(err);
      setImportStatusMessage(`⚠️ Dosya okunamadı: ${err.message || 'Bilinmeyen hata'}`);
      setTimeout(() => setImportStatusMessage(null), 4000);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none">
      <div className={`w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border ${borderClass} ${modalBg}`}>
        
        {/* SOL MENÜ - BÖLÜMLER LİSTESİ & İÇE/DIŞA AKTAR BUTONLARI */}
        <div className={`w-full md:w-72 flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r ${borderClass} ${bgClass}`}>
          <div className={`p-4 border-b ${borderClass}`}>
            <h2 className={`font-bold flex items-center gap-2 ${textClass} mb-1 text-sm`}>
              <Book size={18} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
              Sezon Hikayesi
            </h2>
            <p className="text-[11px] opacity-60 mb-2.5">Bölüm özetleri & dizi incili</p>
            <input 
              type="text" 
              value={bibleData.seriesName}
              onChange={(e) => updateSeriesName(e.target.value)}
              placeholder="Dizi / Sezon Adı"
              className={`w-full text-xs font-semibold px-3 py-2 rounded-lg border focus:outline-none transition-colors ${inputBg} ${borderClass} ${textClass}`}
            />
          </div>

          {/* STATUS NOTIFICATION BANNER */}
          {importStatusMessage && (
            <div className="mx-3 mt-2 p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <Check size={13} className="shrink-0" />
              <span className="truncate">{importStatusMessage}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 px-2 opacity-50 flex items-center justify-between`}>
              <span>BÖLÜMLER ({bibleData.episodes.length})</span>
            </div>
            <div className="space-y-0.5">
              {bibleData.episodes.map(ep => (
                <div 
                  key={ep.id}
                  onClick={() => setActiveEpisodeId(ep.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeEpisodeId === ep.id ? itemActive : itemHover} ${textClass}`}
                >
                  <span className="text-xs font-medium truncate pr-2">{ep.episodeName}</span>
                  <button 
                    onClick={(e) => handleRemoveEpisode(ep.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20 p-1 rounded-md transition-all"
                    title="Bu bölümü sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleAddEpisode}
              className={`w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed hover:border-solid transition-all text-xs font-semibold ${theme === 'dark' ? 'border-[#2d3640] text-[#6ba3e8] hover:bg-[#20272e]' : 'border-[#c8bea8] text-blue-700 hover:bg-[#e8e0d5]'}`}
            >
              <Plus size={14} /> Yeni Bölüm Ekle
            </button>
          </div>
          
          {/* İÇE / DIŞA AKTAR BÖLÜMÜ */}
          <div className={`p-3 border-t ${borderClass} flex flex-col gap-2`}>
            {/* File Upload Input */}
            <input 
              type="file" 
              accept=".docx,.doc,.pdf,.md,.markdown,.txt,.json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImportFile}
            />

            {/* İçe Aktar (Upload) Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition-all border ${
                theme === 'dark' 
                  ? 'border-[#2d3640] bg-[#20272e] hover:bg-[#28323c] text-slate-200' 
                  : 'border-[#c8bea8] bg-white hover:bg-slate-50 text-slate-800 shadow-xs'
              }`}
              title="Word (.docx), PDF, Markdown (.md), Metin (.txt) veya JSON dosyası yükle"
            >
              {isImporting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>İşleniyor...</span>
                </>
              ) : (
                <>
                  <Upload size={13} />
                  <span>Dosyadan Yükle (DOCX, PDF, MD)</span>
                </>
              )}
            </button>

            {/* Dışa Aktar (Download) Butonları */}
            <div className="grid grid-cols-2 gap-1.5 w-full">
              <button 
                onClick={handleExportDOCX}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-colors border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e] text-slate-300' : 'border-[#c8bea8] hover:bg-white text-slate-700'}`}
                title="Microsoft Word (.docx) olarak indir"
              >
                <Download size={12} /> Word (.docx)
              </button>
              <button 
                onClick={handleExportPDF}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-colors border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e] text-slate-300' : 'border-[#c8bea8] hover:bg-white text-slate-700'}`}
                title="PDF olarak yazdır veya kaydet"
              >
                <Download size={12} /> PDF
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 w-full">
              <button 
                onClick={handleExportMarkdown}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-colors border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e] text-slate-300' : 'border-[#c8bea8] hover:bg-white text-slate-700'}`}
                title="Markdown (.md) olarak indir"
              >
                <Download size={12} /> Markdown
              </button>
              <button 
                onClick={handleExportJSON}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-colors border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e] text-slate-300' : 'border-[#c8bea8] hover:bg-white text-slate-700'}`}
                title="JSON yedek dosyası olarak indir"
              >
                <Download size={12} /> JSON
              </button>
            </div>
          </div>
        </div>

        {/* SAĞ PANEL - BÖLÜM HİKAYESİ DÜZENLEME */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <button 
            onClick={onClose}
            className={`absolute top-3.5 right-3.5 p-1.5 rounded-lg z-10 transition-colors ${theme === 'dark' ? 'hover:bg-[#20272e] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
            title="Kapat"
          >
            <X size={18} />
          </button>

          {activeEpisode ? (
            <div className="flex-1 flex flex-col h-full">
              <div className={`px-6 py-4 border-b ${borderClass} flex items-end gap-4`}>
                <div className="flex-1 min-w-0">
                  <label className={`block text-[11px] font-semibold mb-1 opacity-50`}>Bölüm İsmi</label>
                  <input 
                    type="text" 
                    value={activeEpisode.episodeName}
                    onChange={(e) => updateActiveEpisode({ episodeName: e.target.value })}
                    className={`w-full text-xl font-bold bg-transparent border-0 outline-none transition-colors px-0 py-0.5 ${textClass}`}
                    placeholder="Bölüm Adı"
                  />
                </div>
                
                <button 
                  onClick={handleSave}
                  className={`px-4 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs active:scale-95 ${
                    isSaved 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : (theme === 'dark' 
                        ? 'bg-[#6ba3e8] text-slate-950 hover:bg-[#82b4f0]' 
                        : 'bg-blue-700 text-white hover:bg-blue-800')
                  }`}
                >
                  {isSaved ? <Check size={15} /> : <Save size={15} />}
                  {isSaved ? 'Kaydedildi' : 'Kaydet'}
                </button>
              </div>

              <div className={`flex-1 overflow-y-auto p-6 bg-transparent ${textClass} flex flex-col`}>
                 <div className="flex items-center justify-between mb-2">
                   <label className={`block text-xs font-semibold opacity-60`}>Bölüm Hikayesi & Olay Örgüsü</label>
                   <span className="text-[11px] opacity-50 font-mono">
                     {(activeEpisode.storyContent || '').split(/\s+/).filter(Boolean).length} kelime
                   </span>
                 </div>
                 <textarea
                   value={activeEpisode.storyContent}
                   onChange={(e) => updateActiveEpisode({ storyContent: e.target.value })}
                   placeholder="Bu bölümün konusunu, ana dönüm noktalarını ve olay örgüsünü buraya yazın..."
                   className={`w-full flex-1 min-h-[300px] p-0 resize-none outline-none border-0 bg-transparent text-sm sm:text-base leading-relaxed font-sans ${textClass}`}
                 />
              </div>
            </div>
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center opacity-50 p-8 text-center`}>
              <Book size={44} className="mb-3 opacity-50" />
              <p className="text-xs font-medium">Görüntülenecek bir bölüm seçin veya yeni bir bölüm ekleyin.</p>
              <button
                onClick={handleAddEpisode}
                className="mt-3 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                + 1. Bölümü Oluştur
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
