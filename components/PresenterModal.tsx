
import React from 'react';
import { Presenter } from '../types';
import { X, Instagram, Globe, Facebook, MessageSquare } from 'lucide-react';

interface PresenterModalProps {
  presenter: Presenter;
  onClose: () => void;
}

export const PresenterModal: React.FC<PresenterModalProps> = ({ presenter, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-20 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white shadow-lg transition-all"
        >
          <X size={24} />
        </button>

        <div className="relative h-[40vh] min-h-[300px]">
          <img 
            src={presenter.image || 'https://picsum.photos/seed/bali/600/800'} 
            className="w-full h-full object-cover"
            alt={presenter.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-10">
            <h2 className="text-4xl md:text-5xl font-display text-slate-900 leading-tight">
              {presenter.name}
            </h2>
          </div>
        </div>

        <div className="p-10 pt-0 overflow-y-auto max-h-[50vh]">
          <div className="flex gap-4 mb-8">
            {presenter.instagram && (
              <a 
                href={`https://instagram.com/${presenter.instagram.replace('@','')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-full text-xs font-bold hover:bg-pink-100 transition-colors"
              >
                <Instagram size={14} /> Instagram
              </a>
            )}
            {presenter.website && (
              <a 
                href={presenter.website.startsWith('http') ? presenter.website : `https://${presenter.website}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Globe size={14} /> Website
              </a>
            )}
            {presenter.facebook && (
              <a 
                href={presenter.facebook.startsWith('http') ? presenter.facebook : `https://facebook.com/${presenter.facebook}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                <Facebook size={14} /> Facebook
              </a>
            )}
          </div>

          <div className="prose prose-slate max-w-none">
            <div className="flex items-center gap-2 text-orange-600 mb-4">
              <MessageSquare size={16} fill="currentColor" opacity={0.2} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">The Journey</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-lg italic font-light">
              {presenter.bio || "No biography available for this facilitator."}
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button 
              onClick={onClose}
              className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
            >
              Close Bio
            </button>
        </div>
      </div>
    </div>
  );
};
