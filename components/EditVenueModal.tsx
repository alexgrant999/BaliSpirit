
import React, { useState } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';
import { Venue } from '../types';

interface EditVenueModalProps {
  venue: Venue | null; // null = create mode
  onSave: (venue: Partial<Venue>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const EditVenueModal: React.FC<EditVenueModalProps> = ({ venue, onSave, onDelete, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Venue>>({
    name: venue?.name || '',
    description: venue?.description || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({ ...formData, id: venue?.id || undefined });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!venue || !confirm(`Are you sure you want to remove ${venue.name}?`)) return;
    setIsSaving(true);
    try {
      await onDelete(venue.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSaving && onClose()}>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-display text-slate-900">{venue ? 'Edit Venue' : 'New Venue'}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Festival Map</p>
          </div>
          <button onClick={() => !isSaving && onClose()} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <form id="venue-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Venue Name</label>
              <input
                type="text"
                required
                disabled={isSaving}
                placeholder="e.g., Sacred Garden Stage"
                className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Description</label>
              <textarea
                rows={3}
                disabled={isSaving}
                placeholder="Describe the vibe of this space..."
                className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            {venue && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors disabled:opacity-30"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" disabled={isSaving} onClick={onClose} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800 transition-colors disabled:opacity-30">
              Cancel
            </button>
            <button
              form="venue-form"
              type="submit"
              disabled={isSaving || !formData.name}
              className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all disabled:bg-orange-400 flex items-center gap-2"
            >
              {isSaving && <Loader2 size={18} className="animate-spin" />}
              {venue ? 'Save Changes' : 'Create Venue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
