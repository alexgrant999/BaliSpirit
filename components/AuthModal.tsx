
import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, Sparkles, AlertCircle, Settings, HelpCircle, ChevronDown, ChevronUp, ExternalLink, Globe, Copy, Check } from 'lucide-react';
import { supabase, signInWithGoogle } from '../services/supabase';
import { LotusLogo } from './LotusLogo';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentOrigin = window.location.origin.replace(/\/$/, '');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setIsConfigError(false);

    // Defensive trimming to prevent "invalid email" errors from accidental spaces
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email: cleanEmail, password: cleanPassword })
        : await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
      
      if (error) throw error;
      onClose();
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsConfigError(false);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Auth error:", err);
      
      if (err.message?.includes("missing OAuth secret") || err.msg?.includes("missing OAuth secret")) {
        setError("Supabase Configuration Error: You haven't entered the 'Client Secret' in your Supabase Dashboard under Auth > Providers > Google.");
        setIsConfigError(true);
      } else if (err.message?.includes("Unsupported provider") || err.code === "validation_failed") {
        setError("Google authentication is currently being configured. Please use Email/Password for now.");
      } else {
        setError(err.message || "Failed to initiate Google login.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose} 
          disabled={loading}
          className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors disabled:opacity-50 z-20"
        >
          <X size={20} />
        </button>

        <div className="p-8 pt-12 text-center overflow-y-auto">
          <LotusLogo className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-3xl font-display text-slate-900 mb-2">
            {isSignUp ? 'Join the Tribe' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {isSignUp ? 'Create an account to save your festival journey.' : 'Log in to access your personal schedule.'}
          </p>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm mb-4 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>

          <button 
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="flex items-center justify-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-colors mb-6"
          >
            <HelpCircle size={12} />
            Setup Guide / Troubleshooting
            {showTroubleshooting ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showTroubleshooting && (
            <div className="mb-8 p-5 bg-orange-50 rounded-2xl border border-orange-100 text-left animate-in slide-in-from-top-2 duration-300 space-y-6">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-orange-700 mb-2 flex items-center gap-2">
                  <Globe size={14} /> Fixing Localhost Redirects
                </h4>
                <p className="text-[11px] text-orange-900 leading-relaxed mb-3">
                  If you are redirected to <strong>localhost:3000</strong> instead of this site, copy the URL below and update your <strong>Supabase Dashboard</strong>:
                </p>
                
                <div className="flex items-center gap-2 bg-white/50 border border-orange-200 p-2 rounded-xl mb-3">
                  <code className="flex-1 text-[10px] font-mono truncate text-orange-800">{currentOrigin}</code>
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-orange-100 rounded-md text-orange-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <ol className="text-[11px] text-orange-800 space-y-1.5 list-decimal ml-4">
                  <li>Open <strong>Supabase Dashboard</strong>.</li>
                  <li>Go to <strong>Authentication > URL Configuration</strong>.</li>
                  <li>Update <strong>Site URL</strong> to the URL above.</li>
                  <li>Add the URL above to <strong>Redirect URLs</strong>.</li>
                </ol>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-orange-700 mb-2 flex items-center gap-2">
                  <Settings size={14} /> Fixing the 403 / 400 Error
                </h4>
                <p className="text-[11px] text-orange-900 leading-relaxed mb-3">
                  If you see "403 Forbidden," you must authorize your email in Google Cloud:
                </p>
                <ol className="text-[11px] text-orange-800 space-y-1.5 list-decimal ml-4">
                  <li>Go to <strong>Google Cloud Console</strong>.</li>
                  <li>Navigate to <strong>OAuth consent screen</strong>.</li>
                  <li>Scroll to <strong>Test users</strong> and click <strong>+ ADD USERS</strong>.</li>
                  <li>Enter your email address and click <strong>Save</strong>.</li>
                </ol>
              </div>

              <a 
                href="https://app.supabase.com/" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-orange-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-orange-600 hover:bg-orange-100 transition-colors"
              >
                Open Supabase Dashboard <ExternalLink size={10} />
              </a>
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest bg-white px-4 text-slate-400">Or email</div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                required 
                placeholder="Email Address" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-slate-200 border rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" 
                required 
                placeholder="Password" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-slate-200 border rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className={`p-4 rounded-xl flex items-start gap-3 border animate-in fade-in slide-in-from-top-2 ${isConfigError ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-100'}`}>
                {isConfigError ? <Settings className="text-amber-500 shrink-0 mt-0.5" size={18} /> : <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />}
                <div className="flex-1 text-left">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isConfigError ? 'text-amber-700' : 'text-red-700'}`}>
                    {isConfigError ? 'Config Needed' : 'Error'}
                  </p>
                  <p className={`text-xs font-medium leading-relaxed ${isConfigError ? 'text-amber-600' : 'text-red-600'}`}>{error}</p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              disabled={loading}
              className="text-orange-600 font-bold hover:underline disabled:opacity-50"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
