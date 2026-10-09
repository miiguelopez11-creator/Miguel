import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileCode2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { parseNotaXml, agregarNotas } from '@/lib/xmlNotas';
import { NUMERIC_FIELDS, FISCAL_SECTIONS } from '@/lib/fiscal';
import { fmtCurrency, fmtNumber } from '@/lib/format';

const TIPO_LABEL = { nfe: 'NF-e', nfce: 'NFC-e', cfe: 'CF-E', cte: 'CT-e', nfse: 'NFS-e' };
const STATUS_LABEL = { saida: 'saída', entrada: 'entrada', cancelada: 'cancelada', ignorada: 'ignorada' };
const STATUS_CLASS = {
  saida: 'text-emerald-600',
  entrada: 'text-sky-600',
  cancelada: 'text-rose-600',
  ignorada: 'text-amber-600',
};

export default function ImportXmlDialog({ open, onOpenChange, company, period, apuracao, onSaved }) {
  const [notas, setNotas] = useState([]);
  const [invalid, setInvalid] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!open) { setNotas([]); setInvalid([]); } }, [open]);

  const agg = useMemo(() => agregarNotas(notas, company?.cnpj), [notas, company]);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setParsing(true);
    const parsed = [];
    const bad = [];
    for (const f of files) {
      try {
        const nt = parseNotaXml(await f.text());
        if (nt) parsed.push({ ...nt, file: f.name });
        else bad.push(f.name);
      } catch {
        bad.push(f.name);
      }
    }
    setNotas(parsed);
    setInvalid(bad);
    setParsing(false);
  };

  const aplicar = async () => {
    setSaving(true);
    try {
      const base = apuracao || {};
      const payload = { company_id: company.id, company_name: company.name, period: apuracao?.period || period, status: base.status || 'pendente' };
      NUMERIC_FIELDS.forEach((k) => { payload[k] = Number(base[k]) || 0; });
      Object.entries(agg.fields).forEach(([k, v]) => { payload[k] = v; });
      if (apuracao) await base44.entities.Apuracao.update(apuracao.id, payload);
      else await base44.entities.Apuracao.create(payload);
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const fmtVal = (key, v) => (key.endsWith('_qtd') ? `${fmtNumber(v)} un` : fmtCurrency(v));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar XML das notas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-border p-5 text-center">
            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Selecione os arquivos XML (NF-e, NFC-e, CT-e, NFS-e, CF-E).</p>
            <Input
              type="file"
              multiple
              accept=".xml,text/xml,application/xml"
              onChange={(e) => handleFiles(e.target.files)}
              className="max-w-sm mx-auto"
            />
          </div>

          {parsing && <p className="text-sm text-muted-foreground">Lendo arquivos...</p>}

          {invalid.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-500/5 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p>{invalid.length} arquivo(s) não reconhecido(s):</p>
                <p className="break-all">{invalid.join(', ')}</p>
              </div>
            </div>
          )}

          {notas.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[['Notas lidas', agg.resumo.total], ['Saídas', agg.resumo.saidas], ['Entradas', agg.resumo.entradas], ['Ignoradas', agg.resumo.ignoradas]].map(([l, v]) => (
                  <div key={l} className="rounded-xl border border-border bg-card px-3 py-2">
                    <p className="text-lg font-heading font-semibold">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>

              {agg.resumo.saidas === 0 && agg.resumo.entradas === 0 && company?.cnpj && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-500/5 p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Nenhuma nota corresponde ao CNPJ desta empresa ({company.cnpj}). Confira se os XMLs são das notas emitidas por ela.
                  </p>
                </div>
              )}

              <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-medium">Valores calculados automaticamente</p>
                {FISCAL_SECTIONS.map((s) => (
                  <div key={s.title} className="space-y-0.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</p>
                    {s.fields.map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between py-1 text-sm border-b border-border last:border-0">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium tabular-nums">{fmtVal(key, agg.fields[key])}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-medium mb-2">Notas lidas</p>
                <div className="max-h-40 overflow-y-auto divide-y divide-border">
                  {agg.lista.map((nt, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 text-xs">
                      <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate max-w-[36%]">{nt.file}</span>
                      <span className="font-medium">{TIPO_LABEL[nt.tipo] || nt.tipo}</span>
                      <span className="text-muted-foreground">nº {nt.numero || '—'}</span>
                      <span className={STATUS_CLASS[nt.status]}>{STATUS_LABEL[nt.status]}</span>
                      <span className="ml-auto font-medium">{fmtCurrency(nt.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={aplicar} disabled={!notas.length || saving}>
            {saving ? 'Aplicando...' : 'Aplicar à apuração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}