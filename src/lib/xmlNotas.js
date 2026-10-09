const digits = (s) => String(s || '').replace(/\D/g, '');

const lname = (el) => String((el && (el.localName || el.nodeName)) || '').toLowerCase();

// Todas as buscas ignoram maiúsculas/minúsculas e o prefixo de namespace,
// porque cada emissor/município usa grafias diferentes das mesmas tags.
function all(node, name) {
  if (!node || !node.getElementsByTagNameNS) return [];
  const target = String(name).toLowerCase();
  const list = node.getElementsByTagNameNS('*', '*');
  const found = [];
  for (let i = 0; i < list.length; i++) {
    if (lname(list[i]) === target) found.push(list[i]);
  }
  return found;
}

const first = (node, name) => all(node, name)[0] || null;
const valueOf = (el) => (el ? (el.textContent || '').trim() : null);
const text = (node, name) => valueOf(first(node, name));

function anyEl(node, names) {
  for (const n of names) {
    const el = first(node, n);
    if (el) return el;
  }
  return null;
}

function anyText(node, names) {
  for (const n of names) {
    const v = text(node, n);
    if (v) return v;
  }
  return null;
}

// Aceita "1234.56" e também "1.234,56" (usado por alguns municípios).
function num(v) {
  let s = String(v == null ? '' : v).trim().replace(/\s/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const x = Number(s);
  return isFinite(x) ? x : 0;
}

function cnpjOrCpf(node) {
  if (!node) return '';
  const el = first(node, 'cnpj') || first(node, 'cpf');
  return el ? digits(el.textContent) : '';
}

function chave(node) {
  if (!node) return '';
  const attr = node.getAttribute('Id') || node.getAttribute('id');
  if (attr) return digits(attr);
  return digits(text(node, 'chnfe'));
}

function parseNfe(doc) {
  const inf = first(doc, 'infnfe');
  const prot = first(doc, 'infprot');
  const cStat = prot ? text(prot, 'cstat') : null;
  const eventos = all(doc, 'tpevento').map((e) => (e.textContent || '').trim());
  const cancelado = eventos.includes('110111') || cStat === '101';
  const autorizada = cStat ? cStat === '100' && !cancelado : !cancelado;
  const mod = text(inf, 'mod') || '55';
  return {
    tipo: mod === '65' ? 'nfce' : 'nfe',
    mod,
    chave: chave(inf),
    numero: text(inf, 'nnf'),
    serie: text(inf, 'serie'),
    data: text(inf, 'dhemi') || text(inf, 'demi'),
    valor: num(text(inf, 'vnf')),
    emitCnpj: cnpjOrCpf(first(inf, 'emit')),
    destCnpj: cnpjOrCpf(first(inf, 'dest')),
    autorizada,
    cancelado,
  };
}

function parseCte(doc) {
  const inf = first(doc, 'infcte');
  const prot = first(doc, 'infprot');
  const cStat = prot ? text(prot, 'cstat') : null;
  return {
    tipo: 'cte',
    mod: '57',
    chave: chave(inf),
    numero: text(inf, 'nct'),
    serie: text(inf, 'serie'),
    data: text(inf, 'dhemi') || text(inf, 'demi'),
    valor: num(text(inf, 'vtprest')) || num(text(inf, 'vcte')) || num(text(inf, 'vnf')),
    emitCnpj: cnpjOrCpf(first(inf, 'emit')),
    destCnpj: cnpjOrCpf(first(inf, 'dest')),
    autorizada: !cStat || cStat === '100',
    cancelado: cStat === '101',
  };
}

function parseCfe(doc) {
  const inf = first(doc, 'infcfe');
  return {
    tipo: 'cfe',
    mod: '59',
    chave: chave(inf),
    numero: text(inf, 'ncfe'),
    data: text(inf, 'demi'),
    valor: num(text(inf, 'vcfe')) || num(text(inf, 'vtotal')),
    emitCnpj: cnpjOrCpf(first(inf, 'emit')),
    destCnpj: cnpjOrCpf(first(inf, 'dest')),
    autorizada: true,
    cancelado: false,
  };
}

// NFS-e: cada município/prestador nomeia o prestador e o tomador de um jeito.
const PRESTADOR_TAGS = ['prestador', 'prestadorservico', 'identificacaoprestador', 'emit', 'prest'];
const TOMADOR_TAGS = ['tomador', 'tomadorservico', 'identificacaotomador', 'dest', 'toma'];

function parseNfse(doc, inf) {
  const root = inf || doc.documentElement;
  const prestador = anyEl(root, PRESTADOR_TAGS) || root;
  const tomador = anyEl(root, TOMADOR_TAGS);
  return {
    tipo: 'nfse',
    mod: 'nfse',
    numero: anyText(root, ['nnfse', 'numeronfse', 'nnf', 'numeronota', 'ndps', 'numero']),
    data: anyText(root, ['dhemi', 'dataemissao', 'demi', 'dtemissao', 'competencia', 'datacompetencia']),
    valor: num(anyText(root, ['vserv', 'valorservicos', 'vliq', 'valorliquido', 'valorliquidonfse', 'valortotalservicos', 'vtotalservicos', 'vnf', 'vreceb'])),
    emitCnpj: cnpjOrCpf(prestador),
    destCnpj: cnpjOrCpf(tomador),
    autorizada: true,
    cancelado: false,
  };
}

export function parseNotaXml(content) {
  if (!content || !String(content).trim()) return null;
  let doc;
  try {
    doc = new DOMParser().parseFromString(content, 'application/xml');
  } catch {
    return null;
  }
  if (!doc || !doc.documentElement) return null;
  if (lname(doc.documentElement) === 'parsererror') return null;
  if (doc.getElementsByTagName('parsererror').length) return null;

  if (first(doc, 'infnfe')) return parseNfe(doc);
  if (first(doc, 'infcte')) return parseCte(doc);
  if (first(doc, 'infcfe')) return parseCfe(doc);
  if (first(doc, 'infnfse')) return parseNfse(doc, first(doc, 'infnfse'));
  if (first(doc, 'infdps')) return parseNfse(doc, first(doc, 'infdps'));

  const root = lname(doc.documentElement);
  if (root === 'nfse' || root === 'compnfse') return parseNfse(doc, doc.documentElement);
  return null;
}

export function agregarNotas(notas, companyCnpj) {
  const c = digits(companyCnpj);
  const fields = {
    entrada_nfe_qtd: 0, entrada_nfe_valor: 0,
    saida_nfe_qtd: 0, saida_nfe_valor: 0,
    saida_nfe_cancel_qtd: 0, saida_nfe_cancel_valor: 0,
    nfce_qtd: 0, nfce_valor: 0,
    nfce_cancel_qtd: 0, nfce_cancel_valor: 0,
    cfe_qtd: 0, cfe_valor: 0,
    servico_prestado_qtd: 0, servico_prestado_valor: 0,
    servico_tomado_qtd: 0, servico_tomado_valor: 0,
    cte_qtd: 0, cte_valor: 0,
  };
  const resumo = { total: notas.length, entradas: 0, saidas: 0, canceladas: 0, ignoradas: 0 };
  const lista = [];

  notas.forEach((nt) => {
    if (!nt) return;
    const isEmit = c ? nt.emitCnpj === c : true;
    const isDest = c ? nt.destCnpj === c : false;
    let status = 'ignorada';

    if (nt.tipo === 'nfe' || nt.tipo === 'nfce') {
      const isNfce = nt.tipo === 'nfce';
      if (nt.cancelado) {
        if (!isDest) {
          if (isNfce) { fields.nfce_cancel_qtd++; fields.nfce_cancel_valor += nt.valor; }
          else { fields.saida_nfe_cancel_qtd++; fields.saida_nfe_cancel_valor += nt.valor; }
          status = 'cancelada';
        }
      } else if (!nt.autorizada) {
        status = 'ignorada';
      } else if (isEmit) {
        if (isNfce) { fields.nfce_qtd++; fields.nfce_valor += nt.valor; }
        else { fields.saida_nfe_qtd++; fields.saida_nfe_valor += nt.valor; }
        status = 'saida';
      } else if (isDest && !isNfce) {
        fields.entrada_nfe_qtd++; fields.entrada_nfe_valor += nt.valor;
        status = 'entrada';
      }
    } else if (nt.tipo === 'cfe') {
      if (isEmit) { fields.cfe_qtd++; fields.cfe_valor += nt.valor; status = 'saida'; }
    } else if (nt.tipo === 'cte') {
      if (!nt.cancelado && nt.autorizada) { fields.cte_qtd++; fields.cte_valor += nt.valor; status = 'saida'; }
    } else if (nt.tipo === 'nfse') {
      if (isEmit) { fields.servico_prestado_qtd++; fields.servico_prestado_valor += nt.valor; status = 'saida'; }
      else if (isDest) { fields.servico_tomado_qtd++; fields.servico_tomado_valor += nt.valor; status = 'entrada'; }
    }

    if (status === 'saida') resumo.saidas++;
    else if (status === 'entrada') resumo.entradas++;
    else if (status === 'cancelada') resumo.canceladas++;
    else resumo.ignoradas++;

    lista.push({ ...nt, status });
  });

  return { fields, resumo, lista };
}