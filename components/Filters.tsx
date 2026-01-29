
import React from 'react';
import { Search, Printer, Heart } from 'lucide-react';
import { Category, Venue, ViewMode } from '../types';

interface FiltersProps {
  search: string;
  setSearch: (s: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedVenue: string;
  setSelectedVenue: (v: string) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  onlyFavorites: boolean;
  setOnlyFavorites: (b: boolean) => void;
  categories: Category[];
  venues: Venue[];
  onPrint: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  search, setSearch,
  selectedCategory, setSelectedCategory,
  selectedVenue, setSelectedVenue,
  viewMode, setViewMode,
  onlyFavorites, setOnlyFavorites,
  categories, venues,
  onPrint
}) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-[64px] z-20 shadow-sm filters-container">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search sessions..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              {(['grid', 'list'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={onPrint}
              className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              title="Print Schedule"
            >
              <Printer size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>

          <select 
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="all">All Venues</option>
            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`text-sm px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
              onlyFavorites ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <Heart size={14} fill={onlyFavorites ? 'currentColor' : 'none'} />
            My Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
