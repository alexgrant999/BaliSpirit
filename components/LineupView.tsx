
import React from 'react';
import { Presenter } from '../types';
import { Users, Instagram, Globe, Facebook } from 'lucide-react';

interface LineupViewProps {
  presenters: Presenter[];
}

export const LineupView: React.FC<LineupViewProps> = ({ presenters }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-4xl font-display text-slate-900 mb-2">Lineup</h2>
        <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500">
          <Users size={18} />
          <span className="font-medium">{presenters.length} Featured Artists & Teachers</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {presenters.map((presenter) => (
          <div 
            key={presenter.id} 
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full"
          >
            <div className="aspect-[4/5] overflow-hidden relative">
              <img 
                src={presenter.image || 'https://picsum.photos/seed/bali/400/500'} 
                alt={presenter.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute bottom-4 left-4 flex gap-2">
                {presenter.instagram && (
                  <a href={`https://instagram.com/${presenter.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="p-2 bg-white/90 rounded-full text-pink-600 hover:bg-white transition-colors">
                    <Instagram size={16} />
                  </a>
                )}
                {presenter.website && (
                  <a href={presenter.website.startsWith('http') ? presenter.website : `https://${presenter.website}`} target="_blank" rel="noreferrer" className="p-2 bg-white/90 rounded-full text-blue-600 hover:bg-white transition-colors">
                    <Globe size={16} />
                  </a>
                )}
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-2xl font-display text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                {presenter.name}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed line-clamp-4">
                {presenter.bio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
