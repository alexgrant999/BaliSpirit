
import React, { useEffect, useState } from 'react';
import { FestivalEvent, Category, Venue, Presenter } from '../types';
import { format } from 'date-fns';
import { X, MapPin, Clock, Tag, Sparkles } from 'lucide-react';
import { getEventSummary } from '../services/gemini';

interface EventModalProps {
  event: FestivalEvent;
  category: Category;
  venue: Venue;
  presenters: Presenter[];
  onClose: () => void;
  onPresenterClick: (id: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  event, category, venue, presenters, onClose, onPresenterClick
}) => {
  const [smartSummary, setSmartSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      const summary = await getEventSummary(event);
      setSmartSummary(summary);
      setLoadingSummary(false);
    };
    fetchSummary();
  }, [event]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
        <div className="h-32 w-full relative" style={{ backgroundColor: category.color + '22' }}>
           <div className="absolute top-4 right-4 z-10">
            <button onClick={onClose} className="p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-slate-600 hover:text-slate-900 transition-all">
              <X size={20} />
            </button>
          </div>
          <div className="absolute -bottom-6 left-8 p-3 rounded-xl bg-white shadow-lg border-2" style={{ borderColor: category.color }}>
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: category.color }}>{category.name}</span>
          </div>
        </div>

        <div className="p-8 pt-10 overflow-y-auto max-h-[80vh]">
          <h2 className="text-3xl font-display text-slate-900 mb-4">{event.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Clock size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Time & Date</p>
                  <p className="font-medium text-sm">{format(new Date(event.startTime), 'EEEE, MMM d')}</p>
                  <p className="text-xs">{format(new Date(event.startTime), 'h:mm a')} – {format(new Date(event.endTime), 'h:mm a')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <MapPin size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Venue</p>
                  <p className="font-medium text-sm">{venue.name}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-orange-500" />
                <span className="text-[10px] font-bold text-orange-700 uppercase">AI Insight</span>
              </div>
              <p className="text-sm text-orange-900 leading-relaxed italic">
                {loadingSummary ? 'Generating summary...' : smartSummary || event.description}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">About this session</h4>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{event.description}</p>
          </div>

          <div className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Facilitators</h4>
            <div className="space-y-3">
              {presenters.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => onPresenterClick(p.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-orange-50 hover:border-orange-200 hover:shadow-sm transition-all text-left group"
                >
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" />
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 text-sm group-hover:text-orange-700 transition-colors">{p.name}</h5>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">View Facilitator Bio</p>
                  </div>
                </button>
              ))}
              {presenters.length === 0 && (
                <p className="text-xs text-slate-400 italic">No facilitators linked to this session.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            {event.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 rounded-full flex items-center gap-1">
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
