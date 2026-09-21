import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, Send, Copy, Check, CornerDownLeft, 
  Trash2, RotateCcw, ZoomIn, ZoomOut, Sun, Moon, 
  Key, BookOpen, AlertCircle, RefreshCw, Wand2,
  Sliders, MessageSquare, History, FileText
} from 'lucide-react';
import { ScreenplayElement, ElementType, ScreenplayFormat, BinItem } from '../types';
import { safeStorage } from '../lib/storage';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  suggestedType?: ElementType;
  timestamp: number;
}

interface RightSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'ai' | 'history' | 'settings' | null;
  setActiveTab: (tab: 'ai' | 'history' | 'settings' | null) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  elements: ScreenplayElement[];
  focusedElement: ScreenplayElement | null;
  onInsertElement: (type: ElementType, content: string) => void;
  onUpdateFocusedElement: (content: string) => void;
  bin: BinItem[];
  onRestoreBinItem: (item: BinItem) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  format: ScreenplayFormat;
  setFormat: (format: ScreenplayFormat) => void;
  onOpenGuide: () => void;
}

export default function RightSidebarDrawer({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  elements,
  focusedElement,
  onInsertElement,
  onUpdateFocusedElement,
  bin,
  onRestoreBinItem,
  zoom,
  setZoom,
  fontSize,
  setFontSize,
  format,
  setFormat,
  onOpenGuide
}: RightSidebarDrawerProps) {
  // AI State
  const [apiKey, setApiKey] = useState<string>(() => {
    return safeStorage.getItem('scriptHive_gemini_api_key') || (process.env.GEMINI_API_KEY as string) || '';
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = safeStorage.getItem('scriptHive_ai_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Merhaba! Ben ScriptHive Senaryo Asistanınızım. 🎬\n\nSize sahneler oluşturmada, diyalog alternatifleri yazmada veya olay örgüsünü geliştirmede yardımcı olabilirim. Aşağıdaki şablonları deneyebilir veya doğrudan soru sorabilirsiniz!',
        timestamp: Date.now()
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      safeStorage.setItem('scriptHive_ai_messages', JSON.stringify(messages.slice(-30)));
    }
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key.trim());
    safeStorage.setItem('scriptHive_gemini_api_key', key.trim());
    setShowApiKeyInput(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim()) return;

    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInputPrompt('');
    setIsLoading(true);

    try {
      const recentContext = elements.slice(-15).map(e => `${e.type.toUpperCase()}: ${e.content}`).join('\n');
      const focusedContext = focusedElement 
        ? `\nŞu an yazarın seçtiği satır: [${focusedElement.type.toUpperCase()}]: "${focusedElement.content}"`
        : '';

      const systemInstruction = `Sen profesyonel, yaratıcı ve deneyimli bir senarist ve senaryo doktorusun (Script Doctor). 
Kullanıcıya film/dizi senaryosu yazımında yardımcı olacaksın.
Senaryo formatlama kurallarına (Sahne Başlığı, Eylem, Karakter, Diyalog, Parantez İçi, Geçiş) hakimsin.
Yanıtların kısa, etkili, sinematik ve doğrudan senaryoya yapıştırılmaya uygun olsun.
Türkçe dili kurallarına ve sokak/günlük konuşma doğallığına uygun yaz.`;

      const fullPrompt = `${systemInstruction}\n\nSenaryonun Son Kısmı:\n${recentContext}${focusedContext}\n\nYazarın İsteği:\n${promptToSend}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiText = data.candidates[0].content.parts[0].text.trim();
        
        let suggestedType: ElementType = 'action';
        if (focusedElement) {
          suggestedType = focusedElement.type;
        } else if (promptToSend.toLowerCase().includes('diyalog')) {
          suggestedType = 'dialogue';
        } else if (promptToSend.toLowerCase().includes('sahne')) {
          suggestedType = 'scene';
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: aiText,
          suggestedType,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else if (data.error) {
        throw new Error(data.error.message || 'API Hatası');
      } else {
        throw new Error('Yanıt alınamadı.');
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ Bir hata oluştu: ${error.message || 'Lütfen API anahtarınızı kontrol edin.'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !activeTab) return null;

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640] text-slate-200' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900';
  const headerBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]';
  const cardBg = theme === 'dark' ? 'bg-[#252c33] border-[#2d3640]' : 'bg-[#f4efe4] border-[#c8bea8]';
  const inputClass = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640] text-white placeholder-slate-500' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900 placeholder-slate-500';
  const tabActive = theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-bold shadow-sm' : 'bg-blue-700 text-white font-bold shadow-sm';
  const tabInactive = theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-[#252c33]' : 'text-slate-600 hover:text-slate-950 hover:bg-[#dfd7ca]';

  return (
    <div className={`w-80 md:w-96 border-l flex flex-col h-full shrink-0 shadow-2xl z-40 transition-all duration-300 ${bgClass}`}>
      {/* Header with Tabs */}
      <div className={`p-3 border-b flex items-center justify-between ${headerBg}`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'ai' ? tabActive : tabInactive
            }`}
          >
            <Sparkles size={14} className={activeTab === 'ai' ? 'animate-pulse' : ''} />
            AI Asistan
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'history' ? tabActive : tabInactive
            }`}
          >
            <History size={14} />
            Geçmiş & Çöp
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'settings' ? tabActive : tabInactive
            }`}
          >
            <Sliders size={14} />
            Ayarlar
          </button>
        </div>

        <button 
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Paneli Kapat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ======================= AI TAB ======================= */}
        {activeTab === 'ai' && (
          <div className="flex flex-col h-full space-y-3">
            {/* API Key Banner / Settings */}
            {!apiKey || showApiKeyInput ? (
              <div className={`p-3 rounded-xl border ${cardBg} space-y-2 text-xs`}>
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5 text-amber-500">
                    <Key size={14} /> Gemini API Anahtarı
                  </span>
                  {apiKey && (
                    <button onClick={() => setShowApiKeyInput(false)} className="text-slate-400 hover:text-slate-600">
                      Kapat
                    </button>
                  )}
                </div>
                <p className="opacity-75 leading-relaxed">
                  Yapay zeka asistanını kullanmak için ücretsiz bir Google AI Studio API anahtarı girin.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    defaultValue={apiKey}
                    placeholder="AIzaSy..."
                    id="gemini-key-input"
                    className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs outline-none ${inputClass}`}
                  />
                  <button
                    onClick={() => {
                      const val = (document.getElementById('gemini-key-input') as HTMLInputElement)?.value;
                      if (val) handleSaveApiKey(val);
                    }}
                    className={`px-3 py-1.5 font-medium rounded-lg text-xs transition-colors ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-bold hover:bg-[#82b4f0]' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
                  >
                    Kaydet
                  </button>
                </div>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-block text-[11px] text-[#6ba3e8] hover:underline pt-1"
                >
                  🔑 Ücretsiz API Key Al (Google AI Studio) →
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1 text-xs opacity-80">
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <Check size={12} /> Gemini 1.5 Flash Aktif
                </span>
                <button 
                  onClick={() => setShowApiKeyInput(true)} 
                  className="hover:underline text-[11px] opacity-75 hover:opacity-100"
                >
                  API Key Değiştir
                </button>
              </div>
            )}

            {/* Context Widget (Focused element) */}
            {focusedElement && (
              <div className={`p-2.5 rounded-xl border ${cardBg} space-y-1 text-xs`}>
                <div className="flex items-center justify-between text-[11px] opacity-60 font-semibold uppercase tracking-wider">
                  <span>Seçili Satır ({focusedElement.type})</span>
                </div>
                <div className="font-mono text-xs opacity-90 truncate italic">
                  "{focusedElement.content || '(Boş satır)'}"
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  <button
                    onClick={() => handleSendMessage(`Şu anki "${focusedElement.content}" repliği için 3 farklı ve vurucu alternatif diyalog öner.`)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8] hover:bg-[#6ba3e8]/25' : 'bg-blue-600/10 text-blue-700 hover:bg-blue-600/20'}`}
                  >
                    Alternatif Diyalog
                  </button>
                  <button
                    onClick={() => handleSendMessage(`"${focusedElement.content}" satırındaki eylemi sinematik bir dille daha zengin ve görsel olarak betimle.`)}
                    className="px-2 py-1 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 rounded text-[11px] font-medium transition-colors"
                  >
                    Eylemi Genişlet
                  </button>
                  <button
                    onClick={() => handleSendMessage(`Bu sahneye gerilim ve merak uyandırıcı bir çatışma unsuru ekle.`)}
                    className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 rounded text-[11px] font-medium transition-colors"
                  >
                    Çatışma Ekle
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                      msg.sender === 'user' 
                        ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-medium rounded-tr-none shadow-sm' : 'bg-blue-700 text-white rounded-tr-none shadow-sm')
                        : `${cardBg} rounded-tl-none border shadow-sm`
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                    {msg.sender === 'ai' && msg.id !== 'welcome' && (
                      <div className="flex items-center gap-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="p-1 opacity-60 hover:opacity-100 transition-opacity"
                          title="Kopyala"
                        >
                          {copiedId === msg.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>

                        <button
                          onClick={() => onInsertElement(msg.suggestedType || 'action', msg.text)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ml-auto ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8] hover:bg-[#6ba3e8]/25' : 'bg-blue-600/15 text-blue-700 hover:bg-blue-600/25'}`}
                          title="Senaryonun sonuna ekle"
                        >
                          <CornerDownLeft size={11} /> Senaryoya Ekle
                        </button>

                        {focusedElement && (
                          <button
                            onClick={() => onUpdateFocusedElement(msg.text)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded text-[10px] font-semibold transition-colors"
                            title="Seçili satırın içeriğini bu metinle değiştir"
                          >
                            <Wand2 size={11} /> Seçiliyi Güncelle
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-[#6ba3e8] animate-pulse p-2">
                  <Sparkles size={14} /> Asistan yazıyor...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <button
                onClick={() => handleSendMessage('Bu sahne için karakterler arasında bir gerilim yaratacak 2 diyalog alternatifi yaz.')}
                className={`px-2.5 py-1 rounded-full border shrink-0 transition-colors ${cardBg} hover:border-[#6ba3e8]`}
              >
                🎭 Diyalog Yaz
              </button>
              <button
                onClick={() => handleSendMessage('Son sahnenin mekan betimlemesini ve atmosferini daha görsel ve vurucu hale getir.')}
                className={`px-2.5 py-1 rounded-full border shrink-0 transition-colors ${cardBg} hover:border-[#6ba3e8]`}
              >
                🎬 Atmosfer Detaylandır
              </button>
              <button
                onClick={() => handleSendMessage('Senaryonun şu ana kadarki olay akışını analiz et ve sonraki sahne için 3 yaratıcı fikir öner.')}
                className={`px-2.5 py-1 rounded-full border shrink-0 transition-colors ${cardBg} hover:border-[#6ba3e8]`}
              >
                💡 Sonraki Sahne Fikri
              </button>
            </div>

            {/* Prompt Input */}
            <div className="relative flex items-center pt-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Senaryo hakkında soru sor veya talimat yaz..."
                className={`w-full pl-3 pr-10 py-2.5 rounded-xl border text-xs outline-none focus:border-[#6ba3e8] transition-colors ${inputClass}`}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputPrompt.trim()}
                className={`absolute right-1.5 p-1.5 rounded-lg disabled:opacity-40 transition-all shadow-sm ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-bold hover:bg-[#82b4f0]' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ======================= HISTORY & BIN TAB ======================= */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">
                Silinenler & Alternatifler ({bin.length})
              </h4>
            </div>

            {bin.length === 0 ? (
              <div className="p-8 text-center opacity-50 space-y-2">
                <Trash2 size={28} className="mx-auto opacity-40" />
                <p className="text-xs">Çöp kutusu boş. Silinen veya alternatif olarak saklanan satırlar burada görünür.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {bin.map(item => (
                  <div key={item.id} className={`p-3 rounded-xl border ${cardBg} space-y-2 text-xs`}>
                    <div className="flex items-center justify-between text-[11px] opacity-60">
                      <span className="font-semibold uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                        {item.element.type}
                      </span>
                      <span>{new Date(item.deletedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <p className="font-mono text-xs line-clamp-3">
                      {item.element.content || '(Boş)'}
                    </p>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onRestoreBinItem(item)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shadow-sm ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-bold hover:bg-[#82b4f0]' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
                      >
                        <RotateCcw size={12} /> Geri Yükle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= SETTINGS TAB ======================= */}
        {activeTab === 'settings' && (
          <div className="space-y-5 text-xs">
            {/* Sayfa Yakınlaştırma */}
            <div className={`p-3 rounded-xl border ${cardBg} space-y-2`}>
              <div className="flex items-center justify-between font-semibold">
                <span>Sayfa Yakınlaştırma (Zoom)</span>
                <span className="text-[#6ba3e8] font-mono">%{zoom}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-1.5 rounded-lg border border-slate-400/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <ZoomOut size={14} />
                </button>
                <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  step="5" 
                  value={zoom} 
                  onChange={e => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[#6ba3e8] cursor-pointer"
                />
                <button 
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  className="p-1.5 rounded-lg border border-slate-400/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            {/* Senaryo Formatı */}
            <div className={`p-3 rounded-xl border ${cardBg} space-y-2`}>
              <div className="font-semibold">Senaryo Biçimlendirme Standardı</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat('US')}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    format === 'US' 
                      ? (theme === 'dark' ? 'border-[#6ba3e8] bg-[#6ba3e8]/15 text-[#6ba3e8] font-bold' : 'border-blue-700 bg-blue-50 text-blue-800 font-bold')
                      : 'hover:bg-black/5 dark:hover:bg-white/5 border-slate-400/20'
                  }`}
                >
                  🇺🇸 Amerikan (US)
                </button>
                <button
                  onClick={() => setFormat('FR')}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    format === 'FR' 
                      ? (theme === 'dark' ? 'border-[#6ba3e8] bg-[#6ba3e8]/15 text-[#6ba3e8] font-bold' : 'border-blue-700 bg-blue-50 text-blue-800 font-bold')
                      : 'hover:bg-black/5 dark:hover:bg-white/5 border-slate-400/20'
                  }`}
                >
                  🇫🇷 Fransız (FR)
                </button>
              </div>
            </div>

            {/* Tema Değiştir */}
            <div className={`p-3 rounded-xl border ${cardBg} flex items-center justify-between`}>
              <span className="font-semibold">Arayüz Teması</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-400/20 hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors"
              >
                {theme === 'dark' ? <><Sun size={14} className="text-amber-400" /> Açık Moda Geç</> : <><Moon size={14} className="text-blue-500" /> Koyu Moda Geç</>}
              </button>
            </div>

            {/* Kılavuz & Yardım Butonu */}
            <button
              onClick={onOpenGuide}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-400/20 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors"
            >
              <BookOpen size={15} /> Kısayollar ve Yazım Kılavuzu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
