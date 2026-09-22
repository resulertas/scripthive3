import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, ImagePlus, Download, Upload, Users, ChevronDown, ChevronRight, Save, Check } from 'lucide-react';
import { CharacterProfile } from '../types';
import { safeStorage } from '../lib/storage';
import { printStyledDocument, downloadUtf8File, escapeHtml } from '../lib/exportUtils';

export const PREDEFINED_QUESTIONS = {
  "KATMAN 1: Vitrin ve Fiziksellik (Dış Dünya)": [
    "Kimlik: İsmi, yaşı ve toplumdaki resmi rolü (mesleği/stajı/etiketi) nedir?",
    "Belirgin İz: Onu kalabalıkta ayırt etmemizi sağlayacak en belirgin fiziksel özelliği veya kusuru (tik, yara izi, giyim tarzı) nedir?",
    "Sesin Rengi: Konuşma tarzı nasıl? (Kısa/net mi, dolaylı/alt metinli mi, aksanlı mı, hangi kelimeleri takıntı yapmış? Tekrar lafları neler?)",
    "Enerji ve Ritim: Hareket tarzı hangi hayvana benzer? (Hızlı ve tedirgin bir fare mi, ağır ve kendinden emin bir aslan mı?)",
    "Maske: Dünyaya sunduğu sahte kişilik nedir? İnsanların onu nasıl görmesini istiyor?"
  ],
  "KATMAN 2: Dramatik Motor (İstek ve İhtiyaç)": [
    "İstek (Want): Hikaye sonunda ulaşmaya çalıştığı somut, dışsal hedefi nedir?",
    "İhtiyaç (Need): Huzura ermesi için ruhsal olarak öğrenmesi gereken asıl ders/ihtiyaç nedir? (Genelde isteğiyle çelişir).",
    "Neden Şimdi?: Bu macera neden hayatının başka bir döneminde değil de tam şu an (en zayıf/çıkmaz anında) başına geliyor?",
    "Risk (Stakes): Hedefine ulaşamazsa başına gelebilecek en kötü şey nedir? (Dışsal, içsel ve felsefi yıkım).",
    "Ölümcül Kusur (Fatal Flaw): Kendi sonunu hazırlayabilecek veya başarısını engelleyen en büyük içsel zayıflığı nedir?"
  ],
  "KATMAN 3: Psikolojik Derinlik ve Sırlar (İç Dünya)": [
    "Çekirdek Yara (Ghost): Geçmişte yaşanmış, karakteri duygusal olarak sakatlayan o büyük travma nedir?",
    "Büyük Yalan: Yarası yüzünden kendisine inandırdığı o \"yanlış gerçek\" nedir? (Örn: \"Güçlü olmazsam sevilmem.\")",
    "En Büyük Korku: Geceleri onu uyutmayan, yüzleşmekten en çok kaçtığı şey nedir?",
    "Karanlık Sır: Ortaya çıkarsa her şeyi mahvedecek, başkalarından (ve belki kendinden) sakladığı sırrı ne?",
    "Değerler Terazisi: Kendi çıkarı ile inandığı değerler (dürüstlük, aile vb.) arasında kalsa hangisini seçer?"
  ],
  "KATMAN 4: Sosyolojik Yapı ve İlişkiler": [
    "Köken: Nerede, nasıl bir ailede yetişti? Ailenin \"altın çocuğu\" mu yoksa \"kara koyunu\" mu?",
    "Dünya Görüşü: Ona göre dünyanın işleyiş kuralı nedir? (Örn: \"Güçlü olan zayıfı ezer\" veya \"Herkes bir gün ihanet eder.\")",
    "Kırılma Noktası: Hayatındaki \"belirleyici an\" neydi? (Bir hayalin doğduğu veya öldüğü o an).",
    "Antagonist Bağlantısı: Karşıt karakter ona hangi aynayı tutuyor? Neden tam olarak o kişiyle çatışıyor?",
    "Sosyal Sınıf: Hangi sınıfa ait ve bu durum onun özgüvenini/davranışlarını nasıl etkiliyor?"
  ],
  "KATMAN 5: Davranış ve Reaksiyon (Saha Testi)": [
    "Kriz Anı: Önüne bir gaspçı çıksa veya beklenmedik bir felaket olsa vereceği ilk içgüdüsel tepki nedir?",
    "Özel Hayat: Kimse bakmıyorken, tek başınayken ne yapar? (Gerçek benliğinin ortaya çıktığı an).",
    "Hayır Diyebilmek: Bir şeye \"hayır\" derken kullandığı üslup nedir? (Pasif-agresif mi, sert mi, kıvrak mı?)",
    "Metafor: Onu simgeleyen görsel bir imge veya nesne nedir?",
    "Final Fedakarlığı: Hikayenin sonunda değiştiğini kanıtlamak için neyi feda etmeye hazır?"
  ]
};

interface CharacterBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function CharacterBibleModal({ isOpen, onClose, theme }: CharacterBibleModalProps) {
  const [characters, setCharacters] = useState<CharacterProfile[]>(() => {
    const saved = safeStorage.getItem('scriptHive_characterBible');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  
  const [projectName, setProjectName] = useState<string>(() => {
    return safeStorage.getItem('scriptHive_bibleProjectName') || 'İsimsiz Dizi/Proje';
  });

  const [activeId, setActiveId] = useState<string | null>(characters.length > 0 ? characters[0].id : null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [expandedKatmans, setExpandedKatmans] = useState<Record<string, boolean>>({
    "KATMAN 1: Vitrin ve Fiziksellik (Dış Dünya)": true
  });
  const [newQuestion, setNewQuestion] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (characters.length > 0) {
      safeStorage.setItem('scriptHive_characterBible', JSON.stringify(characters));
    } else {
      safeStorage.removeItem('scriptHive_characterBible');
    }
  }, [characters]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_bibleProjectName', projectName);
  }, [projectName]);

  if (!isOpen) return null;

  const activeCharacter = characters.find(c => c.id === activeId);

  const handleAddCharacter = () => {
    const newChar: CharacterProfile = {
      id: Date.now().toString(),
      name: `Yeni Karakter ${characters.length + 1}`,
      answers: {},
      customQuestions: []
    };
    setCharacters([...characters, newChar]);
    setActiveId(newChar.id);
  };

  const handleRemoveCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bu karakteri silmek istediğinize emin misiniz?")) {
      const newChars = characters.filter(c => c.id !== id);
      setCharacters(newChars);
      if (activeId === id) {
        setActiveId(newChars.length > 0 ? newChars[0].id : null);
      }
    }
  };

  const updateActiveCharacter = (updates: Partial<CharacterProfile>) => {
    setCharacters(chars => chars.map(c => 
      c.id === activeId ? { ...c, ...updates } : c
    ));
  };

  const handleAnswerChange = (question: string, value: string) => {
    if (!activeCharacter) return;
    updateActiveCharacter({
      answers: { ...activeCharacter.answers, [question]: value }
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCharacter) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Fotoğraf 2MB'tan küçük olmalıdır.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateActiveCharacter({ photoUrl: base64 });
    };
    reader.readAsDataURL(file);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCharacter || !newQuestion.trim()) return;
    if (activeCharacter.customQuestions.includes(newQuestion.trim())) return;
    
    updateActiveCharacter({
      customQuestions: [...activeCharacter.customQuestions, newQuestion.trim()]
    });
    setNewQuestion("");
  };

  const toggleKatman = (katman: string) => {
    setExpandedKatmans(prev => ({ ...prev, [katman]: !prev[katman] }));
  };

  const handleExplicitSave = () => {
    safeStorage.setItem('scriptHive_characterBible', JSON.stringify(characters));
    safeStorage.setItem('scriptHive_bibleProjectName', projectName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportProject = () => {
    const data = {
      projectName,
      characters
    };
    downloadUtf8File(JSON.stringify(data, null, 2), `${projectName.replace(/\s+/g, '_')}_Karakterleri.json`, 'application/json;charset=utf-8');
  };

  const handleExportDOCX = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      const docChildren: any[] = [
        new Paragraph({
          children: [new TextRun({ text: `KARAKTER REHBERİ: ${projectName}`, bold: true, size: 36, font: "Arial" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `Toplam Karakter: ${characters.length}  |  Tarih: ${new Date().toLocaleDateString('tr-TR')}`, italics: true, size: 20, color: "64748B", font: "Arial" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 350 }
        })
      ];
      
      characters.forEach((char, index) => {
        if (index > 0) {
          docChildren.push(new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 200 } }));
        }

        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `👤 ${char.name || 'İsimsiz Karakter'}`, bold: true, size: 28, color: "1E40AF", font: "Arial" })],
          spacing: { before: 240, after: 140 }
        }));
        
        Object.entries(PREDEFINED_QUESTIONS).forEach(([katman, questions]) => {
          docChildren.push(new Paragraph({
            children: [new TextRun({ text: katman, bold: true, size: 22, color: "0F172A", font: "Arial" })],
            spacing: { before: 180, after: 100 }
          }));

          questions.forEach((q) => {
            docChildren.push(new Paragraph({
              children: [new TextRun({ text: `• ${q}`, bold: true, size: 18, color: "334155", font: "Arial" })],
              spacing: { before: 80, after: 40 }
            }));
            const answerLines = ((char.answers && char.answers[q]) || '(Henüz bir yanıt girilmedi.)').split('\n');
            answerLines.forEach((al: string) => {
              docChildren.push(new Paragraph({
                children: [new TextRun({ text: al, size: 18, font: "Arial", color: "1E293B" })],
                indent: { left: 240 },
                spacing: { after: 40 }
              }));
            });
          });
        });

        if (char.customQuestions && char.customQuestions.length > 0) {
           docChildren.push(new Paragraph({
             children: [new TextRun({ text: "Özel Sorular", bold: true, size: 22, color: "0F172A", font: "Arial" })],
             spacing: { before: 180, after: 100 }
           }));
           char.customQuestions.forEach((q: string) => {
             docChildren.push(new Paragraph({
               children: [new TextRun({ text: `• ${q}`, bold: true, size: 18, color: "334155", font: "Arial" })],
               spacing: { before: 80, after: 40 }
             }));
             const answerLines = ((char.answers && char.answers[q]) || '(Henüz bir yanıt girilmedi.)').split('\n');
             answerLines.forEach((al: string) => {
               docChildren.push(new Paragraph({
                 children: [new TextRun({ text: al, size: 18, font: "Arial", color: "1E293B" })],
                 indent: { left: 240 },
                 spacing: { after: 40 }
               }));
             });
           });
        }
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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_karakterler.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert("DOCX dışa aktarma hatası: " + (e.message || String(e)));
    }
  };

  const handleExportMarkdown = () => {
    let md = `# KARAKTER REHBERİ: ${projectName}\n\n`;
    md += `* **Toplam Karakter:** ${characters.length}\n`;
    md += `* **Oluşturulma Tarihi:** ${new Date().toLocaleDateString('tr-TR')}\n\n---\n\n`;

    characters.forEach(char => {
      md += `## 👤 ${char.name || 'İsimsiz Karakter'}\n\n`;
      Object.entries(PREDEFINED_QUESTIONS).forEach(([katman, questions]) => {
        md += `### ${katman}\n\n`;
        questions.forEach(q => {
          const ans = (char.answers && char.answers[q]) || '_Henüz yanıt girilmedi._';
          md += `**${q}**\n\n${ans}\n\n`;
        });
      });
      if (char.customQuestions && char.customQuestions.length > 0) {
        md += `### Özel Sorular\n\n`;
        char.customQuestions.forEach(q => {
          const ans = (char.answers && char.answers[q]) || '_Henüz yanıt girilmedi._';
          md += `**${q}**\n\n${ans}\n\n`;
        });
      }
      md += `---\n\n`;
    });

    downloadUtf8File(md, `${projectName.replace(/\s+/g, '_')}_Karakterleri.md`, 'text/markdown;charset=utf-8');
  };

  const handleExportPDF = () => {
    let bodyHtml = `
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-val">${characters.length}</div>
          <div class="stat-lbl">Karakter Profili</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">5 Katman</div>
          <div class="stat-lbl">Derinlik Mimarisi</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">20+</div>
          <div class="stat-lbl">Psikolojik Parametre</div>
        </div>
      </div>
    `;

    characters.forEach((char, idx) => {
      bodyHtml += `
        <div style="${idx > 0 ? 'page-break-before: always; margin-top: 30px;' : ''}">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
            ${char.photoUrl ? `<img src="${char.photoUrl}" alt="${escapeHtml(char.name)}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb;" />` : `<div style="width: 50px; height: 50px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-size: 18pt; font-weight: bold;">${escapeHtml((char.name || 'K')[0].toUpperCase())}</div>`}
            <div>
              <h2 style="font-size: 16pt; font-weight: 800; color: #0f172a; margin-bottom: 2px;">${escapeHtml(char.name || 'İsimsiz Karakter')}</h2>
              <div style="font-size: 8.5pt; color: #64748b; font-weight: 600; text-transform: uppercase;">Karakter Dosyası • ${escapeHtml(projectName)}</div>
            </div>
          </div>
      `;

      Object.entries(PREDEFINED_QUESTIONS).forEach(([katman, questions]) => {
        bodyHtml += `<div class="section-title"><span>✦</span> ${escapeHtml(katman)}</div>`;
        questions.forEach(q => {
          const ans = char.answers && char.answers[q];
          bodyHtml += `
            <div class="card">
              <div style="font-size: 9.5pt; font-weight: 700; color: #1e293b; margin-bottom: 6px;">${escapeHtml(q)}</div>
              <div class="writer-note">
                ${ans ? escapeHtml(ans) : '<em style="color: #94a3b8;">(Bu soru için henüz bir detay girilmedi.)</em>'}
              </div>
            </div>
          `;
        });
      });

      if (char.customQuestions && char.customQuestions.length > 0) {
        bodyHtml += `<div class="section-title"><span>✦</span> Özel Sorular</div>`;
        char.customQuestions.forEach(q => {
          const ans = char.answers && char.answers[q];
          bodyHtml += `
            <div class="card">
              <div style="font-size: 9.5pt; font-weight: 700; color: #1e293b; margin-bottom: 6px;">${escapeHtml(q)}</div>
              <div class="writer-note">
                ${ans ? escapeHtml(ans) : '<em style="color: #94a3b8;">(Bu soru için henüz bir detay girilmedi.)</em>'}
              </div>
            </div>
          `;
        });
      }

      bodyHtml += `</div>`;
    });

    printStyledDocument({
      title: `Karakter Rehberi: ${projectName}`,
      categoryBadge: 'Karakter İncili (Bible)',
      subtitle: `${characters.length} Karakter Profili ve Psikolojik Derinlik Çizelgesi`,
      bodyHtml,
      accentColor: '#2563eb'
    });
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          if (data.characters && Array.isArray(data.characters)) {
            setProjectName(data.projectName || 'İçeri Aktarılan Proje');
            setCharacters(data.characters);
            if (data.characters.length > 0) {
              setActiveId(data.characters[0].id);
            }
            return;
          }
        }

        // Parse Markdown or text file
        const lines = content.split(/\r?\n/);
        const importedChars: CharacterProfile[] = [];
        let currentChar: CharacterProfile | null = null;
        let currentQuestion: string = '';
        let currentAnswerLines: string[] = [];

        const saveCurrentQA = () => {
          if (currentChar && currentQuestion) {
            currentChar.answers[currentQuestion] = currentAnswerLines.join('\n').trim();
            currentQuestion = '';
            currentAnswerLines = [];
          }
        };

        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# KARAKTER REHBERİ:')) {
            const pName = trimmed.replace('# KARAKTER REHBERİ:', '').trim();
            if (pName) setProjectName(pName);
          } else if (trimmed.startsWith('## ')) {
            saveCurrentQA();
            const charName = trimmed.replace(/^##\s*/, '').trim();
            currentChar = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              name: charName,
              answers: {},
              customQuestions: []
            };
            importedChars.push(currentChar);
          } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            saveCurrentQA();
            currentQuestion = trimmed.replace(/^\*\*|\*\*$/g, '').trim();
          } else if (trimmed.startsWith('### ')) {
            saveCurrentQA();
          } else if (currentChar && currentQuestion) {
            currentAnswerLines.push(line);
          }
        });
        saveCurrentQA();

        if (importedChars.length > 0) {
          setCharacters(importedChars);
          setActiveId(importedChars[0].id);
        } else {
          alert("Dosyada tanınabilir karakter başlığı (örn: ## Karakter Adı) bulunamadı.");
        }
      } catch (err) {
        alert("Dosya okunurken bir hata oluştu. Doğru formatta olduğundan emin olun.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const bg = theme === 'dark' ? 'bg-[#1a1f25] text-slate-200' : 'bg-[#e8e0d5] text-slate-900';
  const panelBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640]' : 'bg-[#FFFFF0] border-[#c8bea8]';
  const overlayBg = 'bg-black/60 backdrop-blur-sm';
  const inputBg = theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640] text-slate-100 placeholder-slate-500' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900 placeholder-slate-400';

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 ${overlayBg}`} onClick={onClose}>
      <div 
        className={`relative w-full max-w-6xl h-full flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl border ${panelBg}`} 
        onClick={e => e.stopPropagation()}
      >
        <input type="file" ref={fileInputRef} onChange={handleImportProject} accept=".json,.md,.txt,.markdown" className="hidden" onClick={(e) => e.stopPropagation()} />
        <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" onClick={(e) => e.stopPropagation()} />
        
        {/* Sol Panel: Karakter Listesi */}
        <div className={`w-full md:w-64 shrink-0 flex flex-col border-r ${theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]'}`}>
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'} flex flex-col gap-3`}>
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Dizi/Proje Adı"
              className={`w-full text-lg font-bold bg-transparent border-b-2 border-transparent hover:border-slate-400/40 focus:border-[#6ba3e8] focus:outline-none transition-colors pb-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
            />
            <div className="flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2 text-sm opacity-75">
                <Users size={16} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
                Karakterler
              </h2>
              <div className="flex gap-1">
                <button onClick={handleAddCharacter} className={`p-1.5 rounded-lg text-white transition-colors ml-1 ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-bold hover:bg-[#82b4f0]' : 'bg-blue-700 hover:bg-blue-800'}`} title="Yeni Karakter">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {characters.length === 0 ? (
              <div className="text-center p-4 text-sm opacity-50">Henüz karakter eklenmedi.</div>
            ) : (
              characters.map(char => (
                <div 
                  key={char.id}
                  onClick={() => setActiveId(char.id)}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors group ${
                    activeId === char.id 
                      ? (theme === 'dark' ? 'bg-[#252c33] text-[#6ba3e8] font-bold shadow-sm' : 'bg-[#dfd7ca] text-slate-950 font-bold shadow-sm') 
                      : (theme === 'dark' ? 'hover:bg-[#252c33]/50' : 'hover:bg-[#dfd7ca]/50')
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 ${theme === 'dark' ? 'bg-[#252c33]' : 'bg-[#dfd7ca]'} flex items-center justify-center`}>
                    {char.photoUrl ? (
                      <img src={char.photoUrl} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={14} className="opacity-50" />
                    )}
                  </div>
                  <span className="truncate flex-1 font-medium text-sm">{char.name}</span>
                  <button 
                    onClick={(e) => handleRemoveCharacter(char.id, e)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all rounded-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ Panel: Karakter Detayı */}
        <div className={`flex-1 flex flex-col h-full relative ${theme === 'dark' ? 'bg-[#20272e]' : 'bg-[#FFFFF0]'}`}>
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 flex-wrap justify-end">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'dark' ? 'hover:bg-[#252c33] bg-[#252c33]/70 border border-[#2d3640] text-slate-200' : 'hover:bg-[#dfd7ca] bg-[#FFFFF0] border border-[#c8bea8] text-slate-800'}`}
              title="Karakterleri içe aktar (.json, .md, .txt)"
            >
              <Upload size={14} /> İçe Aktar
            </button>
            <button 
              onClick={handleExportProject}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'dark' ? 'hover:bg-[#252c33] bg-[#252c33]/70 border border-[#2d3640] text-slate-200' : 'hover:bg-[#dfd7ca] bg-[#FFFFF0] border border-[#c8bea8] text-slate-800'}`}
              title="JSON olarak dışa aktar"
            >
              <Download size={14} /> .json
            </button>
            <button 
              onClick={handleExportMarkdown}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'dark' ? 'hover:bg-[#252c33] bg-[#252c33]/70 border border-[#2d3640] text-slate-200' : 'hover:bg-[#dfd7ca] bg-[#FFFFF0] border border-[#c8bea8] text-slate-800'}`}
              title="Markdown olarak dışa aktar"
            >
              <Download size={14} /> .md
            </button>
            <button 
              onClick={handleExportDOCX}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'dark' ? 'hover:bg-[#252c33] bg-[#252c33]/70 border border-[#2d3640] text-slate-200' : 'hover:bg-[#dfd7ca] bg-[#FFFFF0] border border-[#c8bea8] text-slate-800'}`}
              title="Word dosyası olarak dışa aktar"
            >
              <Download size={14} /> .docx
            </button>
            <button 
              onClick={handleExportPDF}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'dark' ? 'hover:bg-[#252c33] bg-[#252c33]/70 border border-[#2d3640] text-slate-200' : 'hover:bg-[#dfd7ca] bg-[#FFFFF0] border border-[#c8bea8] text-slate-800'}`}
              title="PDF olarak yazdır"
            >
              <Download size={14} /> .pdf
            </button>
            
            <div className={`w-px h-6 mx-1 ${theme === 'dark' ? 'bg-[#2d3640]' : 'bg-[#c8bea8]'}`}></div>

            {activeCharacter && (
               <button 
                 onClick={handleExplicitSave}
                 disabled={isSaved}
                 className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSaved ? 'bg-emerald-500/15 text-emerald-400' : (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8] hover:bg-[#6ba3e8]/30' : 'bg-blue-600/15 text-blue-700 hover:bg-blue-600/25')}`}
               >
                 {isSaved ? <Check size={14} /> : <Save size={14} />}
                 {isSaved ? 'Kaydedildi' : 'Kaydet'}
               </button>
            )}
            
            <button 
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ml-1 ${theme === 'dark' ? 'hover:bg-[#2d3640] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
              title="Kapat"
            >
              <X size={18} />
            </button>
          </div>

          {activeCharacter ? (
            <div className="flex-1 overflow-y-auto p-6 md:p-10 hide-scrollbar pb-32">
              
              {/* Header: Photo & Name */}
              <div className="flex flex-col md:flex-row gap-6 items-start mb-10 mt-6">
                <div className="flex flex-col items-center shrink-0 gap-3">
                  <div 
                    onClick={() => photoInputRef.current?.click()}
                    className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'border-[#2d3640] hover:border-[#6ba3e8] bg-[#252c33]' : 'border-[#c8bea8] hover:border-blue-600 bg-[#f4efe4]'} flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative transition-colors`}
                  >
                    {activeCharacter.photoUrl ? (
                      <>
                        <img src={activeCharacter.photoUrl} alt={activeCharacter.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImagePlus className="text-white" size={24} />
                        </div>
                      </>
                    ) : (
                      <div className="text-center opacity-50 group-hover:opacity-100 group-hover:text-blue-500 transition-colors">
                        <ImagePlus size={32} className="mx-auto mb-2" />
                        <span className="text-xs font-medium">Fotoğraf<br/>Alanı</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => photoInputRef.current?.click()}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8] hover:bg-[#6ba3e8]/25' : 'bg-blue-600/10 text-blue-700 hover:bg-blue-600/20'}`}
                  >
                    {activeCharacter.photoUrl ? 'Fotoğrafı Değiştir' : 'Fotoğraf Ekle'}
                  </button>
                </div>

                <div className="flex-1 w-full mt-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1 block">Karakter Adı Soyadı</label>
                  <input 
                    type="text" 
                    value={activeCharacter.name}
                    onChange={(e) => updateActiveCharacter({ name: e.target.value })}
                    className={`w-full text-3xl md:text-4xl font-bold bg-transparent border-b-2 border-transparent hover:border-slate-400/40 focus:border-[#6ba3e8] focus:outline-none transition-colors pb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                    placeholder="İsim Girin..."
                  />
                </div>
              </div>

              {/* Katmanlar (Sorular) */}
              <div className="space-y-6 max-w-4xl">
                {Object.entries(PREDEFINED_QUESTIONS).map(([katmanTitle, questions]) => {
                  const isExpanded = expandedKatmans[katmanTitle];
                  const filled = questions.filter(q => activeCharacter.answers[q]?.trim()).length;
                  const total = questions.length;

                  return (
                    <div key={katmanTitle} className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-[#252c33] border-[#2d3640]' : 'bg-[#f4efe4] border-[#c8bea8]'}`}>
                      <button 
                        onClick={() => toggleKatman(katmanTitle)}
                        className={`w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          <h3 className="font-bold text-base md:text-lg">{katmanTitle}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium opacity-60 bg-black/10 dark:bg-white/10 px-2.5 py-1 rounded-full">
                            {filled}/{total} Tamamlandı
                          </span>
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 pt-0 space-y-6">
                          <div className={`h-px w-full mb-6 ${theme === 'dark' ? 'bg-[#2d3640]' : 'bg-[#c8bea8]'}`} />
                          {questions.map((q, idx) => (
                            <div key={idx} className="space-y-2">
                              <label className="block text-sm font-semibold opacity-90 pl-1 leading-snug">
                                {q}
                              </label>
                              <textarea 
                                value={activeCharacter.answers[q] || ""}
                                onChange={(e) => handleAnswerChange(q, e.target.value)}
                                className={`w-full p-3 rounded-xl border focus:outline-none resize-none min-h-[80px] text-sm ${inputBg}`}
                                placeholder="Yanıtınızı buraya yazın..."
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Özel Sorular */}
                <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-[#252c33] border-[#2d3640]' : 'bg-[#f4efe4] border-[#c8bea8]'}`}>
                  <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`}>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Plus size={20} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
                      Sizin Eklediğiniz Özel Sorular
                    </h3>
                  </div>
                  <div className="p-4 space-y-6">
                    {activeCharacter.customQuestions.map((q, idx) => (
                      <div key={idx} className="space-y-2 relative group">
                        <label className="block text-sm font-semibold opacity-90 pl-1 pr-8 leading-snug">
                          {q}
                        </label>
                        <button 
                          onClick={() => {
                            if(confirm("Bu soruyu silmek istediğinize emin misiniz?")) {
                              updateActiveCharacter({
                                customQuestions: activeCharacter.customQuestions.filter(cq => cq !== q)
                              });
                            }
                          }}
                          className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        <textarea 
                          value={activeCharacter.answers[q] || ""}
                          onChange={(e) => handleAnswerChange(q, e.target.value)}
                          className={`w-full p-3 rounded-xl border focus:outline-none resize-none min-h-[80px] text-sm ${inputBg}`}
                          placeholder="Yanıtınızı buraya yazın..."
                        />
                      </div>
                    ))}
                    
                    <form onSubmit={handleAddCustomQuestion} className="flex gap-2 pt-4">
                      <input 
                        type="text"
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        placeholder="Yeni bir karakter sorusu üretin..."
                        className={`flex-1 p-3 rounded-xl border text-sm focus:outline-none ${inputBg}`}
                      />
                      <button 
                        type="submit"
                        disabled={!newQuestion.trim()}
                        className={`px-4 py-2 text-white rounded-xl font-medium disabled:opacity-50 transition-colors whitespace-nowrap ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-bold hover:bg-[#82b4f0]' : 'bg-blue-700 hover:bg-blue-800'}`}
                      >
                        Soru Ekle
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 p-6 text-center">
              <Users size={64} className="mb-4 text-blue-500 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Karakter İncili (Bible)</h3>
              <p className="max-w-md">Karakterlerinizin psikolojik derinliklerini, zaaflarını ve ilişkilerini tasarlamak için sol taraftan yeni bir karakter ekleyin veya .md dosyası içe aktarın.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
