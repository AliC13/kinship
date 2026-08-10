import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Shares } from '@/api/shares';

export default function ChangePermissionModal({ share, onClose, onChanged }) {
  const [permission, setPermission] = useState('view');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (share) {
      setPermission(share.permission);
      setError('');
    }
  }, [share]);

  const handleConfirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      await Shares.updatePermission(share.id, permission);
      onChanged?.(share.id, permission);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update permission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!share} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Change permission</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="text-sm text-muted-foreground truncate" title={share?.shared_with_email}>
            {share?.shared_with_email}
          </div>
          <div className="space-y-2">
            <Label htmlFor="change-permission">Permission</Label>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger id="change-permission">
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={submitting || permission === share?.permission}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}