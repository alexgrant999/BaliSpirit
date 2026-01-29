
import React from 'react';
import { Venue } from '../types';
import { MapPin, ArrowRight, Compass, Waves, Trees, Coffee } from 'lucide-react';

interface VenuesViewProps {
  venues: Venue[];
  onViewSchedule: (venueId: string) => void;
}

const getVenueIcon = (name: string) => {
  if (name.toLowerCase().includes('pool')) return <Waves size={24} className="text-blue-500" />;
  if (name.toLowerCase().includes('grove')) return <Trees size={24} className="text-green-500" />;
  if (name.toLowerCase().includes('lounge')) return <Coffee size={24} className="text-orange-500" />;
  return <Compass size={24} className="text-purple-500" />;
};

export const VenuesView: React.FC<VenuesViewProps> = ({ venues, onViewSchedule }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12">
        <h2 className="text-4xl font-display text-slate-900 mb-2">Festival Map</h2>
        <p className="text-slate-500 font-medium">Explore the sacred spaces of the Bali Spirit Festival</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {venues.map((venue) => (
          <div 
            key={venue.id} 
            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-6 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onViewSchedule(venue.id)}
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              {getVenueIcon(venue.name)}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                {venue.name}
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                {venue.description || "A beautiful space dedicated to movement, sound, and connection."}
              </p>
              <button className="flex items-center gap-2 text-sm font-bold text-blue-600">
                View Schedule <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
