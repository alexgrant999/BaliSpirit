
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
import { PrintSchedule } from './components/PrintSchedule';
import { AuthModal } from './components/AuthModal';
import { InterestPicker } from './components/InterestPicker';
import { Loader2, Calendar, Database, ArrowLeft, Printer, Clock, Sparkles } from 'lucide-react';
import { useFestivalData } from './hooks/useFestivalData';
import { isSupabaseConfigured, supabase, signOut, fetchUserFavorites, toggleFavoriteInDb } from './services/supabase';
import { getSmartRecommendations } from './services/gemini';
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
  const [isPrintView, setIsPrintView] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | 'all'>('all');
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Auth Listener
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const favorites = await fetchUserFavorites(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, interests')
          .eq('id', session.user.id)
          .maybeSingle();

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: (profile?.role as 'admin' | 'user') || 'user',
          interests: profile?.interests || [],
          favorites
        });
      } else {
        setUser(null);
        setOnlyFavorites(false);
        setIsOrganizerAuthorized(false);
        setAiRecommendations([]);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch AI recommendations when user interests or events change
  useEffect(() => {
    const fetchAiPicks = async () => {
      if (!user || events.length === 0 || (!user.interests?.length && !user.favorites.length)) {
        setAiRecommendations([]);
        return;
      }

      setIsAiLoading(true);
      try {
        const context = [...(user.interests || []), ...user.favorites.map(fid => events.find(e => e.id === fid)?.title).filter(Boolean)];
        const picks = await getSmartRecommendations(context as string[], events);
        setAiRecommendations(picks);
      } catch (err) {
        console.error("AI Pick error:", err);
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchAiPicks();
  }, [user?.interests, user?.favorites.length, events]);

  const handleToggleFavorite = async (eventId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const isFavorite = user.favorites.includes(eventId);
    const newFavorites = isFavorite ? user.favorites.filter(id => id !== eventId) : [...user.favorites, eventId];
    setUser({ ...user, favorites: newFavorites });
    await toggleFavoriteInDb(user.id, eventId, isFavorite);
  };

  const handleToggleInterest = async (interest: string) => {
    if (!user || !supabase) return;
    const current = user.interests || [];
    const next = current.includes(interest) ? current.filter(i => i !== interest) : [...current, interest];
    setUser({ ...user, interests: next });
    await supabase.from('profiles').update({ interests: next }).eq('id', user.id);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setIsAdminMode(false);
    setIsOrganizerAuthorized(false);
    setOnlyFavorites(false);
  };

  const festivalDays = useMemo(() => {
    const days = new Set<string>();
    events.forEach(e => {
      days.add(format(new Date(e.startTime), 'yyyy-MM-dd'));
    });
    return Array.from(days).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = format(new Date(event.startTime), 'yyyy-MM-dd');
      const matchesDay = selectedDay === 'all' || eventDate === selectedDay;
      const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) || 
                          event.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
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

  const recommendedEvents = useMemo(() => {
    return events.filter(e => aiRecommendations.includes(e.id)).slice(0, 6);
  }, [events, aiRecommendations]);

  if (dataLoading || authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6 text-center">
        <LotusLogo className="h-40 w-40 mb-8 animate-pulse" />
        <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
        <h2 className="font-display text-2xl text-slate-900">Entering the Sacred Space...</h2>
      </div>
    );
  }

  if (isPrintView) {
    return (
      <div className="min-h-screen bg-white text-black p-4">
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center no-print">
          <button onClick={() => setIsPrintView(false)} className="flex items-center gap-2 text-slate-600 font-bold bg-slate-100 px-4 py-2 rounded-lg"><ArrowLeft size={18} /> Back</button>
          <button onClick={() => window.print()} className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"><Printer size={18} /> Print</button>
        </div>
        <PrintSchedule events={filteredEvents} categories={categories} venues={venues} presenters={presenters} isStandalone={true} />
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
        onAuthClick={() => setShowAuthModal(true)} onSignOut={handleSignOut}
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
                   categories={categories} venues={venues} onPrint={() => setIsPrintView(true)}
                 />

                 {/* Day Swapper & Magic Section */}
                 <div className="bg-white border-b border-slate-100 sticky top-[168px] md:top-[128px] z-10 no-print">
                   <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide flex items-center justify-between">
                     <div className="flex items-center gap-2 py-3">
                       <button onClick={() => setSelectedDay('all')} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${selectedDay === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-500'}`}>All Days</button>
                       {festivalDays.map(day => (
                         <button key={day} onClick={() => setSelectedDay(day)} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${selectedDay === day ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{format(new Date(day), 'EEE, MMM d')}</button>
                       ))}
                     </div>
                     {user && (
                       <button onClick={() => setShowInterestPicker(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-full transition-all">
                         <Sparkles size={14} /> My Vibe
                       </button>
                     )}
                   </div>
                 </div>

                 <div className="max-w-7xl mx-auto px-4 py-8">
                   {/* AI Recommendations Bar */}
                   {user && recommendedEvents.length > 0 && !onlyFavorites && selectedDay === 'all' && (
                     <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center gap-2 mb-6">
                           <div className="bg-orange-100 text-orange-600 p-2 rounded-xl"><Sparkles size={20} /></div>
                           <div>
                             <h2 className="text-2xl font-display text-slate-900 leading-tight">Magic Picks for You</h2>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Recommendations based on your vibe</p>
                           </div>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                           {recommendedEvents.map(event => (
                              <div key={event.id} className="w-[280px] shrink-0">
                                <EventCard 
                                  event={event}
                                  category={categories.find(c => c.id === event.categoryId)!}
                                  venue={venues.find(v => v.id === event.venueId)!}
                                  presenters={presenters.filter(p => event.presenterIds.includes(p.id))}
                                  isFavorite={user.favorites.includes(event.id)}
                                  onToggleFavorite={handleToggleFavorite}
                                  onClick={(e) => setSelectedEventId(e.id)}
                                />
                              </div>
                           ))}
                        </div>
                     </div>
                   )}

                   {filteredEvents.length === 0 ? (
                      <div className="py-20 text-center"><Calendar size={32} className="mx-auto text-slate-200 mb-4" /><h3 className="text-xl font-bold text-slate-900">No sessions match</h3></div>
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
                                  onToggleFavorite={handleToggleFavorite} onClick={(e) => setSelectedEventId(e.id)}
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

      {!isAdminMode && isDbMode && <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showInterestPicker && user && (
        <InterestPicker 
          selectedInterests={user.interests || []} 
          onToggle={handleToggleInterest} 
          onClose={() => setShowInterestPicker(false)} 
        />
      )}

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
