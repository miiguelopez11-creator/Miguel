import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Building2, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CompanyForm from '@/components/CompanyForm';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = () => base44.entities.Company.list('-created_date', 500).then(setCompanies).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    await base44.entities.Company.delete(toDelete.id);
    setToDelete(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground mt-1">Abra uma empresa para lançar a apuração mensal</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Nova empresa
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">Nenhuma empresa cadastrada.</p>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-2" />Cadastrar empresa</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <div key={c.id} className="relative rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
              <Link to={`/empresas/${c.id}`} className="block p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  {c.codigo && <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">Cód. {c.codigo}</span>}
                </div>
                <h3 className="font-heading font-semibold pr-16">{c.name}</h3>
                {c.cnpj && <p className="text-sm text-muted-foreground mt-0.5">CNPJ: {c.cnpj}</p>}
                {c.regime && <p className="text-sm text-muted-foreground">{c.regime}</p>}
                <span className="inline-flex items-center gap-1 text-sm text-primary mt-4">Ver apuração<ChevronRight className="w-4 h-4" /></span>
              </Link>
              <div className="absolute top-4 right-4 flex gap-1">
                <button onClick={() => { setEditing(c); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setToDelete(c)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CompanyForm open={formOpen} onOpenChange={setFormOpen} company={editing} onSaved={load} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. As apurações vinculadas permanecem no histórico.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}