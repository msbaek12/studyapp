
import React, { useState } from 'react';
import { Group } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GroupCalendarProps {
  groups: Group[];
}

// Mock data generator for study history to simulate "days the group studied"
const getMockStudyDates = (groupId: string, year: number, month: number): string[] => {
  const dates = [];
  // Deterministic "random" dates based on group ID to keep UI consistent
  const seed = groupId.charCodeAt(0) + (groupId.length * 5);
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let d = 1; d <= daysInMonth; d++) {
    // Logic: Study roughly 60% of the time, creating streaks
    // Use different modulo logic per group to create variety
    if ((d + seed) % (3 + (seed % 3)) !== 0) { 
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
  }
  return dates;
};

export const GroupCalendar: React.FC<GroupCalendarProps> = ({ groups }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  
  // Pre-calculate study dates for all groups
  const groupStudyData = groups.map(group => ({
      group,
      dates: getMockStudyDates(group.id, year, month)
  }));

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysCount = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const renderDays = () => {
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Days
    for (let d = 1; d <= daysCount; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = todayStr === dateString;

      // Find which groups studied on this day
      const activeGroupsForDay = groupStudyData.filter(data => data.dates.includes(dateString));

      days.push(
        <div key={d} className="h-12 flex flex-col items-center pt-1 relative cursor-default group border border-transparent hover:bg-gray-800/50 rounded-lg transition-colors">
          <span className={`text-xs z-10 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-gray-700 text-white font-bold shadow-lg' : 'text-gray-400'}`}>
            {d}
          </span>
          
          {/* Study Indicators (Dots) */}
          <div className="flex gap-1 mt-1 flex-wrap justify-center px-1">
             {activeGroupsForDay.map((data) => (
                 <div 
                    key={data.group.id}
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: data.group.color }}
                    title={data.group.name}
                />
             ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          통합 스터디 캘린더
        </h3>
        <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-700 rounded transition-colors"><ChevronLeft size={16} className="text-gray-400" /></button>
            <span className="text-sm font-bold text-white min-w-[80px] text-center">
                {year}년 {monthNames[month]}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-700 rounded transition-colors"><ChevronRight size={16} className="text-gray-400" /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2 border-b border-gray-700 pb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div key={day} className={`text-xs font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
                {day}
            </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>

      {/* Dynamic Legend */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center border-t border-gray-700/50 pt-3">
          {groups.map(group => (
              <div key={group.id} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }}></div>
                  <span className="text-xs text-gray-400">{group.name}</span>
              </div>
          ))}
      </div>
    </div>
  );
};
