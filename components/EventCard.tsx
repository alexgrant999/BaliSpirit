
import React from 'react';
import { FestivalEvent, Category, Venue, Presenter } from '../types';
import { format } from 'date-fns';
import { MapPin, Users, Tag, Heart, Calendar, Clock } from 'lucide-react';

interface EventCardProps {
  event: FestivalEvent;
  category: Category;
  venue: Venue;
  presenters: Presenter[];
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: (event: FestivalEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  category,
  venue,
  presenters,
  isFavorite,
  onToggleFavorite,
  onClick
}) => {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  return (
    <div 
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 overflow-hidden cursor-pointer flex flex-col h-full"
      style={{ borderLeftColor: category.color }}
      onClick={() => onClick(event)}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-black tracking-widest uppercase opacity-80 px-2 py-0.5 rounded-md bg-slate-50" style={{ color: category.color }}>
            {category.name}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(event.id);
            }}
            className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'bg-red-50 text-red-500' : 'text-slate-300 hover:text-red-400 hover:bg-red-50'}`}
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <h3 className="font-bold text-lg text-slate-800 leading-tight mb-4 group-hover:text-orange-600 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-2.5 text-xs text-slate-500 mb-4 flex-1">
          <div className="flex items-center gap-2.5 text-slate-900 font-semibold bg-slate-50 p-2 rounded-lg">
            <Calendar size={14} className="text-orange-500" />
            <span>{format(start, 'EEE, MMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center gap-2.5 px-2">
            <Clock size={14} className="text-slate-400" />
            <span className="font-medium">
              {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
            </span>
          </div>
          
          <div className="flex items-center gap-2.5 px-2">
            <MapPin size={14} className="text-slate-400" />
            <span className="truncate">{venue.name}</span>
          </div>

          <div className="flex items-center gap-2.5 px-2">
            <Users size={14} className="text-slate-400" />
            <span className="truncate">{presenters.map(p => p.name).join(', ')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-auto pt-3 border-t border-slate-50">
          {event.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-[9px] rounded-full text-slate-500 font-bold uppercase tracking-tighter flex items-center gap-1">
              <Tag size={8} />
              {tag}
            </span>
          ))}
          {event.tags.length > 3 && (
            <span className="text-[9px] text-slate-400 font-bold px-1">+{event.tags.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
};
