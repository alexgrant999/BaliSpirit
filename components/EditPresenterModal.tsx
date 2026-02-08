
import React, { useState, useRef } from 'react';
import { X, Loader2, Trash2, Instagram, Globe, Upload, Image as ImageIcon } from 'lucide-react';
import { Presenter } from '../types';
import { uploadPresenterImage } from '../services/supabase';

interface EditPresenterModalProps {
  presenter: Presenter | null; // null = create mode
  onSave: (presenter: Partial<Presenter>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const EditPresenterModal: React.FC<EditPresenterModalProps> = ({ presenter, onSave, onDelete, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Presenter>>({
    name: presenter?.name || '',
    bio: presenter?.bio || '',
    image: presenter?.image || '',
    website: presenter?.website || '',
    instagram: presenter?.instagram || '',
    facebook: presenter?.facebook || ''
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image exceeds 2MB limit.");
      return;
    }
    setIsUploading(true);
    try {
      const publicUrl = await uploadPresenterImage(file);
      setFormData(prev => ({ ...prev, image: publicUrl }));
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isUploading || !formData.name?.trim()) return;

    setIsSaving(true);
    try {
      await onSave({ ...formData, id: presenter?.id || undefined });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!presenter || !confirm(`Are you sure you want to remove ${presenter.name}?`)) return;
    setIsSaving(true);
    try {
      await onDelete(presenter.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isUploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !busy && onClose()}>
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-display text-slate-900">{presenter ? 'Edit Presenter' : 'New Presenter'}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Facilitator Roster</p>
          </div>
          <button onClick={() => !busy && onClose()} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <form id="presenter-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={busy}
                  placeholder="e.g., Ananda Das"
                  className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Short Bio</label>
                <textarea
                  required
                  rows={6}
                  disabled={busy}
                  placeholder="Describe the facilitator's background and unique style..."
                  className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50"
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Social Media</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Instagram Username"
                    disabled={busy}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm disabled:opacity-50"
                    value={formData.instagram}
                    onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Website URL"
                    disabled={busy}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm disabled:opacity-50"
                    value={formData.website}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest mb-4">Profile Image</label>
                <div className="flex flex-col gap-4">
                  {formData.image ? (
                    <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden group border-4 border-white shadow-xl bg-white">
                      <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="p-3 bg-white rounded-full text-red-600 hover:scale-110 transition-transform shadow-lg">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !busy && fileInputRef.current?.click()}
                      className={`w-full aspect-square max-w-[320px] mx-auto rounded-3xl border-4 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${busy ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-200 hover:border-orange-400 hover:bg-orange-50'}`}
                    >
                      {isUploading ? (
                        <Loader2 size={40} className="animate-spin text-orange-500" />
                      ) : (
                        <Upload size={40} className="text-slate-300" />
                      )}
                      <div className="text-center px-4">
                        <p className="text-sm font-bold text-slate-600">{isUploading ? 'Uploading...' : 'Upload Headshot'}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-1">
                    <ImageIcon size={12} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Or paste an image URL..."
                      disabled={busy}
                      className="flex-1 bg-transparent text-[10px] text-slate-500 outline-none border-b border-slate-200 py-1"
                      value={formData.image}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                    />
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            {presenter && (
              <button
                type="button"
                disabled={busy}
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors disabled:opacity-30"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => !busy && onClose()} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
              Cancel
            </button>
            <button
              form="presenter-form"
              type="submit"
              disabled={busy || !formData.name}
              className="bg-orange-600 text-white px-10 py-3 rounded-2xl font-bold shadow-xl shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all disabled:bg-orange-400 flex items-center gap-2"
            >
              {busy && <Loader2 size={18} className="animate-spin" />}
              {presenter ? 'Save Changes' : 'Add to Lineup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
