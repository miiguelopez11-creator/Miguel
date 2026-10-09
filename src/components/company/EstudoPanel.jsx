import React from 'react';
import { fmtCurrency } from '@/lib/format';
import { estudoAnalise } from '@/lib/fiscal';
import { cn } from '@/lib/utils';

function Line({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium tabular-nums', tone)}>{value}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-heading font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function EstudoPanel({ apuracao }) {
  const a = estudoAnalise(apuracao);
  const money = (v) => fmtCurrency(v);
  const pct = `${(a.percentualCompras * 100).toFixed(1).replace('.', ',')}%`;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Vendas">
        <Line label="Notas fiscais" value={money(apuracao.vendas_notas_fiscais)} />
        <Line label="Cupons fiscais" value={money(apuracao.vendas_cupons_fiscais)} />
        <Line label="NFC-e" value={money(apuracao.vendas_nfce)} />
        <Line label="NFS-e — serviços" value={money(apuracao.vendas_nfse)} />
        <div className="border-t border-border mt-2 pt-2">
          <Line label="Total de vendas" value={money(a.totalVendas)} />
        </div>
      </Card>

      <Card title="Compras">
        <Line label="Notas fiscais" value={money(apuracao.compras_notas_fiscais)} />
        <div className="border-t border-border mt-2 pt-2">
          <Line label="Total de compras" value={money(a.totalCompras)} />
        </div>
      </Card>

      <Card title="Meios de pagamento (DIMP)">
        <Line label="Débito" value={money(apuracao.dimp_debito)} />
        <Line label="Crédito" value={money(apuracao.dimp_credito)} />
        <Line label="PIX" value={money(apuracao.dimp_pix)} />
        <div className="border-t border-border mt-2 pt-2">
          <Line label="Total" value={money(a.totalPagamentos)} />
        </div>
      </Card>

      <Card title="Análises">
        <Line label="Diferença vendas − compras" value={money(a.diferencaVendasCompras)} tone={a.diferencaVendasCompras < 0 ? 'text-rose-600' : 'text-emerald-600'} />
        <Line label="Diferença vendas − pagamentos" value={money(a.diferencaPagamentos)} tone={a.diferencaPagamentos < 0 ? 'text-rose-600' : 'text-emerald-600'} />
        <Line label="Compras ideais (25% das vendas)" value={money(a.idealCompras)} />
        <Line label="Compras reais" value={money(a.totalCompras)} />
        <Line label="% compras sobre vendas" value={pct} />
      </Card>
    </div>
  );
}