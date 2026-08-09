import React from 'react';
import { GENDER_BORDER, formatYears, initials } from '@/lib/treeUtils';

export default function PersonNode({ person, selected, dimmed }) {
  const borderColor = GENDER_BORDER[person.gender] || GENDER_BORDER.unknown;
  return (
    <div
      className={`relative bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-150 h-[88px] ${selected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:shadow-md hover:border-slate-300'} ${dimmed ? 'opacity-25' : 'opacity-100'}`}
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-center gap-2.5 p-2.5 h-full">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
          {person.photoUrl
            ? <img src={person.photoUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-xs font-semibold text-slate-400">{initials(person.name)}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{person.name}</div>
          <div className="text-[10px] text-slate-400 truncate">{formatYears(person) || '—'}</div>
        </div>
      </div>
    </div>
  );
}