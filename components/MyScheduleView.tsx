import React from 'react';
import { Calendar, Clock, MapPin, Heart, Sparkles } from 'lucide-react';
import { FestivalEvent, Category, Venue, Presenter } from '../types';
import { format, isSameDay, parseISO } from 'date-fns';

interface MyScheduleViewProps {
  events: FestivalEvent[];
  categories: Category[];
  venues: Venue[];
  presenters: Presenter[];
  favorites: string[];
  onToggleFavorite: (eventId: string) => void;
  onEventClick: (event: FestivalEvent) => void;
}

export const MyScheduleView: React.FC<MyScheduleViewProps> = ({
  events,
  categories,
  venues,
  presenters,
  favorites,
  onToggleFavorite,
  onEventClick
}) => {
  // Filter to only show favorited events
  const favoriteEvents = events.filter(e => favorites.includes(e.id));

  // Group events by day
  const eventsByDay = favoriteEvents.reduce((acc, event) => {
    const date = format(parseISO(event.startTime), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, FestivalEvent[]>);

  // Sort days chronologically
  const sortedDays = Object.keys(eventsByDay).sort();

  const getCategoryName = (categoryId: string) =>
    categories.find(c => c.id === categoryId)?.name || 'Uncategorized';

  const getCategoryColor = (categoryId: string) =>
    categories.find(c => c.id === categoryId)?.color || '#ea580c';

  const getVenueName = (venueId: string) =>
    venues.find(v => v.id === venueId)?.name || 'TBA';

  const getPresenterNames = (presenterIds: string[]) =>
    presenterIds
      .map(id => presenters.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');

  if (favoriteEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <Heart size={48} className="text-orange-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">No Favorites Yet</h2>
        <p className="text-slate-500 text-center max-w-md mb-8">
          Start building your personal schedule by tapping the heart icon on sessions you'd like to attend.
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Sparkles size={16} />
          <span>Your favorited sessions will appear here</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Heart className="text-orange-600" size={32} />
          My Schedule
        </h1>
        <p className="text-slate-600">
          {favoriteEvents.length} {favoriteEvents.length === 1 ? 'session' : 'sessions'} saved
        </p>
      </div>

      {/* Events grouped by day */}
      {sortedDays.map(day => {
        const dayEvents = eventsByDay[day].sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        const dayDate = parseISO(dayEvents[0].startTime);

        return (
          <div key={day} className="mb-10">
            {/* Day Header */}
            <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 -mx-4 px-4 py-4 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="text-orange-600" size={20} />
                <h2 className="text-xl font-bold text-slate-900">
                  {format(dayDate, 'EEEE, MMMM d, yyyy')}
                </h2>
                <span className="text-sm text-slate-500 ml-auto">
                  {dayEvents.length} {dayEvents.length === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            </div>

            {/* Events for this day */}
            <div className="space-y-4">
              {dayEvents.map(event => {
                const category = categories.find(c => c.id === event.categoryId);
                const startTime = parseISO(event.startTime);
                const endTime = parseISO(event.endTime);

                return (
                  <div
                    key={event.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex gap-4">
                      {/* Time column */}
                      <div className="flex-shrink-0 w-20 text-center pt-1">
                        <div className="text-sm font-bold text-slate-900">
                          {format(startTime, 'h:mm')}
                        </div>
                        <div className="text-xs text-slate-400">
                          {format(startTime, 'a')}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {Math.round((endTime.getTime() - startTime.getTime()) / 60000)}m
                        </div>
                      </div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0">
                        {/* Category badge */}
                        <div
                          className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-3"
                          style={{ backgroundColor: getCategoryColor(event.categoryId) }}
                        >
                          {getCategoryName(event.categoryId)}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                          {event.title}
                        </h3>

                        {/* Meta info */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-400" />
                            <span>{getVenueName(event.venueId)}</span>
                          </div>
                          {event.presenterIds.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">with</span>
                              <span className="font-medium">{getPresenterNames(event.presenterIds)}</span>
                            </div>
                          )}
                        </div>

                        {/* Description preview */}
                        {event.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Heart button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(event.id);
                        }}
                        className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors"
                      >
                        <Heart
                          size={20}
                          className="text-orange-600 fill-orange-600"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
