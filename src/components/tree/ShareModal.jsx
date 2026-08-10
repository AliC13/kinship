import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Loader2, Eye, Pencil, Trash2 } from 'lucide-react';
import { Shares } from '@/api/shares';
import ChangePermissionModal from '@/components/tree/ChangePermissionModal';
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

export default function ShareModal({ open, onClose }) {
  // Invite form
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Trees I've shared out
  const [sharedWith, setSharedWith] = useState([]);
  const [loadingShared, setLoadingShared] = useState(true);

  const [editingPermission, setEditingPermission] = useState(null); // share row awaiting permission change
  const [pendingRemove, setPendingRemove] = useState(null); // share row awaiting delete confirmation
  const [removing, setRemoving] = useState(false);

  const loadShared = useCallback(async () => {
    setLoadingShared(true);
    try {
      setSharedWith(await Shares.listSharedByMe());
    } catch (err) {
      console.error('Failed to load shares', err);
    } finally {
      setLoadingShared(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setEmail('');
      setPermission('view');
      setError('');
      loadShared();
    }
  }, [open, loadShared]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await Shares.create({ email, permission });
      setEmail('');
      setPermission('view');
      await loadShared();
    } catch (err) {
      setError(err.message?.includes('duplicate') || err.code === '23505'
        ? 'You\'ve already shared your tree with this email.'
        : err.message || 'Failed to share');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemoveShared = async () => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await Shares.remove(pendingRemove.id);
      setSharedWith((prev) => prev.filter((s) => s.id !== pendingRemove.id));
    } catch (err) {
      console.error('Failed to remove share', err);
    } finally {
      setRemoving(false);
      setPendingRemove(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share your family tree</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="share-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="share-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-permission">Permission</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger id="share-permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Can view</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sharing...
                </>
              ) : (
                'Share'
              )}
            </Button>
          </form>

          {/* Trees I've shared out */}
          <div className="pt-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Shared with</div>
            <div className="space-y-0.5">
              {loadingShared && (
                <div className="flex items-center gap-2 px-1 py-1.5 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" /> Loading...
                </div>
              )}
              {!loadingShared && sharedWith.length === 0 && (
                <div className="px-1 py-1.5 text-xs text-muted-foreground">
                  You haven't shared your tree with anyone yet.
                </div>
              )}
              {!loadingShared && sharedWith.map((s) => (
                <div key={s.id} className="w-full flex items-center justify-between gap-2 px-1 py-1.5 rounded-md text-xs">
                  <span className="truncate" title={s.shared_with_email}>{s.shared_with_email}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingPermission(s)}
                      title={s.permission === 'view' ? 'View access — click to change' : 'Edit access — click to change'}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
                    >
                      {s.permission === 'view' ? <Eye size={13} /> : <Pencil size={13} />}
                    </button>
                    <button
                      onClick={() => setPendingRemove(s)}
                      title="Remove"
                      className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-slate-100 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ChangePermissionModal
        share={editingPermission}
        onClose={() => setEditingPermission(null)}
        onChanged={(id, newPermission) => {
          setSharedWith((prev) => prev.map((s) => (s.id === id ? { ...s, permission: newPermission } : s)));
        }}
      />

      <AlertDialog open={!!pendingRemove} onOpenChange={(v) => !v && !removing && setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this shared board?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{pendingRemove?.shared_with_email}</span> will lose access to your family tree. You can share it with them again later if you change your mind.
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
    </>
  );
}