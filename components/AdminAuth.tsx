
import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminAuthProps {
  onAuthorized: () => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthorized }) => {
  const [accessCode, setAccessCode] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === 'bali2025') onAuthorized();
    else alert("Invalid Access Code. Hint: bali2025");
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock size={40} />
      </div>
      <h2 className="text-2xl font-display text-slate-900 mb-2">Organizer Access</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input 
          type="password" 
          placeholder="Access Code (Hint: bali2025)" 
          required 
          className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 transition-all text-center font-bold tracking-widest"
          value={accessCode} 
          onChange={e => setAccessCode(e.target.value)}
        />
        <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all">
          Unlock Dashboard
        </button>
      </form>
    </div>
  );
};
