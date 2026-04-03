import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Wallet, ArrowUpRight, ArrowDownRight,
  Plus, Download, FileText, ShoppingBag,
  Sparkles, Clock, Crown, TrendingUp, Pickaxe, ChevronRight
} from 'lucide-react';
import {
  format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subDays, parseISO, isWithinInterval, differenceInDays, eachDayOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart as RPieChart, Pie, Cell } from 'recharts';
import * as expensesService from '@/services/expensesService';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtShort = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : fmt(v);

type PeriodKey = 'hoje' | 'semana' | 'mes' | '30dias' | 'custom';

const EXPENSE_CATEGORIES = ['Produtos', 'Funcionários', 'Aluguel', 'Energia', 'Manutenção', 'Software', 'Outros'];

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro', outro: 'Outro',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Produtos': 'hsl(var(--primary))',
  'Funcionários': 'hsl(var(--primary) / 0.8)',
  'Aluguel': 'hsl(var(--primary) / 0.6)',
  'Energia': 'hsl(var(--primary) / 0.4)',
  'Manutenção': 'hsl(var(--primary) / 0.25)',
  'Software': 'hsl(var(--primary) / 0.15)',
  'Outros': 'hsl(var(--muted-foreground) / 0.3)',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export function FinanceiroProComplete() {
  const { appointments } = useAdmin();
  const [expenses, setExpenses] = useState<expensesService.ExpenseRow[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('mes');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Outros', date: format(new Date(), 'yyyy-MM-dd') });

  const loadExpenses = useCallback(async () => {
    const data = await expensesService.getExpenses();
    setExpenses(data);
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  // Period range
  const { start, end } = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'hoje': return { start: startOfDay(now), end: endOfDay(now) };
      case 'semana': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'mes': return { start: startOfMonth(now), end: endOfMonth(now) };
      case '30dias': return { start: subDays(now, 30), end: now };
      case 'custom': return { start: customStart || startOfMonth(now), end: customEnd || endOfMonth(now) };
      default: return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period, customStart, customEnd]);

  // Filter global
  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const d = parseISO(a.date);
      return isWithinInterval(d, { start, end });
    });
  }, [appointments, start, end]);

  const paidAppointments = useMemo(() =>
    filtered.filter(a => a.status === 'realizado' && a.payment_status === 'pago'),
  [filtered]);

  const pendingAppointments = useMemo(() =>
    filtered.filter(a => a.status !== 'cancelado' && a.payment_status !== 'pago'),
  [filtered]);

  const filteredExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start, end });
    }),
  [expenses, start, end]);

  // Core Metrics
  const metrics = useMemo(() => {
    const revenue = paidAppointments.reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
    const pendingRevenue = pendingAppointments.reduce((s, a) => s + (a.price || 0), 0);
    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const profit = revenue - totalExpenses;
    return { revenue, pendingRevenue, totalExpenses, profit, pendingCount: pendingAppointments.length };
  }, [paidAppointments, pendingAppointments, filteredExpenses]);

  // Smart metrics vs previous period (Fintech comparative)
  const vsLastPeriod = useMemo(() => {
    const periodDays = Math.max(1, differenceInDays(end, start) + 1);
    const prevStart = subDays(start, periodDays);
    const prevEnd = subDays(start, 1);
    
    const prevPaid = appointments.filter(a => {
      const d = parseISO(a.date);
      return a.status === 'realizado' && a.payment_status === 'pago' && isWithinInterval(d, { start: prevStart, end: prevEnd });
    });
    const prevRevenue = prevPaid.reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);

    const prevExp = expenses.filter(e => isWithinInterval(parseISO(e.date), { start: prevStart, end: prevEnd }));
    const prevExpensesTotal = prevExp.reduce((s, e) => s + e.amount, 0);

    const revPct = prevRevenue > 0 ? ((metrics.revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const expPct = prevExpensesTotal > 0 ? ((metrics.totalExpenses - prevExpensesTotal) / prevExpensesTotal) * 100 : 0;

    return { revPct: Math.round(revPct), expPct: Math.round(expPct), prevRevenue, prevExpensesTotal };
  }, [metrics, appointments, expenses, start, end]);

  // Area Chart (Cash Flow)
  const compositeChartData = useMemo(() => {
    let days = eachDayOfInterval({ start, end });
    if (days.length > 40) {
      days = days.filter((_, i) => i % Math.ceil(days.length / 30) === 0);
    }
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRev = paidAppointments.filter(a => a.date === dayStr).reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
      const dayExp = filteredExpenses.filter(e => e.date === dayStr).reduce((s, e) => s + e.amount, 0);
      return { date: format(day, 'dd/MM'), receita: dayRev, despesa: dayExp };
    });
  }, [paidAppointments, filteredExpenses, start, end]);

  // Donut Chart (Expenses by Category)
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    const total = metrics.totalExpenses || 1;
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, metrics.totalExpenses]);

  // Extract Log (Chronological merge of revenues + expenses)
  const bankExtract = useMemo(() => {
    const arr: Array<{ id: string, type: 'in'|'out', date: string, title: string, subtitle: string, amount: number, originalDateObj: Date }> = [];
    paidAppointments.forEach(a => {
      arr.push({
        id: `rev-${a.id}`,
        type: 'in',
        date: format(parseISO(a.date), "dd MMM", {locale: ptBR}),
        title: a.service_name,
        subtitle: `${a.customer_name || 'Cliente'} • ${PAYMENT_LABELS[a.payment_method || ''] || '—'}`,
        amount: a.payment_amount || a.price || 0,
        originalDateObj: parseISO(a.date)
      });
    });
    filteredExpenses.forEach(e => {
      arr.push({
        id: `exp-${e.id}`,
        type: 'out',
        date: format(parseISO(e.date), "dd MMM", {locale: ptBR}),
        title: e.description,
        subtitle: e.category,
        amount: e.amount,
        originalDateObj: parseISO(e.date)
      });
    });
    return arr.sort((a, b) => b.originalDateObj.getTime() - a.originalDateObj.getTime());
  }, [paidAppointments, filteredExpenses]);

  // Revenue by service
  const revenueByService = useMemo(() => {
    const map: Record<string, number> = {};
    paidAppointments.forEach(a => { map[a.service_name] = (map[a.service_name] || 0) + (a.payment_amount || a.price || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [paidAppointments]);


  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;
    await expensesService.createExpense({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
    });
    setNewExpense({ description: '', amount: '', category: 'Outros', date: format(new Date(), 'yyyy-MM-dd') });
    setNewExpenseOpen(false);
    await loadExpenses();
  };

  const handleExport = (type: 'csv') => {
    if (type === 'csv') {
      const rows = bankExtract.map(r => ({ Data: r.date, Titulo: r.title, Categoria: r.subtitle, Tipo: r.type === 'in' ? 'Entrada' : 'Saída', Valor: r.amount }));
      const headers = Object.keys(rows[0] || {});
      const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r as any)[h]}"`).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `extrato-${format(new Date(), 'yyyy-MM-dd')}.csv`; link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* HEADER & PRO BADGE */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-primary/10 hidden sm:flex border border-primary/20 shadow-inner">
            <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Financeiro</h1>
              <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0 shadow-sm px-2 py-0.5 whitespace-nowrap">
                <Crown className="w-3 h-3 mr-1" /> PRO
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Sua conta digital PetCão e gestão inteligente da saúde da empresa.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {([
            { key: 'hoje', label: 'Hoje' },
            { key: 'semana', label: 'Semana' },
            { key: 'mes', label: 'Mês' },
            { key: '30dias', label: '30 Dias' },
          ] as { key: PeriodKey; label: string }[]).map(p => (
            <Button
              key={p.key}
              variant={period === p.key ? 'default' : 'ghost'}
              size="sm"
              className={cn("text-xs rounded-xl font-medium transition-all", period === p.key ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted/50 border border-transparent")}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-background text-foreground rounded-xl shadow-sm gap-1.5 transition-all w-full sm:w-auto">
                <Download className="w-3.5 h-3.5" /> Exportar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-1.5 rounded-xl shadow-lg border-border/50" align="end">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs rounded-lg" onClick={() => handleExport('csv')}><FileText className="w-3.5 h-3.5 mr-2" /> CSV</Button>
            </PopoverContent>
          </Popover>
          <Dialog open={newExpenseOpen} onOpenChange={setNewExpenseOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-md gap-1.5 ml-1 transition-all">
                <Plus className="w-3.5 h-3.5" /> Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl">
              <DialogHeader><DialogTitle className="text-xl">Nova Despesa</DialogTitle></DialogHeader>
              <div className="space-y-4 py-3">
                <div className="space-y-1.5"><Label className="text-xs uppercase font-medium text-muted-foreground">Descrição</Label><Input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Conta de Luz" className="rounded-xl h-11" /></div>
                <div className="space-y-1.5"><Label className="text-xs uppercase font-medium text-muted-foreground">Valor (R$)</Label><Input type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="rounded-xl h-11 font-mono text-lg" /></div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase font-medium text-muted-foreground">Categoria</Label>
                  <Select value={newExpense.category} onValueChange={v => setNewExpense(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs uppercase font-medium text-muted-foreground">Data</Label><Input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))} className="rounded-xl h-11" /></div>
                <Button onClick={handleAddExpense} className="w-full rounded-xl h-12 font-bold mt-2">Registrar Despesa</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPI BENTO GRID - FINTECH AESTHETIC */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Receita Líquida / Lucro */}
        <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow rounded-3xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> Lucro Líquido
                </p>
                <h3 className="text-3xl lg:text-4xl font-bold text-foreground mt-3 tracking-tight">{fmt(metrics.profit)}</h3>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-border/40 pt-4">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Margem</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-bold text-primary">{metrics.revenue > 0 ? Math.round((metrics.profit / metrics.revenue) * 100) : 0}%</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        </Card>

        {/* Entradas */}
        <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow rounded-3xl">
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
               Receitas (Entradas)
            </p>
            <h3 className="text-3xl font-bold text-foreground mt-3 tracking-tight">{fmt(metrics.revenue)}</h3>
            <div className="mt-5 flex items-center gap-1.5 border-t border-border/40 pt-4">
              {vsLastPeriod.prevRevenue > 0 && period !== 'hoje' ? (
                <>
                  <ArrowUpRight className={cn("w-4 h-4", vsLastPeriod.revPct >= 0 ? "text-emerald-500" : "text-red-500 rotate-90")} />
                  <span className={cn("text-xs font-bold", vsLastPeriod.revPct >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {vsLastPeriod.revPct > 0 ? '+' : ''}{vsLastPeriod.revPct}%
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">vs. período anterior</span>
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground/60 font-medium tracking-wide">PAGAMENTOS REALIZADOS</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Saídas */}
        <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow rounded-3xl">
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
               Despesas (Saídas)
            </p>
            <h3 className="text-3xl font-bold text-foreground mt-3 tracking-tight">{fmt(metrics.totalExpenses)}</h3>
            <div className="mt-5 flex items-center gap-1.5 border-t border-border/40 pt-4">
               {vsLastPeriod.prevExpensesTotal > 0 && period !== 'hoje' ? (
                <>
                  <ArrowDownRight className={cn("w-4 h-4", vsLastPeriod.expPct <= 0 ? "text-emerald-500 rotate-[270deg]" : "text-red-500")} />
                  <span className={cn("text-xs font-bold", vsLastPeriod.expPct <= 0 ? "text-emerald-500" : "text-red-500")}>
                    {vsLastPeriod.expPct > 0 ? '+' : ''}{vsLastPeriod.expPct}%
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">vs. período anterior</span>
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground/60 font-medium tracking-wide">CUSTOS OPERACIONAIS</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pendentes (A Receber) */}
        <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent shadow-sm hover:shadow-md transition-shadow rounded-3xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-amber-600/90 dark:text-amber-500/90 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> A Receber
                </p>
                <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-500 mt-3 tracking-tight">{fmt(metrics.pendingRevenue)}</h3>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 border-t border-amber-500/10 pt-4">
              <span className="text-[11px] font-bold tracking-wide uppercase text-amber-700/70 dark:text-amber-500/70">{metrics.pendingCount} pagamentos abertos</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* DASHBOARDS ROW */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fluxo de Caixa */}
        <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col rounded-3xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-foreground">Evolução do Caixa</CardTitle>
            <CardDescription className="text-xs">Histórico dinâmico de entradas e saídas no período.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1">
            <ChartContainer config={{ value: { label: 'Reais' }}} className="h-[240px] w-full">
              <AreaChart data={compositeChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} className="fill-muted-foreground opacity-70" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtShort} tickLine={false} axisLine={false} className="fill-muted-foreground opacity-70" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v, name) => [fmt(v as number), name === 'receita' ? 'Entradas' : 'Despesas']} />} />
                <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="despesa" stroke="hsl(var(--muted-foreground))" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Categorias de Despesas Donut */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-sm flex flex-col rounded-3xl">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-bold text-foreground">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center flex-1 w-full">
             {expensesByCategory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50 py-10 w-full">
                  <Pickaxe className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-xs text-center text-muted-foreground">Otimizado. Zero despesas.</p>
                </div>
            ) : (
              <>
                <ChartContainer config={{ value: { label: 'R$' } }} className="h-[180px] w-full max-w-[200px]">
                  <RPieChart>
                    <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={80} strokeWidth={0} paddingAngle={2}>
                      {expensesByCategory.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Outros']} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent formatter={(val, name, props) => [`${props.payload.pct}% (${fmt(val as number)})`, name]} />} />
                  </RPieChart>
                </ChartContainer>
                <div className="w-full mt-5 space-y-2.5 px-4 pb-2">
                  {expensesByCategory.slice(0, 4).map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || CATEGORY_COLORS['Outros'] }} />
                        <span className="text-xs font-medium text-muted-foreground truncate max-w-[90px]">{cat.name}</span>
                      </div>
                      <span className="text-xs font-bold text-foreground">{cat.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </motion.div>

      {/* LOWER TABLES */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Serviços Pipeline */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-sm flex flex-col h-full rounded-3xl">
          <CardHeader className="pb-4 border-b border-border/20 pt-5 px-6">
            <CardTitle className="text-sm font-bold flex items-center justify-between gap-2">
               Melhores Serviços <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">Top 5</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-6 flex-1 justify-center">
            {revenueByService.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-4">Sem dados sufcientes.</p>
            ) : (
              revenueByService.map((service, i) => {
                const maxVal = revenueByService[0].value;
                const pct = Math.round((service.value / maxVal) * 100);
                return (
                  <div key={service.name} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground truncate max-w-[130px] flex items-center gap-2">
                         <span className="text-muted-foreground/60 w-3">{i+1}.</span>
                         {service.name}
                      </span>
                      <span className="font-semibold text-muted-foreground">{fmt(service.value)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/80 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Extrato Financeiro - Statement */}
        <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur-xl shadow-sm flex flex-col overflow-hidden h-[400px] rounded-3xl">
          <CardHeader className="pb-3 border-b border-border/20 py-5 px-6 bg-muted/10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  Conta Corrente <span className="font-normal text-muted-foreground opacity-60">| Movimentação</span>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-muted-foreground hover:text-primary tracking-wide">
                VER EXTRATO TOTAL <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto custom-scrollbar flex-1">
            <Table>
              <TableBody>
                {bankExtract.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-10">Nenhuma transação efetuada.</TableCell></TableRow>
                ) : bankExtract.slice(0, 30).map(t => (
                  <TableRow key={t.id} className="group hover:bg-muted/40 border-b border-border/30 transition-colors">
                    <TableCell className="py-3 px-6 w-12">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", t.type === 'in' ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border/50")}>
                          {t.type === 'in' ? <Sparkles className="w-4 h-4 text-primary" /> : <ShoppingBag className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-2">
                        <p className="text-[13px] font-bold text-foreground leading-tight">{t.title}</p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">{t.subtitle}</p>
                    </TableCell>
                    <TableCell className="text-right py-3 px-6">
                      <p className={cn("text-sm font-bold tracking-tight", t.type === 'in' ? "text-primary" : "text-foreground")}>
                        {t.type === 'in' ? '+' : '-'} {fmt(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{t.date}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </motion.div>

    </motion.div>
  );
}
