import React, { useState } from 'react';
import { Member } from '../types';
import { AlertTriangle, Zap, Share2, Copy, Check } from 'lucide-react';

interface MemberListProps {
  members: Member[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
  currentUserId: string;
  groupName: string;
}

export const MemberList: React.FC<MemberListProps> = ({ members, onAddMember, onRemoveMember, currentUserId, groupName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = () => {
    // Copy group name to clipboard
    navigator.clipboard.writeText(groupName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-sm font-bold">스터디 멤버 상태 ({members.length}명)</h3>
        
        <button 
            onClick={handleCopyInvite}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                copied ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
            }`}
        >
            {copied ? <Check size={12} /> : <Share2 size={12} />}
            {copied ? '복사됨!' : '그룹 이름 복사'}
        </button>
      </div>

      {members.length === 0 && (
          <div className="text-center py-8 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
              <p className="text-gray-400 text-sm">아직 멤버가 없습니다.</p>
              <p className="text-gray-500 text-xs mt-1">친구에게 그룹 이름 <span className="text-blue-400 font-bold">"{groupName}"</span>을<br/>공유하여 초대하세요!</p>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className={`relative group flex items-center gap-4 p-3 rounded-xl border transition-all ${
              member.status === 'distracted'
                ? 'bg-red-500/5 border-red-500/30'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="relative">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`}
                alt={member.name}
                className={`w-12 h-12 rounded-full border-2 object-cover bg-gray-700 ${
                  member.status === 'distracted' ? 'border-red-500' : 'border-emerald-500'
                }`}
              />
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900 ${
                  member.status === 'distracted' ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              >
                {member.status === 'distracted' ? (
                  <AlertTriangle size={10} className="text-white" />
                ) : (
                  <Zap size={10} className="text-white" />
                )}
              </div>
            </div>
            
            <div className="flex flex-col flex-1">
              <span className={`font-bold ${member.id === currentUserId ? 'text-white' : 'text-gray-300'}`}>
                {member.name} {member.id === currentUserId && <span className="text-xs text-gray-500 font-normal">(나)</span>}
              </span>
              <span className={`text-xs font-medium ${
                 member.status === 'distracted' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {member.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};