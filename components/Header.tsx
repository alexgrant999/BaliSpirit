
import React, { useState } from 'react';
import { Layout, Shield, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { LotusLogo } from './LotusLogo';
import { User } from '../types';

interface HeaderProps {
  activeTab: 'schedule' | 'presenters' | 'venues';
  isAdminMode: boolean;
  user: User | null;
  onTabChange: (tab: 'schedule' | 'presenters' | 'venues') => void;
  onAdminToggle: () => void;
  onHomeClick: () => void;
  onAuthClick: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isAdminMode,
  user,
  onTabChange,
  onAdminToggle,
  onHomeClick,
  onAuthClick,
  onSignOut
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onHomeClick}>
          <LotusLogo className="h-10 w-10 transition-transform hover:scale-110" />
          <div className="hidden sm:block">
            <h1 className="font-display text-lg text-slate-900 leading-tight">Bali Spirit</h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Festival Scheduler</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 h-full">
          {(['schedule', 'presenters', 'venues'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              disabled={isAdminMode}
              className={`text-sm font-semibold h-full border-b-2 flex items-center px-2 transition-colors capitalize ${
                isAdminMode 
                  ? 'text-slate-300 border-transparent cursor-not-allowed'
                  : activeTab === tab 
                    ? 'text-orange-600 border-orange-600' 
                    : 'text-slate-500 border-transparent hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
            <button 
              onClick={() => isAdminMode && onAdminToggle()}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${!isAdminMode ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Layout size={12} /> Public
            </button>
            <button 
              onClick={() => !isAdminMode && onAdminToggle()}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isAdminMode ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Shield size={12} /> Admin
            </button>
          </div>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setShowProfileMenu(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => { onAdminToggle(); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Shield size={16} /> Admin Portal
                      </button>
                      <button 
                        onClick={() => { onSignOut(); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              <UserIcon size={14} />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
