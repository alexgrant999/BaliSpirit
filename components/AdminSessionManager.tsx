
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, MapPin, Calendar, Clock, Timer, Users, Search, Check, Loader2, X } from 'lucide-react';
// Fixed: Removed startOfMinute which was causing a module error in some environments
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import { FestivalEvent, Category, Venue, Presenter } from '../types';

interface AdminSessionManagerProps {
  events: FestivalEvent[];
  categories: Category[];
  venues: Venue[];
  presenters: Presenter[];
  onAddEvent: (event: Partial<FestivalEvent>) => Promise<void>;
  onUpdateEvent: (event: FestivalEvent) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export const AdminSessionManager: React.FC<AdminSessionManagerProps> = ({
  events, categories, venues, presenters, onAddEvent, onUpdateEvent, onDeleteEvent
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [presenterSearch, setPresenterSearch] = useState('');
  
  const [formData, setFormData] = useState<Partial<FestivalEvent>>({
    title: '', 
    description: '',
    startTime: '',
    venueId: '', 
    categoryId: '',
    tags: [], 
    presenterIds: []
  });

  // Filtered presenters for the picker
  const filteredPresenters = useMemo(() => {
    return presenters.filter(p => 
      p.name.toLowerCase().includes(presenterSearch.toLowerCase())
    );
  }, [presenters, presenterSearch]);

  const togglePresenter = (id: string) => {
    setFormData(prev => {
      const current = prev.presenterIds || [];
      const next = current.includes(id) 
        ? current.filter(pid => pid !== id) 
        : [...current, id];
      return { ...prev, presenterIds: next };
    });
  };

  useEffect(() => {
    if (!formData.venueId && venues.length > 0) setFormData(prev => ({ ...prev, venueId: venues[0].id }));
    if (!formData.categoryId && categories.length > 0) setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
  }, [venues, categories, isAdding]);

  const handleOpenAdd = () => {
    // Fixed: Replaced startOfMinute with manual Date manipulation to ensure compatibility
    const now = new Date();
    now.setSeconds(0, 0);
    const ms = 1000 * 60 * 30; // 30 minutes
    const rounded = new Date(Math.ceil(now.getTime() / ms) * ms);
    
    setEditingId(null);
    setSessionDuration(60);
    setPresenterSearch('');
    setFormData({
      title: '', 
      description: '',
      startTime: format(rounded, "yyyy-MM-dd'T'HH:mm"),
      venueId: venues[0]?.id || '', 
      categoryId: categories[0]?.id || '',
      tags: [], 
      presenterIds: []
    });
    setIsAdding(true);
  };

  const handleOpenEdit = (event: FestivalEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const duration = Math.min(180, Math.max(5, differenceInMinutes(end, start)));
    
    setSessionDuration(duration);
    setFormData({
      ...event,
      startTime: format(start, "yyyy-MM-dd'T'HH:mm")
    });
    setEditingId(event.id);
    setPresenterSearch('');
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startTime || isSaving) return;

    setIsSaving(true);
    try {
      const start = new Date(formData.startTime);
      const startTimeIso = format(start, "yyyy-MM-dd'T'HH:mm:ssXXX");
      const endTimeIso = format(addMinutes(start, sessionDuration), "yyyy-MM-dd'T'HH:mm:ssXXX");
      
      const finalEvent = {
        ...formData,
        startTime: startTimeIso,
        endTime: endTimeIso
      };

      if (editingId) {
        await onUpdateEvent({ ...finalEvent, id: editingId } as FestivalEvent);
      } else {
        await onAddEvent(finalEvent);
      }
      
      setIsAdding(false);
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save session:", error);
      alert("Something went wrong while saving. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-xl text-slate-900">Manage Schedule</h3>
        <button onClick={handleOpenAdd} className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-orange-700 transition-all">
          <Plus size={20}/> New Session
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-display text-slate-900">{editingId ? 'Edit Session' : 'Create New Session'}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Festival Scheduling</p>
              </div>
              <button 
                onClick={() => !isSaving && setIsAdding(false)} 
                className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              <form id="session-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Session Title</label>
                    <input 
                      type="text" 
                      required 
                      disabled={isSaving}
                      placeholder="e.g., Sunrise Vinyasa Flow"
                      className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Description</label>
                    <textarea 
                      required 
                      rows={4} 
                      disabled={isSaving}
                      placeholder="Share what attendees can expect from this session..."
                      className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Link Facilitators</label>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        {formData.presenterIds?.length || 0} Selected
                      </span>
                    </div>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                      <div className="p-2 border-b border-slate-200 bg-white">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Filter presenters..."
                            disabled={isSaving}
                            className="w-full pl-9 pr-4 py-2 text-sm outline-none bg-slate-50 rounded-lg focus:bg-white transition-colors disabled:opacity-50"
                            value={presenterSearch}
                            onChange={e => setPresenterSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 grid grid-cols-1 gap-1">
                        {filteredPresenters.length > 0 ? (
                          filteredPresenters.map(p => {
                            const isSelected = formData.presenterIds?.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={isSaving}
                                onClick={() => togglePresenter(p.id)}
                                className={`flex items-center gap-3 p-2 rounded-xl transition-all text-left disabled:opacity-50 ${isSelected ? 'bg-orange-600 text-white shadow-md shadow-orange-100' : 'hover:bg-white text-slate-700'}`}
                              >
                                <img src={p.image || 'https://picsum.photos/seed/bali/40/40'} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" />
                                <span className="flex-1 text-sm font-bold">{p.name}</span>
                                {isSelected && <Check size={16} />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="py-8 text-center text-slate-400 text-xs italic">
                            No presenters found matching your search.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1">
                        <Clock size={10} /> Start Time
                      </label>
                      <input 
                        type="datetime-local" 
                        step="300" 
                        required
                        disabled={isSaving}
                        className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50" 
                        value={formData.startTime} 
                        onChange={e => setFormData({...formData, startTime: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1">
                        <Timer size={10} /> Duration
                      </label>
                      <div className="relative">
                        <select 
                          disabled={isSaving}
                          className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none appearance-none transition-all disabled:opacity-50"
                          value={sessionDuration}
                          onChange={e => setSessionDuration(Number(e.target.value))}
                        >
                          {Array.from({ length: 36 }, (_, i) => (i + 1) * 5).map(mins => (
                            <option key={mins} value={mins}>
                              {mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? (mins % 60) + 'm' : ''}` : `${mins} Minutes`}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs font-bold">
                          MINS
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Venue</label>
                      <select 
                        disabled={isSaving}
                        className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50" 
                        value={formData.venueId} 
                        onChange={e => setFormData({...formData, venueId: e.target.value})}
                      >
                        {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Category</label>
                      <select 
                        disabled={isSaving}
                        className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50" 
                        value={formData.categoryId} 
                        onChange={e => setFormData({...formData, categoryId: e.target.value})}
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                type="button" 
                disabled={isSaving}
                onClick={() => setIsAdding(false)} 
                className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800 transition-colors disabled:opacity-30"
              >
                Cancel
              </button>
              <button 
                form="session-form"
                type="submit" 
                disabled={isSaving || !formData.startTime}
                className="bg-orange-600 text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all disabled:bg-orange-400 flex items-center gap-2"
              >
                {isSaving && <Loader2 size={18} className="animate-spin" />}
                {isSaving ? 'Updating Schedule...' : editingId ? 'Save Changes' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {events.map(event => {
          const startTime = new Date(event.startTime);
          const endTime = new Date(event.endTime);
          return (
            <div key={event.id} className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm group hover:shadow-md transition-all gap-4">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center bg-orange-50 text-orange-600 font-black text-xs shadow-sm ring-1 ring-orange-100">
                  {format(startTime, 'dd')}
                  <span className="opacity-50 text-[9px] uppercase tracking-tighter">{format(startTime, 'MMM')}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 leading-tight mb-1 text-lg">{event.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-[11px] font-bold text-orange-600 flex items-center gap-1.5 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md">
                      <Clock size={12} /> {format(startTime, 'h:mm a')} – {format(endTime, 'h:mm a')}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <MapPin size={12} className="text-slate-400" /> {venues.find(v => v.id === event.venueId)?.name || 'Unknown Venue'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Users size={12} className="text-slate-400" /> {presenters.filter(p => event.presenterIds.includes(p.id)).length} Presenters
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Timer size={12} /> {differenceInMinutes(endTime, startTime)} MINS
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                <button 
                  onClick={() => handleOpenEdit(event)} 
                  disabled={isSaving}
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm disabled:opacity-50"
                >
                  <Edit2 size={16}/>
                </button>
                <button 
                  onClick={() => confirm(`Are you sure you want to delete "${event.title}"?`) && onDeleteEvent(event.id)} 
                  disabled={isSaving}
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm disabled:opacity-50"
                >
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">
            <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No sessions scheduled yet.</p>
            <p className="text-slate-300 text-xs mt-1">Click "New Session" to build your festival program.</p>
          </div>
        )}
      </div>
    </div>
  );
};
