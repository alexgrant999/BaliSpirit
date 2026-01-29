
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Loader2, Compass } from 'lucide-react';
import { Venue } from '../types';

interface AdminVenueManagerProps {
  venues: Venue[];
  onSaveVenue: (venue: Partial<Venue>) => Promise<void>;
  onDeleteVenue: (id: string) => Promise<void>;
}

export const AdminVenueManager: React.FC<AdminVenueManagerProps> = ({
  venues, onSaveVenue, onDeleteVenue
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Venue>>({
    name: '', description: ''
  });

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  const handleOpenEdit = (v: Venue) => {
    setFormData({ ...v });
    setEditingId(v.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    setIsSaving(true);
    try {
      await onSaveVenue({ ...formData, id: editingId || undefined });
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-xl text-slate-900">Festival Map & Venues</h3>
        <button 
          onClick={handleOpenAdd} 
          disabled={isAdding}
          className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-orange-700 transition-all disabled:opacity-50"
        >
          <Plus size={20}/> New Venue
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 mb-8 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Venue Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Atmosphere / Description</label>
                <textarea 
                  required 
                  rows={3} 
                  className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Describe the vibe of this space..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving || !formData.name}
                className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-2"
              >
                {isSaving && <Loader2 size={18} className="animate-spin" />}
                {editingId ? 'Update Venue' : 'Register Venue'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {venues.map(v => (
          <div key={v.id} className="bg-white rounded-2xl p-6 border border-slate-200 flex items-start gap-4 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-orange-600">
              <MapPin size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 mb-1">{v.name}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{v.description || "No description provided."}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOpenEdit(v)} 
                  className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Edit2 size={12}/> Edit
                </button>
                <button 
                  onClick={() => confirm(`Are you sure you want to remove ${v.name}?`) && onDeleteVenue(v.id)} 
                  className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Trash2 size={12}/> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {venues.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">
            <Compass size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No festival venues mapped yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
