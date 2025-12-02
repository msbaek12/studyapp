import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface ControlsProps {
  isLocked: boolean;
  toggleLock: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  isLocked, 
  toggleLock
}) => {
  
  return (
    <div className="w-full mb-8">
      <button
        onClick={toggleLock}
        className={`w-full relative group overflow-hidden rounded-2xl p-1 transition-all duration-300 ${
            isLocked 
            ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
            : 'bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.3)]'
        }`}
      >
        <div className={`relative z-10 w-full h-16 flex items-center justify-center gap-3 rounded-xl transition-transform duration-300 ${
             isLocked ? 'bg-gray-900 translate-y-0' : 'bg-blue-600 -translate-y-0'
        }`}>
            {isLocked ? (
                <>
                    <Lock className="text-emerald-500 animate-pulse" />
                    <span className="text-emerald-500 font-bold text-lg">스마트폰 잠김 (공부 중)</span>
                    <span className="absolute right-4 text-xs text-gray-500 font-normal hidden sm:block">
                        클릭하여 잠금 해제
                    </span>
                </>
            ) : (
                <>
                    <Unlock className="text-white/80" />
                    <span className="text-white font-bold text-lg">스마트폰 잠금 (공부 시작)</span>
                </>
            )}
        </div>
        
        {/* Background Fill Effect */}
        {!isLocked && (
             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
      
      {/* Helper Text */}
      <div className="mt-3 text-center h-5">
          {isLocked ? (
             <p className="text-xs text-red-400 font-bold animate-pulse">
                ⚠️ 잠금 해제 시 그룹원 모두에게 알림이 전송됩니다!
             </p>
          ) : (
             <p className="text-xs text-gray-500">
                연대 책임: 모두가 잠궈야 타이머가 작동합니다.
             </p>
          )}
      </div>
    </div>
  );
};