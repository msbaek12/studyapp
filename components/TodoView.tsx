import React, { useState } from 'react';
import { Member, TodoItem } from '../types';
import { CheckCircle2, Circle, ListTodo, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface TodoViewProps {
  members: Member[];
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  todos: Record<string, TodoItem[]>;
  onToggleTodo: (memberId: string, todoId: string) => void;
  onAdd: (text: string) => void;
  onRemove: (todoId: string) => void;
  onUpdate: (todoId: string, text: string) => void;
  currentUserId: string;
}

export const TodoView: React.FC<TodoViewProps> = ({ 
  members, 
  selectedMemberId, 
  onSelectMember,
  todos,
  onToggleTodo,
  onAdd,
  onRemove,
  onUpdate,
  currentUserId
}) => {
  const currentTodos = todos[selectedMemberId] || [];
  const isMe = selectedMemberId === currentUserId;

  const [isAdding, setIsAdding] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      onAdd(newTodoText.trim());
      setNewTodoText('');
      setIsAdding(false);
    }
  };

  const startEditing = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const saveEditing = (id: string) => {
    if (editingText.trim()) {
      onUpdate(id, editingText.trim());
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
                selectedMemberId === member.id ? 'border-purple-500' : 'border-transparent'
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
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <ListTodo className="text-purple-400" /> 
                {members.find(m => m.id === selectedMemberId)?.name}의 투두리스트
            </h3>
            {isMe ? (
                 <button 
                    onClick={() => setIsAdding(true)}
                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                    <Plus size={14} /> 추가
                </button>
            ) : (
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full font-bold">
                    {currentTodos.filter(t => t.completed).length} / {currentTodos.length} 완료
                </span>
            )}
         </div>

         {isMe && isAdding && (
             <form onSubmit={handleAddSubmit} className="mb-4 bg-gray-700/50 p-3 rounded-lg flex gap-2 animate-in fade-in slide-in-from-top-2">
                 <input 
                    type="text" 
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    placeholder="할 일 입력..."
                    className="flex-1 bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
                    autoFocus
                 />
                 <button type="submit" className="text-xs bg-purple-600 text-white px-3 py-1 rounded">추가</button>
                 <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-gray-400 hover:text-white px-2 py-1">취소</button>
             </form>
         )}
         
         {currentTodos.length === 0 && !isAdding ? (
             <div className="text-center py-10 text-gray-500">
                 등록된 할 일이 없습니다.
             </div>
         ) : (
             <div className="space-y-2">
                 {currentTodos.map((todo) => (
                     <div 
                        key={todo.id} 
                        className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                            todo.completed 
                            ? 'bg-gray-900/30 border-gray-800 opacity-60' 
                            : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                        }`}
                     >
                        {/* Checkbox (Always visible, actionable if Me) */}
                         <div 
                            onClick={() => isMe && onToggleTodo(selectedMemberId, todo.id)}
                            className={`cursor-${isMe ? 'pointer' : 'default'}`}
                         >
                            {todo.completed ? (
                                <CheckCircle2 className="text-purple-500 w-5 h-5 flex-shrink-0" />
                            ) : (
                                <Circle className="text-gray-500 w-5 h-5 flex-shrink-0 group-hover:text-purple-400" />
                            )}
                         </div>

                         {/* Content or Edit Form */}
                         {editingId === todo.id ? (
                             <div className="flex-1 flex gap-2 items-center">
                                 <input 
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="flex-1 bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                                    autoFocus
                                 />
                                 <button onClick={() => saveEditing(todo.id)} className="text-green-400 p-1"><Check size={16}/></button>
                                 <button onClick={() => setEditingId(null)} className="text-gray-400 p-1"><X size={16}/></button>
                             </div>
                         ) : (
                             <span 
                                onClick={() => isMe && onToggleTodo(selectedMemberId, todo.id)}
                                className={`flex-1 text-sm cursor-${isMe ? 'pointer' : 'default'} ${todo.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}
                             >
                                 {todo.text}
                             </span>
                         )}

                         {/* Actions (Only for Me) */}
                         {isMe && !editingId && (
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-gray-800/90 rounded px-1">
                                 <button onClick={() => startEditing(todo)} className="p-1.5 text-gray-400 hover:text-blue-400"><Edit2 size={14} /></button>
                                 <button onClick={() => onRemove(todo.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                             </div>
                         )}
                     </div>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
};