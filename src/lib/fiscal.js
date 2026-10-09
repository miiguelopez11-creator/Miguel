import { fmtCurrency } from '@/lib/format';

export const n = (v) => Number(v) || 0;

export const NUMERIC_FIELDS = [
  'entrada_nfe_qtd', 'entrada_nfe_valor',
  'saida_nfe_qtd', 'saida_nfe_valor',
  'saida_nfe_cancel_qtd', 'saida_nfe_cancel_valor',
  'nfce_qtd', 'nfce_valor',
  'nfce_cancel_qtd', 'nfce_cancel_valor',
  'cfe_qtd', 'cfe_valor',
  'servico_prestado_qtd', 'servico_prestado_valor',
  'servico_tomado_qtd', 'servico_tomado_valor',
  'cte_qtd', 'cte_valor',
  'vendas_notas_fiscais', 'vendas_cupons_fiscais', 'vendas_nfce', 'vendas_nfse',
  'compras_notas_fiscais',
  'dimp_debito', 'dimp_credito', 'dimp_pix',
];

export const emptyApuracao = () => NUMERIC_FIELDS.reduce((o, k) => ({ ...o, [k]: 0 }), {});

export const FISCAL_SECTIONS = [
  { title: 'Entradas', fields: [['entrada_nfe_qtd', 'NF-e autorizadas (qtd)'], ['entrada_nfe_valor', 'NF-e valor total']] },
  { title: 'Saídas · NF-e', fields: [['saida_nfe_qtd', 'Autorizadas (qtd)'], ['saida_nfe_valor', 'Autorizadas (valor)'], ['saida_nfe_cancel_qtd', 'Canceladas (qtd)'], ['saida_nfe_cancel_valor', 'Canceladas (valor)']] },
  { title: 'Saídas · NFC-E', fields: [['nfce_qtd', 'Autorizadas (qtd)'], ['nfce_valor', 'Autorizadas (valor)'], ['nfce_cancel_qtd', 'Canceladas (qtd)'], ['nfce_cancel_valor', 'Canceladas (valor)']] },
  { title: 'Saídas · CF-E', fields: [['cfe_qtd', 'Quantidade'], ['cfe_valor', 'Valor total']] },
  { title: 'Notas de serviço (ISS)', fields: [['servico_prestado_qtd', 'Serviço prestado (qtd)'], ['servico_prestado_valor', 'Serviço prestado (valor)'], ['servico_tomado_qtd', 'Serviço tomado (qtd)'], ['servico_tomado_valor', 'Serviço tomado (valor)']] },
  { title: 'CT-e', fields: [['cte_qtd', 'Quantidade'], ['cte_valor', 'Valor total']] },
];

export const ESTUDO_SECTIONS = [
  { title: 'Vendas', fields: [['vendas_notas_fiscais', 'Notas fiscais'], ['vendas_cupons_fiscais', 'Cupons fiscais'], ['vendas_nfce', 'NFC-e'], ['vendas_nfse', 'NFS-e (serviços)']] },
  { title: 'Compras', fields: [['compras_notas_fiscais', 'Notas fiscais']] },
  { title: 'Meios de pagamento (DIMP)', fields: [['dimp_debito', 'Débito'], ['dimp_credito', 'Crédito'], ['dimp_pix', 'PIX']] },
];

export const STATUS_FLOW = ['pendente', 'em_analise', 'aguardando_dimp', 'concluido'];
export const STATUS_LABELS = { pendente: 'Pendente', em_analise: 'Em Análise', aguardando_dimp: 'Aguardando DIMP', concluido: 'Concluído' };
export const STATUS_STYLES = {
  pendente: 'bg-muted text-muted-foreground',
  em_analise: 'bg-amber-500/15 text-amber-700',
  aguardando_dimp: 'bg-sky-500/15 text-sky-700',
  concluido: 'bg-emerald-500/15 text-emerald-700',
};

export const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'];
export const COMPRAS_IDEAL_PCT = 0.25;

export function regimeGroup(regime) {
  const r = (regime || '').toUpperCase();
  if (r.includes('SIMPLES')) return 'Simples Nacional';
  if (r.includes('PRESUM')) return 'Lucro Presumido';
  if (r.includes('REAL')) return 'Lucro Real';
  return 'Outro';
}

export function fiscalTotals(a) {
  if (!a) return { entradas: 0, saidas: 0, saldo: 0 };
  const entradas = n(a.entrada_nfe_valor) + n(a.servico_tomado_valor);
  const saidas = n(a.saida_nfe_valor) + n(a.nfce_valor) + n(a.cfe_valor) + n(a.servico_prestado_valor);
  return { entradas, saidas, saldo: entradas - saidas };
}

export function volumeNotas(a) {
  if (!a) return 0;
  return n(a.entrada_nfe_qtd) + n(a.saida_nfe_qtd) + n(a.nfce_qtd) + n(a.cfe_qtd) + n(a.cte_qtd) + n(a.servico_prestado_qtd) + n(a.servico_tomado_qtd);
}

export function estudoAnalise(a) {
  if (!a) return null;
  const totalVendas = n(a.vendas_notas_fiscais) + n(a.vendas_cupons_fiscais) + n(a.vendas_nfce) + n(a.vendas_nfse);
  const totalCompras = n(a.compras_notas_fiscais);
  const totalPagamentos = n(a.dimp_debito) + n(a.dimp_credito) + n(a.dimp_pix);
  return {
    totalVendas,
    totalCompras,
    totalPagamentos,
    diferencaVendasCompras: totalVendas - totalCompras,
    diferencaPagamentos: totalVendas - totalPagamentos,
    idealCompras: totalVendas * COMPRAS_IDEAL_PCT,
    percentualCompras: totalVendas ? totalCompras / totalVendas : 0,
  };
}

export function alertas(a) {
  const list = [];
  if (!a) return list;
  const e = estudoAnalise(a);
  if (e.totalPagamentos > 0 && e.totalPagamentos > e.totalVendas) {
    list.push({
      id: 'dimp_vendas',
      titulo: 'Divergência DIMP x Vendas',
      descricao: `As vendas informadas (${fmtCurrency(e.totalVendas)}) estão menores que o total dos meios de pagamento (${fmtCurrency(e.totalPagamentos)}).`,
      bloqueia: true,
    });
  }
  if (e.totalVendas > 0 && e.percentualCompras > COMPRAS_IDEAL_PCT) {
    list.push({
      id: 'compras_vendas',
      titulo: '% Compras / Vendas fora da margem ideal',
      descricao: `As compras representam ${(e.percentualCompras * 100).toFixed(1).replace('.', ',')}% das vendas (ideal até ${COMPRAS_IDEAL_PCT * 100}%).`,
      bloqueia: true,
    });
  }
  return list;
}