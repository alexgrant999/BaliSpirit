
import React, { useState, useRef } from 'react';
import { X, User as UserIcon, Mail, Phone, Camera, Loader2, Save, CheckCircle2, UploadCloud } from 'lucide-react';
import { User } from '../types';
import { updateProfile, uploadAvatar } from '../services/supabase';

interface SettingsModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onUpdate }) => {
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;
    
    // Simple validation
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (JPG, PNG, etc).");
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(user.id, {
        email: email !== user.email ? email : undefined,
        phone,
        avatar_url: avatarUrl
      });
      
      onUpdate({
        ...user,
        email,
        phone,
        avatarUrl
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400">
          <X size={20} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-display text-slate-900 mb-8 text-center">Profile Settings</h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col items-center mb-8">
              <div 
                className={`relative group cursor-pointer transition-all duration-300 ${isDragging ? 'scale-105' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <div className={`w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 shadow-xl relative transition-all duration-300 ${isDragging ? 'border-orange-500 ring-4 ring-orange-100' : 'border-white'}`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className={`w-full h-full object-cover transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                      <UserIcon size={48} />
                    </div>
                  )}
                  
                  {isDragging && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-orange-50/90 text-orange-600 animate-in fade-in duration-200">
                      <UploadCloud size={32} className="mb-1 animate-bounce" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Drop Image</span>
                    </div>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 z-30 bg-white/80 flex items-center justify-center">
                      <Loader2 className="animate-spin text-orange-600" />
                    </div>
                  )}

                  {!isDragging && !isUploading && (
                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                       <Camera size={24} className="text-white drop-shadow-md" />
                     </div>
                  )}
                </div>
                
                {!isDragging && (
                  <div className="absolute bottom-1 right-1 p-2 bg-orange-600 text-white rounded-full shadow-lg border-2 border-white z-10 transition-transform group-hover:scale-110">
                    <Camera size={16} />
                  </div>
                )}
                
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4 flex items-center gap-2">
                {isDragging ? <span className="text-orange-600">Release to Upload</span> : "Drag image here or click to upload"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="tel" 
                    placeholder="+62 ..."
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {success && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700 animate-in slide-in-from-top-2">
                <CheckCircle2 size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Profile updated successfully</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSaving || isUploading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSaving ? 'Updating Soul...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
