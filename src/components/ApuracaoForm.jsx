import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { FISCAL_SECTIONS, ESTUDO_SECTIONS, NUMERIC_FIELDS, emptyApuracao, STATUS_FLOW, STATUS_LABELS } from '@/lib/fiscal';

function Section({ title, fields, values, set }) {
  return (
    <div className="space-y-3">
      <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map(([key, label]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input id={key} type="number" step="any" value={values[key] ?? ''} onChange={(e) => set(key, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ApuracaoForm({ open, onOpenChange, company, apuracao, defaultPeriod, onSaved }) {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({ ...emptyApuracao(), status: 'pendente', period: defaultPeriod || new Date().toISOString().slice(0, 7), ...(apuracao || {}) });
    }
  }, [open, apuracao, defaultPeriod]);

  const set = (key, value) => setValues((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { company_id: company.id, company_name: company.name, period: values.period, status: values.status || 'pendente' };
      NUMERIC_FIELDS.forEach((k) => { payload[k] = Number(values[k]) || 0; });
      if (apuracao) await base44.entities.Apuracao.update(apuracao.id, payload);
      else await base44.entities.Apuracao.create(payload);
      onSaved();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{apuracao ? 'Editar apuração' : 'Nova apuração'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Período (mês) *</Label>
              <Input id="period" type="month" value={values.period || ''} onChange={(e) => set('period', e.target.value)} required disabled={!!apuracao} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={values.status || 'pendente'} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Tabs defaultValue="fiscal">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="fiscal">Valores fiscais</TabsTrigger>
              <TabsTrigger value="estudo">Estudo do mês</TabsTrigger>
            </TabsList>
            <TabsContent value="fiscal" className="mt-4 space-y-5">
              {FISCAL_SECTIONS.map((s) => <Section key={s.title} title={s.title} fields={s.fields} values={values} set={set} />)}
            </TabsContent>
            <TabsContent value="estudo" className="mt-4 space-y-5">
              {ESTUDO_SECTIONS.map((s) => <Section key={s.title} title={s.title} fields={s.fields} values={values} set={set} />)}
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}