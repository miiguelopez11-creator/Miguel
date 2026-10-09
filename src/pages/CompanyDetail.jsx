import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Pencil, Trash2, Building2, FileUp, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import ApuracaoForm from '@/components/ApuracaoForm';
import FiscalPanel from '@/components/company/FiscalPanel';
import EstudoPanel from '@/components/company/EstudoPanel';
import AlertasPanel from '@/components/company/AlertasPanel';
import StatusControl from '@/components/company/StatusControl';
import ComparativoPanel from '@/components/company/ComparativoPanel';
import ApuracaoHistorico from '@/components/company/ApuracaoHistorico';
import ImportXmlDialog from '@/components/company/ImportXmlDialog';
import { monthLabel } from '@/lib/format';
import { alertas } from '@/lib/fiscal';
import { gerarRelatorioPdf } from '@/lib/pdfRelatorio';

export default function CompanyDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [company, setCompany] = useState(null);
  const [apuracoes, setApuracoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [month, setMonth] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [xmlOpen, setXmlOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    try {
      const c = await base44.entities.Company.get(id);
      if (!c) {setNotFound(true);return;}
      const list = await base44.entities.Apuracao.filter({ company_id: id }, '-period', 500);
      setCompany(c);
      setApuracoes(list);
      setMonth((prev) => prev || list[0]?.period || new Date().toISOString().slice(0, 7));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {load();}, [id]);

  const current = apuracoes.find((a) => a.period === month);
  const monthText = month ? monthLabel(month) : '—';

  const handleDelete = async () => {
    await base44.entities.Apuracao.delete(toDelete.id);
    setToDelete(null);
    load();
  };

  const changeStatus = async (status) => {
    if (!current) return;
    if (status === 'concluido' && alertas(current).some((a) => a.bloqueia)) {
      toast({ title: 'Inconsistências pendentes', description: 'Resolva os alertas contábeis antes de concluir a apuração.', variant: 'destructive' });
      return;
    }
    await base44.entities.Apuracao.update(current.id, { status });
    load();
  };

  const baixarPdf = () => {
    if (!current) return;
    gerarRelatorioPdf({ company, apuracao: current });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (notFound) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Empresa não encontrada.</p>
        <Button asChild className="mt-4"><Link to="/empresas">Voltar para Empresas</Link></Button>
      </div>);

  }

  const info = [
  { label: 'Código', value: company.codigo },
  { label: 'CNPJ', value: company.cnpj },
  { label: 'Responsável (CPF)', value: company.responsavel },
  { label: 'Regime', value: company.regime },
  { label: 'Inscrição Estadual (CGF)', value: company.inscricao_estadual },
  { label: 'Inscrição Municipal (ISS)', value: company.inscricao_municipal }].
  filter((i) => i.value);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/empresas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />Empresas
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight">{company.name}</h1>
            {company.codigo && <p className="text-muted-foreground mt-0.5 text-sm">Código {company.codigo}</p>}
          </div>
        </div>
        {info.length > 0 &&
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
            {info.map((i) =>
          <div key={i.label} className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{i.label}</p>
                <p className="text-sm font-medium mt-0.5 break-words">{i.value}</p>
              </div>
          )}
          </div>
        }
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Mês de referência</span>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
        <div className="flex flex-wrap gap-2 ml-auto">
          <Button variant="outline" onClick={() => setXmlOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" />Importar XML
          </Button>
          <Button variant="outline" onClick={baixarPdf} disabled={!current}>
            <FileDown className="w-4 h-4 mr-2" />Relatório PDF
          </Button>
          <Button onClick={() => {setEditing(null);setFormOpen(true);}} disabled={!!current}>
            <Plus className="w-4 h-4 mr-2" />Nova apuração
          </Button>
        </div>
      </div>

      {current ?
      <>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div>
              
              <StatusControl status={current.status} onChange={changeStatus} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {setEditing(current);setFormOpen(true);}}>
                <Pencil className="w-4 h-4 mr-2" />Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setToDelete(current)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />Excluir
              </Button>
            </div>
          </div>

          <FiscalPanel apuracao={current} />

          <div className="space-y-3">
            <h2 className="font-heading font-semibold">Estudo de tributação do mês</h2>
            <AlertasPanel apuracao={current} />
            <EstudoPanel apuracao={current} />
          </div>

          <ComparativoPanel apuracoes={apuracoes} month={month} />
        </> :

      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Nenhuma apuração cadastrada para {monthText}.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => {setEditing(null);setFormOpen(true);}}>
              <Plus className="w-4 h-4 mr-2" />Registrar apuração
            </Button>
            <Button variant="outline" onClick={() => setXmlOpen(true)}>
              <FileUp className="w-4 h-4 mr-2" />Importar XML
            </Button>
          </div>
        </div>
      }

      <ApuracaoHistorico apuracoes={apuracoes} companyName={company.name} />

      <ApuracaoForm open={formOpen} onOpenChange={setFormOpen} company={company} apuracao={editing} defaultPeriod={month} onSaved={load} />
      <ImportXmlDialog open={xmlOpen} onOpenChange={setXmlOpen} company={company} period={month} apuracao={current} onSaved={load} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir apuração?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}