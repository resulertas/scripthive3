import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Timer, X, Play, Target } from 'lucide-react';
import { useSprintStore, sprintActions } from '../store/sprintStore';

interface SprintWidgetProps {
  currentWordCount: number;
  isTablet?: boolean;
}

export default function SprintWidget({ currentWordCount, isTablet = false }: SprintWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sprint = useSprintStore();
  const [goalType, setGoalType] = useState<'pomodoro' | 'wordCount'>('pomodoro');
  const [customWordCount, setCustomWordCount] = useState(500);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (goalType === 'pomodoro') {
      sprintActions.startPomodoro();
    } else {
      sprintActions.startQuantityGoal('wordCount', customWordCount, currentWordCount);
    }
    setIsOpen(false);
  };

  const btnClass = isTablet 
    ? "flex items-center justify-center p-1.5 md:p-2 shrink-0 rounded-lg text-slate-400 hover:text-white hover:bg-[#2d3640] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#2d3640] transition-colors"
    : "flex items-center justify-center p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#2d3640] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#2d3640] transition-colors shrink-0";

  const renderActiveButton = () => {
    if (sprint.type === 'pomodoro') {
      return (
        <button 
          onClick={() => setIsOpen(true)}
          className={btnClass}
          title={`Kalan Süre: ${formatTime(sprint.timeRemaining)}`}
        >
          <Timer size={isTablet ? 17 : 18} className="text-[#6ba3e8]" />
        </button>
      );
    }

    if (sprint.type === 'wordCount') {
      const added = Math.max(0, currentWordCount - sprint.startValue);
      const isComplete = added >= sprint.target;
      return (
        <button 
          onClick={() => setIsOpen(true)}
          className={btnClass}
          title={`Hedef: ${added}/${sprint.target} Kelime`}
        >
          <Target size={isTablet ? 17 : 18} className={isComplete ? "text-emerald-400" : "text-amber-400"} />
        </button>
      );
    }
    return null;
  };

  const popupContent = isOpen ? (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      <div className={`fixed z-[9999] w-64 bg-[#FFFFF0] dark:bg-[#1a1f25] border border-[#c8bea8] dark:border-[#2d3640] rounded-2xl shadow-2xl p-4 flex flex-col gap-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}>
        <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 border-b border-[#c8bea8] dark:border-[#2d3640] pb-2">
          <Target size={18} className="text-amber-500" />
          Yazım Hedefi
        </h3>
        
        {sprint.isActive ? (
          <div className="flex flex-col gap-4 text-center">
            {sprint.type === 'pomodoro' ? (
              <div className="text-3xl font-mono font-bold text-blue-600 dark:text-[#6ba3e8] py-4">{formatTime(sprint.timeRemaining)}</div>
            ) : (
              <div className="py-2">
                <div className="text-2xl font-mono font-bold text-amber-500">
                  {Math.max(0, currentWordCount - sprint.startValue)} / {sprint.target}
                </div>
                <div className="text-sm opacity-60 mt-1">Kelime</div>
              </div>
            )}
            <button 
              onClick={() => { sprintActions.stop(); setIsOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <X size={16} /> Hedefi İptal Et
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 p-1 bg-[#f4efe4] dark:bg-[#252c33] rounded-xl">
              <button 
                onClick={() => setGoalType('pomodoro')} 
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${goalType === 'pomodoro' ? 'bg-[#FFFFF0] dark:bg-[#1a1f25] shadow-sm text-blue-700 dark:text-[#6ba3e8]' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                Pomodoro
              </button>
              <button 
                onClick={() => setGoalType('wordCount')} 
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${goalType === 'wordCount' ? 'bg-[#FFFFF0] dark:bg-[#1a1f25] shadow-sm text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                Kelime
              </button>
            </div>

            {goalType === 'pomodoro' && (
              <div className="text-center space-y-2">
                <div className="text-3xl font-mono font-bold text-blue-700 dark:text-[#6ba3e8]">25:00</div>
                <p className="text-xs opacity-70">Aralıksız 25 dakika boyunca odaklanarak yazın.</p>
              </div>
            )}

            {goalType === 'wordCount' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold opacity-70 mb-1 block">Hedef Kelime</label>
                  <input 
                    type="number" 
                    value={customWordCount} 
                    onChange={e => setCustomWordCount(Number(e.target.value) || 0)}
                    className="w-full bg-[#f4efe4] dark:bg-[#252c33] border border-[#c8bea8] dark:border-[#2d3640] rounded-xl p-2 text-sm font-bold outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCustomWordCount(250)} className="flex-1 py-1 bg-[#f4efe4] dark:bg-[#252c33] rounded-lg text-xs hover:bg-[#dfd7ca] dark:hover:bg-[#2d3640]">250</button>
                  <button onClick={() => setCustomWordCount(500)} className="flex-1 py-1 bg-[#f4efe4] dark:bg-[#252c33] rounded-lg text-xs hover:bg-[#dfd7ca] dark:hover:bg-[#2d3640]">500</button>
                  <button onClick={() => setCustomWordCount(1000)} className="flex-1 py-1 bg-[#f4efe4] dark:bg-[#252c33] rounded-lg text-xs hover:bg-[#dfd7ca] dark:hover:bg-[#2d3640]">1000</button>
                </div>
              </div>
            )}

            <button 
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-transform active:scale-95 bg-blue-700 text-white dark:bg-[#6ba3e8] dark:text-slate-950 shadow-md"
            >
              <Play size={16} /> Başlat
            </button>
          </>
        )}
      </div>
    </>
  ) : null;

  return (
    <div className={isTablet ? '' : 'relative shrink-0'}>
      {sprint.isActive ? renderActiveButton() : (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={btnClass}
          title="Yazım Hedefi (Sprint/Pomodoro)"
        >
          <Target size={isTablet ? 17 : 18} /> 
        </button>
      )}

      {mounted && popupContent ? createPortal(popupContent, document.body) : null}
    </div>
  );
}
