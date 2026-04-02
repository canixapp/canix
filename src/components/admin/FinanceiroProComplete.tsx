import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, TrendingDown, TrendingUp, Crown, Wallet, ArrowUpRight, ArrowDownRight,
  Plus, Download, FileText, CalendarIcon, CreditCard, ShoppingBag,
  BarChart3, PiggyBank, Receipt, Sparkles
} from 'lucide-react';
import {
  format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subDays, parseISO, isWithinInterval, differenceInDays, getDaysInMonth, eachDayOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell, PieChart as RPieChart, Pie } from 'recharts';
import * as expensesService from '@/services/expensesService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtShort = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : fmt(v);

type PeriodKey = 'hoje' | 'semana' | 'mes' | '30dias' | 'custom';

const EXPENSE_CATEGORIES = ['Produtos', 'Funcionários', 'Aluguel', 'Energia', 'Manutenção', 'Outros'];

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro', outro: 'Outro',
};

const PIE_COLORS = ['hsl(200, 80%, 50%)', 'hsl(150, 70%, 45%)', 'hsl(45, 90%, 55%)', 'hsl(280, 60%, 55%)'];
const BAR_COLORS = ['hsl(200, 80%, 55%)', 'hsl(150, 70%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(45, 90%, 55%)', 'hsl(340, 70%, 55%)'];

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

  // Filter appointments by period
  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const d = parseISO(a.date);
      return isWithinInterval(d, { start, end });
    });
  }, [appointments, start, end]);

  const paidAppointments = useMemo(() =>
    filtered.filter(a => a.status === 'realizado' && a.payment_status === 'pago'),
    [filtered]
  );

  const filteredExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start, end });
    }),
    [expenses, start, end]
  );

  // Metrics
  const metrics = useMemo(() => {
    const revenue = paidAppointments.reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const profit = revenue - totalExpenses;
    const ticketMedio = paidAppointments.length > 0 ? revenue / paidAppointments.length : 0;
    return { revenue, totalExpenses, profit, ticketMedio, paidCount: paidAppointments.length };
  }, [paidAppointments, filteredExpenses]);

  // Smart metrics vs previous period
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

  // Composite Chart (Rev vs Exp)
  const compositeChartData = useMemo(() => {
    // If interval > 31 days, group by weeks or months, but let's stick to days for simplicity 
    // and clip it to a max array to avoid lag if custom date is huge
    let days = eachDayOfInterval({ start, end });
    if (days.length > 40) {
      // rough decimation if too large, but for 'mes' or '30dias' it's 30/31 items = perfectly fine
      days = days.filter((_, i) => i % Math.ceil(days.length / 30) === 0);
    }

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRev = paidAppointments
        .filter(a => a.date === dayStr)
        .reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
      const dayExp = filteredExpenses
        .filter(e => e.date === dayStr)
        .reduce((s, e) => s + e.amount, 0);
      return { date: format(day, 'dd/MM'), receita: dayRev, despesa: dayExp };
    });
  }, [paidAppointments, filteredExpenses, start, end]);

  // Revenue by service
  const revenueByService = useMemo(() => {
    const map: Record<string, number> = {};
    paidAppointments.forEach(a => {
      map[a.service_name] = (map[a.service_name] || 0) + (a.payment_amount || a.price || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5
      .map(([name, value]) => ({ name, value }));
  }, [paidAppointments]);

  const topService = revenueByService[0] || null;

  // Payment methods
  const paymentMethods = useMemo(() => {
    const map: Record<string, number> = {};
    paidAppointments.forEach(a => {
      const method = a.payment_method || 'outro';
      map[method] = (map[method] || 0) + 1;
    });
    const total = paidAppointments.length || 1;
    return Object.entries(map).map(([method, count]) => ({
      name: PAYMENT_LABELS[method] || method,
      value: count,
      pct: Math.round((count / total) * 100),
    }));
  }, [paidAppointments]);

  // Forecast
  const forecast = useMemo(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const totalDays = getDaysInMonth(now);
    if (dayOfMonth === 0) return 0;
    const currentMonthPaid = appointments.filter(a => {
      const d = parseISO(a.date);
      return a.status === 'realizado' && a.payment_status === 'pago' &&
        isWithinInterval(d, { start: startOfMonth(now), end: endOfDay(now) });
    });
    const currentRevenue = currentMonthPaid.reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
    return (currentRevenue / dayOfMonth) * totalDays;
  }, [appointments]);

  // Expense handlers
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

  const handleDeleteExpense = async (id: string) => {
    await expensesService.deleteExpense(id);
    await loadExpenses();
  };

  // Export
  const handleExport = (type: 'csv' | 'pdf' | 'excel') => {
    const rows = paidAppointments.map(a => ({
      Data: a.date,
      Pet: a.pets?.map(p => p.pet_name).join(', ') || '',
      Cliente: a.customer_name || '',
      Serviço: a.service_name,
      Valor: a.payment_amount || a.price || 0,
      Pagamento: PAYMENT_LABELS[a.payment_method || ''] || a.payment_method || '',
    }));

    if (type === 'csv') {
      const headers = Object.keys(rows[0] || {});
      const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r as any)[h]}"`).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financeiro-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (type === 'excel') {
      import('xlsx').then(XLSX => {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
        XLSX.writeFile(wb, `financeiro-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      });
    } else if (type === 'pdf') {
      import('jspdf').then(({ jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          const doc = new jsPDF();
          doc.setFontSize(16);
          doc.text('Relatorio Financeiro', 14, 20);
          doc.setFontSize(10);
          doc.text(`Periodo: ${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}`, 14, 28);
          doc.text(`Receita: ${fmt(metrics.revenue)} | Despesas: ${fmt(metrics.totalExpenses)} | Lucro: ${fmt(metrics.profit)}`, 14, 35);
          const headers = ['Data', 'Pet', 'Cliente', 'Servico', 'Valor', 'Pagamento'];
          const body = rows.map(r => [r.Data, r.Pet, r.Cliente, r.Serviço, fmt(r.Valor as number), r.Pagamento]);
          autoTable(doc, { head: [headers], body, startY: 42, styles: { fontSize: 8 } });
          doc.save(`financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        });
      });
    }
  };

  const chartConfigRev = { value: { label: 'Receita', color: 'hsl(150, 70%, 45%)' } };
  const chartConfigExp = { value: { label: 'Despesa', color: 'hsl(340, 70%, 55%)' } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* HEADER TITLE & PRO BADGE */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/10 hidden sm:flex">
            <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Financeiro</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão inteligente de receitas, despesas e fluxo de caixa</p>
          </div>
        </div>
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center shadow-none px-2 py-0.5 whitespace-nowrap">
          <Crown className="w-3 h-3 mr-1" /> PRO
        </Badge>
      </motion.div>

      {/* FILTER & ACTIONS ROW */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-2 rounded-2xl border border-border/40 shadow-sm">
        <div className="flex flex-wrap items-center gap-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {([
            { key: 'hoje', label: 'Hoje' },
            { key: 'semana', label: 'Esta semana' },
            { key: 'mes', label: 'Este mês' },
            { key: '30dias', label: 'Últimos 30 dias' },
            { key: 'custom', label: 'Personalizado' },
          ] as { key: PeriodKey; label: string }[]).map(p => (
            <Button
              key={p.key}
              variant={period === p.key ? 'default' : 'ghost'}
              size="sm"
              className={cn("text-xs rounded-xl font-medium transition-all", period === p.key ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700" : "hover:bg-muted")}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {period === 'custom' && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-xl border-border/50">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {customStart ? format(customStart, 'dd/MM/yyyy') : 'Início'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStart} onSelect={setCustomStart} locale={ptBR} className="p-3" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-xl border-border/50">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {customEnd ? format(customEnd, 'dd/MM/yyyy') : 'Fim'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} locale={ptBR} className="p-3" />
                </PopoverContent>
              </Popover>
            </div>
          )}
          {/* Export Dropdown / Buttons */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-background text-foreground rounded-xl shadow-sm gap-1.5 transition-all">
                <Download className="w-3.5 h-3.5" /> Exportar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1.5 rounded-xl shadow-lg border-border/50" align="end">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs rounded-lg mb-1" onClick={() => handleExport('pdf')}><FileText className="w-3.5 h-3.5 mr-2" /> PDF</Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs rounded-lg mb-1" onClick={() => handleExport('excel')}><FileText className="w-3.5 h-3.5 mr-2" /> Excel</Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs rounded-lg" onClick={() => handleExport('csv')}><FileText className="w-3.5 h-3.5 mr-2" /> CSV</Button>
            </PopoverContent>
          </Popover>

          <Dialog open={newExpenseOpen} onOpenChange={setNewExpenseOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-md gap-1.5 ml-2 transition-all">
                <Plus className="w-3.5 h-3.5" /> Adicionar Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Nova Despesa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Descrição</Label>
                  <Input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Conta de Luz" className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Valor (R$)</Label>
                  <Input type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="rounded-xl h-11 font-mono text-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Categoria</Label>
                  <Select value={newExpense.category} onValueChange={v => setNewExpense(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Data</Label>
                  <Input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))} className="rounded-xl h-11" />
                </div>
                <Button onClick={handleAddExpense} className="w-full rounded-xl h-11 font-semibold text-sm">Salvar Despesa</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPI BENTO GRID */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Plena */}
        <Card className="relative overflow-hidden border-emerald-500/20 shadow-sm transition-all hover:shadow-md bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Bruta</p>
                <h3 className="text-3xl font-bold text-foreground mt-1 tracking-tight">{fmt(metrics.revenue)}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            {vsLastPeriod.prevRevenue > 0 && period !== 'hoje' && (
              <div className="mt-4 flex items-center gap-1.5">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 border-none", vsLastPeriod.revPct >= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600")}>
                  {vsLastPeriod.revPct >= 0 ? '+' : ''}{vsLastPeriod.revPct}%
                </Badge>
                <span className="text-[11px] text-muted-foreground">vs. período anterior</span>
              </div>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        </Card>

        {/* Despesas */}
        <Card className="relative overflow-hidden border-red-500/20 shadow-sm transition-all hover:shadow-md bg-gradient-to-br from-red-500/5 to-transparent">
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Despesas</p>
                <h3 className="text-3xl font-bold text-red-600 mt-1 tracking-tight">{fmt(metrics.totalExpenses)}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
            </div>
            {vsLastPeriod.prevExpensesTotal > 0 && period !== 'hoje' && (
              <div className="mt-4 flex items-center gap-1.5">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 border-none", vsLastPeriod.expPct <= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600")}>
                  {vsLastPeriod.expPct > 0 ? '+' : ''}{vsLastPeriod.expPct}%
                </Badge>
                <span className="text-[11px] text-muted-foreground">vs. período anterior</span>
              </div>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        </Card>

        {/* Lucro */}
        <Card className={cn("relative overflow-hidden shadow-sm transition-all hover:shadow-md", metrics.profit >= 0 ? "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent" : "border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent")}>
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                <h3 className={cn("text-3xl font-bold mt-1 tracking-tight", metrics.profit >= 0 ? "text-primary dark:text-primary" : "text-red-600")}>{fmt(metrics.profit)}</h3>
              </div>
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", metrics.profit >= 0 ? "bg-primary/10" : "bg-red-500/10")}>
                <PiggyBank className={cn("w-5 h-5", metrics.profit >= 0 ? "text-primary" : "text-red-600")} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Margem: {metrics.revenue > 0 ? Math.round((metrics.profit / metrics.revenue) * 100) : 0}%</span>
            </div>
          </CardContent>
          <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none", metrics.profit >= 0 ? "bg-primary/10" : "bg-red-500/10")} />
        </Card>

        {/* Ticket Medio */}
        <Card className="relative overflow-hidden border-border/40 shadow-sm transition-all hover:shadow-md bg-gradient-to-br from-slate-500/5 to-transparent">
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <h3 className="text-3xl font-bold text-foreground mt-1 tracking-tight">{fmt(metrics.ticketMedio)}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-slate-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">{metrics.paidCount} atendimentos pagos</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CHARTS LAYER */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composite Area Chart */}
        <Card className="lg:col-span-2 border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/10 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Fluxo de Caixa (Receitas vs Despesas)
            </CardTitle>
            <CardDescription className="text-xs">Evolução financeira do período selecionado</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <ChartContainer config={chartConfigRev} className="h-[280px] w-full">
              <AreaChart data={compositeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(150, 70%, 45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(150, 70%, 45%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(340, 70%, 55%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(340, 70%, 55%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} className="fill-muted-foreground opacity-70" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtShort} tickLine={false} axisLine={false} className="fill-muted-foreground opacity-70" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v, name) => [fmt(v as number), name === 'receita' ? 'Receita' : 'Despesa']} />} />
                <Area type="monotone" dataKey="receita" stroke="hsl(150, 70%, 45%)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="despesa" stroke="hsl(340, 70%, 55%)" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Forecast & Top Services Side-Bento */}
        <div className="flex flex-col gap-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-sm relative overflow-hidden h-full min-h-[140px]">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Previsão do Mês</span>
              </div>
              <p className="text-3xl font-bold text-primary tracking-tight mt-1">{fmt(forecast)}</p>
              <p className="text-xs text-muted-foreground mt-2">estimativa final baseada no ritmo atual</p>
            </CardContent>
            <div className="absolute -bottom-8 -right-8 opacity-5">
              <TrendingUp className="w-40 h-40" />
            </div>
          </Card>

          <Card className="border-border/40 shadow-sm flex-1">
            <CardHeader className="pb-2 border-b border-border/10 bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" /> Top Serviços
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col justify-center gap-4">
              {revenueByService.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-4">Nenhum dado disponível.</p>
              ) : (
                revenueByService.map((service, index) => {
                  const maxVal = revenueByService[0].value;
                  const pct = Math.round((service.value / maxVal) * 100);
                  return (
                    <div key={service.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[120px]" title={service.name}>{service.name}</span>
                        <span className="font-bold text-emerald-600">{fmt(service.value)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* LOWER LAYER: Payment Methods & Transactions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Methods */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2 border-b border-border/10 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-500" /> Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6 flex flex-col items-center justify-center">
            {paymentMethods.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-8">Nenhum pagamento registrado.</p>
            ) : (
              <div className="w-full flex flex-col items-center">
                <ChartContainer config={{ value: { label: 'Pagamentos' } }} className="h-[200px] w-full max-w-[240px]">
                  <RPieChart>
                    <Pie data={paymentMethods} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} strokeWidth={0} paddingAngle={2}>
                      {paymentMethods.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent formatter={(val, name, props) => [`${props.payload.pct}% (${val})`, name]} />} />
                  </RPieChart>
                </ChartContainer>
                <div className="mt-4 w-full grid grid-cols-2 gap-x-2 gap-y-3 px-2">
                  {paymentMethods.map((pm, i) => (
                    <div key={pm.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs font-semibold text-foreground truncate max-w-[60px]">{pm.name}</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">{pm.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Tabs */}
        <Card className="lg:col-span-2 border-border/40 shadow-sm overflow-hidden flex flex-col">
          <Tabs defaultValue="receitas" className="flex flex-col h-full w-full">
            <CardHeader className="pb-0 border-b border-border/10 bg-muted/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> Extrato Financeiro
                </CardTitle>
                <TabsList className="h-9">
                  <TabsTrigger value="receitas" className="text-xs px-4">Entradas</TabsTrigger>
                  <TabsTrigger value="despesas" className="text-xs px-4">Saídas</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              
              <TabsContent value="receitas" className="m-0 border-0 h-full max-h-[380px] overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Data</TableHead>
                      <TableHead className="text-xs font-semibold">Servirço / Cliente</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidAppointments.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-10">Nenhuma entrada no período.</TableCell></TableRow>
                    ) : paidAppointments.slice(0, 50).map(a => (
                      <TableRow key={a.id} className="group hover:bg-emerald-500/5 transition-colors">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {a.date ? format(parseISO(a.date), "dd MMM", {locale: ptBR}) : ''}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-foreground">{a.service_name}</p>
                          <p className="text-xs text-muted-foreground">{a.customer_name || 'Cliente comum'} • {PAYMENT_LABELS[a.payment_method || ''] || '—'}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                            + {fmt(a.payment_amount || a.price || 0)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="despesas" className="m-0 border-0 h-full max-h-[380px] overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Data</TableHead>
                      <TableHead className="text-xs font-semibold">Descrição / Categoria</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-10">Nenhuma saída no período.</TableCell></TableRow>
                    ) : filteredExpenses.map(e => (
                      <TableRow key={e.id} className="group hover:bg-red-500/5 transition-colors">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(parseISO(e.date), "dd MMM", {locale: ptBR})}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-foreground">{e.description}</p>
                          <p className="text-xs text-muted-foreground">{e.category}</p>
                        </TableCell>
                        <TableCell className="text-right relative">
                          <div className="flex items-center justify-end gap-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-500/10 text-red-600 text-xs font-bold">
                              - {fmt(e.amount)}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1">
                              {/* Small delete button overlay instead of full column */}
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background border shadow-sm hover:border-red-500 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteExpense(e.id)}>
                                <TrendingDown className="w-3 h-3 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </motion.div>

    </motion.div>
  );
}
