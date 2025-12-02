import React from 'react';
import { Clock, AlertTriangle, Smartphone, RotateCcw } from 'lucide-react';

interface TimerDisplayProps {
  isRunning: boolean;
  distractedMemberName?: string | null;
  distractedMessage?: string;
  isMeDistracted: boolean;
  seconds: number;
  onReset: () => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  isRunning, 
  distractedMemberName, 
  distractedMessage,
  isMeDistracted,
  seconds,
  onReset
}) => {
  const handleResetClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling
    onReset(); // Reset immediately without confirmation for better UX
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hasDistraction = !!distractedMemberName;

  return (
    <div className="flex flex-col items-center justify-center w-full mb-4">
      <div 
        className={`relative w-full max-w-sm py-8 px-4 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 overflow-hidden ${
            isRunning 
            ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
            : hasDistraction
            ? 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            : 'bg-gray-800/50 border-gray-700'
        }`}
      >
        {/* Visual Pulse for Blocked State */}
        {hasDistraction && (
             <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
        )}
        
        {/* Reset Button (Top Right) */}
        <button 
            type="button"
            onClick={handleResetClick}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-20"
            title="타이머 초기화 (00:00:00)"
        >
            <RotateCcw size={18} />
        </button>

        <div className="flex flex-col items-center z-10">
            <span className={`text-5xl md:text-6xl font-bold tracking-wider font-mono transition-colors ${
                isRunning ? 'text-emerald-400' : 
                hasDistraction ? 'text-red-500' : 'text-gray-500'
            }`}>
            {formatTime(seconds)}
            </span>
            
            {/* Blame Message */}
            {hasDistraction && (
                <div className="mt-2 flex flex-col items-center text-red-400 animate-bounce text-center">
                    <div className="flex items-center gap-2 mb-1">
                        {isMeDistracted ? <Smartphone size={16} /> : <AlertTriangle size={16} />}
                        <span className="text-sm font-bold">
                            {isMeDistracted ? "⚠️ 내 스마트폰 사용 감지됨!" : `⚠️ ${distractedMemberName}님 딴짓 감지!`}
                        </span>
                    </div>
                    {/* Unified Message Display */}
                    <span className="text-xs font-medium bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                        {distractedMessage || "사유: 잠금 해제됨"}
                    </span>
                </div>
            )}
        </div>
      </div>

      <div className={`flex items-center gap-2 mt-3 transition-colors ${
          hasDistraction ? 'text-red-400/80' : 'text-emerald-500/80'
      }`}>
        <Clock size={16} />
        <span className="text-sm font-semibold tracking-wide">
            {hasDistraction ? '연대 책임 발동 (랭킹 집계 중단)' : '연대 책임 타이머 작동 중'}
        </span>
      </div>
    </div>
  );
};