
import React from 'react';
import { Database, RefreshCw, Calendar, Users, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  isDbMode: boolean;
  activeTab: 'sessions' | 'presenters' | 'venues' | 'users';
  onRefresh: () => void;
  setActiveTab: (tab: 'sessions' | 'presenters' | 'venues' | 'users') => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  isDbMode, activeTab, onRefresh, setActiveTab
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start">
      <div className="flex-1">
        <h2 className="text-3xl font-display text-slate-900">Festival Manager</h2>
        <div className="flex items-center gap-4 mt-2">
          <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isDbMode ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 shadow-sm ring-1 ring-red-200'}`}>
            {isDbMode ? <Database size={12}/> : <AlertCircle size={12}/>}
            {isDbMode ? 'Cloud Ready' : 'Empty Database'}
          </span>
          <button onClick={onRefresh} className="text-orange-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline group">
            <RefreshCw size={10} className="group-hover:rotate-180 transition-transform duration-500" /> Sync Real-time
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-full lg:w-auto">
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'sessions' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Calendar size={14} /> Sessions
        </button>
        <button 
          onClick={() => setActiveTab('presenters')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'presenters' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Users size={14} /> Presenters
        </button>
        <button 
          onClick={() => setActiveTab('venues')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'venues' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <MapPin size={14} /> Venues
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <ShieldCheck size={14} /> Users
        </button>
      </div>
    </div>
  );
};
