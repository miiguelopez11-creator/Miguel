import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { fmtCurrency, fmtNumber, monthLabel } from '@/lib/format';
import { fiscalTotals, volumeNotas } from '@/lib/fiscal';
import { cn } from '@/lib/utils';

function shiftMonth(period, delta) {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function Delta({ label, pct }) {
  const has = pct != null && isFinite(pct);
  const up = has && pct >= 0;
  const Icon = !has ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5 mt-2">
        <Icon className={cn('w-5 h-5', !has ? 'text-muted-foreground' : up ? 'text-emerald-600' : 'text-rose-600')} />
        <span className={cn('font-heading text-2xl font-semibold tracking-tight', !has ? 'text-muted-foreground' : up ? 'text-emerald-600' : 'text-rose-600')}>
          {has ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1).replace('.', ',')}%` : '—'}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">volume de notas</p>
    </div>
  );
}

export default function ComparativoPanel({ apuracoes, month }) {
  const [modo, setModo] = useState('volume');

  const byPeriod = useMemo(() => {
    const m = {};
    apuracoes.forEach((a) => { m[a.period] = a; });
    return m;
  }, [apuracoes]);

  const series = useMemo(() => {
    if (!month) return [];
    return Array.from({ length: 12 }, (_, i) => shiftMonth(month, -(11 - i))).map((p) => {
      const a = byPeriod[p];
      const t = fiscalTotals(a);
      return { period: p, label: monthLabel(p), volume: volumeNotas(a), entradas: t.entradas, saidas: t.saidas };
    });
  }, [month, byPeriod]);

  if (!month) return null;

  const current = series[series.length - 1] || {};
  const prev = series[series.length - 2] || {};
  const yoyNota = byPeriod[shiftMonth(month, -12)];

  const mom = prev.volume ? ((current.volume - prev.volume) / prev.volume) * 100 : null;
  const yoy = yoyNota ? (() => { const v = volumeNotas(yoyNota); return v ? ((current.volume - v) / v) * 100 : null; })() : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-heading font-semibold">Comparativo MoM / YoY</h2>
        <div className="flex gap-1 rounded-xl border border-border p-1 w-fit">
          {[['volume', 'Volume de notas'], ['valores', 'Valores']].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setModo(k)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', modo === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Delta label="Mês a mês (vs mês anterior)" pct={mom} />
        <Delta label="Ano a ano (vs mesmo mês do ano anterior)" pct={yoy} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading font-semibold mb-4">Últimos 12 meses</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={series} margin={{ left: 8, right: 16 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
            <YAxis tickFormatter={(v) => (modo === 'volume' ? fmtNumber(v) : fmtCurrency(v).replace('R$', '').trim())} fontSize={12} stroke="hsl(var(--muted-foreground))" />
            <Tooltip formatter={(v, name) => (modo === 'volume' ? [fmtNumber(v), name] : [fmtCurrency(v), name])} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))' }} />
            <Legend />
            {modo === 'volume' ? (
              <Bar dataKey="volume" name="Notas emitidas" fill="hsl(199 70% 45%)" radius={[6, 6, 0, 0]} />
            ) : (
              <>
                <Bar dataKey="entradas" name="Entradas" fill="hsl(152 60% 45%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(350 70% 60%)" radius={[6, 6, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}