import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Save, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { UploadFile } from '@/api/storage';
import { formatYears, getParents, getChildren, getSpouses, getSiblings, initials } from '@/lib/treeUtils';

const RELATIVE_TYPES = [
  { key: 'parent', label: 'Parent' },
  { key: 'child', label: 'Child' },
  { key: 'spouse', label: 'Spouse' },
  { key: 'sibling', label: 'Sibling' }
];

export default function PersonPanel({ person, people, relationships, onClose, onSave, onDelete, onAddRelative, onSelectPerson }) {
  const [form, setForm] = useState(person);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setForm(person); }, [person]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      set('photoUrl', file_url);
    } finally {
      setUploading(false);
    }
  };

  const addMilestone = () => set('milestones', [...(form.milestones || []), { label: '', date: '', description: '' }]);
  const updateMilestone = (i, k, v) => set('milestones', (form.milestones || []).map((m, idx) => idx === i ? { ...m, [k]: v } : m));
  const removeMilestone = (i) => set('milestones', (form.milestones || []).filter((_, idx) => idx !== i));

  const parents = getParents(person.id, relationships).map(id => people.find(p => p.id === id)).filter(Boolean);
  const children = getChildren(person.id, relationships).map(id => people.find(p => p.id === id)).filter(Boolean);
  const spouses = getSpouses(person.id, relationships).map(id => people.find(p => p.id === id)).filter(Boolean);
  const siblings = getSiblings(person.id, relationships).map(id => people.find(p => p.id === id)).filter(Boolean);

  const save = async () => {
    setSaving(true);
    try { await onSave(person.id, form); } finally { setSaving(false); }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[380px] max-w-[90vw] bg-white border-l border-slate-200 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Profile</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
              {form.photoUrl
                ? <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-lg font-semibold text-slate-300">{initials(form.name)}</span>}
            </div>
            <label className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center cursor-pointer shadow-md">
              <ImagePlus className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <Input value={form.name || ''} onChange={e => set('name', e.target.value)} className="h-9 font-semibold" placeholder="Full name" />
            <div className="text-xs text-slate-400 mt-1">{formatYears(person)}</div>
          </div>
        </div>

        <div>
          <Label className="text-xs text-slate-500">Gender</Label>
          <Select value={form.gender || 'unknown'} onValueChange={v => set('gender', v)}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500">Birth Date</Label>
            <Input type="date" value={form.birthDate || ''} onChange={e => set('birthDate', e.target.value)} className="h-9 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Death Date</Label>
            <Input type="date" value={form.deathDate || ''} onChange={e => set('deathDate', e.target.value)} className="h-9 mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500">Birth Place</Label>
            <Input value={form.birthPlace || ''} onChange={e => set('birthPlace', e.target.value)} className="h-9 mt-1" placeholder="City, Country" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Death Place</Label>
            <Input value={form.deathPlace || ''} onChange={e => set('deathPlace', e.target.value)} className="h-9 mt-1" placeholder="City, Country" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-slate-500">Biography</Label>
          <Textarea value={form.biography || ''} onChange={e => set('biography', e.target.value)} className="mt-1 min-h-[80px]" placeholder="Notes about this person's life..." />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-500">Milestones</Label>
            <button onClick={addMilestone} className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
          </div>
          <div className="space-y-2 mt-2">
            {(form.milestones || []).map((m, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-2.5 space-y-2">
                <div className="flex gap-2">
                  <Input value={m.label} onChange={e => updateMilestone(i, 'label', e.target.value)} className="h-8 text-sm" placeholder="Label (e.g. Graduation)" />
                  <Input type="date" value={m.date || ''} onChange={e => updateMilestone(i, 'date', e.target.value)} className="h-8 text-sm w-36" />
                  <button onClick={() => removeMilestone(i)} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <Input value={m.description} onChange={e => updateMilestone(i, 'description', e.target.value)} className="h-8 text-sm" placeholder="Description" />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs text-slate-500 mb-2 block">Family Connections</Label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {RELATIVE_TYPES.map(t => (
              <button key={t.key} onClick={() => onAddRelative(person, t.key)} className="flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-500 transition">
                <Plus className="w-3 h-3" />{t.label}
              </button>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <RelativesList label="Parents" items={parents} onSelect={onSelectPerson} />
            <RelativesList label="Children" items={children} onSelect={onSelectPerson} />
            <RelativesList label="Spouses" items={spouses} onSelect={onSelectPerson} />
            <RelativesList label="Siblings" items={siblings} onSelect={onSelectPerson} />
          </div>
        </div>

        <Separator />

        <button onClick={() => onDelete(person.id)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" />Delete this person</button>
      </div>

      <div className="p-3 border-t border-slate-100 shrink-0">
        <Button onClick={save} disabled={saving} className="w-full bg-indigo-500 hover:bg-indigo-600">
          <Save className="w-4 h-4 mr-1.5" />{saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function RelativesList({ label, items, onSelect }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.map(p => (
          <button key={p.id} onClick={() => onSelect(p)} className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs text-slate-700 transition">{p.name}</button>
        ))}
      </div>
    </div>
  );
}