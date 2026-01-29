
import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Instagram, Globe, Facebook, Loader2, Users, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Presenter } from '../types';
import { uploadPresenterImage } from '../services/supabase';

interface AdminPresenterManagerProps {
  presenters: Presenter[];
  onSavePresenter: (presenter: Partial<Presenter>) => Promise<void>;
  onDeletePresenter: (id: string) => Promise<void>;
}

export const AdminPresenterManager: React.FC<AdminPresenterManagerProps> = ({
  presenters, onSavePresenter, onDeletePresenter
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Presenter>>({
    name: '', bio: '', image: '', website: '', instagram: '', facebook: ''
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', bio: '', image: '', website: '', instagram: '', facebook: '' });
    setIsAdding(true);
  };

  const handleOpenEdit = (p: Presenter) => {
    setFormData({ ...p });
    setEditingId(p.id);
    setIsAdding(true);
  };

  const handleClose = () => {
    if (isSaving || isUploading) return;
    setIsAdding(false);
    setEditingId(null);
  };

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
      await onSavePresenter({ ...formData, id: editingId || undefined });
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-xl text-slate-900">Presenter Roster</h3>
        <button 
          onClick={handleOpenAdd} 
          className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-orange-700 transition-all"
        >
          <Plus size={20}/> New Presenter
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-display text-slate-900">{editingId ? 'Edit Presenter' : 'Add New Presenter'}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Facilitator Roster</p>
              </div>
              <button onClick={handleClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
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
                      disabled={isSaving}
                      placeholder="e.g., Ananda Das"
                      className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Short Bio</label>
                    <textarea 
                      required 
                      rows={6} 
                      disabled={isSaving}
                      placeholder="Describe the facilitator's background and unique style..."
                      className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50" 
                      value={formData.bio} 
                      onChange={e => setFormData({...formData, bio: e.target.value})} 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Social Media Presence</label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input 
                        type="text" 
                        placeholder="Instagram Username" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" 
                        value={formData.instagram} 
                        onChange={e => setFormData({...formData, instagram: e.target.value})} 
                      />
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input 
                        type="text" 
                        placeholder="Website URL" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" 
                        value={formData.website} 
                        onChange={e => setFormData({...formData, website: e.target.value})} 
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
                          onClick={() => !isSaving && !isUploading && fileInputRef.current?.click()}
                          className={`w-full aspect-square max-w-[320px] mx-auto rounded-3xl border-4 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isUploading || isSaving ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-200 hover:border-orange-400 hover:bg-orange-50'}`}
                        >
                          {isUploading ? (
                            <Loader2 size={40} className="animate-spin text-orange-500" />
                          ) : (
                            <Upload size={40} className="text-slate-300" />
                          )}
                          <div className="text-center px-4">
                            <p className="text-sm font-bold text-slate-600">
                                {isUploading ? 'Uploading...' : 'Upload Headshot'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">JPG, PNG up to 2MB</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 px-1">
                         <ImageIcon size={12} className="text-slate-400" />
                         <input 
                            type="text" 
                            placeholder="Or paste an image URL..." 
                            disabled={isSaving || isUploading}
                            className="flex-1 bg-transparent text-[10px] text-slate-500 outline-none border-b border-slate-200 py-1"
                            value={formData.image} 
                            onChange={e => setFormData({...formData, image: e.target.value})} 
                          />
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
              <button type="button" onClick={handleClose} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors">
                Discard
              </button>
              <button 
                form="presenter-form"
                type="submit" 
                disabled={isSaving || isUploading || !formData.name}
                className="bg-orange-600 text-white px-12 py-3 rounded-2xl font-bold shadow-xl shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-2"
              >
                {(isSaving || isUploading) && <Loader2 size={18} className="animate-spin" />}
                {isSaving ? 'Saving...' : editingId ? 'Update Presenter' : 'Add to Lineup'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {presenters.map(p => (
          <div key={p.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group relative overflow-hidden">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-orange-600/10 rounded-full scale-110 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img src={p.image || 'https://picsum.photos/seed/bali/200/200'} className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg transition-transform group-hover:scale-105" alt={p.name} />
            </div>
            <h4 className="font-display text-xl text-slate-900 mb-1">{p.name}</h4>
            <div className="flex gap-2 mb-4">
              {p.instagram && <Instagram size={14} className="text-slate-400"/>}
              {p.website && <Globe size={14} className="text-slate-400"/>}
              {p.facebook && <Facebook size={14} className="text-slate-400"/>}
            </div>
            <p className="text-xs text-slate-500 mb-6 line-clamp-2 px-4 h-8 leading-relaxed italic">"{p.bio}"</p>
            
            <div className="flex gap-2 w-full pt-6 border-t border-slate-50">
              <button onClick={() => handleOpenEdit(p)} className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <Edit2 size={14}/> Edit
              </button>
              <button onClick={() => confirm("Are you sure?") && onDeletePresenter(p.id)} className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <Trash2 size={14}/> Del
              </button>
            </div>
          </div>
        ))}
        {presenters.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">
            <Users size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Lineup is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
};
