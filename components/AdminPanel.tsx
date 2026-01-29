
import React, { useState } from 'react';
import { FestivalEvent, Category, Venue, Presenter } from '../types';
import { AlertTriangle } from 'lucide-react';
import { AdminHeader } from './AdminHeader';
import { AdminSessionManager } from './AdminSessionManager';
import { AdminPresenterManager } from './AdminPresenterManager';
import { AdminVenueManager } from './AdminVenueManager';

interface AdminPanelProps {
  events: FestivalEvent[];
  categories: Category[];
  venues: Venue[];
  presenters: Presenter[];
  onAddEvent: (event: Partial<FestivalEvent>) => Promise<void>;
  onUpdateEvent: (event: FestivalEvent) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onSavePresenter: (presenter: Partial<Presenter>) => Promise<void>;
  onDeletePresenter: (id: string) => Promise<void>;
  onSaveVenue: (venue: Partial<Venue>) => Promise<void>;
  onDeleteVenue: (id: string) => Promise<void>;
  isLive: boolean;
  isDbMode: boolean;
  onRefresh: () => void;
}

type AdminTab = 'sessions' | 'presenters' | 'venues';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  events, categories, venues, presenters, 
  onAddEvent, onUpdateEvent, onDeleteEvent, 
  onSavePresenter, onDeletePresenter, 
  onSaveVenue, onDeleteVenue,
  isLive, isDbMode, onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('sessions');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <AdminHeader 
        isDbMode={isDbMode}
        activeTab={activeTab}
        onRefresh={onRefresh}
        setActiveTab={setActiveTab}
      />

      {!isDbMode && isLive && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 text-amber-800 shadow-sm">
          <AlertTriangle size={24} className="shrink-0" />
          <div className="text-sm">
            <p className="font-bold uppercase tracking-tight text-[10px] mb-1">DATA REQUIRED</p>
            <p>The cloud database is currently empty. Use the tabs below to manually set up your festival's <strong>Venues</strong>, <strong>Presenters</strong>, and <strong>Sessions</strong>.</p>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <AdminSessionManager 
          events={events}
          categories={categories}
          venues={venues}
          presenters={presenters}
          onAddEvent={onAddEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}
      
      {activeTab === 'presenters' && (
        <AdminPresenterManager 
          presenters={presenters}
          onSavePresenter={onSavePresenter}
          onDeletePresenter={onDeletePresenter}
        />
      )}

      {activeTab === 'venues' && (
        <AdminVenueManager 
          venues={venues}
          onSaveVenue={onSaveVenue}
          onDeleteVenue={onDeleteVenue}
        />
      )}
    </div>
  );
};
