
import React, { useState, useEffect } from 'react';
import { Users, Shield, ShieldAlert, Loader2, Search, Mail, Phone, Calendar } from 'lucide-react';
import { fetchAllProfiles, updateUserRole } from '../services/supabase';
import { format } from 'date-fns';

export const AdminUserManager: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await fetchAllProfiles();
      setProfiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleRoleToggle = async (profile: any) => {
    const newRole = profile.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change ${profile.email}'s role to ${newRole}?`)) return;

    setUpdatingId(profile.id);
    try {
      await updateUserRole(profile.id, newRole);
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
    } catch (err) {
      alert("Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = profiles.filter(p => 
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-display text-xl text-slate-900">User Management</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            {profiles.length} Registered Spirits
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4" />
          <p className="text-xs font-black uppercase tracking-widest">Fetching profiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(profile => (
            <div key={profile.id} className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border-2 border-slate-50 shadow-sm">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Users size={20} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 truncate max-w-[200px]">{profile.email}</h4>
                    {profile.role === 'admin' && (
                      <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Admin</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-tighter">
                      <Calendar size={10} /> Joined {format(new Date(profile.created_at), 'MMM d, yyyy')}
                    </p>
                    {profile.phone && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-tighter">
                        <Phone size={10} /> {profile.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button 
                  onClick={() => handleRoleToggle(profile)}
                  disabled={updatingId === profile.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                    profile.role === 'admin' 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' 
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100'
                  } disabled:opacity-50`}
                >
                  {updatingId === profile.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : profile.role === 'admin' ? (
                    <ShieldAlert size={12} />
                  ) : (
                    <Shield size={12} />
                  )}
                  {profile.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">
              <Users size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No spirits found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
