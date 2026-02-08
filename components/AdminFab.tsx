
import React from 'react';
import { Plus } from 'lucide-react';

interface AdminFabProps {
  onClick: () => void;
}

export const AdminFab: React.FC<AdminFabProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 md:bottom-8 right-6 z-40 w-14 h-14 bg-orange-600 text-white rounded-full shadow-2xl shadow-orange-200 hover:bg-orange-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
      aria-label="Create new"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
};
