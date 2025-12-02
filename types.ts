
export interface Group {
  id: string; // This is now the Random Code
  name: string;
  color: string;
  password?: string;
  ownerId: string; // ID of the creator
}

export interface Member {
  id: string;
  name: string;
  status: 'focus' | 'distracted';
  avatarSeed: string;
  message: string;
  groupId: string;
}

export interface ChartDataPoint {
  name: string;
  value1: number; // 본인 공부량
  value2: number; // 평균 공부량
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TimeTableItem {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
}

export enum TabType {
  GROUP = '그룹 룸',
  CALENDAR = '캘린더',
  TIMETABLE = '시간표',
  TODO = '투두',
  RANKING = '랭킹',
}
