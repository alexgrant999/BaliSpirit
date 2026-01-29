
import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';

const INTEREST_OPTIONS = [
  'Yoga Flow', 'Meditation', 'Ecstatic Dance', 'Healing Music', 
  'Breathwork', 'Philosophy', 'Sustainability', 'Active Workshops',
  'Sound Healing', 'Kirtan', 'Deep Restorative', 'Advanced Practice'
];

interface InterestPickerProps {
  selectedInterests: string[];
  onToggle: (interest: string) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export const InterestPicker: React.FC<InterestPickerProps> = ({ 
  selectedInterests, onToggle, onClose, isSaving 
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400">
          <X size={20} />
        </button>

        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles size={32} />
          </div>
          <h2 className="text-3xl font-display text-slate-900 mb-2">Personalize Your Spirit</h2>
          <p className="text-slate-500 text-sm mb-8">Select what resonates with you. Gemini will suggest sessions that match your vibe.</p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {INTEREST_OPTIONS.map(interest => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => onToggle(interest)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${
                    isSelected 
                      ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100 scale-105' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  {isSelected && <Check size={12} />}
                  {interest}
                </button>
              );
            })}
          </div>

          <button 
            onClick={onClose}
            disabled={isSaving}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? 'Updating Soul Settings...' : 'Continue to Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};
