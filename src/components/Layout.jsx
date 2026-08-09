import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Trees, LogOut, ChevronDown, ChevronRight, Eye, Pencil, Share2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Placeholder data until real sharing is wired up to the backend.
const PLACEHOLDER_SHARED = [
  { email: 'jane.doe@example.com', permission: 'view' },
  { email: 'sam.smith@example.com', permission: 'edit' },
  { email: 'alex.chen@example.com', permission: 'view' },
  { email: 'ali.han@example.com', permission: 'view' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sharedOpen, setSharedOpen] = useState(true);
  const [sharedWith] = useState(PLACEHOLDER_SHARED);

  const handleOpenShared = (email) => {
    // TODO: wire up to real "view shared tree" flow once sharing is implemented
    console.log('Open shared tree for', email);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[#0F172A] text-slate-300">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <Trees className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm tracking-tight">KINSHIP</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Heritage Builder</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-500">Navigate</div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/')}
            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-sm bg-white/5 text-white cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Trees size={16} className="shrink-0" /> <span className="truncate">My Kinship</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: wire up to real share flow once sharing is implemented
              }}
              title="Share"
              className="shrink-0 p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Share2 size={14} />
            </button>
          </div>

          <button
            onClick={() => setSharedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-2 py-1.5 mt-4 text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span>Shared</span>
            {sharedOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {sharedOpen && (
            <div className="space-y-0.5">
              {sharedWith.map((s) => (
                <button
                  key={s.email}
                  onClick={() => handleOpenShared(s.email)}
                  title={`Open ${s.email}'s tree`}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left hover:bg-white/5 transition-colors"
                >
                  <span className="truncate text-slate-400">{s.email}</span>
                  <span
                    title={s.permission === 'view' ? 'View access' : 'Edit access'}
                    className="shrink-0 p-1 text-slate-500"
                  >
                    {s.permission === 'view' ? <Eye size={13} /> : <Pencil size={13} />}
                  </span>
                </button>
              ))}
            </div>
          )}
        </nav>
        <div className="px-5 py-4 border-t border-white/5 space-y-3">
          <div className="text-[11px] leading-relaxed text-slate-500">
            Your tree auto-saves as you build. Come back any time to continue.
          </div>
          {user && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 truncate" title={user.email}>{user.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <LogOut size={12} /> Log out
              </button>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
}