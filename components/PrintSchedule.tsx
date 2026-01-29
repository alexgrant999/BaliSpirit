
import React from 'react';
import { FestivalEvent, Category, Venue, Presenter } from '../types';
import { format } from 'date-fns';

interface PrintScheduleProps {
  events: FestivalEvent[];
  categories: Category[];
  venues: Venue[];
  presenters: Presenter[];
  isStandalone?: boolean;
}

const getCategoryKey = (catName: string): string => {
  const name = catName.toLowerCase();
  if (name.includes('yoga') || name.includes('dance')) return 'Y';
  if (name.includes('music')) return 'M';
  if (name.includes('meditation') || name.includes('breath')) return 'B';
  if (name.includes('talk') || name.includes('dharma')) return 'D';
  if (name.includes('percussion') || name.includes('kirtan')) return 'P';
  return '?';
};

export const PrintSchedule: React.FC<PrintScheduleProps> = ({
  events, categories, venues, presenters, isStandalone = false
}) => {
  // Group events by day
  const groupedEvents = events.reduce((acc, event) => {
    const day = format(new Date(event.startTime), 'MMMM d • EEEE').toUpperCase();
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {} as Record<string, FestivalEvent[]>);

  return (
    <div className={isStandalone ? 'bg-white' : 'print-only'}>
      <div style={{ padding: '0 10px', color: 'black', fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 20px 0' }}>Balispirit Festival 2025</h1>
        
        <div className="legend">
          <div><span className="category-box">B</span> Breathwork-Sound Medicine-Ceremony-Meditation-Relaxation</div>
          <div><span className="category-box">D</span> Dharma Talks-Seminars-Bodywork-Health Talks</div>
          <div><span className="category-box">M</span> Music</div>
          <div><span className="category-box">P</span> Percussion-Music-Kirtan-Voice</div>
          <div><span className="category-box">Y</span> Yoga-Dance-Qigong-Martial Arts</div>
        </div>

        {Object.keys(groupedEvents).map((day) => {
          const dayEvents = groupedEvents[day];
          return (
            <div key={day}>
              <div className="day-header">{day}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  {dayEvents.map(event => {
                    const cat = categories.find(c => c.id === event.categoryId);
                    const venue = venues.find(v => v.id === event.venueId);
                    const eventPresenters = presenters.filter(p => event.presenterIds.includes(p.id));
                    const startTime = format(new Date(event.startTime), 'h:mm a').toLowerCase();
                    const endTime = format(new Date(event.endTime), 'h:mm a').toLowerCase();

                    return (
                      <tr key={event.id} style={{ borderBottom: '1px solid black' }}>
                        <td style={{ width: '140px', fontWeight: '500', padding: '8px 0' }}>
                          {startTime} – {endTime}
                        </td>
                        <td style={{ width: '40px', textAlign: 'center', padding: '8px 0' }}>
                          <span className="category-box">{getCategoryKey(cat?.name || '')}</span>
                        </td>
                        <td style={{ padding: '8px 4px' }}>
                          <div style={{ fontWeight: 'bold' }}>{event.title}</div>
                          <div style={{ fontSize: '9pt', fontStyle: 'italic', marginTop: '2px' }}>
                            Presenters: {eventPresenters.map(p => p.name).join(' & ')}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '500', minWidth: '100px', padding: '8px 0' }}>
                          {venue?.name}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
};
