import React, { useState, useMemo, useEffect, useCallback, ErrorInfo, ReactNode } from 'react';
import { User, ViewMode, FestivalEvent, Category, Venue, Presenter } from './types';
import { Filters } from './components/Filters';
import { EventCard } from './components/EventCard';
import { EventModal } from './components/EventModal';
import { PresenterModal } from './components/PresenterModal';
import { AdminPanel } from './components/AdminPanel';
import { PresentersView } from './components/PresentersView';
import { VenuesView } from './components/VenuesView';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { LotusLogo } from './components/LotusLogo';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { Loader2, Calendar, Clock, AlertTriangle, RefreshCcw, Activity, ShieldAlert, RotateCcw } from 'lucide-react';
import { useFestivalData } from './hooks/useFestivalData';
import { isSupabaseConfigured, supabase, signOut, fetchUserFavorites, toggleFavoriteInDb, getSupabaseStatus } from './services/supabase';
import { format } from 'date-fns';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Critical Fix: Explicitly use React.Component to ensure proper type inference for props
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
          <div className="p-4 bg-red-50 rounded-full text-red-600 mb-6">
            <AlertTriangle size={48} />
          </div>
          <h1 className="text-2xl font-display text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-500 text-sm max-w-md mb-8">
            The application encountered an unexpected error.
          </p>
          <pre className="p-4 bg-slate-50 rounded-2xl text-[10px] text-red-600 text-left font-mono overflow-auto max-w-full mb-8 border border-slate-100">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all"
          >
            <RotateCcw size={18} /> Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type Tab = 'schedule' | 'presenters' | 'venues';

const AppContent: React.FC = () => {
  const {
    loading: dataLoading, events, categories, venues, presenters, isDbMode,
    refreshData, onAddEvent, onUpdateEvent, onDeleteEvent, 
    onSavePresenter, onDeletePresenter, onSaveVenue, onDeleteVenue
  } = useFestivalData();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bypassLoading, setBypassLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedPresenterId, setSelectedPresenterId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | 'all'>('all');
  
  const [logs, setLogs] = useState<string[]>(['System Startup...']);
  const [isWakingDb, setIsWakingDb] = useState(false);

  // Memoize addLog to be stable across renders
  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-3), msg]);
  }, []);

  const syncUserFromSession = useCallback(async (session: any) => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    try {
      addLog("Syncing profile...");
      const [favorites, profileRes] = await Promise.all([
        fetchUserFavorites(session.user.id).catch(() => [] as string[]),
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().catch(() => ({ data: null }))
      ]);

      const profile = profileRes.data;

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        role: (profile?.role as 'admin' | 'user') || 'user',
        interests: profile?.interests || [],
        favorites: favorites || [],
        phone: profile?.phone,
        avatarUrl: profile?.avatar_url
      });
      addLog("User authenticated.");
    } catch (err) {
      console.error("Profile Sync Error:", err);
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        role: 'user',
        favorites: []
      });
    }
  }, [addLog]);

  useEffect(() => {
    addLog("Connecting to Supabase...");
    
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await syncUserFromSession(session);
      } catch (err) {
        console.error(err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      await syncUserFromSession(session);
      if (authLoading) setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [syncUserFromSession, authLoading, addLog]);

  const handleForceWake = async () => {
    if (isWakingDb) return;
    setIsWakingDb(true);
    const status = await getSupabaseStatus(20000);
    setIsWakingDb(false);
    if (status.ok) refreshData();
  };

  const festivalDays = useMemo(() => {
    const days = new Set<string>();
    events.forEach(e => {
      try {
        days.add(format(new Date(e.startTime), 'yyyy-MM-dd'));
      } catch (err) {}
    });
    return Array.from(days).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      try {
        const eventDate = format(new Date(event.startTime), 'yyyy-MM-dd');
        const matchesDay = selectedDay === 'all' || eventDate === selectedDay;
        const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || event.categoryId === selectedCategory;
        const matchesVenue = selectedVenue === 'all' || event.venueId === selectedVenue;
        const matchesFavorite = !onlyFavorites || (user?.favorites?.includes(event.id));
        return matchesDay && matchesSearch && matchesCategory && matchesVenue && matchesFavorite;
      } catch (err) {
        return false;
      }
    }).sort((a,b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });
  }, [events, search, selectedCategory, selectedVenue, onlyFavorites, user, selectedDay]);

  const eventsByDay = useMemo(() => {
    const groups: Record<string, FestivalEvent[]> = {};
    filteredEvents.forEach(event => {
      try {
        const dayLabel = format(new Date(event.startTime), 'EEEE, MMMM d');
        if (!groups[dayLabel]) groups[dayLabel] = [];
        groups[dayLabel].push(event);
      } catch (err) {}
    });
    return groups;
  }, [filteredEvents]);

  const canAccessAdmin = user?.role === 'admin';

  const getEventCategory = (event: FestivalEvent) => {
    return categories.find(c => c.id === event.categoryId) || (({ id: 'unknown', name: 'Other' as any, color: '#64748b' }) as any);
  };

  const getEventVenue = (event: FestivalEvent) => {
    return venues.find(v => v.id === event.venueId) || { id: 'unknown', name: 'Unknown Venue' } as Venue;
  };

  const getEventPresenters = (event: FestivalEvent) => {
    return presenters.filter(p => event.presenterIds?.includes(p.id));
  };

  // Safe loading check
  const isLoading = (dataLoading || authLoading) && !bypassLoading;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6 overflow-y-auto">
        <div className="max-w-md w-full flex flex-col items-center py-10">
          <LotusLogo className="h-16 w-16 mb-8 animate-pulse" />
          <Loader2 className="animate-spin text-orange-500 mb-6" size={28} />
          <h2 className="font-display text-2xl text-slate-900 mb-4 text-center">Waking up the Festival...</h2>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[10px] font-mono text-slate-400 uppercase tracking-widest text-left space-y-1 shadow-inner inline-block min-w-[200px]">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <Activity size={10} className="mt-0.5 text-orange-400" /> {log}
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-3">
             <button onClick={handleForceWake} className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
               <RefreshCcw size={12} className={isWakingDb ? 'animate-spin' : ''} /> Reconnect
             </button>
             <button onClick={() => setBypassLoading(true)} className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
               Demo Mode
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        activeTab={activeTab} isAdminMode={isAdminMode} user={user}
        onTabChange={setActiveTab} 
        onAdminToggle={() => {
          if (!user) setShowAuthModal(true);
          else setIsAdminMode(!isAdminMode);
        }}
        onHomeClick={() => {setActiveTab('schedule'); setIsAdminMode(false);}}
        onAuthClick={() => setShowAuthModal(true)} 
        onSignOut={() => signOut().then(() => setUser(null))}
        onSettingsClick={() => setShowSettingsModal(true)}
      />

      <main className="flex-1 bg-slate-50 pb-20 md:pb-8">
        {isAdminMode ? (
          canAccessAdmin ? (
            <AdminPanel 
              events={events} categories={categories} venues={venues} presenters={presenters}
              onAddEvent={onAddEvent} onUpdateEvent={onUpdateEvent} onDeleteEvent={onDeleteEvent}
              onSavePresenter={onSavePresenter} onDeletePresenter={onDeletePresenter}
              onSaveVenue={onSaveVenue} onDeleteVenue={onDeleteVenue}
              isLive={isSupabaseConfigured} isDbMode={isDbMode} onRefresh={refreshData}
            />
          ) : (
            <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[2.5rem] border border-slate-200 text-center shadow-xl animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={40} />
              </div>
              <h2 className="text-2xl font-display text-slate-900 mb-2">Privileged Access Required</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Your account ({user?.email}) does not have administrative privileges for the Bali Spirit Festival. 
                Please contact the coordinator to elevate your role.
              </p>
              <button 
                onClick={() => setIsAdminMode(false)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-black transition-all"
              >
                Return to Public View
              </button>
            </div>
          )
        ) : (
          <>
            {activeTab === 'presenters' ? <PresentersView presenters={presenters} onPresenterClick={setSelectedPresenterId} /> : 
             activeTab === 'venues' ? <VenuesView venues={venues} onViewSchedule={(id) => {setSelectedVenue(id); setActiveTab('schedule');}} /> :
             (
               <>
                 <Filters 
                   search={search} setSearch={setSearch}
                   selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                   selectedVenue={selectedVenue} setSelectedVenue={setSelectedVenue}
                   viewMode={viewMode} setViewMode={setViewMode}
                   onlyFavorites={onlyFavorites} setOnlyFavorites={(v) => user ? setOnlyFavorites(v) : setShowAuthModal(true)}
                   categories={categories} venues={venues} onPrint={() => {}}
                 />

                 <div className="bg-white border-b border-slate-100 sticky top-[168px] md:top-[128px] z-10 no-print">
                   <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide flex items-center justify-between">
                     <div className="flex items-center gap-2 py-3">
                       <button onClick={() => setSelectedDay('all')} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${selectedDay === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-500'}`}>All Days</button>
                       {festivalDays.map(day => (
                         <button key={day} onClick={() => setSelectedDay(day)} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${selectedDay === day ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{format(new Date(day), 'EEE, MMM d')}</button>
                       ))}
                     </div>
                   </div>
                 </div>

                 <div className="max-w-7xl mx-auto px-4 py-8">
                   {filteredEvents.length === 0 ? (
                      <div className="py-20 text-center">
                        <Calendar size={32} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No sessions match</h3>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters.</p>
                      </div>
                   ) : (
                     <div className="space-y-12">
                        {(Object.entries(eventsByDay) as [string, FestivalEvent[]][]).map(([dayLabel, dayEvents]) => (
                          <section key={dayLabel} className="space-y-6">
                            <div className="flex items-center gap-4 sticky top-[230px] md:top-[190px] z-10 bg-slate-50/95 backdrop-blur-sm py-2">
                              <div className="bg-orange-100 text-orange-600 p-2 rounded-xl"><Clock size={20} /></div>
                              <h2 className="text-2xl font-display text-slate-900">{dayLabel}</h2>
                              <div className="flex-1 border-b border-slate-200"></div>
                            </div>
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                              {dayEvents.map(event => (
                                <EventCard 
                                  key={event.id} 
                                  event={event} 
                                  category={getEventCategory(event)}
                                  venue={getEventVenue(event)}
                                  presenters={getEventPresenters(event)}
                                  isFavorite={user?.favorites?.includes(event.id) || false}
                                  onToggleFavorite={(id) => {
                                    if (!user) setShowAuthModal(true);
                                    else {
                                      const isFav = user.favorites.includes(id);
                                      const next = isFav ? user.favorites.filter(fid => fid !== id) : [...user.favorites, id];
                                      setUser({ ...user, favorites: next });
                                      toggleFavoriteInDb(user.id, id, isFav);
                                    }
                                  }} 
                                  onClick={(e) => setSelectedEventId(e.id)}
                                />
                              ))}
                            </div>
                          </section>
                        ))}
                     </div>
                   )}
                 </div>
               </>
             )
            }
          </>
        )}
      </main>

      {!isAdminMode && <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showSettingsModal && user && (
        <SettingsModal 
          user={user} 
          onClose={() => setShowSettingsModal(false)} 
          onUpdate={setUser}
        />
      )}
      
      {selectedEventId && (
        <EventModal 
          event={events.find(e => e.id === selectedEventId)!}
          category={getEventCategory(events.find(e => e.id === selectedEventId)!)}
          venue={getEventVenue(events.find(e => e.id === selectedEventId)!)}
          presenters={getEventPresenters(events.find(e => e.id === selectedEventId)!)}
          onClose={() => setSelectedEventId(null)} onPresenterClick={setSelectedPresenterId}
        />
      )}
      {selectedPresenterId && <PresenterModal presenter={presenters.find(p => p.id === selectedPresenterId)!} onClose={() => setSelectedPresenterId(null)} />}
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;