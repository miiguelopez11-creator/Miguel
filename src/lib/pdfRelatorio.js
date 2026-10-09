import { jsPDF } from 'jspdf';
import { fiscalTotals, estudoAnalise, STATUS_LABELS, alertas } from '@/lib/fiscal';
import { fmtCurrency, fmtNumber, monthLabel, fmtDate } from '@/lib/format';

const TEAL = [13, 110, 100];
const SLATE = [30, 41, 59];
const GRAY = [100, 116, 139];
const LINE = [226, 232, 240];
const M = 14;
const W = 210;
const RIGHT = W - M;

export function gerarRelatorioPdf({ company, apuracao }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  const ensure = (need = 12) => {
    if (y + need > 280) { doc.addPage(); y = 18; }
  };

  const sectionTitle = (t) => {
    ensure(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...SLATE);
    doc.text(t, M, y);
    doc.setDrawColor(...LINE);
    doc.line(M, y + 1.8, RIGHT, y + 1.8);
    y += 7;
  };

  const kv = (label, value) => {
    ensure(7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label, M, y);
    doc.setTextColor(...SLATE);
    doc.text(String(value || '—'), M + 42, y);
    y += 5.4;
  };

  const group = (title) => {
    ensure(9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEAL);
    doc.text(title, M, y);
    y += 5.4;
  };

  const row = (label, qtd, valor) => {
    ensure(7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label, M + 2, y);
    doc.text(`${fmtNumber(qtd)} un`, RIGHT - 34, y, { align: 'right' });
    doc.setTextColor(...SLATE);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtCurrency(valor), RIGHT, y, { align: 'right' });
    y += 5.6;
  };

  const line = (label, value, bold) => {
    ensure(7);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...(bold ? SLATE : GRAY));
    doc.text(label, M + 2, y);
    doc.setTextColor(...SLATE);
    doc.text(fmtCurrency(value), RIGHT, y, { align: 'right' });
    y += 5.6;
  };

  const lineText = (label, value, bold) => {
    ensure(7);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...(bold ? SLATE : GRAY));
    doc.text(label, M + 2, y);
    doc.setTextColor(...SLATE);
    doc.text(String(value), RIGHT, y, { align: 'right' });
    y += 5.6;
  };

  // Brand band
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 30, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 8, 14, 14, 3, 3, 'F');
  doc.setTextColor(...TEAL);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('P', M + 7, 17.6, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('PROJETUS CONTABILIDADE', M + 18, 13.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Relatório de Apuração Mensal', M + 18, 20);
  doc.setFontSize(9);
  doc.text(monthLabel(apuracao.period), RIGHT, 13.5, { align: 'right' });
  doc.text(`Emitido em ${fmtDate(new Date())}`, RIGHT, 20, { align: 'right' });

  y = 42;

  sectionTitle('Identificação da empresa');
  kv('Empresa', company.name);
  kv('Código', company.codigo);
  kv('CNPJ', company.cnpj);
  kv('Regime tributário', company.regime);
  kv('Responsável (CPF)', company.responsavel);
  kv('Inscrição Estadual (CGF)', company.inscricao_estadual);
  kv('Inscrição Municipal (ISS)', company.inscricao_municipal);
  kv('Status da apuração', STATUS_LABELS[apuracao.status || 'pendente']);
  y += 3;

  const t = fiscalTotals(apuracao);
  sectionTitle('Resumo do mês');
  ensure(24);
  const boxW = (W - M * 2 - 8) / 3;
  [['Entradas', t.entradas], ['Saídas', t.saidas], ['Saldo', t.saldo]].forEach((b, i) => {
    const x = M + i * (boxW + 4);
    doc.setDrawColor(...LINE);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(b[0], x + 4, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...SLATE);
    doc.text(fmtCurrency(b[1]), x + 4, y + 14.5);
  });
  y += 26;

  sectionTitle('Valores fiscais');
  group('Entradas');
  row('NF-e autorizadas', apuracao.entrada_nfe_qtd, apuracao.entrada_nfe_valor);
  group('Saídas — NF-e');
  row('Autorizadas', apuracao.saida_nfe_qtd, apuracao.saida_nfe_valor);
  row('Canceladas', apuracao.saida_nfe_cancel_qtd, apuracao.saida_nfe_cancel_valor);
  group('Saídas — NFC-E');
  row('Autorizadas', apuracao.nfce_qtd, apuracao.nfce_valor);
  row('Canceladas', apuracao.nfce_cancel_qtd, apuracao.nfce_cancel_valor);
  group('Saídas — CF-E');
  row('CF-E', apuracao.cfe_qtd, apuracao.cfe_valor);
  group('Notas de serviço (ISS)');
  row('Serviço prestado', apuracao.servico_prestado_qtd, apuracao.servico_prestado_valor);
  row('Serviço tomado', apuracao.servico_tomado_qtd, apuracao.servico_tomado_valor);
  group('CT-e');
  row('CT-e', apuracao.cte_qtd, apuracao.cte_valor);
  y += 3;

  const e = estudoAnalise(apuracao);
  sectionTitle('Estudo de tributação do mês');
  group('Vendas');
  line('Notas fiscais', apuracao.vendas_notas_fiscais);
  line('Cupons fiscais', apuracao.vendas_cupons_fiscais);
  line('NFC-e', apuracao.vendas_nfce);
  line('NFS-e (serviços)', apuracao.vendas_nfse);
  line('Total de vendas', e.totalVendas, true);
  group('Compras');
  line('Notas fiscais', apuracao.compras_notas_fiscais);
  line('Total de compras', e.totalCompras, true);
  group('Meios de pagamento (DIMP)');
  line('Débito', apuracao.dimp_debito);
  line('Crédito', apuracao.dimp_credito);
  line('PIX', apuracao.dimp_pix);
  line('Total', e.totalPagamentos, true);
  group('Análises');
  line('Diferença vendas − compras', e.diferencaVendasCompras);
  line('Diferença vendas − pagamentos', e.diferencaPagamentos);
  line('Compras ideais (25% das vendas)', e.idealCompras);
  lineText('% compras sobre vendas', `${(e.percentualCompras * 100).toFixed(1).replace('.', ',')}%`, true);
  y += 3;

  sectionTitle('Conferência contábil');
  const list = alertas(apuracao);
  if (list.length === 0) {
    lineText('Situação', 'Sem inconsistências detectadas', true);
  } else {
    list.forEach((al) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const desc = doc.splitTextToSize(al.descricao, W - M * 2 - 8);
      const h = 9 + desc.length * 4;
      ensure(h + 6);
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(M, y - 4, W - M * 2, h, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(185, 28, 28);
      doc.text(al.titulo, M + 3, y + 1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(desc, M + 3, y + 5.5);
      y += h + 6;
    });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Projetus Contabilidade · Relatório gerado automaticamente', M, 289);
  doc.text('Página 1', RIGHT, 289, { align: 'right' });

  const safe = (company.name || 'empresa').replace(/[^\w-]+/g, '-').toLowerCase();
  doc.save(`apuracao-${safe}-${apuracao.period}.pdf`);
}