import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Copy, Check, Plus, RefreshCw, X, 
  Settings2, Bot, Trash2, Key, Globe, ChevronDown, 
  ArrowRight, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { ScreenplayElement, ElementType } from '../types';
import { safeStorage } from '../lib/storage';

export type AiProvider = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'mistral' | 'openrouter' | 'custom';

interface ModelOption {
  id: string;
  name: string;
  desc: string;
}

export const PROVIDER_MODELS: Record<AiProvider, ModelOption[]> = {
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'En yeni ve ultra hızlı Google modeli' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Gelişmiş senaryo analizi ve yaratıcılık' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Hızlı ve dengeli' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', desc: 'En yetenekli amiral gemisi model' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Hızlı, hafif ve ekonomik' },
    { id: 'o3-mini', name: 'o3 Mini', desc: 'Gelişmiş olay örgüsü ve mantık' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: 'Kapsamlı metin üretimi' },
  ],
  claude: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: 'Edebi kalite ve diyalog doğallığında lider' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Ultra hızlı tepki süresi' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', desc: 'Derin karakter ve sahne çözümlemesi' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)', desc: 'Yüksek kaliteli genel ve yaratıcı yazım' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)', desc: 'Derin düşünce ve olay örgüsü kurgulama' },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large', desc: 'Avrupa merkezli güçlü büyük model' },
    { id: 'mistral-small-latest', name: 'Mistral Small', desc: 'Hızlı ve tutarlı' },
    { id: 'codestral-latest', name: 'Codestral', desc: 'Hızlı metin üretimi' },
  ],
  openrouter: [
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OpenRouter)', desc: 'OpenRouter üzerinden Gemini' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', desc: 'OpenRouter üzerinden Claude' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (OpenRouter)', desc: 'OpenRouter üzerinden OpenAI' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)', desc: 'OpenRouter üzerinden DeepSeek R1' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OpenRouter)', desc: 'Açık kaynak Meta Llama' },
  ],
  custom: [
    { id: 'default', name: 'Özel / Yerel Model', desc: 'Ollama, LM Studio veya uyumlu API' }
  ]
};

const PROVIDER_NAMES: Record<AiProvider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI (ChatGPT)',
  claude: 'Anthropic Claude',
  deepseek: 'DeepSeek',
  mistral: 'Mistral AI',
  openrouter: 'OpenRouter',
  custom: 'Özel / Yerel (Ollama vb.)'
};

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  suggestedType?: ElementType;
  timestamp: number;
}

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  elements: ScreenplayElement[];
  focusedElement: ScreenplayElement | null;
  onInsertElement: (type: ElementType, content: string) => void;
  onUpdateFocusedElement: (content: string) => void;
}

export default function AiAssistantModal({
  isOpen,
  onClose,
  theme,
  elements,
  focusedElement,
  onInsertElement,
  onUpdateFocusedElement
}: AiAssistantModalProps) {
  // Provider and Keys state
  const [provider, setProvider] = useState<AiProvider>(() => {
    return (safeStorage.getItem('scriptHive_ai_provider') as AiProvider) || 'gemini';
  });
  
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = safeStorage.getItem('scriptHive_ai_model');
    if (saved) return saved;
    return PROVIDER_MODELS.gemini[0].id;
  });

  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const saved = safeStorage.getItem('scriptHive_ai_keys');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const oldGemini = safeStorage.getItem('scriptHive_gemini_api_key') || (process.env.GEMINI_API_KEY as string) || '';
    return {
      gemini: oldGemini,
      openai: '',
      claude: '',
      deepseek: '',
      mistral: '',
      openrouter: '',
      customUrl: 'http://localhost:11434/v1/chat/completions',
      customModel: 'llama3'
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);
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
        text: 'Merhaba! Ben ScriptHive Senaryo Asistanınızım. 🎬\n\nSize sahne kurgulama, diyalog yazma, karakter geliştirme veya senaryo doktorluğu (Script Doctor) desteği verebilirim. Dilediğiniz yapay zekayı (Gemini, OpenAI, Claude, DeepSeek, Mistral) seçebilir ve doğrudan çalışmaya başlayabilirsiniz!',
        timestamp: Date.now()
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    safeStorage.setItem('scriptHive_ai_provider', provider);
  }, [provider]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_ai_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_ai_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    if (messages.length > 0) {
      safeStorage.setItem('scriptHive_ai_messages', JSON.stringify(messages.slice(-40)));
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Update selectedModel if provider changes and model doesn't belong to it
  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    const available = PROVIDER_MODELS[newProvider];
    if (available && available.length > 0) {
      setSelectedModel(available[0].id);
    }
  };

  const handleKeyChange = (prov: string, val: string) => {
    setApiKeys(prev => ({ ...prev, [prov]: val }));
    if (prov === 'gemini') {
      safeStorage.setItem('scriptHive_gemini_api_key', val.trim());
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim()) return;

    const currentKey = apiKeys[provider] || '';
    if (provider !== 'custom' && !currentKey.trim()) {
      setIsSettingsOpen(true);
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
        ? `\nŞu an yazarın odaklandığı satır: [${focusedElement.type.toUpperCase()}]: "${focusedElement.content}"`
        : '';

      const systemInstruction = `Sen profesyonel, ödüllü ve deneyimli bir sinema/dizi senaristi ve senaryo doktorusun (Script Doctor).
Kullanıcıya film/dizi senaryosu yazımında yardımcı oluyorsun.
Amerikan ve Fransız senaryo formatlama kurallarına (Sahne Başlığı, Eylem, Karakter, Diyalog, Parantez İçi, Geçiş) tam anlamıyla hakimsin.
Yanıtların kısa, etkileyici, sinematik ve doğrudan senaryoya yapıştırılmaya uygun olsun.
Türkçe dili kurallarına, sokak/günlük konuşma doğallığına ve senaryo ritmine dikkat et.`;

      const fullUserPrompt = `Senaryonun Son Kısmı:\n${recentContext}${focusedContext}\n\nYazarın Talebi:\n${promptToSend}`;

      let aiText = '';

      // Call the corresponding provider API
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel || 'gemini-2.0-flash'}:generateContent?key=${currentKey.trim()}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: fullUserPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500
            }
          })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          aiText = data.candidates[0].content.parts[0].text.trim();
        } else if (data.error) {
          throw new Error(data.error.message || 'Gemini API Hatası');
        } else {
          throw new Error('Gemini modelinden yanıt alınamadı.');
        }
      } else if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey.trim()}`
          },
          body: JSON.stringify({
            model: selectedModel || 'gpt-4o',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: fullUserPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          aiText = data.choices[0].message.content.trim();
        } else if (data.error) {
          throw new Error(data.error.message || 'OpenAI API Hatası');
        } else {
          throw new Error('OpenAI modelinden yanıt alınamadı.');
        }
      } else if (provider === 'claude') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': currentKey.trim(),
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: selectedModel || 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            system: systemInstruction,
            messages: [{ role: 'user', content: fullUserPrompt }]
          })
        });

        const data = await response.json();
        if (data.content && data.content[0]?.text) {
          aiText = data.content[0].text.trim();
        } else if (data.error) {
          throw new Error(data.error.message || 'Claude API Hatası');
        } else {
          throw new Error('Claude modelinden yanıt alınamadı.');
        }
      } else if (provider === 'deepseek') {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey.trim()}`
          },
          body: JSON.stringify({
            model: selectedModel || 'deepseek-chat',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: fullUserPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          aiText = data.choices[0].message.content.trim();
        } else if (data.error) {
          throw new Error(data.error.message || 'DeepSeek API Hatası');
        } else {
          throw new Error('DeepSeek modelinden yanıt alınamadı.');
        }
      } else if (provider === 'mistral') {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey.trim()}`
          },
          body: JSON.stringify({
            model: selectedModel || 'mistral-large-latest',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: fullUserPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          aiText = data.choices[0].message.content.trim();
        } else if (data.error) {
          throw new Error(data.error.message || 'Mistral API Hatası');
        } else {
          throw new Error('Mistral modelinden yanıt alınamadı.');
        }
      } else if (provider === 'openrouter') {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey.trim()}`,
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
            'X-Title': 'ScriptHive'
          },
          body: JSON.stringify({
            model: selectedModel || 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: fullUserPrompt }
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          aiText = data.choices[0].message.content.trim();
        } else if (data.error) {
          throw new Error(data.error.message || 'OpenRouter API Hatası');
        } else {
          throw new Error('OpenRouter modelinden yanıt alınamadı.');
        }
      } else if (provider === 'custom') {
        const url = apiKeys.customUrl || 'http://localhost:11434/v1/chat/completions';
        const customModelName = apiKeys.customModel || 'llama3';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (currentKey.trim()) {
          headers['Authorization'] = `Bearer ${currentKey.trim()}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: customModelName,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: fullUserPrompt }
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          aiText = data.choices[0].message.content.trim();
        } else if (data.error) {
          throw new Error(data.error.message || 'Özel API Hatası');
        } else {
          throw new Error('Özel modelden yanıt alınamadı.');
        }
      }

      // Infer suggested element type
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
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ Bir hata oluştu: ${error.message || 'Lütfen API anahtarınızı veya model ayarlarınızı kontrol edin.'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640] text-slate-200' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900';
  const headerBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]';
  const cardBg = theme === 'dark' ? 'bg-[#252c33] border-[#2d3640]' : 'bg-[#f4efe4] border-[#c8bea8]';
  const inputClass = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640] text-white placeholder-slate-500 focus:border-[#6ba3e8]' : 'bg-white border-[#c8bea8] text-slate-900 placeholder-slate-500 focus:border-blue-600';

  const quickPrompts = [
    { label: '💬 Diyalog Alternatifi', prompt: 'Seçili diyalog için 3 farklı duygu tonunda (daha sert, daha alaycı, daha kırılgan) alternatif yaz.' },
    { label: '🎬 Sahne Aksiyonu', prompt: 'Bu sahnenin atmosferini, görsel detaylarını ve karakter hareketlerini sinematik bir dille genişlet.' },
    { label: '💡 Sonraki Sahne Fikri', prompt: 'Bu sahneden sonra gelebilecek, hikayenin gerilimini ve merak duygusunu artıracak 2 farklı sahne fikri ver.' },
    { label: '🎭 Karakter Derinleştirme', prompt: 'Karakterin bu andaki alt metnini (subtext) ve gizli motivasyonunu ortaya çıkaran bir replik/eylem öner.' },
    { label: '🩺 Script Doctor İncelemesi', prompt: 'Senaryonun son bölümünü tempo, klişeler ve diyalog doğallığı açısından incele ve 3 somut öneri ver.' },
    { label: '⚔️ Çatışma & Gerilim Artır', prompt: 'Bu sahnedeki diyaloga çatışma ve yüksek gerilim katarak yeniden yaz.' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className={`flex flex-col w-full max-w-4xl h-[90vh] max-h-[850px] rounded-2xl shadow-2xl border overflow-hidden ${bgClass}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 select-none ${headerBg}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Yapay Zeka Senaryo Asistanı</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-[#6ba3e8]">
                  {PROVIDER_NAMES[provider]} • {selectedModel}
                </span>
              </div>
              <p className="text-xs opacity-70">Sahneler, diyaloglar ve hikaye akışı için çok modelli senaryo asistanı</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                isSettingsOpen 
                  ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 border-[#6ba3e8]' : 'bg-blue-700 text-white border-blue-700')
                  : (theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-[#c8bea8] hover:bg-[#dfd7ca] text-slate-800')
              }`}
              title="Model ve API Anahtarı Ayarları"
            >
              <Settings2 size={16} />
              <span className="hidden sm:inline">Model Ayarları</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Sohbet geçmişini temizlemek istiyor musunuz?')) {
                  setMessages([]);
                  safeStorage.removeItem('scriptHive_ai_messages');
                }
              }}
              className={`p-2 rounded-xl border border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-all`}
              title="Sohbeti Temizle"
            >
              <Trash2 size={17} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition-all"
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Settings Panel (Collapsible) */}
        {isSettingsOpen && (
          <div className={`p-4 border-b shrink-0 animate-in slide-in-from-top-2 duration-200 space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck size={17} className="text-emerald-500" />
                <span>Yapay Zeka Servisi & Model Seçimi</span>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs opacity-60 hover:opacity-100 underline"
              >
                Paneli Gizle
              </button>
            </div>

            {/* Provider Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {(Object.keys(PROVIDER_NAMES) as AiProvider[]).map((pKey) => {
                const isSelected = provider === pKey;
                return (
                  <button
                    key={pKey}
                    onClick={() => handleProviderChange(pKey)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? (theme === 'dark' ? 'bg-[#6ba3e8] border-[#6ba3e8] text-slate-950 font-bold shadow-xs' : 'bg-blue-700 border-blue-700 text-white font-bold shadow-xs')
                        : (theme === 'dark' ? 'border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800' : 'border-[#c8bea8] bg-white/70 text-slate-800 hover:bg-white')
                    }`}
                  >
                    {PROVIDER_NAMES[pKey].split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Model & Key Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Model Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-80 flex items-center justify-between">
                  <span>Model</span>
                  <span className="text-[11px] opacity-60">{PROVIDER_NAMES[provider]}</span>
                </label>
                {provider !== 'custom' ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={`w-full p-2 rounded-xl text-xs outline-none border cursor-pointer ${inputClass}`}
                  >
                    {PROVIDER_MODELS[provider].map((m) => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {m.name} — {m.desc}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={apiKeys.customModel || 'llama3'}
                    onChange={(e) => handleKeyChange('customModel', e.target.value)}
                    placeholder="Örn: llama3, mistral, qwen2.5"
                    className={`w-full p-2 rounded-xl text-xs outline-none border ${inputClass}`}
                  />
                )}
              </div>

              {/* API Key Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-80 flex items-center justify-between">
                  <span>{provider === 'custom' ? 'Özel Endpoint URL' : `${PROVIDER_NAMES[provider]} API Anahtarı`}</span>
                  {provider === 'gemini' && (
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-blue-600 dark:text-[#6ba3e8] hover:underline"
                    >
                      Ücretsiz Anahtar Al ↗
                    </a>
                  )}
                  {provider === 'openai' && (
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-blue-600 dark:text-[#6ba3e8] hover:underline"
                    >
                      API Key Al ↗
                    </a>
                  )}
                  {provider === 'claude' && (
                    <a 
                      href="https://console.anthropic.com/settings/keys" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-blue-600 dark:text-[#6ba3e8] hover:underline"
                    >
                      API Key Al ↗
                    </a>
                  )}
                </label>
                {provider !== 'custom' ? (
                  <div className="relative flex items-center">
                    <input
                      type={showKeyText ? 'text' : 'password'}
                      value={apiKeys[provider] || ''}
                      onChange={(e) => handleKeyChange(provider, e.target.value)}
                      placeholder={`${PROVIDER_NAMES[provider]} API anahtarınızı girin...`}
                      className={`w-full p-2 pr-9 rounded-xl text-xs font-mono outline-none border ${inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="absolute right-2.5 opacity-50 hover:opacity-100"
                      title={showKeyText ? "Gizle" : "Göster"}
                    >
                      {showKeyText ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={apiKeys.customUrl || 'http://localhost:11434/v1/chat/completions'}
                    onChange={(e) => handleKeyChange('customUrl', e.target.value)}
                    placeholder="http://localhost:11434/v1/chat/completions"
                    className={`w-full p-2 rounded-xl text-xs font-mono outline-none border ${inputClass}`}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${
                  msg.sender === 'user'
                    ? (theme === 'dark' ? 'bg-blue-600 border-blue-500 text-white rounded-br-none' : 'bg-blue-600 border-blue-700 text-white rounded-br-none')
                    : (theme === 'dark' ? 'bg-[#20272e] border-slate-700/80 text-slate-100 rounded-bl-none' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900 rounded-bl-none')
                }`}
              >
                {msg.text}
              </div>

              {msg.sender === 'ai' && msg.id !== 'welcome' && !msg.text.startsWith('⚠️') && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all ${
                      theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-[#c8bea8] hover:bg-[#dfd7ca] text-slate-700'
                    }`}
                    title="Panoya Kopyala"
                  >
                    {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copiedId === msg.id ? 'Kopyalandı' : 'Kopyala'}
                  </button>

                  <button
                    onClick={() => {
                      onInsertElement(msg.suggestedType || 'action', msg.text);
                      onClose();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all shadow-xs ${
                      theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'
                    }`}
                    title="Senaryoda geçerli satırın hemen altına yeni blok olarak ekler"
                  >
                    <Plus size={12} />
                    Senaryoya Ekle
                  </button>

                  {focusedElement && (
                    <button
                      onClick={() => {
                        onUpdateFocusedElement(msg.text);
                        onClose();
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        theme === 'dark' ? 'border-amber-600/40 text-amber-300 hover:bg-amber-600/20' : 'border-amber-500 text-amber-900 hover:bg-amber-100'
                      }`}
                      title="Şu an seçili olan satırın metnini bu yanıtla değiştirir"
                    >
                      <ArrowRight size={12} />
                      Seçili Satırı Değiştir
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-semibold opacity-70 p-2">
              <RefreshCw size={15} className="animate-spin text-blue-500" />
              <span>{PROVIDER_NAMES[provider]} ({selectedModel}) senaryonuzu inceliyor ve yazıyor...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className={`px-4 py-2 border-t overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar ${cardBg}`}>
          <span className="text-[11px] font-bold opacity-60 shrink-0">Hızlı İstekler:</span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 border transition-all whitespace-nowrap ${
                theme === 'dark' 
                  ? 'border-slate-700 bg-[#20272e] text-slate-300 hover:text-white hover:border-slate-500' 
                  : 'border-[#c8bea8] bg-white text-slate-800 hover:bg-[#e8e0d5]'
              }`}
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className={`p-3 sm:p-4 border-t flex items-end gap-2 shrink-0 ${headerBg}`}>
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Yapay zekaya senaryonuzla ilgili dilediğinizi sorun veya yazmasını isteyin... (Göndermek için Enter, yeni satır için Shift+Enter)"
              className={`w-full p-2.5 rounded-xl text-xs sm:text-sm outline-none resize-none border ${inputClass}`}
            />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputPrompt.trim()}
            className={`p-3 rounded-xl font-bold transition-all shrink-0 flex items-center justify-center shadow-md ${
              isLoading || !inputPrompt.trim()
                ? 'opacity-40 cursor-not-allowed bg-slate-500 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-95'
            }`}
            title="Gönder (Enter)"
          >
            <Send size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
