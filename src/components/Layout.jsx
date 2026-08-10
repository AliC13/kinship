import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Trees, LogOut, Share2, ChevronDown, ChevronRight, Eye, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Shares } from '@/api/shares';
import ShareModal from '@/components/tree/ShareModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Trees other people have shared with me.
  const [sharedWithMeOpen, setSharedWithMeOpen] = useState(true);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loadingSharedWithMe, setLoadingSharedWithMe] = useState(true);
  const [pendingRemove, setPendingRemove] = useState(null); // share row awaiting removal confirmation
  const [removing, setRemoving] = useState(false);

  const loadSharedWithMe = useCallback(async () => {
    setLoadingSharedWithMe(true);
    try {
      setSharedWithMe(await Shares.listSharedWithMe());
    } catch (err) {
      console.error('Failed to load shares', err);
    } finally {
      setLoadingSharedWithMe(false);
    }
  }, []);

  useEffect(() => {
    loadSharedWithMe();
  }, [loadSharedWithMe]);

  const confirmRemoveShared = async () => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await Shares.remove(pendingRemove.id);
      setSharedWithMe((prev) => prev.filter((s) => s.id !== pendingRemove.id));
    } catch (err) {
      console.error('Failed to remove share', err);
    } finally {
      setRemoving(false);
      setPendingRemove(null);
    }
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
                setShareModalOpen(true);
              }}
              title="Share"
              className="shrink-0 p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Share2 size={14} />
            </button>
          </div>

          <button
            onClick={() => setSharedWithMeOpen((v) => !v)}
            className="w-full flex items-center justify-between px-2 py-1.5 mt-4 text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span>Shared with me</span>
            {sharedWithMeOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {sharedWithMeOpen && (
            <div className="space-y-0.5">
              {loadingSharedWithMe && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500">
                  <Loader2 size={12} className="animate-spin" /> Loading...
                </div>
              )}

              {!loadingSharedWithMe && sharedWithMe.length === 0 && (
                <div className="px-2.5 py-1.5 text-xs text-slate-600">
                  No one has shared a tree with you yet.
                </div>
              )}

              {!loadingSharedWithMe && sharedWithMe.map((s) => (
                <div
                  key={s.id}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs"
                >
                  <span className="truncate text-slate-400" title={s.owner_email}>
                    {s.owner_email || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <span
                      title={s.permission === 'view' ? 'View access' : 'Edit access'}
                      className="p-1 text-slate-500"
                    >
                      {s.permission === 'view' ? <Eye size={13} /> : <Pencil size={13} />}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingRemove(s);
                      }}
                      title="Remove"
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                </div>
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

      <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} />

      <AlertDialog open={!!pendingRemove} onOpenChange={(v) => !v && !removing && setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove yourself from this board?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll lose access to <span className="font-medium text-foreground">{pendingRemove?.owner_email}</span>'s family tree. You can only get it back if they share it with you again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRemove(null)} disabled={removing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveShared}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {removing ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}