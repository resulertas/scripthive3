import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Download, Upload, NotebookPen, Save, Check, FileText, Code2, FileCode, Printer, Loader2 } from 'lucide-react';
import { safeStorage } from '../lib/storage';
import { printStyledDocument, downloadUtf8File, escapeHtml } from '../lib/exportUtils';
import { saveAs } from 'file-saver';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface NotebookData {
  projectName: string;
  notes: Note[];
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

function parseTextToNotes(text: string, defaultProjectName: string): NotebookData {
  const lines = text.split(/\r?\n/);
  const notes: Note[] = [];
  let detectedProjectName = defaultProjectName;
  let currentNote: Note | null = null;
  let currentContentLines: string[] = [];

  const saveCurrentNote = () => {
    if (currentNote) {
      currentNote.content = currentContentLines.join('\n').trim();
      notes.push(currentNote);
      currentNote = null;
      currentContentLines = [];
    }
  };

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentNote) currentContentLines.push('');
      continue;
    }

    // Proje Başlığı Tespiti (# Proje Adı)
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      const title = trimmed
        .replace(/^#\s*/, '')
        .replace(/\s*-\s*Not Defteri$/i, '')
        .replace(/\s*-\s*NOT DEFTERİ$/i, '')
        .replace(/\s*-\s*Notları$/i, '')
        .trim();
      if (title) detectedProjectName = title;
      continue;
    }

    // Not Başlığı Tespiti (## Başlık, 📌 Başlık, Not #1, vb.)
    const isHeading = trimmed.startsWith('## ') || 
                      trimmed.startsWith('### ') || 
                      trimmed.startsWith('📌 ') || 
                      (/^\d+[\.\)]\s+/.test(trimmed) && trimmed.length < 80) ||
                      /^NOT\s*#?\d+:?/i.test(trimmed);

    if (isHeading) {
      saveCurrentNote();
      const cleanTitle = trimmed
        .replace(/^#{2,3}\s*/, '')
        .replace(/^📌\s*/, '')
        .replace(/^\d+[\.\)]\s+/, '')
        .replace(/^NOT\s*#?\d+:?\s*/i, '')
        .trim();

      currentNote = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        title: cleanTitle || `Not #${notes.length + 1}`,
        content: ''
      };
    } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      // Ayrıcı çizgi
    } else {
      if (!currentNote) {
        currentNote = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          title: trimmed.length < 40 ? trimmed : `Not #${notes.length + 1}`,
          content: trimmed.length < 40 ? '' : trimmed
        };
      } else {
        currentContentLines.push(line);
      }
    }
  }

  saveCurrentNote();

  if (notes.length === 0) {
    notes.push({
      id: Date.now().toString(),
      title: 'Genel Notlar',
      content: text.trim()
    });
  }

  return {
    projectName: detectedProjectName,
    notes
  };
}

export default function NotesModal({ isOpen, onClose, theme }: NotesModalProps) {
  const [notebookData, setNotebookData] = useState<NotebookData>(() => {
    const defaultData: NotebookData = {
      projectName: 'Dizi Notları',
      notes: [
        { id: 'note_1', title: 'Genel Notlar', content: '' }
      ]
    };
    const saved = safeStorage.getItem('scriptHive_notebook');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            projectName: parsed.projectName || 'Dizi Notları',
            notes: Array.isArray(parsed.notes) && parsed.notes.length > 0 ? parsed.notes : defaultData.notes
          };
        }
      } catch (e) {}
    }
    return defaultData;
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    return notebookData.notes && notebookData.notes.length > 0 ? notebookData.notes[0].id : null;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    safeStorage.setItem('scriptHive_notebook', JSON.stringify(notebookData));
  }, [notebookData]);

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-[#15191f]' : 'bg-[#f4eee4]';
  const modalBg = theme === 'dark' ? 'bg-[#1e242b]' : 'bg-[#fcfbf8]';
  const textClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
  const borderClass = theme === 'dark' ? 'border-[#2d3640]/70' : 'border-[#c8bea8]/70';
  const inputBg = theme === 'dark' ? 'bg-[#15191f]' : 'bg-white';
  const itemHover = theme === 'dark' ? 'hover:bg-[#20272e]' : 'hover:bg-[#ede5d6]';
  const itemActive = theme === 'dark' ? 'bg-[#20272e] text-[#6ba3e8] font-bold shadow-xs' : 'bg-[#e8e0d5] text-slate-950 font-bold shadow-xs';

  const updateProjectName = (name: string) => {
    setNotebookData(prev => ({ ...prev, projectName: name }));
  };

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: `Yeni Not #${notebookData.notes.length + 1}`,
      content: ''
    };
    setNotebookData(prev => ({
      ...prev,
      notes: [...prev.notes, newNote]
    }));
    setActiveNoteId(newNote.id);
  };

  const handleRemoveNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bu notu silmek istediğinize emin misiniz?")) {
      setNotebookData(prev => {
        const newNotes = prev.notes.filter(n => n.id !== id);
        if (activeNoteId === id) {
          setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null);
        }
        return { ...prev, notes: newNotes };
      });
    }
  };

  const updateActiveNote = (updates: Partial<Note>) => {
    setNotebookData(prev => ({
      ...prev,
      notes: prev.notes.map(n => 
        n.id === activeNoteId ? { ...n, ...updates } : n
      )
    }));
  };

  const activeNote = notebookData.notes.find(n => n.id === activeNoteId);

  const handleSave = () => {
    safeStorage.setItem('scriptHive_notebook', JSON.stringify(notebookData));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // --- EXPORT HANDLERS ---
  const handleExportJSON = () => {
    try {
      setIsExporting('json');
      const dataToExport = {
        projectName: notebookData.projectName || 'Not Defteri',
        exportedAt: new Date().toISOString(),
        totalNotes: notebookData.notes.length,
        notes: notebookData.notes
      };
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const cleanFileName = `${(notebookData.projectName || 'Notlar').replace(/\s+/g, '_')}_Notlar.json`;
      downloadUtf8File(dataStr, cleanFileName, 'application/json;charset=utf-8');
      
      setStatusMessage('✓ Notlar JSON olarak başarıyla indirildi!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e: any) {
      alert("JSON dışa aktarılırken bir hata oluştu: " + e.message);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportMarkdown = () => {
    try {
      setIsExporting('md');
      let md = `# ${notebookData.projectName || 'Not Defteri'} - Senaryo Notları\n\n`;
      md += `* **Toplam Not:** ${notebookData.notes.length}\n`;
      md += `* **Dışa Aktarma Tarihi:** ${new Date().toLocaleDateString('tr-TR')}\n\n---\n\n`;

      notebookData.notes.forEach((n, i) => {
        md += `## ${i + 1}. ${n.title}\n\n`;
        md += `${n.content || '_Bu not henüz boş._'}\n\n---\n\n`;
      });

      const cleanFileName = `${(notebookData.projectName || 'Notlar').replace(/\s+/g, '_')}_Notlar.md`;
      downloadUtf8File(md, cleanFileName, 'text/markdown;charset=utf-8');

      setStatusMessage('✓ Notlar Markdown (.md) olarak başarıyla indirildi!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e: any) {
      alert("Markdown dışa aktarılırken bir hata oluştu: " + e.message);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDOCX = async () => {
    try {
      setIsExporting('docx');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      const docChildren: any[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: `${notebookData.projectName || 'Not Defteri'} - SENARYO VE PROJE NOTLARI`,
              bold: true,
              size: 32,
              font: "Arial",
              color: "0F172A"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Toplam Not: ${notebookData.notes.length}  |  Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
              italics: true,
              size: 20,
              color: "64748B",
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 320 }
        })
      ];

      notebookData.notes.forEach((n, i) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `📌 ${i + 1}. ${n.title}`,
                bold: true,
                size: 24,
                color: "1E40AF",
                font: "Arial"
              })
            ],
            spacing: { before: 240, after: 80 }
          })
        );

        const lines = (n.content || '(Bu not henüz boş.)').split(/\r?\n/);
        lines.forEach(l => {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: l,
                  size: 21,
                  font: "Arial",
                  color: "1E293B"
                })
              ],
              spacing: { after: 60 }
            })
          );
        });

        docChildren.push(
          new Paragraph({
            text: "",
            spacing: { after: 140 }
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
      const cleanFileName = `${(notebookData.projectName || 'Notlar').replace(/\s+/g, '_')}_Notlar.docx`;
      saveAs(blob, cleanFileName);

      setStatusMessage('✓ Notlar Word (.docx) olarak başarıyla indirildi!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e: any) {
      console.error(e);
      alert("DOCX dışa aktarma sırasında bir hata oluştu: " + (e.message || String(e)));
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExporting('pdf');
      let bodyHtml = `
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-val">${notebookData.notes.length}</div>
            <div class="stat-lbl">Toplam Not Başlığı</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">Not Defteri</div>
            <div class="stat-lbl">Doküman Formatı</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${new Date().toLocaleDateString('tr-TR')}</div>
            <div class="stat-lbl">Son Güncelleme</div>
          </div>
        </div>
      `;

      notebookData.notes.forEach((n, i) => {
        bodyHtml += `
          <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
              <div class="card-title" style="color: #1e40af;">📌 ${i + 1}. ${escapeHtml(n.title)}</div>
              <div class="card-badge">Not #${i + 1}</div>
            </div>
            <div class="writer-note" style="margin-top: 8px; font-size: 10.5pt; line-height: 1.65; white-space: pre-wrap;">
              ${n.content ? escapeHtml(n.content) : '<em style="color: #94a3b8;">(Bu not henüz boş.)</em>'}
            </div>
          </div>
        `;
      });

      printStyledDocument({
        title: `${notebookData.projectName || 'Not Defteri'} - Senaryo Notları`,
        categoryBadge: 'Yazar Odası Notları',
        subtitle: `${notebookData.notes.length} Not Başlığı • ScriptHive Notebook`,
        bodyHtml,
        accentColor: '#2563eb'
      });

      setStatusMessage('✓ PDF yazdırma penceresi açıldı!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e: any) {
      alert("PDF dışa aktarılırken bir hata oluştu: " + e.message);
    } finally {
      setIsExporting(null);
    }
  };

  // --- IMPORT HANDLER FOR DOCX, PDF, MD, TXT, JSON ---
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatusMessage("Dosya okunuyor ve notlar ayrıştırılıyor...");

    try {
      const fileName = file.name;
      const lowerName = fileName.toLowerCase();

      // 1. JSON Import
      if (lowerName.endsWith('.json')) {
        const text = await file.text();
        const importedData = JSON.parse(text);
        if (importedData && (importedData.projectName !== undefined || Array.isArray(importedData.notes))) {
          const validNotes = Array.isArray(importedData.notes) ? importedData.notes : [];
          setNotebookData({
            projectName: importedData.projectName || notebookData.projectName,
            notes: validNotes.length > 0 ? validNotes : [{ id: Date.now().toString(), title: 'Genel Notlar', content: '' }]
          });
          if (validNotes.length > 0) {
            setActiveNoteId(validNotes[0].id);
          }
          setStatusMessage(`✓ JSON dosyasından ${validNotes.length} not başarıyla yüklendi!`);
          setTimeout(() => setStatusMessage(null), 3500);
          return;
        }
      }

      // 2. DOCX / DOC Import
      if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        let extractedText = '';

        try {
          const mammoth = (await import('mammoth')).default || (await import('mammoth'));
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value || '';
        } catch (mErr) {
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
          const parsed = parseTextToNotes(extractedText, defaultTitle);
          setNotebookData(parsed);
          if (parsed.notes.length > 0) {
            setActiveNoteId(parsed.notes[0].id);
          }
          setStatusMessage(`✓ DOCX dosyasından ${parsed.notes.length} not başarıyla aktarıldı!`);
          setTimeout(() => setStatusMessage(null), 3500);
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
          const parsed = parseTextToNotes(fullPdfText, defaultTitle);
          setNotebookData(parsed);
          if (parsed.notes.length > 0) {
            setActiveNoteId(parsed.notes[0].id);
          }
          setStatusMessage(`✓ PDF dosyasından ${parsed.notes.length} not başarıyla ayrıştırıldı!`);
          setTimeout(() => setStatusMessage(null), 3500);
          return;
        }
      }

      // 4. Markdown & Plain Text Import
      const rawText = await file.text();
      const defaultTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[\-_]/g, ' ');
      const parsed = parseTextToNotes(rawText, defaultTitle);
      setNotebookData(parsed);
      if (parsed.notes.length > 0) {
        setActiveNoteId(parsed.notes[0].id);
      }
      setStatusMessage(`✓ Metin dosyasından ${parsed.notes.length} not başarıyla yüklendi!`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`⚠️ Dosya okunamadı: ${err.message || 'Bilinmeyen hata'}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none">
      <div className={`w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border ${borderClass} ${modalBg}`}>
        
        {/* Sol Menü - Notlar Listesi ve Dışa/İçe Aktar Paneli */}
        <div className={`w-full md:w-72 flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r ${borderClass} ${bgClass}`}>
          <div className={`p-4 border-b ${borderClass}`}>
            <h2 className={`font-bold flex items-center gap-2 ${textClass} mb-1 text-sm`}>
              <NotebookPen size={18} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
              Not Defteri
            </h2>
            <p className="text-[11px] opacity-60 mb-2.5">Fikirler & çalışma notları</p>
            <input 
              type="text" 
              value={notebookData.projectName}
              onChange={(e) => updateProjectName(e.target.value)}
              placeholder="Dizi / Proje Adı"
              className={`w-full text-xs font-semibold px-3 py-2 rounded-lg border focus:outline-none transition-colors ${inputBg} ${borderClass} ${textClass}`}
            />
          </div>

          {/* Bildirim / Durum Mesajı */}
          {statusMessage && (
            <div className="mx-3 mt-2 p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <Check size={13} className="shrink-0" />
              <span className="truncate">{statusMessage}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider opacity-50 ${textClass}`}>
                NOTLAR ({notebookData.notes.length})
              </span>
            </div>
            
            <div className="space-y-0.5">
              {notebookData.notes.map((n, i) => (
                <div 
                  key={n.id}
                  onClick={() => setActiveNoteId(n.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeNoteId === n.id ? itemActive : itemHover} ${textClass}`}
                >
                  <span className="text-xs font-medium truncate pr-2">
                    <span className="opacity-40 mr-1.5 font-mono text-[11px]">{i + 1}.</span>
                    {n.title || '(Başlıksız Not)'}
                  </span>
                  <button 
                    onClick={(e) => handleRemoveNote(n.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20 p-1 rounded-md transition-all"
                    title="Bu notu sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleAddNote}
              className={`w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed hover:border-solid transition-all text-xs font-semibold ${theme === 'dark' ? 'border-[#2d3640] text-[#6ba3e8] hover:bg-[#20272e]' : 'border-[#c8bea8] text-blue-700 hover:bg-[#e8e0d5]'}`}
            >
              <Plus size={14} /> Yeni Not Ekle
            </button>
          </div>
          
          {/* Dışa Aktarma (Export) ve İçe Aktarma (Import) Alanı */}
          <div className={`p-3 border-t ${borderClass} flex flex-col gap-2`}>
            {/* 4 Format: MD, JSON, DOCX, PDF */}
            <div className="grid grid-cols-2 gap-1.5 w-full">
              <button 
                onClick={handleExportDOCX}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-colors border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e] text-slate-300' : 'border-[#c8bea8] hover:bg-white text-slate-700'}`}
                title="Microsoft Word (.docx) olarak dışa aktar"
              >
                <FileCode size={12} />
                <span>Word (.docx)</span>
              </button>

              <button 
                onClick={handleExportPDF}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-colors border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e] text-slate-300' : 'border-[#c8bea8] hover:bg-white text-slate-700'}`}
                title="PDF (.pdf) olarak yazdır ve kaydet"
              >
                <Printer size={12} />
                <span>PDF (.pdf)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 w-full">
              <button 
                onClick={handleExportMarkdown}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-colors border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e] text-slate-300' : 'border-[#c8bea8] hover:bg-white text-slate-700'}`}
                title="Markdown (.md) olarak dışa aktar"
              >
                <FileText size={12} />
                <span>Markdown</span>
              </button>

              <button 
                onClick={handleExportJSON}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-colors border ${theme === 'dark' ? 'border-[#2d3640] hover:bg-[#20272e] text-slate-300' : 'border-[#c8bea8] hover:bg-white text-slate-700'}`}
                title="JSON (.json) olarak dışa aktar"
              >
                <Code2 size={12} />
                <span>JSON</span>
              </button>
            </div>

            <input 
              type="file" 
              accept=".json,.md,.txt,.markdown,.docx,.doc,.pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImportFile}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition-all border ${
                theme === 'dark' 
                  ? 'border-[#2d3640] bg-[#20272e] hover:bg-[#28323c] text-slate-200' 
                  : 'border-[#c8bea8] bg-white hover:bg-slate-50 text-slate-800 shadow-xs'
              }`}
            >
              {isImporting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              <span>{isImporting ? 'İçe Aktarılıyor...' : 'Dosyadan Yükle (DOCX, PDF, MD)'}</span>
            </button>
          </div>
        </div>

        {/* Sağ Panel - Not İçeriği Düzenleme */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <button 
            onClick={onClose}
            className={`absolute top-3.5 right-3.5 p-1.5 rounded-lg z-10 transition-colors ${theme === 'dark' ? 'hover:bg-[#20272e] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
            title="Kapat"
          >
            <X size={18} />
          </button>

          {activeNote ? (
            <div className="flex-1 flex flex-col h-full">
              <div className={`px-6 py-4 border-b ${borderClass} flex items-end gap-4`}>
                <div className="flex-1 min-w-0">
                  <label className={`block text-[11px] font-semibold mb-1 opacity-50`}>Not Başlığı</label>
                  <input 
                    type="text" 
                    value={activeNote.title}
                    onChange={(e) => updateActiveNote({ title: e.target.value })}
                    className={`w-full text-xl font-bold bg-transparent border-0 outline-none transition-colors px-0 py-0.5 ${textClass}`}
                    placeholder="Not Başlığı"
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
                 <label className={`block text-xs font-semibold mb-2 opacity-60`}>Not İçeriği</label>
                 <textarea
                   value={activeNote.content}
                   onChange={(e) => updateActiveNote({ content: e.target.value })}
                   placeholder="Notlarınızı buraya yazın..."
                   className={`w-full flex-1 min-h-[300px] p-0 resize-none outline-none border-0 bg-transparent text-sm sm:text-base leading-relaxed font-sans ${textClass}`}
                 />
              </div>
            </div>
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center opacity-50 p-8 text-center`}>
              <NotebookPen size={44} className="mb-3 opacity-50" />
              <p className="text-xs font-medium">Görüntülenecek bir not seçin veya yeni ekleyin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
