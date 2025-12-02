
import React, { useState } from 'react';
import { Group } from '../types';
import { Plus, Users, ChevronDown, Check, Edit2, Trash2, X, Lock } from 'lucide-react';

interface GroupHeaderProps {
  groups: Group[]; // These are "My Groups" now
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string, password: string) => void; // Combined create/join handler
  onUpdateGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({ 
  groups, 
  activeGroupId, 
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPassword, setNewGroupPassword] = useState('');

  // Editing State
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const activeGroup = groups.find(g => g.id === activeGroupId);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim() && newGroupPassword.trim()) {
      onCreateGroup(newGroupName.trim(), newGroupPassword.trim());
      setNewGroupName('');
      setNewGroupPassword('');
      setIsAdding(false);
      setIsOpen(false);
    }
  };

  const startEditing = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    setEditingGroupId(group.id);
    setEditName(group.name);
  };

  const saveEditing = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim()) {
      onUpdateGroup(id, editName.trim());
      setEditingGroupId(null);
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('이 그룹에서 탈퇴(삭제) 하시겠습니까?')) {
      onDeleteGroup(id);
    }
  };

  return (
    <div className="relative mb-6 z-20">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Users size={20} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-400 font-bold">현재 스터디 그룹</span>
            <span className="text-white font-bold text-lg">{activeGroup?.name || '그룹 선택'}</span>
          </div>
        </div>
        <ChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto">
             <div className="px-4 py-2 text-xs text-gray-500 font-bold uppercase tracking-wider bg-gray-900/50">내 그룹 목록</div>
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => {
                  if (editingGroupId !== group.id) {
                    onSelectGroup(group.id);
                    setIsOpen(false);
                  }
                }}
                className={`w-full flex items-center justify-between p-3 border-b border-gray-700/50 last:border-0 group ${
                    editingGroupId === group.id ? 'bg-gray-700' : 'hover:bg-gray-700 cursor-pointer'
                }`}
              >
                {editingGroupId === group.id ? (
                    // Edit Mode
                    <div className="flex w-full gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-gray-900 text-white px-2 py-1 rounded text-sm border border-indigo-500 focus:outline-none"
                            autoFocus
                        />
                        <button onClick={(e) => saveEditing(e, group.id)} className="p-1 text-green-400 hover:bg-gray-600 rounded"><Check size={16} /></button>
                        <button onClick={cancelEditing} className="p-1 text-gray-400 hover:bg-gray-600 rounded"><X size={16} /></button>
                    </div>
                ) : (
                    // View Mode
                    <>
                        <div className="flex items-center gap-2 flex-1 overflow-hidden">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }}></div>
                            <span className={`font-medium truncate ${group.id === activeGroupId ? 'text-indigo-400' : 'text-gray-300'}`}>
                            {group.name}
                            </span>
                            {group.id === activeGroupId && <Check size={14} className="text-indigo-400 flex-shrink-0" />}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => startEditing(e, group)}
                                className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-gray-600 rounded"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, group.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-600 rounded"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </>
                )}
              </div>
            ))}
            {groups.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                    가입된 그룹이 없습니다.
                </div>
            )}
          </div>
          
          <div className="p-3 bg-gray-900/50 border-t border-gray-700">
            {isAdding ? (
              <form onSubmit={handleAddSubmit} className="flex flex-col gap-2 p-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-white font-bold">새 그룹 생성 또는 가입</span>
                    <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500"><X size={14} /></button>
                </div>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="그룹 이름"
                  className="bg-gray-800 text-sm text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                  autoFocus
                  required
                />
                <input
                  type="password"
                  value={newGroupPassword}
                  onChange={(e) => setNewGroupPassword(e.target.value)}
                  placeholder="그룹 비밀번호"
                  className="bg-gray-800 text-sm text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                  required
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold"
                >
                  확인 (생성/입장)
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white py-1"
              >
                <Plus size={16} /> 새 그룹 추가 (가입/생성)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
