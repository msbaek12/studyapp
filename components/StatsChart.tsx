import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChartDataPoint } from '../types';

interface StatsChartProps {
  data: ChartDataPoint[];
}

export const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-8">
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">
        실시간 공부량 비교 (분)
      </h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9ca3af', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
              }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar dataKey="value1" radius={[4, 4, 0, 0]} name="공부 시간">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : '#4b5563'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};