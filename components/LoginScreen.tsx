import React, { useState } from 'react';
import { Eye, Users } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (name: string, groupName: string, avatarSeed: string) => void;
}

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Sarah', 'Micah', 'Jessica', 'Jon', 'Bear', 'Fox', 'Cat'];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_SEEDS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && groupName.trim()) {
      onLogin(name.trim(), groupName.trim(), selectedAvatar);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-red-500 text-3xl font-black tracking-tight">Studying Brother</h1>
            <Eye className="text-red-500 w-8 h-8" />
          </div>
          <p className="text-gray-400 text-sm">감시형 스터디 그룹에 입장하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
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

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
              <Users size={16} className="text-indigo-400"/> 그룹 이름 (입장/생성)
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="예: 전공 스터디, 자격증 뽀개기"
              className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
              maxLength={20}
            />
            <p className="text-xs text-gray-500 px-1">
              * 동일한 이름을 입력하면 해당 그룹으로 입장합니다.
            </p>
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
            입장하기
          </button>
        </form>
      </div>
    </div>
  );
};