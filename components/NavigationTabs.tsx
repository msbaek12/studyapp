import React from 'react';
import { TabType } from '../types';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = Object.values(TabType);

  return (
    <div className="flex w-full border-b border-gray-700 mb-6 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 min-w-[80px] pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
            activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {tab}
          {activeTab === tab && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
};
