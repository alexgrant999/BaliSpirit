
import React from 'react';
import { Calendar, Users, MapPin } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'schedule' | 'presenters' | 'venues';
  onTabChange: (tab: 'schedule' | 'presenters' | 'venues') => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'presenters', icon: Users, label: 'Presenters' },
    { id: 'venues', icon: MapPin, label: 'Venues' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:hidden flex justify-around items-center h-16 pb-safe px-4 shadow-lg">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button 
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === id ? 'text-orange-600' : 'text-slate-400'}`}
        >
          <Icon size={20} className={activeTab === id ? 'fill-orange-50' : ''} />
          <span className="text-[10px] font-bold mt-1">{label}</span>
        </button>
      ))}
    </nav>
  );
};
