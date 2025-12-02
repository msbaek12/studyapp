
import React, { useState } from 'react';
import { Eye, Users, Settings, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (name: string, groupName: string, groupPassword: string, avatarSeed: string) => void;
  onResetConfig: () => void;
}

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Sarah', 'Micah', 'Jessica', 'Jon', 'Bear', 'Fox', 'Cat'];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onResetConfig }) => {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_SEEDS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && groupName.trim() && groupPassword.trim()) {
      onLogin(name.trim(), groupName.trim(), groupPassword.trim(), selectedAvatar);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative">
      {/* Reset Config Button */}
      <button 
        onClick={onResetConfig}
        className="absolute top-4 right-4 text-gray-500 hover:text-white flex items-center gap-1 bg-gray-800/50 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors border border-gray-700"
        title="잘못된 설정 초기화"
      >
        <Settings size={16} />
        <span className="text-xs font-bold">설정 초기화</span>
      </button>

      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-red-500 text-3xl font-black tracking-tight">Studying Brother</h1>
            <Eye className="text-red-500 w-8 h-8" />
          </div>
          <p className="text-gray-400 text-sm">감시형 스터디 그룹에 입장하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-300">닉네임</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="사용할 이름을 입력하세요"
              className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              required
              maxLength={10}
            />
          </div>

          <div className="bg-gray-700/30 p-4 rounded-xl space-y-3 border border-gray-700">
            <div className="space-y-1">
                <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <Users size={16} className="text-indigo-400"/> 그룹 이름
                </label>
                <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="예: 전공 스터디"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                required
                maxLength={20}
                />
            </div>
            <div className="space-y-1">
                <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <Lock size={16} className="text-indigo-400"/> 그룹 비밀번호
                </label>
                <input
                type="password"
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                placeholder="비밀번호 설정 또는 입력"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                required
                maxLength={20}
                />
                <p className="text-xs text-gray-500">
                * 새 그룹이면 이 비밀번호로 생성되고,<br/>기존 그룹이면 비밀번호가 일치해야 입장됩니다.
                </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300">아바타 선택</label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setSelectedAvatar(seed)}
                  className={`relative rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === seed
                      ? 'border-red-500 scale-110 shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                    alt={seed}
                    className="w-full h-full bg-gray-700"
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg flex items-center justify-center gap-2"
          >
            시작하기
          </button>
        </form>
      </div>
    </div>
  );
};
