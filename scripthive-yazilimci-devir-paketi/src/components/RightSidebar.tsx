import React from 'react';
import { History, Sparkles, Sliders, HelpCircle, Bot } from 'lucide-react';

interface RightSidebarProps {
  theme: 'dark' | 'light';
  activeTab: 'ai' | 'history' | 'settings' | null;
  onSelectTab: (tab: 'ai' | 'history' | 'settings' | null) => void;
  onOpenGuide: () => void;
}

export default function RightSidebar({ 
  theme, 
  activeTab, 
  onSelectTab, 
  onOpenGuide 
}: RightSidebarProps) {
  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]';
  const inactiveBtnClass = theme === 'dark' 
    ? 'text-slate-400 hover:text-white hover:bg-[#2d3640]/60' 
    : 'text-slate-700 hover:text-black hover:bg-[#dfd7ca]';
  const activeBtnClass = 'bg-blue-600 text-white shadow-md hover:bg-blue-700';

  const toggleTab = (tab: 'ai' | 'history' | 'settings') => {
    if (activeTab === tab) {
      onSelectTab(null);
    } else {
      onSelectTab(tab);
    }
  };

  return (
    <div className={`w-14 border-l flex flex-col items-center py-4 space-y-4 shrink-0 hidden sm:flex no-print ${bgClass}`}>
      {/* AI Assistant Button */}
      <button 
        onClick={() => toggleTab('ai')}
        className={`p-2.5 rounded-xl transition-all relative group ${activeTab === 'ai' ? activeBtnClass : inactiveBtnClass}`}
        title="AI Senaryo Asistanı (Gemini)"
      >
        <Sparkles size={20} className={activeTab === 'ai' ? 'animate-pulse' : ''} />
        <span className="absolute right-full mr-2 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          AI Asistan
        </span>
      </button>

      {/* History / Bin Button */}
      <button 
        onClick={() => toggleTab('history')}
        className={`p-2.5 rounded-xl transition-all relative group ${activeTab === 'history' ? activeBtnClass : inactiveBtnClass}`}
        title="Geçmiş & Silinenler"
      >
        <History size={20} />
        <span className="absolute right-full mr-2 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          Geçmiş & Çöp
        </span>
      </button>

      {/* Settings Button */}
      <button 
        onClick={() => toggleTab('settings')}
        className={`p-2.5 rounded-xl transition-all relative group ${activeTab === 'settings' ? activeBtnClass : inactiveBtnClass}`}
        title="Görünüm ve Editör Ayarları"
      >
        <Sliders size={20} />
        <span className="absolute right-full mr-2 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          Ayarlar
        </span>
      </button>
      
      <div className="flex-1"></div>
      
      {/* Help / Guide Button */}
      <button 
        onClick={onOpenGuide}
        className={`p-2.5 rounded-xl transition-colors relative group ${inactiveBtnClass}`}
        title="Kullanım Rehberi & Kısayollar"
      >
        <HelpCircle size={20} />
        <span className="absolute right-full mr-2 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          Rehber & Kısayollar
        </span>
      </button>
    </div>
  );
}
