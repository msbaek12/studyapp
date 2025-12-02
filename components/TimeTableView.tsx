import React, { useState } from 'react';
import { Member, TimeTableItem } from '../types';
import { Plus, Trash2, Edit2, Check, X, ArrowRight } from 'lucide-react';

interface TimeTableViewProps {
  members: Member[];
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  timetables: Record<string, TimeTableItem[]>;
  onAdd: (startTime: string, endTime: string, subject: string) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, startTime: string, endTime: string, subject: string) => void;
  currentUserId: string;
}

export const TimeTableView: React.FC<TimeTableViewProps> = ({ 
  members, 
  selectedMemberId, 
  onSelectMember,
  timetables,
  onAdd,
  onRemove,
  onUpdate,
  currentUserId
}) => {
  const currentSchedule = timetables[selectedMemberId] || [];
  const isMe = selectedMemberId === currentUserId;

  const [isAdding, setIsAdding] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editSubject, setEditSubject] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStartTime && newEndTime && newSubject) {
      if (newStartTime >= newEndTime) {
        alert("종료 시간은 시작 시간보다 늦어야 합니다.");
        return;
      }
      onAdd(newStartTime, newEndTime, newSubject);
      setNewStartTime('');
      setNewEndTime('');
      setNewSubject('');
      setIsAdding(false);
    }
  };

  const startEditing = (item: TimeTableItem) => {
    setEditingId(item.id);
    setEditStartTime(item.startTime);
    setEditEndTime(item.endTime);
    setEditSubject(item.subject);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditStartTime('');
    setEditEndTime('');
    setEditSubject('');
  };

  const saveEditing = (id: string) => {
    if (editStartTime && editEndTime && editSubject) {
       if (editStartTime >= editEndTime) {
        alert("종료 시간은 시작 시간보다 늦어야 합니다.");
        return;
      }
      onUpdate(id, editStartTime, editEndTime, editSubject);
      setEditingId(null);
    }
  };

  return (
    <div className="w-full">
      {/* Member Selector */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelectMember(member.id)}
            className={`flex flex-col items-center gap-2 min-w-[60px] transition-opacity ${
              selectedMemberId === member.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <div className={`w-12 h-12 rounded-full border-2 p-0.5 ${
                selectedMemberId === member.id ? 'border-blue-500' : 'border-transparent'
            }`}>
                 <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`}
                    alt={member.name}
                    className="w-full h-full rounded-full bg-gray-700 object-cover"
                />
            </div>
            <span className="text-xs text-gray-300 font-medium truncate max-w-[60px]">
              {member.name}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                📅 {members.find(m => m.id === selectedMemberId)?.name}의 시간표
            </h3>
            {isMe && !isAdding && (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                    <Plus size={14} /> 추가
                </button>
            )}
         </div>

         {/* Add Form */}
         {isMe && isAdding && (
             <form onSubmit={handleAddSubmit} className="mb-4 bg-gray-700/50 p-3 rounded-lg flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                 <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1 border border-gray-600">
                        <input 
                            type="time" 
                            value={newStartTime}
                            onChange={(e) => setNewStartTime(e.target.value)}
                            className="bg-transparent text-white text-sm focus:outline-none"
                            required
                        />
                        <ArrowRight size={12} className="text-gray-500" />
                        <input 
                            type="time" 
                            value={newEndTime}
                            onChange={(e) => setNewEndTime(e.target.value)}
                            className="bg-transparent text-white text-sm focus:outline-none"
                            required
                        />
                     </div>
                 </div>
                 <input 
                    type="text" 
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="과목명 입력"
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                    required
                 />
                 <div className="flex gap-2 justify-end mt-1">
                     <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-gray-400 hover:text-white px-2 py-1">취소</button>
                     <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1 rounded">저장</button>
                 </div>
             </form>
         )}
         
         {currentSchedule.length === 0 && !isAdding ? (
             <div className="text-center py-10 text-gray-500">
                 등록된 시간표가 없습니다.
             </div>
         ) : (
             <div className="space-y-3">
                 {currentSchedule.map((item) => (
                     <div key={item.id} className="group relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors">
                         {editingId === item.id ? (
                            // Edit Mode
                            <div className="flex flex-col w-full gap-2">
                                <div className="flex items-center gap-2">
                                     <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1 border border-gray-600">
                                        <input 
                                            type="time" 
                                            value={editStartTime}
                                            onChange={(e) => setEditStartTime(e.target.value)}
                                            className="bg-transparent text-white text-sm focus:outline-none w-20"
                                        />
                                        <ArrowRight size={12} className="text-gray-500" />
                                        <input 
                                            type="time" 
                                            value={editEndTime}
                                            onChange={(e) => setEditEndTime(e.target.value)}
                                            className="bg-transparent text-white text-sm focus:outline-none w-20"
                                        />
                                    </div>
                                    <div className="flex-1" />
                                    <button onClick={() => saveEditing(item.id)} className="text-green-400 hover:text-green-300 p-1"><Check size={16}/></button>
                                    <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-300 p-1"><X size={16}/></button>
                                </div>
                                <input 
                                    type="text"
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                    className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                                />
                            </div>
                         ) : (
                            // View Mode
                            <>
                                <div className="min-w-[130px] flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-sm">
                                    <span>{item.startTime}</span>
                                    <span className="text-gray-600">~</span>
                                    <span>{item.endTime}</span>
                                </div>
                                <div className="flex-1 font-medium text-gray-200 break-words">
                                    {item.subject}
                                </div>
                                {isMe && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-gray-900/90 rounded px-1">
                                        <button onClick={() => startEditing(item)} className="p-1.5 text-gray-400 hover:text-blue-400"><Edit2 size={14} /></button>
                                        <button onClick={() => onRemove(item.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                                    </div>
                                )}
                            </>
                         )}
                     </div>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
};