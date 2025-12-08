import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { Check, Flame } from 'lucide-react';

export const DailyStreak: React.FC = () => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle Window Resize for Confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check LocalStorage on mount
  useEffect(() => {
    const today = new Date().toDateString();
    const lastCheckIn = localStorage.getItem('lastCheckIn');
    if (lastCheckIn === today) {
      setCheckedIn(true);
    }
  }, []);

  const handleCheckIn = () => {
    if (checkedIn) return;
    
    setCheckedIn(true);
    setShowConfetti(true);
    const today = new Date().toDateString();
    localStorage.setItem('lastCheckIn', today);

    // Stop confetti after 5 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
  };

  // Circular Progress Logic
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = checkedIn ? 0 : circumference;

  return (
    <div className="relative">
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
           <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} gravity={0.3} />
        </div>
      )}
      
      <div className="bg-secondary rounded-3xl border border-card-border p-6 flex flex-col items-center justify-center relative overflow-hidden group">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors"></div>

        <div className="relative mb-4 cursor-pointer" onClick={handleCheckIn}>
            {/* SVG Ring */}
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
              <circle
                stroke="#334155" // Slate-700
                strokeWidth={stroke}
                fill="transparent"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#f97316" // Orange-500
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            
            {/* Center Icon */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${checkedIn ? 'scale-110' : 'hover:scale-105'}`}>
               <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${checkedIn ? 'bg-orange-500 text-white shadow-orange-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {checkedIn ? <Check className="w-10 h-10 animate-bounce" /> : <Flame className="w-10 h-10" />}
               </div>
            </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {checkedIn ? "Streak Active!" : "Daily Check-in"}
        </h3>
        <p className="text-xs text-slate-400 text-center max-w-[200px]">
          {checkedIn 
            ? "Great job maintaining your health streak!" 
            : "Click the ring to mark your daily health goals complete."}
        </p>
      </div>
    </div>
  );
};
