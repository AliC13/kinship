import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, Heart, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { initials } from '@/lib/treeUtils';

const REL_TYPES = [
  { value: 'parent', label: 'Parent → Child' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'partner', label: 'Partner' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'step_parent', label: 'Step-parent → Step-child' },
  { value: 'half_sibling', label: 'Half-sibling' },
  { value: 'adopted_parent', label: 'Adoptive parent → Adopted child' }
];

export default function RelationshipPanel({ relationship, people, onClose, onSave, onDelete, onAddChildOfCouple }) {
  const [form, setForm] = useState(relationship);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(relationship); }, [relationship]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const from = people.find(p => p.id === relationship.fromPersonId);
  const to = people.find(p => p.id === relationship.toPersonId);
  const isRomantic = ['spouse', 'partner'].includes(form.type);

  const save = async () => {
    setSaving(true);
    try { await onSave(relationship.id, form); } finally { setSaving(false); }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[360px] max-w-[90vw] bg-white border-l border-slate-200 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" />Connection</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex items-center justify-center gap-3 py-3 rounded-xl bg-slate-50">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-slate-200 mx-auto flex items-center justify-center text-sm font-semibold text-slate-600">{initials(from?.name)}</div>
            <div className="text-xs font-medium text-slate-700 mt-1 max-w-[100px] truncate">{from?.name}</div>
          </div>
          <div className="text-slate-300 text-lg">→</div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-slate-200 mx-auto flex items-center justify-center text-sm font-semibold text-slate-600">{initials(to?.name)}</div>
            <div className="text-xs font-medium text-slate-700 mt-1 max-w-[100px] truncate">{to?.name}</div>
          </div>
        </div>

        <div>
          <Label className="text-xs text-slate-500">Relationship Type</Label>
          <Select value={form.type} onValueChange={v => set('type', v)}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{REL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {isRomantic && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Marriage Date</Label>
                <Input type="date" value={form.marriageDate || ''} onChange={e => set('marriageDate', e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Separation Date</Label>
                <Input type="date" value={form.separationDate || ''} onChange={e => set('separationDate', e.target.value)} className="h-9 mt-1" />
              </div>
            </div>
            <Button onClick={() => { onClose(); onAddChildOfCouple(from, to); }} variant="outline" className="w-full justify-start text-slate-600">
              <Baby className="w-4 h-4 mr-2 text-indigo-500" />Add Child of Both
            </Button>
          </>
        )}

        <div>
          <Label className="text-xs text-slate-500">Notes</Label>
          <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="mt-1 min-h-[80px]" placeholder="Details about this relationship..." />
        </div>

        <button onClick={() => onDelete(relationship.id)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" />Remove this connection</button>
      </div>

      <div className="p-3 border-t border-slate-100 shrink-0">
        <Button onClick={save} disabled={saving} className="w-full bg-indigo-500 hover:bg-indigo-600">
          <Save className="w-4 h-4 mr-1.5" />{saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}