import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { fmtCurrency, fmtNumber } from '@/lib/format';
import { fiscalTotals } from '@/lib/fiscal';
import { cn } from '@/lib/utils';

function Row({ label, qtd, valor }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-4 tabular-nums">
        <span className="text-muted-foreground">{fmtNumber(qtd)} un</span>
        <span className="font-medium w-28 text-right">{fmtCurrency(valor)}</span>
      </span>
    </div>
  );
}

function Group({ title, rows }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-heading font-semibold mb-2">{title}</h3>
      {rows.map((r) => <Row key={r.label} {...r} />)}
    </div>
  );
}

export default function FiscalPanel({ apuracao }) {
  const t = fiscalTotals(apuracao);
  const cards = [
    { label: 'Entradas', value: t.entradas, icon: TrendingUp, tone: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Saídas', value: t.saidas, icon: TrendingDown, tone: 'text-rose-600', bg: 'bg-rose-500/10' },
    { label: 'Saldo', value: t.saldo, icon: Wallet, tone: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', c.bg)}>
                  <Icon className={cn('w-4 h-4', c.tone)} />
                </div>
              </div>
              <div className="font-heading text-2xl font-semibold tracking-tight">{fmtCurrency(c.value)}</div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Group title="Entradas" rows={[{ label: 'NF-e autorizadas', qtd: apuracao.entrada_nfe_qtd, valor: apuracao.entrada_nfe_valor }]} />
        <Group title="CT-e" rows={[{ label: 'CT-e', qtd: apuracao.cte_qtd, valor: apuracao.cte_valor }]} />
        <Group title="Saídas — NF-e" rows={[
          { label: 'Autorizadas', qtd: apuracao.saida_nfe_qtd, valor: apuracao.saida_nfe_valor },
          { label: 'Canceladas', qtd: apuracao.saida_nfe_cancel_qtd, valor: apuracao.saida_nfe_cancel_valor },
        ]} />
        <Group title="Saídas — NFC-E" rows={[
          { label: 'Autorizadas', qtd: apuracao.nfce_qtd, valor: apuracao.nfce_valor },
          { label: 'Canceladas', qtd: apuracao.nfce_cancel_qtd, valor: apuracao.nfce_cancel_valor },
        ]} />
        <Group title="Saídas — CF-E" rows={[{ label: 'CF-E', qtd: apuracao.cfe_qtd, valor: apuracao.cfe_valor }]} />
        <Group title="Notas de serviço (ISS)" rows={[
          { label: 'Serviço prestado', qtd: apuracao.servico_prestado_qtd, valor: apuracao.servico_prestado_valor },
          { label: 'Serviço tomado', qtd: apuracao.servico_tomado_qtd, valor: apuracao.servico_tomado_valor },
        ]} />
      </div>
    </div>
  );
}