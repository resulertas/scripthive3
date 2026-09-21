import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, Send, Copy, Check, Plus, RefreshCw, X, 
  Settings2, Trash2, ChevronDown, 
  ArrowRight, ShieldCheck, Eye, EyeOff, Clapperboard,
  MessageSquare, Zap, Sparkle
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
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Ücretsiz Kota & Ultra Hızlı' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Gelişmiş Senaryo Doktoru' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Hızlı ve Dengeli' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)', desc: 'Ultra Ekonomik (~$0.14/M token)' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', desc: 'Derin Olay Örgüsü Analizi' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Hafif, Hızlı ve Ekonomik' },
    { id: 'gpt-4o', name: 'GPT-4o', desc: 'Amiral Gemisi Model' },
    { id: 'o3-mini', name: 'o3 Mini', desc: 'Gelişmiş Mantık ve Kurgu' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: 'Kapsamlı Metin Üretimi' },
  ],
  claude: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: 'Doğal Diyalog & Edebi Kalite' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Ultra Hızlı' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', desc: 'Derin Karakter Çözümlemesi' },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large', desc: 'Güçlü Büyük Model' },
    { id: 'mistral-small-latest', name: 'Mistral Small', desc: 'Hızlı ve Tutarlı' },
    { id: 'codestral-latest', name: 'Codestral', desc: 'Hızlı Metin Üretimi' },
  ],
  openrouter: [
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OpenRouter)', desc: 'OpenRouter Üzerinden' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', desc: 'OpenRouter Üzerinden' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (OpenRouter)', desc: 'OpenRouter Üzerinden' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)', desc: 'OpenRouter Üzerinden' },
  ],
  custom: [
    { id: 'default', name: 'Özel / Yerel Model', desc: 'Ollama, LM Studio vb.' }
  ]
};

const PROVIDER_NAMES: Record<AiProvider, string> = {
  gemini: 'Google Gemini',
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  claude: 'Anthropic Claude',
  mistral: 'Mistral AI',
  openrouter: 'OpenRouter',
  custom: 'Özel / Yerel'
};

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  suggestedType?: ElementType;
  timestamp: number;
}

export type ContextScope = 'replik' | 'scene' | 'recent' | 'none';

interface SceneInfo {
  sceneNumber: number | string;
  heading: string;
  startIndex: number;
  endIndex: number;
  elements: ScreenplayElement[];
}

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  elements: ScreenplayElement[];
  focusedElement: ScreenplayElement | null;
  onInsertElement: (type: ElementType, content: string) => void;
  onUpdateFocusedElement: (content: string) => void;
}

export default function AiAssistantPanel({
  isOpen,
  onClose,
  theme,
  elements,
  focusedElement,
  onInsertElement,
  onUpdateFocusedElement
}: AiAssistantPanelProps) {
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
  const [selectedSceneNum, setSelectedSceneNum] = useState<number | string | null>(null);
  const [contextScope, setContextScope] = useState<ContextScope>('scene');

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = safeStorage.getItem('scriptHive_ai_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Merhaba! Ben ScriptHive Senaryo Asistanınızım. 🎬\n\nSenaryonuzda bir diyaloğa veya sahneye tıkladığınızda otomatik olarak tanırım. Fareyle seçim yapmanıza gerek kalmadan tek tıkla sahne incelemesi veya replik alternatifleri isteyebilirsiniz.',
        timestamp: Date.now()
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Parse and extract all scenes with their indices and elements
  const allScenes: SceneInfo[] = useMemo(() => {
    const list: SceneInfo[] = [];
    let currentScene: SceneInfo | null = null;
    let autoSceneIndex = 0;

    elements.forEach((el, idx) => {
      if (el.type === 'scene') {
        if (currentScene) {
          currentScene.endIndex = idx - 1;
          list.push(currentScene);
        }
        autoSceneIndex++;
        const plainHeading = el.content ? el.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : `Sahne ${autoSceneIndex}`;
        currentScene = {
          sceneNumber: el.sceneNumber !== undefined ? el.sceneNumber : autoSceneIndex,
          heading: plainHeading,
          startIndex: idx,
          endIndex: elements.length - 1,
          elements: [el]
        };
      } else if (currentScene) {
        currentScene.elements.push(el);
      }
    });

    if (currentScene) {
      currentScene.endIndex = elements.length - 1;
      list.push(currentScene);
    }
    return list;
  }, [elements]);

  // Determine currently active scene based on focused element or selectedSceneNum
  const activeScene: SceneInfo | null = useMemo(() => {
    if (selectedSceneNum !== null) {
      const found = allScenes.find(s => String(s.sceneNumber) === String(selectedSceneNum));
      if (found) return found;
    }
    if (focusedElement) {
      const found = allScenes.find(s => s.elements.some(e => e.id === focusedElement.id));
      if (found) return found;
    }
    return allScenes[0] || null;
  }, [allScenes, focusedElement, selectedSceneNum]);

  // Strip HTML utility
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  // Plain focused content
  const focusedPlain = useMemo(() => {
    if (!focusedElement) return '';
    return stripHtml(focusedElement.content);
  }, [focusedElement]);

  // Compute estimated tokens for current scope
  const estimatedTokens = useMemo(() => {
    let text = '';
    if (contextScope === 'replik' && focusedElement) {
      text = focusedPlain;
    } else if (contextScope === 'scene' && activeScene) {
      text = activeScene.elements.map(e => `${e.type.toUpperCase()}: ${stripHtml(e.content)}`).join('\n');
    } else if (contextScope === 'recent') {
      text = elements.slice(-15).map(e => `${e.type.toUpperCase()}: ${stripHtml(e.content)}`).join('\n');
    }
    const wordCount = text.split(/\s+/).filter(Boolean).length + inputPrompt.split(/\s+/).filter(Boolean).length + 80;
    return Math.round(wordCount * 1.3);
  }, [contextScope, focusedElement, focusedPlain, activeScene, elements, inputPrompt]);

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

  // Core Send Message function
  const handleSendMessage = async (customPrompt?: string, forcedScope?: ContextScope) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim()) return;

    const currentKey = apiKeys[provider] || '';
    if (provider !== 'custom' && !currentKey.trim()) {
      setIsSettingsOpen(true);
      return;
    }

    const scopeToUse = forcedScope || contextScope;

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
      // Build focused & economic context based on scope
      let contextText = '';
      if (scopeToUse === 'replik' && focusedElement) {
        contextText = `YALNIZCA SEÇİLİ REPLİK/SATIR:\n[${focusedElement.type.toUpperCase()}]: "${focusedPlain}"`;
      } else if (scopeToUse === 'scene' && activeScene) {
        const sceneBody = activeScene.elements.map(e => `${e.type.toUpperCase()}: ${stripHtml(e.content)}`).join('\n');
        contextText = `YALNIZCA İNCELENEN SAHNE (${activeScene.sceneNumber}. Sahne: ${activeScene.heading}):\n${sceneBody}`;
        if (focusedElement && focusedElement.type !== 'scene') {
          contextText += `\n\n(Yazarın sahnede odaklandığı satır: [${focusedElement.type.toUpperCase()}]: "${focusedPlain}")`;
        }
      } else if (scopeToUse === 'recent') {
        const recent = elements.slice(-15).map(e => `${e.type.toUpperCase()}: ${stripHtml(e.content)}`).join('\n');
        contextText = `SENARYONUN SON AKIŞI:\n${recent}`;
        if (focusedElement) {
          contextText += `\n\n(Odaklanılan satır: [${focusedElement.type.toUpperCase()}]: "${focusedPlain}")`;
        }
      }

      const systemInstruction = `Sen profesyonel, ödüllü ve deneyimli bir sinema/dizi senaristi ve senaryo doktorusun (Script Doctor).
Kullanıcıya film/dizi senaryosu yazımında yardımcı oluyorsun.
Amerikan ve Fransız senaryo formatlama kurallarına (Sahne Başlığı, Eylem, Karakter, Diyalog, Parantez İçi, Geçiş) tam anlamıyla hakimsin.
Yanıtların doğrudan senaryoda kullanılmaya uygun, doğal, etkileyici ve sinematik olsun.
Gereksiz uzun açıklamalar yapma, doğrudan istenen replikleri veya sahne düzeltmelerini sun.`;

      const fullUserPrompt = contextText 
        ? `${contextText}\n\nYAZARIN TALEBİ:\n${promptToSend}`
        : `YAZARIN TALEBİ:\n${promptToSend}`;

      let aiText = '';

      // API calls
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel || 'gemini-2.0-flash'}:generateContent?key=${currentKey.trim()}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: fullUserPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
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
            model: selectedModel || 'gpt-4o-mini',
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

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] border-l-[#2d3640] text-slate-200' : 'bg-[#fcfaf7] border-l-[#c8bea8] text-slate-900';
  const headerBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]';
  const cardBg = theme === 'dark' ? 'bg-[#252c33] border-[#2d3640]' : 'bg-[#f4efe4] border-[#c8bea8]';
  const inputClass = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640] text-white placeholder-slate-500 focus:border-[#6ba3e8]' : 'bg-white border-[#c8bea8] text-slate-900 placeholder-slate-500 focus:border-blue-600';

  return (
    <aside className={`w-full md:w-96 lg:w-[420px] h-full flex flex-col shrink-0 border-l z-40 select-none transition-all duration-200 ${bgClass}`}>
      
      {/* Header */}
      <div className={`p-3 border-b flex items-center justify-between shrink-0 ${headerBg}`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xs">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold tracking-tight">Yapay Zeka Asistanı</h2>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-[#6ba3e8]">
                {PROVIDER_NAMES[provider].split(' ')[0]}
              </span>
            </div>
            <p className="text-[10px] opacity-60">Senaryo ve diyalog optimizasyonu</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
              isSettingsOpen 
                ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 border-[#6ba3e8]' : 'bg-blue-700 text-white border-blue-700')
                : (theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-[#c8bea8] hover:bg-[#dfd7ca] text-slate-800')
            }`}
            title="Model ve API Ayarları"
          >
            <Settings2 size={15} />
          </button>

          <button
            onClick={() => {
              if (confirm('Sohbet geçmişini temizlemek istiyor musunuz?')) {
                setMessages([]);
                safeStorage.removeItem('scriptHive_ai_messages');
              }
            }}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            title="Sohbeti Temizle"
          >
            <Trash2 size={15} />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            title="Paneli Kapat"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Model & Key Settings Pane (Collapsible) */}
      {isSettingsOpen && (
        <div className={`p-3 border-b shrink-0 space-y-3 animate-in slide-in-from-top-2 duration-200 text-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" /> Sağlayıcı & Model
            </span>
            <button onClick={() => setIsSettingsOpen(false)} className="text-[11px] opacity-60 hover:opacity-100 underline">
              Kapat
            </button>
          </div>

          {/* Provider Selector Tabs */}
          <div className="grid grid-cols-4 gap-1">
            {(Object.keys(PROVIDER_NAMES) as AiProvider[]).map((pKey) => {
              const isSelected = provider === pKey;
              return (
                <button
                  key={pKey}
                  onClick={() => handleProviderChange(pKey)}
                  className={`px-1.5 py-1 rounded text-[11px] font-semibold border truncate transition-all ${
                    isSelected
                      ? (theme === 'dark' ? 'bg-[#6ba3e8] border-[#6ba3e8] text-slate-950 font-bold' : 'bg-blue-700 border-blue-700 text-white font-bold')
                      : (theme === 'dark' ? 'border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800' : 'border-[#c8bea8] bg-white/70 text-slate-800 hover:bg-white')
                  }`}
                  title={PROVIDER_NAMES[pKey]}
                >
                  {PROVIDER_NAMES[pKey].split(' ')[0]}
                </button>
              );
            })}
          </div>

          {/* Model Dropdown */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] opacity-75 font-medium">
              <span>Model</span>
              <span>{PROVIDER_NAMES[provider]}</span>
            </div>
            {provider !== 'custom' ? (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={`w-full p-1.5 rounded-lg text-xs outline-none border cursor-pointer ${inputClass}`}
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
                placeholder="Model adı: llama3, mistral..."
                className={`w-full p-1.5 rounded-lg text-xs outline-none border ${inputClass}`}
              />
            )}
          </div>

          {/* API Key Input */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] opacity-75 font-medium">
              <span>{provider === 'custom' ? 'Endpoint URL' : `${PROVIDER_NAMES[provider]} API Anahtarı`}</span>
              {provider === 'gemini' && (
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-[#6ba3e8] hover:underline">
                  Ücretsiz Al ↗
                </a>
              )}
            </div>
            {provider !== 'custom' ? (
              <div className="relative flex items-center">
                <input
                  type={showKeyText ? 'text' : 'password'}
                  value={apiKeys[provider] || ''}
                  onChange={(e) => handleKeyChange(provider, e.target.value)}
                  placeholder="API anahtarınızı yapıştırın..."
                  className={`w-full p-1.5 pr-8 rounded-lg text-xs font-mono outline-none border ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute right-2 opacity-50 hover:opacity-100"
                  title={showKeyText ? "Gizle" : "Göster"}
                >
                  {showKeyText ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={apiKeys.customUrl || 'http://localhost:11434/v1/chat/completions'}
                onChange={(e) => handleKeyChange('customUrl', e.target.value)}
                className={`w-full p-1.5 rounded-lg text-xs font-mono outline-none border ${inputClass}`}
              />
            )}
          </div>
        </div>
      )}

      {/* SMART SCENE & REPLIK CONTROLLER BAR */}
      <div className={`p-2.5 border-b shrink-0 space-y-2 text-xs select-none ${cardBg}`}>
        
        {/* 1. Scene Selector Bar */}
        <div className="flex items-center gap-2">
          <Clapperboard size={15} className="text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            {allScenes.length > 0 ? (
              <select
                value={activeScene?.sceneNumber || 1}
                onChange={(e) => setSelectedSceneNum(e.target.value)}
                className={`w-full py-1 px-2 rounded-lg text-xs font-semibold outline-none border cursor-pointer truncate ${inputClass}`}
                title="İncelenecek Sahneyi Seçin"
              >
                {allScenes.map((sc) => (
                  <option key={sc.sceneNumber} value={sc.sceneNumber} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Sahne {sc.sceneNumber}: {sc.heading} ({sc.elements.length} blok)
                  </option>
                ))}
              </select>
            ) : (
              <span className="opacity-60 text-xs italic">Henüz sahne başlığı eklenmedi</span>
            )}
          </div>
        </div>

        {/* 2. Active Replik / Line Card (if focused) */}
        {focusedElement && focusedPlain && (
          <div className={`p-2 rounded-xl border flex flex-col gap-1.5 ${theme === 'dark' ? 'bg-[#1f262e] border-slate-700/80' : 'bg-white/80 border-[#c8bea8]'}`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold flex items-center gap-1 opacity-80 uppercase tracking-wider">
                <MessageSquare size={12} className="text-amber-500" />
                Seçili {focusedElement.type === 'dialogue' ? 'Diyalog' : focusedElement.type === 'character' ? 'Karakter' : 'Satır'}
              </span>
              <span className="text-[10px] opacity-50 font-mono">#{focusedElement.id.slice(-4)}</span>
            </div>
            <p className="text-xs italic line-clamp-2 opacity-90 font-mono">
              "{focusedPlain}"
            </p>
            
            {/* Quick Replik Action Buttons */}
            <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleSendMessage('Bu replik için farklı duygu tonlarında (daha sert, daha alaycı, daha kırılgan) 3 alternatif diyalog yaz.', 'replik')}
                disabled={isLoading}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1 shrink-0 transition-all ${
                  theme === 'dark' ? 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10' : 'border-amber-600/40 text-amber-900 hover:bg-amber-50'
                }`}
                title="Seçili replik için 3 farklı alternatif önerisi alır"
              >
                <Sparkle size={11} /> 3 Alternatif Replik
              </button>

              <button
                onClick={() => handleSendMessage('Bu repliğin alt metnini (subtext) güçlendirerek karakterin gerçek hissini doğrudan söylemeden hissettiren bir alternatif yaz.', 'replik')}
                disabled={isLoading}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border shrink-0 transition-all ${
                  theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-[#c8bea8] text-slate-800 hover:bg-white'
                }`}
                title="Repliğe derinlik ve alt metin katar"
              >
                Alt Metin Ekle
              </button>

              <button
                onClick={() => handleSendMessage('Bu repliği kitabi/yapay konuşmadan çıkarıp sokak ve günlük konuşma doğallığına kavuştur.', 'replik')}
                disabled={isLoading}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border shrink-0 transition-all ${
                  theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-[#c8bea8] text-slate-800 hover:bg-white'
                }`}
                title="Diyaloğu doğallaştırır"
              >
                Doğallaştır
              </button>
            </div>
          </div>
        )}

        {/* 3. Quick Scene-Level Actions (Fareyle Seçmeden Tek Tıkla Sahne Doktorluğu) */}
        {activeScene && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              onClick={() => handleSendMessage(`Sahne ${activeScene.sceneNumber} (${activeScene.heading}) sahnesini senaryo doktoru gözüyle incele; tempo, diyalog ritmi ve görsel atmosfer açısından 3 somut iyileştirme önerisi ver.`, 'scene')}
              disabled={isLoading}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1 shrink-0 transition-all ${
                theme === 'dark' ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30' : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
              }`}
              title="Bu sahneyi baştan sona inceler ve iyileştirme önerileri sunar"
            >
              <Zap size={11} /> Sahneyi İncele & İyileştir
            </button>

            <button
              onClick={() => handleSendMessage(`Sahne ${activeScene.sceneNumber} sahnesindeki diyalogları incele; yapay veya tekrar eden cümleleri tespit edip doğallaştırarak yeniden yaz.`, 'scene')}
              disabled={isLoading}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border shrink-0 transition-all ${
                theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-[#c8bea8] text-slate-800 hover:bg-white'
              }`}
              title="Sahnedeki tüm diyalogları doğal konuşma diline uyarlar"
            >
              Diyalogları Doğallaştır
            </button>

            <button
              onClick={() => handleSendMessage(`Sahne ${activeScene.sceneNumber} sahnesine daha yüksek bir dramatik çatışma, gerilim veya sürpriz bir an katarak sahneyi zenginleştir.`, 'scene')}
              disabled={isLoading}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border shrink-0 transition-all ${
                theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-[#c8bea8] text-slate-800 hover:bg-white'
              }`}
              title="Sahnedeki gerilimi ve merak duygusunu artırır"
            >
              Çatışmayı Artır
            </button>

            <button
              onClick={() => handleSendMessage(`Sahne ${activeScene.sceneNumber} sahnesinden sonra hikayeyi ileri taşıyacak 2 farklı sonraki sahne fikri öner.`, 'scene')}
              disabled={isLoading}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border shrink-0 transition-all ${
                theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-[#c8bea8] text-slate-800 hover:bg-white'
              }`}
              title="Bir sonraki sahne için yaratıcı fikirler üretir"
            >
              Sonraki Sahne Fikri
            </button>
          </div>
        )}

        {/* 4. Context Scope Selector & Token Badge */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-700/20 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="opacity-60 font-semibold">Kapsam:</span>
            {[
              { id: 'scene', label: 'Sahne' },
              { id: 'replik', label: 'Replik' },
              { id: 'recent', label: 'Son 15' },
              { id: 'none', label: 'Yalnız Soru' },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => setContextScope(sc.id as ContextScope)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  contextScope === sc.id
                    ? (theme === 'dark' ? 'bg-blue-600 text-white font-bold' : 'bg-blue-700 text-white font-bold')
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] opacity-70" title="Tahmini Girdi Token Miktarı">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>~{estimatedTokens} Token</span>
          </div>
        </div>

      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 select-text">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap shadow-xs border ${
                msg.sender === 'user'
                  ? (theme === 'dark' ? 'bg-blue-600 border-blue-500 text-white rounded-br-none' : 'bg-blue-600 border-blue-700 text-white rounded-br-none')
                  : (theme === 'dark' ? 'bg-[#20272e] border-slate-700/80 text-slate-100 rounded-bl-none' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900 rounded-bl-none')
              }`}
            >
              {msg.text}
            </div>

            {msg.sender === 'ai' && msg.id !== 'welcome' && !msg.text.startsWith('⚠️') && (
              <div className="flex items-center gap-1.5 mt-1.5 select-none">
                <button
                  onClick={() => handleCopy(msg.id, msg.text)}
                  className={`px-2 py-0.5 rounded border text-[10px] font-medium flex items-center gap-1 transition-all ${
                    theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-[#c8bea8] hover:bg-[#dfd7ca] text-slate-700'
                  }`}
                  title="Panoya Kopyala"
                >
                  {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  {copiedId === msg.id ? 'Kopyalandı' : 'Kopyala'}
                </button>

                {focusedElement && (
                  <button
                    onClick={() => onUpdateFocusedElement(msg.text)}
                    className={`px-2 py-0.5 rounded border text-[10px] font-semibold flex items-center gap-1 transition-all ${
                      theme === 'dark' ? 'border-amber-600/40 text-amber-300 hover:bg-amber-600/20' : 'border-amber-500 text-amber-900 hover:bg-amber-100'
                    }`}
                    title="Şu an seçili olan satırın metnini bu yanıtla değiştirir"
                  >
                    <ArrowRight size={11} />
                    Seçili Satırı Değiştir
                  </button>
                )}

                <button
                  onClick={() => onInsertElement(msg.suggestedType || 'action', msg.text)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all shadow-xs ${
                    theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'
                  }`}
                  title="Senaryoda geçerli satırın altına yeni blok olarak ekler"
                >
                  <Plus size={11} />
                  Senaryoya Ekle
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-semibold opacity-70 p-2">
            <RefreshCw size={13} className="animate-spin text-blue-500" />
            <span>{PROVIDER_NAMES[provider]} ({selectedModel}) yanıt hazırlıyor...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div className={`p-2.5 border-t flex items-end gap-2 shrink-0 ${headerBg}`}>
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
            placeholder="Yapay zekaya sorun veya bir istek yazın... (Enter: Gönder, Shift+Enter: Yeni satır)"
            className={`w-full p-2 rounded-xl text-xs outline-none resize-none border ${inputClass}`}
          />
        </div>

        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputPrompt.trim()}
          className={`p-2.5 rounded-xl font-bold transition-all shrink-0 flex items-center justify-center shadow-sm ${
            isLoading || !inputPrompt.trim()
              ? 'opacity-40 cursor-not-allowed bg-slate-500 text-white'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-95'
          }`}
          title="Gönder (Enter)"
        >
          <Send size={15} />
        </button>
      </div>

    </aside>
  );
}
