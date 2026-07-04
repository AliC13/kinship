import React from 'react';
import { Outlet } from 'react-router-dom';
import { Trees, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[#0F172A] text-slate-300">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <Trees className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm tracking-tight">FamilyRoots</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Heritage Builder</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-500">Navigate</div>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm bg-white/5 text-white">
            <Trees size={16} /> Family Tree
          </div>
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