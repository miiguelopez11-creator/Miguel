import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { alertas } from '@/lib/fiscal';

export default function AlertasPanel({ apuracao }) {
  const list = alertas(apuracao);

  if (list.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-500/5 p-4">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-700">Nenhuma inconsistência contábil detectada para este mês.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((al) => (
        <div key={al.id} className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-500/5 p-4">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700">{al.titulo}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{al.descricao}</p>
          </div>
        </div>
      ))}
    </div>
  );
}