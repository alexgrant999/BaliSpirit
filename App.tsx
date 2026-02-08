
import React, { useState, useMemo, useEffect, useCallback, ErrorInfo, ReactNode } from 'react';
import { User, ViewMode, FestivalEvent, Category, Venue, Presenter } from './types';
import { Filters } from './components/Filters';
import { EventCard } from './components/EventCard';
import { EventModal } from './components/EventModal';
import { PresenterModal } from './components/PresenterModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminAuth } from './components/AdminAuth';
import { PresentersView } from './components/PresentersView';
import { VenuesView } from './components/VenuesView';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { LotusLogo } from './components/LotusLogo';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { Loader2, Calendar, Clock, AlertTriangle, RefreshCcw, Activity, RotateCcw, ShieldCheck, Database } from 'lucide-react';
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
          <p className="text-slate-500 text-sm max-w-md mb-8">The application encountered an unexpected error.</p>
          <pre className="p-4 bg-slate-50 rounded-2xl text-[10px] text-red-600 text-left font-mono overflow-auto max-w-full mb-8 border border-slate-100">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all">
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
    loading: dataLoading, events, categories, venues, presenters, isDbMode, statusMessage,
    refreshData, onAddEvent, onUpdateEvent, onDeleteEvent, 
    onSavePresenter, onDeletePresenter, onSaveVenue, onDeleteVenue
  } = useFestivalData();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedPresenterId, setSelectedPresenterId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | 'all'>('all');

  const syncUserFromSession = useCallback(async (session: any) => {
    console.log('🔄 syncUserFromSession called', session ? 'with session' : 'no session');

    if (!session?.user) {
      console.log('No session user, setting user to null');
      setUser(null);
      return;
    }

    try {
      console.log('Syncing user:', session.user.id, session.user.email);

      // Set basic user state immediately to avoid blocking on database queries
      const userState = {
        id: session.user.id,
        email: session.user.email || '',
        role: 'user' as 'admin' | 'user',
        favorites: []
      };

      console.log('✅ Setting initial user state:', userState);
      setUser(userState);

      // Fetch profile details in the background (non-blocking)
      setTimeout(async () => {
        try {
          const [favorites, profileRes] = await Promise.all([
            fetchUserFavorites(session.user.id).catch(() => []),
            supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
          ]);

          console.log('Profile query result:', profileRes);
          const profile = profileRes.data;

          // Update user state with full profile details
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: (profile?.role as 'admin' | 'user') || 'user',
            favorites: favorites || [],
            phone: profile?.phone,
            avatarUrl: profile?.avatar_url
          });
          console.log('✅ Updated user state with profile details');
        } catch (err) {
          console.error('Failed to fetch profile details:', err);
        }
      }, 500); // Delay to let auth settle

    } catch (err) {
      console.error("User Sync Error:", err);
      // Set a minimal user state so the user at least appears logged in
      const fallbackUser = {
        id: session.user.id,
        email: session.user.email || '',
        role: 'user' as const,
        favorites: []
      };
      console.log('⚠️ Using fallback user state:', fallbackUser);
      setUser(fallbackUser);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          await syncUserFromSession(session);
        }
      } catch (err: any) {
        // Ignore AbortErrors from React StrictMode double-mounting
        if (err.name === 'AbortError') {
          console.log('Auth initialization aborted (React StrictMode), ignoring...');
        } else if (mounted) {
          console.error('Auth initialization error:', err);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (!mounted) return;

      try {
        await syncUserFromSession(session);
        if (authLoading && mounted) setAuthLoading(false);
        if ((event === 'SIGNED_IN' || event === 'SIGNED_OUT') && mounted) refreshData();
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Auth state change aborted, ignoring...');
        } else if (mounted) {
          console.error('Auth state change error:', err);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserFromSession, authLoading, refreshData]);

  const festivalDays = useMemo(() => {
    const days = new Set<string>();
    events.forEach(e => {
      try { days.add(format(new Date(e.startTime), 'yyyy-MM-dd')); } catch (err) {}
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
      } catch (err) { return false; }
    }).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
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

  const canAccessAdmin = user?.role === 'admin' || isLocalAdmin;

  const getEventCategory = (event: FestivalEvent) => categories.find(c => c.id === event.categoryId) || { id: 'unknown', name: 'Other' as any, color: '#64748b' } as Category;
  const getEventVenue = (event: FestivalEvent) => venues.find(v => v.id === event.venueId) || { id: 'unknown', name: 'Unknown Venue' } as Venue;
  const getEventPresenters = (event: FestivalEvent) => presenters.filter(p => event.presenterIds?.includes(p.id));

  const isDbEmpty = isDbMode && events.length === 0 && presenters.length === 0 && venues.length === 0;

  if (dataLoading || authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6">
        <LotusLogo className="h-16 w-16 mb-8 animate-pulse" />
        <Loader2 className="animate-spin text-orange-500 mb-6" size={28} />
        <h2 className="font-display text-2xl text-slate-900 mb-4 text-center">Opening the Festival...</h2>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[10px] font-mono text-slate-400 uppercase tracking-widest text-left space-y-2 w-64 shadow-inner">
           <div className="flex gap-2 text-orange-600"><Activity size={10} className="mt-0.5" /> {statusMessage}</div>
           <div className="pt-2 border-t border-slate-200">
              <div className="flex justify-between"><span>Events:</span> <span>{events.length}</span></div>
              <div className="flex justify-between"><span>Presenters:</span> <span>{presenters.length}</span></div>
              <div className="flex justify-between"><span>Venues:</span> <span>{venues.length}</span></div>
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
            <AdminAuth onAuthorized={() => setIsLocalAdmin(true)} />
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

                 {isDbEmpty && canAccessAdmin && (
                    <div className="max-w-7xl mx-auto px-4 mt-6">
                      <div className="bg-orange-50 border border-orange-200 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="flex items-center gap-4 text-orange-800">
                          <Database size={32} className="shrink-0" />
                          <div>
                            <h3 className="font-bold text-lg">Connected, but no Data</h3>
                            <p className="text-sm opacity-80 leading-relaxed">Your Supabase project is reachable, but your tables are empty. Head to the Admin Portal to add your content.</p>
                          </div>
                        </div>
                        <button onClick={() => setIsAdminMode(true)} className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-orange-700 transition-all shrink-0">
                          <ShieldCheck size={18} className="inline mr-2" /> Open Admin Portal
                        </button>
                      </div>
                    </div>
                 )}

                 <div className="bg-white border-b border-slate-100 sticky top-[168px] md:top-[128px] z-10 no-print">
                   <div className="max-w-7xl mx-auto px-4 overflow-x-auto flex items-center gap-2 py-3">
                     <button onClick={() => setSelectedDay('all')} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${selectedDay === 'all' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>All Days</button>
                     {festivalDays.map(day => (
                       <button key={day} onClick={() => setSelectedDay(day)} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${selectedDay === day ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>{format(new Date(day), 'EEE, MMM d')}</button>
                     ))}
                   </div>
                 </div>

                 <div className="max-w-7xl mx-auto px-4 py-8">
                   {filteredEvents.length === 0 ? (
                      <div className="py-20 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                        <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No sessions match</h3>
                        <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Check that your event dates match the selected filters.</p>
                      </div>
                   ) : (
                     <div className="space-y-12">
                        {Object.entries(eventsByDay).map(([dayLabel, dayEvents]) => (
                          <section key={dayLabel} className="space-y-6">
                            <h2 className="text-2xl font-display text-slate-900 border-l-4 border-orange-500 pl-4">{dayLabel}</h2>
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
                                      toggleFavoriteInDb(user.id, id, isFav, user.email);
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
      {showSettingsModal && user && <SettingsModal user={user} onClose={() => setShowSettingsModal(false)} onUpdate={setUser} />}
      {selectedEventId && <EventModal event={events.find(e => e.id === selectedEventId)!} category={getEventCategory(events.find(e => e.id === selectedEventId)!)} venue={getEventVenue(events.find(e => e.id === selectedEventId)!)} presenters={getEventPresenters(events.find(e => e.id === selectedEventId)!)} onClose={() => setSelectedEventId(null)} onPresenterClick={setSelectedPresenterId} />}
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
