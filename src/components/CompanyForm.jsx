import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { REGIMES } from '@/lib/fiscal';

const EMPTY = { name: '', codigo: '', cnpj: '', responsavel: '', regime: '', inscricao_estadual: '', inscricao_municipal: '' };

function TextField({ label, value, onChange, full }) {
  return (
    <div className={full ? 'sm:col-span-2 space-y-2' : 'space-y-2'}>
      <Label>{label}</Label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function CompanyForm({ open, onOpenChange, company, onSaved }) {
  const [values, setValues] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setValues(company ? { ...EMPTY, ...company } : EMPTY);
  }, [open, company]);

  const set = (key, value) => setValues((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    setLoading(true);
    try {
      const payload = { ...values };
      if (company) await base44.entities.Company.update(company.id, payload);
      else await base44.entities.Company.create(payload);
      onSaved();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Empresa *" value={values.name} onChange={(v) => set('name', v)} full />
            <TextField label="Código" value={values.codigo} onChange={(v) => set('codigo', v)} />
            <TextField label="CNPJ" value={values.cnpj} onChange={(v) => set('cnpj', v)} />
            <TextField label="Responsável (CPF)" value={values.responsavel} onChange={(v) => set('responsavel', v)} />
            <div className="space-y-2">
              <Label>Regime tributário</Label>
              <Select value={values.regime || ''} onValueChange={(v) => set('regime', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {REGIMES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <TextField label="Inscrição Estadual (CGF)" value={values.inscricao_estadual} onChange={(v) => set('inscricao_estadual', v)} />
            <TextField label="Inscrição Municipal (ISS)" value={values.inscricao_municipal} onChange={(v) => set('inscricao_municipal', v)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}