import React from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
        <Users className="w-8 h-8 text-indigo-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-1.5">Start your family tree</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Add your first family member to begin. You can connect relatives and fine-tune relationships as your tree grows.
      </p>
      <Button onClick={onAdd} className="bg-indigo-500 hover:bg-indigo-600">
        <Plus className="w-4 h-4 mr-1.5" />Add First Member
      </Button>
    </div>
  );
}