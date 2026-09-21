import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

type SprintType = 'pomodoro' | 'wordCount' | 'pageCount' | null;

interface SprintState {
  isActive: boolean;
  type: SprintType;
  target: number;
  startValue: number;
  timeRemaining: number;
  hasAchieved: boolean;
}

let globalState: SprintState = {
  isActive: false,
  type: null,
  target: 0,
  startValue: 0,
  timeRemaining: 0,
  hasAchieved: false,
};

let listeners = new Set<() => void>();
let timerInterval: any = null;

const notify = () => {
  listeners.forEach(l => l());
};

export const sprintActions = {
  startPomodoro: () => {
    globalState = {
      ...globalState,
      isActive: true,
      type: 'pomodoro',
      target: 25 * 60,
      startValue: 0,
      timeRemaining: 25 * 60,
      hasAchieved: false,
    };
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (globalState.timeRemaining > 0) {
        globalState.timeRemaining -= 1;
        if (globalState.timeRemaining === 0) {
          globalState.hasAchieved = true;
          globalState.isActive = false;
          clearInterval(timerInterval);
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
          });
          setTimeout(() => {
            alert('Tebrikler! Pomodoro hedefinize ulaştınız. Harika bir iş çıkardınız! 🎉');
          }, 500);
        }
        notify();
      }
    }, 1000);
    notify();
  },
  
  startQuantityGoal: (type: 'wordCount' | 'pageCount', target: number, currentValue: number) => {
    globalState = {
      ...globalState,
      isActive: true,
      type,
      target,
      startValue: currentValue,
      timeRemaining: 0,
      hasAchieved: false,
    };
    if (timerInterval) clearInterval(timerInterval);
    notify();
  },

  updateQuantity: (currentValue: number) => {
    if (globalState.isActive && (globalState.type === 'wordCount' || globalState.type === 'pageCount') && !globalState.hasAchieved) {
      const diff = currentValue - globalState.startValue;
      if (diff >= globalState.target) {
        globalState.hasAchieved = true;
        globalState.isActive = false;
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });
        setTimeout(() => {
          alert(`Tebrikler! Belirlediğiniz ${globalState.target} ${globalState.type === 'wordCount' ? 'kelime' : 'sayfa'} hedefine ulaştınız! 🎉`);
        }, 500);
        notify();
      }
    }
  },

  stop: () => {
    globalState = {
      ...globalState,
      isActive: false,
      type: null,
      hasAchieved: false,
    };
    if (timerInterval) clearInterval(timerInterval);
    notify();
  }
};

export function useSprintStore() {
  const [state, setState] = useState(globalState);

  useEffect(() => {
    const l = () => setState({ ...globalState });
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return state;
}
