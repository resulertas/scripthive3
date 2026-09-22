import React, { useState } from 'react';
import { ChevronLeft, List, GripVertical, StickyNote, Trash2 } from 'lucide-react';
import { ScreenplayElement } from '../types';
import { Reorder } from 'motion/react';

interface SidebarProps {
  elements: ScreenplayElement[];
  setFocusedId: (id: string) => void;
  theme: 'dark' | 'light';
  onReorderScenesArray: (newOrder: ScreenplayElement[]) => void;
  onRemoveElement?: (id: string) => void;
}

export default function Sidebar({ elements, setFocusedId, theme, onReorderScenesArray, onRemoveElement }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenes' | 'notes'>('scenes');

  const scenes = elements.filter(e => e.type === 'scene');
  const notes = elements.filter(e => e.type === 'note');

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]';
  const textClass = theme === 'dark' ? 'text-slate-300 hover:bg-[#2d3640]/50' : 'text-slate-800 hover:bg-[#dfd7ca]';
  const headerClass = theme === 'dark' ? 'text-slate-500' : 'text-slate-600';
  const tabActive = theme === 'dark' ? 'text-sky-400 border-sky-400 font-bold' : 'text-blue-700 border-blue-700 font-bold';
  const tabInactive = theme === 'dark' ? 'text-slate-400 border-transparent hover:text-white' : 'text-slate-700 border-transparent hover:text-black';

  return (
    <div className={`border-r flex flex-col overflow-y-auto shrink-0 transition-all duration-300 no-print ${isOpen ? 'w-72' : 'w-12'} ${bgClass}`}>
      <div className={`p-3 flex items-center ${isOpen ? 'justify-between' : 'justify-center'} border-b border-[inherit]`}>
        {isOpen && (
          <div className="flex gap-4 border-b border-[inherit] w-full mr-2">
            <button 
              onClick={() => setActiveTab('scenes')}
              className={`pb-1 text-xs font-bold tracking-wider border-b-2 flex items-center gap-1.5 ${activeTab === 'scenes' ? tabActive : tabInactive}`}
            >
              <List size={14} /> SAHNELER
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`pb-1 text-xs font-bold tracking-wider border-b-2 flex items-center gap-1.5 ${activeTab === 'notes' ? tabActive : tabInactive}`}
            >
              <StickyNote size={14} /> NOTLAR
            </button>
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 md:p-1 rounded ${textClass} shrink-0`}
          title={isOpen ? "Paneli Gizle" : "Paneli Göster"}
        >
          {isOpen ? <ChevronLeft size={20} className="md:w-5 md:h-5" /> : <List size={20} className="md:w-5 md:h-5" />}
        </button>
      </div>
      {isOpen && (
        <div className="p-2 md:p-4 space-y-1">
          {activeTab === 'scenes' ? (
            <Reorder.Group axis="y" values={scenes} onReorder={onReorderScenesArray}>
              {scenes.map((scene) => (
                <Reorder.Item 
                  key={scene.id} 
                  value={scene}
                  className={`px-3 py-3 md:py-2 rounded text-sm cursor-pointer truncate flex items-center justify-between gap-3 md:gap-2 ${textClass} select-none group`}
                >
                  <div className="flex items-center gap-3 md:gap-2 truncate" onClick={() => setFocusedId(scene.id)}>
                    <GripVertical size={18} className="opacity-40 shrink-0 md:w-3.5 md:h-3.5" />
                    {scene.colorTag && (
                      <div 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: scene.colorTag }}
                      />
                    )}
                    <span className="truncate">{scene.sceneNumber}. {scene.content || 'YENİ SAHNE'}</span>
                  </div>
                  {onRemoveElement && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveElement(scene.id);
                      }}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 rounded-md transition-all text-slate-400"
                      title="Sahneyi sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
             <div className="flex flex-col gap-2">
               {notes.length === 0 ? (
                 <div className="text-xs opacity-50 px-2 py-4 text-center">Hiç satır içi not bulunamadı.</div>
               ) : (
                 notes.map((note) => (
                   <div
                     key={note.id}
                     onClick={() => setFocusedId(note.id)}
                     className={`group relative p-3 rounded-lg text-xs cursor-pointer border-l-2 border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
                   >
                     <p className="line-clamp-3 pr-6">{note.content || 'Boş not...'}</p>
                     {onRemoveElement && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           onRemoveElement(note.id);
                         }}
                         className="absolute right-1 top-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-md transition-all text-slate-400"
                         title="Notu sil"
                       >
                         <Trash2 size={14} />
                       </button>
                     )}
                   </div>
                 ))
               )}
             </div>
          )}
        </div>
      )}
    </div>
  );
}
