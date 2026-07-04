import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
import { initials } from '@/lib/treeUtils';

const REL_TYPES = [
  { value: 'spouse', label: 'Spouse', romantic: true },
  { value: 'partner', label: 'Partner', romantic: true },
  { value: 'parent', label: 'Parent → Child', romantic: false },
  { value: 'sibling', label: 'Sibling', romantic: false },
  { value: 'step_parent', label: 'Step-parent → Step-child', romantic: false },
  { value: 'half_sibling', label: 'Half-sibling', romantic: false },
  { value: 'adopted_parent', label: 'Adoptive parent → Adopted child', romantic: false }
];

export default function ConnectMembersModal({ open, onClose, onConnect, people }) {
  const [personAId, setPersonAId] = useState('');
  const [personBId, setPersonBId] = useState('');
  const [relType, setRelType] = useState('spouse');
  const [marriageDate, setMarriageDate] = useState('');
  const [separationDate, setSeparationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPersonAId(people[0]?.id || '');
      setPersonBId(people[1]?.id || '');
      setRelType('spouse');
      setMarriageDate('');
      setSeparationDate('');
      setNotes('');
    }
  }, [open, people]);

  const a = people.find(p => p.id === personAId);
  const b = people.find(p => p.id === personBId);
  const isRomantic = REL_TYPES.find(t => t.value === relType)?.romantic;
  const canSubmit = personAId && personBId && personAId !== personBId;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConnect({ personAId, personBId, relType, marriageDate, separationDate, notes });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Connect Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <Label className="text-xs text-slate-500">Person</Label>
              <Select value={personAId} onValueChange={setPersonAId}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {people.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {a && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500 overflow-hidden">
                    {a.photoUrl ? <img src={a.photoUrl} alt="" className="w-full h-full object-cover" /> : initials(a.name)}
                  </div>
                  <span className="text-xs text-slate-600 truncate">{a.name}</span>
                </div>
              )}
            </div>
            <div className="mt-5 text-slate-300"><ArrowRight className="w-4 h-4" /></div>
            <div>
              <Label className="text-xs text-slate-500">Person</Label>
              <Select value={personBId} onValueChange={setPersonBId}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {people.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {b && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500 overflow-hidden">
                    {b.photoUrl ? <img src={b.photoUrl} alt="" className="w-full h-full object-cover" /> : initials(b.name)}
                  </div>
                  <span className="text-xs text-slate-600 truncate">{b.name}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Relationship</Label>
            <Select value={relType} onValueChange={setRelType}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isRomantic && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Marriage Date</Label>
                <Input type="date" value={marriageDate} onChange={e => setMarriageDate(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Separation Date</Label>
                <Input type="date" value={separationDate} onChange={e => setSeparationDate(e.target.value)} className="h-9 mt-1" />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-slate-500">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 min-h-[60px]" placeholder="Optional details..." />
          </div>

          {personAId && personBId && personAId === personBId && (
            <p className="text-xs text-red-500">Please pick two different members.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit || submitting} className="bg-indigo-500 hover:bg-indigo-600">
            {submitting ? 'Connecting...' : 'Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}