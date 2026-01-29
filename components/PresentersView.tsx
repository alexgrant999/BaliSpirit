
import React from 'react';
import { Presenter } from '../types';
import { Users, Instagram, Globe, Facebook, Search, ArrowRight } from 'lucide-react';

interface PresentersViewProps {
  presenters: Presenter[];
  onPresenterClick: (id: string) => void;
}

export const PresentersView: React.FC<PresentersViewProps> = ({ presenters, onPresenterClick }) => {
  if (presenters.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
          <Users size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Presenters Found</h3>
        <p className="text-slate-500 text-sm mt-1">Presenters will appear here once they are added to the database.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-4xl font-display text-slate-900 mb-2">Presenters</h2>
        <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500">
          <Users size={18} />
          <span className="font-medium">{presenters.length} Artists, Teachers & Facilitators</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {presenters.map((presenter) => (
          <div 
            key={presenter.id} 
            onClick={() => onPresenterClick(presenter.id)}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col h-full cursor-pointer transform hover:-translate-y-2"
          >
            <div className="aspect-[4/5] overflow-hidden relative">
              <img 
                src={presenter.image || 'https://picsum.photos/seed/bali/400/500'} 
                alt={presenter.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-4 left-4 flex gap-2">
                {presenter.instagram && (
                  <div className="p-2 bg-white/90 rounded-full text-pink-600 shadow-sm">
                    <Instagram size={16} />
                  </div>
                )}
                {presenter.website && (
                  <div className="p-2 bg-white/90 rounded-full text-blue-600 shadow-sm">
                    <Globe size={16} />
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500">
                <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-xl uppercase tracking-widest">
                  View Bio <ArrowRight size={12} />
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-2xl font-display text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                {presenter.name}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                {presenter.bio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
