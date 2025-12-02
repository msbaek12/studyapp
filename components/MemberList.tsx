
import React, { useState } from 'react';
import { Member } from '../types';
import { AlertTriangle, Zap } from 'lucide-react';

interface MemberListProps {
  members: Member[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
  currentUserId: string;
  groupName: string;
}

export const MemberList: React.FC<MemberListProps> = ({ members, onAddMember, onRemoveMember, currentUserId, groupName }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-sm font-bold">스터디 멤버 상태 ({members.length}명)</h3>
      </div>

      {members.length === 0 && (
          <div className="text-center py-8 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
              <p className="text-gray-400 text-sm">아직 멤버가 없습니다.</p>
              <p className="text-gray-500 text-xs mt-1">친구를 초대하여 함께 공부하세요!</p>
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
