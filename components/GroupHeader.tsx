
import React, { useState } from 'react';
import { Group } from '../types';
import { Plus, Users, ChevronDown, Check, Edit2, Trash2, X, Lock, Copy, LogOut } from 'lucide-react';

interface GroupHeaderProps {
  groups: Group[]; // My Groups
  activeGroupId: string;
  currentUserId: string;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string, password: string) => void;
  onJoinGroup: (code: string, password: string) => void;
  onUpdateGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
  onLeaveGroup: (id: string) => void;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({ 
  groups, 
  activeGroupId, 
  currentUserId,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  onUpdateGroup,
  onDeleteGroup,
  onLeaveGroup
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Mode: 'list' | 'create' | 'join'
  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list');
  
  // Form State
  const [inputName, setInputName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [inputPassword, setInputPassword] = useState('');

  // Editing State
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const isOwner = activeGroup?.ownerId === currentUserId;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim() && inputPassword.trim()) {
      onCreateGroup(inputName.trim(), inputPassword.trim());
      resetForm();
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim() && inputPassword.trim()) {
      onJoinGroup(inputCode.trim(), inputPassword.trim());
      resetForm();
    }
  };

  const resetForm = () => {
    setInputName('');
    setInputCode('');
    setInputPassword('');
    setMode('list');
    setIsOpen(false);
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
    if (window.confirm('그룹을 삭제하시겠습니까? 모든 데이터가 사라집니다.')) {
      onDeleteGroup(id);
    }
  };

  const handleLeave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('이 그룹에서 나가시겠습니까?')) {
      onLeaveGroup(id);
    }
  };

  const copyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    alert(`초대 코드 [${code}]가 복사되었습니다.`);
  };

  return (
    <div className="relative mb-6 z-20">
      <button 
        onClick={() => { setIsOpen(!isOpen); setMode('list'); }}
        className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Users size={20} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-400 font-bold">현재 스터디 그룹</span>
            <span className="text-white font-bold text-lg">{activeGroup?.name || '그룹을 선택/생성하세요'}</span>
          </div>
        </div>
        <ChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Group Code Badge */}
      {activeGroup && (
          <div className="absolute top-4 right-12 md:right-14">
              <button 
                onClick={(e) => copyCode(e, activeGroup.id)}
                className="flex items-center gap-1.5 bg-gray-900/80 hover:bg-black text-xs text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded cursor-pointer transition-colors"
              >
                  <span className="font-mono font-bold tracking-wider">{activeGroup.id}</span>
                  <Copy size={10} />
              </button>
          </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {mode === 'list' && (
            <>
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
                                    {group.ownerId === currentUserId ? (
                                        <>
                                            <button onClick={(e) => startEditing(e, group)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-gray-600 rounded" title="이름 수정">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={(e) => handleDelete(e, group.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-600 rounded" title="그룹 삭제">
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={(e) => handleLeave(e, group.id)} className="p-1.5 text-gray-500 hover:text-orange-400 hover:bg-gray-600 rounded" title="그룹 나가기">
                                            <LogOut size={14} />
                                        </button>
                                    )}
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
                
                <div className="p-2 grid grid-cols-2 gap-2 bg-gray-900/50 border-t border-gray-700">
                    <button
                        onClick={() => setMode('create')}
                        className="flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold transition-colors"
                    >
                        <Plus size={16} /> 방 만들기
                    </button>
                    <button
                        onClick={() => setMode('join')}
                        className="flex items-center justify-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-bold transition-colors"
                    >
                        <LogOut size={16} className="rotate-180" /> 코드로 입장
                    </button>
                </div>
            </>
          )}

          {mode === 'create' && (
              <form onSubmit={handleCreateSubmit} className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">새 그룹 생성</span>
                    <button type="button" onClick={() => setMode('list')} className="text-gray-500 hover:text-white"><X size={16}/></button>
                </div>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="그룹 이름 (예: 모각코)"
                  className="bg-gray-900 text-sm text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                  autoFocus
                  required
                />
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="비밀번호 설정"
                  className="bg-gray-900 text-sm text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                  required
                />
                <button type="submit" className="bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold mt-1">생성하기</button>
              </form>
          )}

          {mode === 'join' && (
              <form onSubmit={handleJoinSubmit} className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">코드로 입장</span>
                    <button type="button" onClick={() => setMode('list')} className="text-gray-500 hover:text-white"><X size={16}/></button>
                </div>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="그룹 코드 (6자리)"
                  className="bg-gray-900 text-sm text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                  autoFocus
                  required
                  maxLength={6}
                />
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="그룹 비밀번호"
                  className="bg-gray-900 text-sm text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                  required
                />
                <button type="submit" className="bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg text-sm font-bold mt-1">입장하기</button>
              </form>
          )}

        </div>
      )}
    </div>
  );
};
