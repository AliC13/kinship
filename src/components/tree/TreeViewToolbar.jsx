import React from 'react';
import { Plus, Search, Network, GitBranch, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { initials } from '@/lib/treeUtils';

export default function TreeViewToolbar({ view, onViewChange, searchQuery, onSearchChange, onSearchSelect, onAddClick, onConnectClick, peopleCount, people }) {
  const results = searchQuery
    ? people.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-200 bg-white/80 backdrop-blur z-20 relative">
      <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
        <button
          onClick={() => onViewChange('canvas')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'canvas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Network className="w-3.5 h-3.5" />Canvas
        </button>
        <button
          onClick={() => onViewChange('hierarchy')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'hierarchy' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <GitBranch className="w-3.5 h-3.5" />Chart
        </button>
      </div>

      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search members..."
          className="pl-8 h-9 text-sm bg-slate-50 border-slate-200"
        />
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => { onSearchSelect(p.id); onSearchChange(''); }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 text-left"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500">
                  {initials(p.name)}
                </div>
                <span className="text-sm text-slate-700 truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto hidden sm:block text-xs text-slate-400">
        {peopleCount} {peopleCount === 1 ? 'member' : 'members'}
      </div>
      {peopleCount >= 2 && (
        <Button onClick={onConnectClick} variant="outline" className="h-9 shrink-0 border-slate-200 text-slate-600 hover:text-slate-800">
          <Link2 className="w-4 h-4 mr-1.5" />Connect
        </Button>
      )}
      <Button onClick={onAddClick} className="bg-indigo-500 hover:bg-indigo-600 h-9 shrink-0">
        <Plus className="w-4 h-4 mr-1.5" />Add Member
      </Button>
    </div>
  );
}