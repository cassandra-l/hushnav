import React, { useState, useEffect } from 'react';
import { XButton } from './components/x-button';

interface BreathingExerciseProps {
  onClose: () => void;
}

type Phase = 'In' | 'Out';

export function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const [phase, setPhase] = useState<Phase>('In');
  const [timeLeft, setTimeLeft] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const nextPhase = phase === 'In' ? 'Out' : 'In';
          setPhase(nextPhase);
          return nextPhase === 'In' ? 4 : 6;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#E6F2EF] p-6 font-sans text-[#1E2939]">
      <style>{`
        @keyframes drain {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 565.48; }
        }
        .animate-drain {
          animation: drain linear infinite;
          stroke-dasharray: 565.48;
        }
      `}</style>

      <XButton />

      <div className="relative flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-40 w-40 rounded-full bg-white/40 blur-2xl"></div>
          
          <svg className="rotate-[-90deg]" width="240" height="240">
            <circle cx="120" cy="120" r="90" stroke="#C5DCD6" strokeWidth="8" fill="transparent" />
            
            <circle 
              key={phase} 
              cx="120" cy="120" r="90" 
              stroke="#1E2939" strokeWidth="8" fill="transparent" 
              strokeLinecap="round"
              className="animate-drain"
              style={{ animationDuration: phase === 'In' ? '4s' : '6s' }}
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className="text-[60px] font-light tracking-tighter leading-none">{timeLeft}</span>
            <span className="text-[14px] uppercase tracking-widest opacity-70">seconds</span>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            {phase === 'In' ? 'Breathe In' : 'Breathe Out'}
          </h1>
          <p className="mt-2 text-lg opacity-80">
            {phase === 'In' ? 'Inhale slowly through your nose' : 'Exhale slowly through your mouth'}
          </p>
        </div>
      </div>
    </div>
  );
}