import React from 'react';
import { Check } from 'lucide-react';
import { STATUS_FLOW, STATUS_LABELS } from '@/lib/fiscal';
import { cn } from '@/lib/utils';

export default function StatusControl({ status, onChange }) {
  const current = status || 'pendente';
  const currentIndex = STATUS_FLOW.indexOf(current);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_FLOW.map((s, i) => {
        const active = s === current;
        const done = i < currentIndex;
        return null;















      })}
    </div>);

}