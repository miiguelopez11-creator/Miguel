import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Plus, ChevronRight, Building2, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fmtCurrency, monthLabel } from '@/lib/format';
import { fiscalTotals, regimeGroup, REGIMES, STATUS_LABELS, STATUS_STYLES } from '@/lib/fiscal';
import { cn } from '@/lib/utils';

export default function Home() {
  const [companies, setCompanies] = useState([]);
  const [apuracoes, setApuracoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('');
  const [regime, setRegime] = useState('todos');

  useEffect(() => {
    Promise.all([
      base44.entities.Company.list('-created_date', 500),
      base44.entities.Apuracao.list('-period', 2000),
    ]).then(([c, a]) => { setCompanies(c); setApuracoes(a); }).finally(() => setLoading(false));
  }, []);

  const periods = useMemo(() => [...new Set(apuracoes.map((a) => a.period))].sort((x, y) => y.localeCompare(x)), [apuracoes]);

  useEffect(() => {
    if (!month && periods.length) setMonth(periods[0]);
  }, [periods, month]);

  const filtered = useMemo(
    () => (regime === 'todos' ? companies : companies.filter((c) => regimeGroup(c.regime) === regime)),
    [companies, regime]
  );

  const byCompany = useMemo(() => filtered.map((c) => {
    const a = apuracoes.find((x) => x.company_id === c.id && x.period === month);
    return { id: c.id, name: c.name, codigo: c.codigo, status: a ? (a.status || 'pendente') : 'pendente', ...fiscalTotals(a) };
  }), [filtered, apuracoes, month]);

  const totals = byCompany.reduce((acc, c) => ({ entradas: acc.entradas + c.entradas, saidas: acc.saidas + c.saidas }), { entradas: 0, saidas: 0 });
  const saldo = totals.entradas - totals.saidas;
  const concluidas = byCompany.filter((c) => c.status === 'concluido').length;
  const pendentes = byCompany.length - concluidas;
  const chartData = byCompany.filter((c) => c.entradas || c.saidas);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const cards = [
    { label: 'Entradas', value: fmtCurrency(totals.entradas), icon: TrendingUp, tone: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Saídas', value: fmtCurrency(totals.saidas), icon: TrendingDown, tone: 'text-rose-600', bg: 'bg-rose-500/10' },
    { label: 'Saldo', value: fmtCurrency(saldo), icon: Wallet, tone: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Clientes', value: String(byCompany.length), icon: Building2, tone: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Panorama da carteira de clientes por mês</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={regime} onValueChange={setRegime}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os regimes</SelectItem>
              {REGIMES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent>
              {periods.map((p) => <SelectItem key={p} value={p}>{monthLabel(p)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/empresas"><Plus className="w-4 h-4 mr-2" />Empresas</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', c.bg)}>
                  <Icon className={cn('w-4 h-4', c.tone)} />
                </div>
              </div>
              <div className="font-heading text-2xl font-semibold tracking-tight">{c.value}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-heading font-semibold">Situação das apurações{month ? ` · ${monthLabel(month)}` : ''}</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="w-4 h-4" />{concluidas} concluídas</span>
            <span className="inline-flex items-center gap-1.5 text-amber-600"><Clock className="w-4 h-4" />{pendentes} pendentes</span>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${byCompany.length ? (concluidas / byCompany.length) * 100 : 0}%` }} />
        </div>
      </div>

      {periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border bg-card">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma apuração cadastrada. Cadastre uma empresa e registre a apuração do mês.</p>
          <Button asChild className="mt-4"><Link to="/empresas"><Plus className="w-4 h-4 mr-2" />Gerenciar empresas</Link></Button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading font-semibold mb-4">Entradas e saídas por empresa · {monthLabel(month)}</h2>
            {chartData.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma apuração neste mês.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="codigo" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v) => fmtCurrency(v).replace('R$', '').trim()} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v) => fmtCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="hsl(152 60% 45%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="hsl(350 70% 60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading font-semibold mb-4">Resumo por empresa{month ? ` · ${monthLabel(month)}` : ''}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2.5 pr-4 font-medium">Empresa</th>
                    <th className="py-2.5 pr-4 font-medium">Regime</th>
                    <th className="py-2.5 pr-4 font-medium text-right">Entradas</th>
                    <th className="py-2.5 pr-4 font-medium text-right">Saídas</th>
                    <th className="py-2.5 pr-4 font-medium text-right">Saldo</th>
                    <th className="py-2.5 pr-4 font-medium">Status</th>
                    <th className="py-2.5 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {byCompany.map((c) => {
                    const company = filtered.find((x) => x.id === c.id);
                    return (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-4 font-medium">{c.name}{c.codigo ? ` · ${c.codigo}` : ''}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{company?.regime || '—'}</td>
                        <td className="py-3 pr-4 text-right text-emerald-600">{fmtCurrency(c.entradas)}</td>
                        <td className="py-3 pr-4 text-right text-rose-600">{fmtCurrency(c.saidas)}</td>
                        <td className={cn('py-3 pr-4 text-right font-medium', c.saldo < 0 && 'text-rose-600')}>{fmtCurrency(c.saldo)}</td>
                        <td className="py-3 pr-4">
                          <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[c.status])}>
                            {STATUS_LABELS[c.status] || 'Pendente'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link to={`/empresas/${c.id}`} className="inline-flex items-center text-primary hover:underline">Ver<ChevronRight className="w-4 h-4" /></Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}