
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, ViewMode, FestivalEvent } from './types';
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
import { InterestPicker } from './components/InterestPicker';
import { Loader2, Calendar, Database, Clock, Sparkles, AlertTriangle, ChevronRight, RefreshCcw, Activity } from 'lucide-react';
import { useFestivalData } from './hooks/useFestivalData';
import { isSupabaseConfigured, supabase, signOut, fetchUserFavorites, toggleFavoriteInDb, getSupabaseStatus } from './services/supabase';
import { format } from 'date-fns';

type Tab = 'schedule' | 'presenters' | 'venues';

const App: React.FC = () => {
  const {
    loading: dataLoading, events, categories, venues, presenters, isDbMode,
    refreshData, onAddEvent, onUpdateEvent, onDeleteEvent, 
    onSavePresenter, onDeletePresenter, onSaveVenue, onDeleteVenue
  } = useFestivalData();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bypassLoading, setBypassLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isOrganizerAuthorized, setIsOrganizerAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedPresenterId, setSelectedPresenterId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | 'all'>('all');
  
  // Real-time diagnostics
  const [logs, setLogs] = useState<string[]>(['Application Bootstrap...']);
  const [diagResult, setDiagResult] = useState<string | null>(null);
  const [isWakingDb, setIsWakingDb] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), msg]);

  // Sync user from session
  const syncUserFromSession = useCallback(async (session: any) => {
    try {
      if (session?.user) {
        addLog("Retrieving user profile...");
        const favorites = await fetchUserFavorites(session.user.id);
        const { data: profile } = await supabase.from('profiles').select('role, interests').eq('id', session.user.id).maybeSingle();
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: (profile?.role as 'admin' | 'user') || 'user',
          interests: profile?.interests || [],
          favorites
        });
        addLog("Authentication session secured.");
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth sync error:", err);
    }
  }, []);

  // Initialization lifecycle
  useEffect(() => {
    addLog("Searching for Bali Spirit DB...");
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUserFromSession(session).finally(() => {
        setAuthLoading(false);
        addLog("Ready to connect.");
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      await syncUserFromSession(session);
    });

    return () => subscription.unsubscribe();
  }, [syncUserFromSession]);

  const handleForceWake = async () => {
    if (isWakingDb) return;
    setIsWakingDb(true);
    setDiagResult("Sending wake-up signal (HTTP PROBE)...");
    const status = await getSupabaseStatus(25000);
    setDiagResult(`${status.ok ? '✅' : '❌'} ${status.message}`);
    setIsWakingDb(false);
    if (status.ok) refreshData();
  };

  const festivalDays = useMemo(() => {
    const days = new Set<string>();
    events.forEach(e => days.add(format(new Date(e.startTime), 'yyyy-MM-dd')));
    return Array.from(days).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = format(new Date(event.startTime), 'yyyy-MM-dd');
      const matchesDay = selectedDay === 'all' || eventDate === selectedDay;
      const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || event.categoryId === selectedCategory;
      const matchesVenue = selectedVenue === 'all' || event.venueId === selectedVenue;
      const matchesFavorite = !onlyFavorites || (user?.favorites?.includes(event.id));
      return matchesDay && matchesSearch && matchesCategory && matchesVenue && matchesFavorite;
    }).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, search, selectedCategory, selectedVenue, onlyFavorites, user, selectedDay]);

  const eventsByDay = useMemo(() => {
    const groups: Record<string, FestivalEvent[]> = {};
    filteredEvents.forEach(event => {
      const dayLabel = format(new Date(event.startTime), 'EEEE, MMMM d');
      if (!groups[dayLabel]) groups[dayLabel] = [];
      groups[dayLabel].push(event);
    });
    return groups;
  }, [filteredEvents]);

  if ((dataLoading || authLoading) && !bypassLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6 text-center animate-in fade-in duration-700">
        <LotusLogo className="h-20 w-20 mb-10 animate-bounce" />
        <Loader2 className="animate-spin text-orange-500 mb-8" size={32} />
        
        <div className="space-y-4 mb-16 max-w-sm w-full">
          <h2 className="font-display text-3xl text-slate-900 tracking-tight">Syncing with Bali...</h2>
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl text-[10px] font-mono text-slate-400 uppercase tracking-widest text-left space-y-2 shadow-inner">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <Activity size={10} className="mt-0.5 text-orange-400" /> {log}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-xs w-full space-y-4">
          {diagResult && (
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-[10px] font-bold text-orange-700 uppercase text-left leading-relaxed animate-in slide-in-from-top-2">
              <AlertTriangle size={14} className="inline mr-2 mb-1" />
              {diagResult}
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleForceWake}
              disabled={isWakingDb}
              className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-orange-200 hover:text-orange-600 transition-all disabled:opacity-50"
            >
              {isWakingDb ? <RefreshCcw size={14} className="animate-spin" /> : <Database size={14} />}
              {isWakingDb ? 'Pinging Cloud...' : 'Wake Up Database'}
            </button>
            <button 
              onClick={() => setBypassLoading(true)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-100 hover:bg-black active:scale-95 transition-all"
            >
              Enter Local Mode <ChevronRight size={14} className="inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showAdminPanel = isAdminMode && (user?.role === 'admin' || isOrganizerAuthorized);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        activeTab={activeTab} isAdminMode={isAdminMode} user={user}
        onTabChange={setActiveTab} onAdminToggle={() => setIsAdminMode(!isAdminMode)}
        onHomeClick={() => {setActiveTab('schedule'); setIsAdminMode(false);}}
        onAuthClick={() => setShowAuthModal(true)} onSignOut={() => signOut().then(() => setUser(null))}
      />

      <main className="flex-1 bg-slate-50 pb-20 md:pb-8">
        {isAdminMode ? (
          showAdminPanel ? (
            <AdminPanel 
              events={events} categories={categories} venues={venues} presenters={presenters}
              onAddEvent={onAddEvent} onUpdateEvent={onUpdateEvent} onDeleteEvent={onDeleteEvent}
              onSavePresenter={onSavePresenter} onDeletePresenter={onDeletePresenter}
              onSaveVenue={onSaveVenue} onDeleteVenue={onDeleteVenue}
              isLive={isSupabaseConfigured} isDbMode={isDbMode} onRefresh={refreshData}
            />
          ) : <AdminAuth onAuthorized={() => setIsOrganizerAuthorized(true)} />
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
                                  key={event.id} event={event} category={categories.find(c => c.id === event.categoryId)!}
                                  venue={venues.find(v => v.id === event.venueId)!}
                                  presenters={presenters.filter(p => event.presenterIds.includes(p.id))}
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
      
      {selectedEventId && (
        <EventModal 
          event={events.find(e => e.id === selectedEventId)!}
          category={categories.find(c => c.id === events.find(e => e.id === selectedEventId)!.categoryId)!}
          venue={venues.find(v => v.id === events.find(e => e.id === selectedEventId)!.venueId)!}
          presenters={presenters.filter(p => events.find(e => e.id === selectedEventId)!.presenterIds.includes(p.id))}
          onClose={() => setSelectedEventId(null)} onPresenterClick={setSelectedPresenterId}
        />
      )}
      {selectedPresenterId && <PresenterModal presenter={presenters.find(p => p.id === selectedPresenterId)!} onClose={() => setSelectedPresenterId(null)} />}
    </div>
  );
};

export default App;
