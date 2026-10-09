import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fmtCurrency, monthLabel } from '@/lib/format';
import { fiscalTotals } from '@/lib/fiscal';
import { cn } from '@/lib/utils';

function Empty() {
  return <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma apuração registrada.</div>;
}

export default function ApuracaoHistorico({ apuracoes, companyName }) {
  const rows = [...apuracoes]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((a) => ({ period: a.period, label: monthLabel(a.period), ...fiscalTotals(a) }));

  const exportCsv = () => {
    const num = (v) => (Number(v) || 0).toFixed(2).replace('.', ',');
    const lines = [
      [`Apuração mensal - ${companyName || ''}`],
      [],
      ['Período', 'Entradas', 'Saídas', 'Saldo'],
      ...rows.map((r) => [r.label, num(r.entradas), num(r.saidas), num(r.saldo)]),
    ];
    const csv = lines.map((l) => l.map((f) => `"${String(f ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apuracao-${(companyName || 'empresa').replace(/\s+/g, '-').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading font-semibold mb-4">Entradas e saídas por mês</h2>
        {rows.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rows} margin={{ left: 8, right: 16 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => fmtCurrency(v).replace('R$', '').trim()} fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v) => fmtCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Bar dataKey="entradas" name="Entradas" fill="hsl(152 60% 45%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="hsl(350 70% 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold">Histórico mensal</h2>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-2" />Exportar
          </Button>
        </div>
        {rows.length === 0 ? <Empty /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2.5 pr-4 font-medium">Mês</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Entradas</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Saídas</th>
                  <th className="py-2.5 font-medium text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.period} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-medium">{monthLabel(r.period)}</td>
                    <td className="py-3 pr-4 text-right text-emerald-600">{fmtCurrency(r.entradas)}</td>
                    <td className="py-3 pr-4 text-right text-rose-600">{fmtCurrency(r.saidas)}</td>
                    <td className={cn('py-3 text-right font-medium', r.saldo < 0 && 'text-rose-600')}>{fmtCurrency(r.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}