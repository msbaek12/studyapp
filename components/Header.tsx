import React from 'react';
import { Eye } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-red-500 text-3xl font-black tracking-tight">
          Studying Brother
        </h1>
        <Eye className="text-red-500 w-8 h-8 animate-pulse" />
      </div>
      {/* Subtitle removed as requested */}
    </header>
  );
};