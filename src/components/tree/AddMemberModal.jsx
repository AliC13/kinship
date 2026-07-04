import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus } from 'lucide-react';
import { UploadFile } from '@/api/storage';
import { initials } from '@/lib/treeUtils';

const ROLES = [
  { value: 'parent', label: 'Parent of' },
  { value: 'child', label: 'Child of' },
  { value: 'spouse', label: 'Spouse of' },
  { value: 'sibling', label: 'Sibling of' }
];

export default function AddMemberModal({ open, onClose, onAdd, people, contextPerson, contextRole, secondParent }) {
  const [form, setForm] = useState({ name: '', gender: 'unknown', birthDate: '', birthPlace: '', deathDate: '', deathPlace: '', biography: '' });
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [connectToId, setConnectToId] = useState('');
  const [role, setRole] = useState('child');

  useEffect(() => {
    if (open) {
      setForm({ name: '', gender: 'unknown', birthDate: '', birthPlace: '', deathDate: '', deathPlace: '', biography: '' });
      setPhotoUrl('');
      if (contextPerson) {
        setConnectToId(contextPerson.id);
        setRole(contextRole || 'child');
      } else {
        setConnectToId(people[0]?.id || '');
        setRole('child');
      }
    }
  }, [open, contextPerson, contextRole, people]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setPhotoUrl(file_url);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await onAdd({ ...form, photoUrl }, { contextPersonId: connectToId, role, secondParentId: secondParent?.id });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = ROLES.find(r => r.value === role)?.label.replace(' of', '') || '';

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{secondParent ? 'Add Child' : contextPerson ? 'Add Relative' : 'Add Family Member'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                {photoUrl
                  ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="text-slate-300 text-lg font-semibold">{initials(form.name)}</span>}
              </div>
              <label className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center cursor-pointer shadow-md">
                <ImagePlus className="w-2.5 h-2.5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
              </label>
            </div>
            <div className="flex-1">
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" className="font-medium" autoFocus />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Gender</Label>
              <Select value={form.gender} onValueChange={v => set('gender', v)}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Birth Date</Label>
              <Input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className="h-9 mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Birth Place</Label>
              <Input value={form.birthPlace} onChange={e => set('birthPlace', e.target.value)} className="h-9 mt-1" placeholder="City, Country" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Death Date</Label>
              <Input type="date" value={form.deathDate} onChange={e => set('deathDate', e.target.value)} className="h-9 mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Biography</Label>
            <Textarea value={form.biography} onChange={e => set('biography', e.target.value)} className="mt-1 min-h-[60px]" placeholder="Optional notes about this person..." />
          </div>

          {people.length > 0 && (
            <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/50">
              <Label className="text-xs text-slate-500">Connection</Label>
              {contextPerson ? (
                <div className="text-sm text-slate-600">
                  New member will be the{' '}
                  <span className="font-medium text-indigo-600">{roleLabel}</span>{' '}
                  of{' '}
                  {secondParent ? (
                    <>
                      <span className="font-medium text-slate-800">{contextPerson.name}</span> and{' '}
                      <span className="font-medium text-slate-800">{secondParent.name}</span>
                    </>
                  ) : (
                    <span className="font-medium text-slate-800">{contextPerson.name}</span>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={connectToId} onValueChange={setConnectToId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>{people.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name.trim() || submitting} className="bg-indigo-500 hover:bg-indigo-600">
            {submitting ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}