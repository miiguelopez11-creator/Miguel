export const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

export const fmtNumber = (v) =>
  new Intl.NumberFormat('pt-BR').format(Number(v) || 0);

export const fmtDate = (d) => {
  if (!d) return '';
  const date = typeof d === 'string' && d.length <= 10 ? new Date(d + 'T00:00:00') : new Date(d);
  return date.toLocaleDateString('pt-BR');
};

export const monthLabel = (key) => {
  const [y, m] = key.split('-');
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${names[Number(m) - 1]}/${y.slice(2)}`;
};