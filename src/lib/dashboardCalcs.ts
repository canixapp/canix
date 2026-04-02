import { AppointmentRow } from '@/services/appointmentsService';
import { ExpenseRow } from '@/services/expensesService';
import { PaymentMethod } from '@/lib/constants';
import { startOfDay, subDays, startOfMonth, endOfMonth, parseISO, format, eachDayOfInterval, eachHourOfInterval, startOfHour } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type PeriodFilter = 'hoje' | '7dias' | 'mes' | string;

export interface DashboardAppointmentSummary {
  id: string;
  date: string;
  time: string;
  clientName: string;
  petName: string;
  service: string;
  status: string;
  price: number;
  paymentStatus: string;
  paymentMethod?: string;
  paymentAmount?: number;
  completedAt?: string;
}

export interface DashboardCalculatedMetrics {
  revenueTotal: number;
  totalReceived: number;
  pendingPaymentsCount: number;
  pendingPaymentsValue: number;
  totalAtendimentos: number;
  agendamentosPendentes: number;
  cancelamentos: number;
  taxaConfirmacao: number;
  ticketMedio: number;
  bestDay: { date: string; value: number } | null;
  topService: { name: string; count: number } | null;
  topClient: { name: string; count: number } | null;
  paymentMethods: { method: PaymentMethod; value: number; count: number; pct: number }[];
  mostUsedMethod: { method: PaymentMethod; value: number; count: number; pct: number };
  chartData: { date: string; revenue: number; expense: number }[];
  recentCompleted: DashboardAppointmentSummary[];
  // New metrics
  totalExpenses: number;
  profit: number;
}

function toSummary(a: AppointmentRow): DashboardAppointmentSummary {
  return {
    id: a.id,
    date: a.date,
    time: a.time,
    clientName: a.customer_name || '',
    petName: a.pets?.map(p => p.pet_name).join(', ') || '',
    service: a.service_name,
    status: a.status,
    price: a.price || 0,
    paymentStatus: a.payment_status || 'nao_cobrado',
    paymentMethod: a.payment_method || undefined,
    paymentAmount: a.payment_amount || undefined,
    completedAt: a.completed_at || undefined,
  };
}

export function getPeriodRange(period: PeriodFilter): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = startOfDay(now);

  if (period === 'hoje') return { start: todayStart, end: now };
  if (period === '7dias') return { start: subDays(todayStart, 6), end: now };
  if (period === 'mes') return { start: startOfMonth(now), end: now };
  if (period.match(/^\d{4}-\d{2}$/)) {
    const ms = startOfMonth(parseISO(period + '-01'));
    return { start: ms, end: endOfMonth(ms) };
  }
  return { start: subDays(todayStart, 30), end: now };
}

export function filterAppointmentsByPeriod(appointments: AppointmentRow[], period: PeriodFilter): AppointmentRow[] {
  const { start, end } = getPeriodRange(period);

  return appointments.filter(apt => {
    const dateStr = apt.completed_at || apt.date;
    if (!dateStr) return false;
    const d = parseISO(dateStr);
    return d >= start && d <= end;
  });
}

export function filterExpensesByPeriod(expenses: ExpenseRow[], period: PeriodFilter): ExpenseRow[] {
  const { start, end } = getPeriodRange(period);

  return expenses.filter(exp => {
    const d = parseISO(exp.date);
    return d >= start && d <= end;
  });
}

export function calculateMetrics(
  appointments: AppointmentRow[],
  period: PeriodFilter,
  expenses: ExpenseRow[] = []
): DashboardCalculatedMetrics {
  const now = new Date();
  const todayStart = startOfDay(now);
  const completed = appointments.filter(a => a.status === 'realizado');
  const inPeriod = filterAppointmentsByPeriod(completed, period);
  const allInPeriod = filterAppointmentsByPeriod(appointments, period);
  const paid = inPeriod.filter(a => a.payment_status === 'pago');
  const pendingPay = inPeriod.filter(a => a.payment_status === 'pendente');

  const revenueTotal = inPeriod.reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
  const totalReceived = paid.reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
  const pendingPaymentsValue = pendingPay.reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
  const totalAtendimentos = inPeriod.length;

  const agendamentosPendentes = allInPeriod.filter(a => a.status === 'pendente').length;
  const cancelamentos = allInPeriod.filter(a => a.status === 'cancelado').length;
  const confirmedOrDone = allInPeriod.filter(a => ['confirmado', 'realizado'].includes(a.status)).length;
  const taxaConfirmacao = (confirmedOrDone + cancelamentos) > 0 ? Math.round((confirmedOrDone / (confirmedOrDone + cancelamentos)) * 100) : 0;

  const ticketMedio = paid.length > 0 ? totalReceived / paid.length : 0;

  // Expenses
  const expensesInPeriod = filterExpensesByPeriod(expenses, period);
  const totalExpenses = expensesInPeriod.reduce((s, e) => s + e.amount, 0);
  const profit = totalReceived - totalExpenses;

  const serviceCount: Record<string, number> = {};
  inPeriod.forEach(a => { serviceCount[a.service_name] = (serviceCount[a.service_name] || 0) + 1; });
  const topServiceEntry = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];

  const clientCount: Record<string, number> = {};
  inPeriod.forEach(a => { const name = a.customer_name || a.customer_id; clientCount[name] = (clientCount[name] || 0) + 1; });
  const topClientEntry = Object.entries(clientCount).sort((a, b) => b[1] - a[1])[0];

  const byMethod: Record<string, number> = { pix: 0, cartao: 0, dinheiro: 0, outro: 0 };
  const byMethodCount: Record<string, number> = { pix: 0, cartao: 0, dinheiro: 0, outro: 0 };
  paid.forEach(a => {
    const m = a.payment_method || 'outro';
    byMethod[m] = (byMethod[m] || 0) + (a.payment_amount || a.price || 0);
    byMethodCount[m] = (byMethodCount[m] || 0) + 1;
  });
  const methodTotal = Object.values(byMethod).reduce((s, v) => s + v, 0);
  const methods: PaymentMethod[] = ['pix', 'cartao', 'dinheiro', 'outro'];
  const paymentMethods = methods.map(m => ({
    method: m,
    value: byMethod[m] || 0,
    count: byMethodCount[m] || 0,
    pct: methodTotal > 0 ? Math.round(((byMethod[m] || 0) / methodTotal) * 100) : 0,
  }));
  const mostUsedMethod = paymentMethods.reduce((best, m) => m.value > best.value ? m : best, paymentMethods[0]);

  // Adaptive chart data based on period
  const chartData = buildChartData(completed, period, expensesInPeriod);

  const recentCompleted = [...inPeriod]
    .sort((a, b) => (b.completed_at || b.date).localeCompare(a.completed_at || a.date))
    .slice(0, 10)
    .map(toSummary);

  const dayRevMap: Record<string, number> = {};
  paid.forEach(a => {
    const key = (a.completed_at || a.date).split('T')[0];
    if (key) dayRevMap[key] = (dayRevMap[key] || 0) + (a.payment_amount || a.price || 0);
  });
  const bestDayEntry = Object.entries(dayRevMap).sort((a, b) => b[1] - a[1])[0];
  const bestDay = bestDayEntry
    ? { date: format(parseISO(bestDayEntry[0]), 'dd/MM', { locale: ptBR }), value: bestDayEntry[1] }
    : null;

  return {
    revenueTotal, totalReceived, pendingPaymentsCount: pendingPay.length, pendingPaymentsValue,
    totalAtendimentos, agendamentosPendentes, cancelamentos, taxaConfirmacao, ticketMedio, bestDay,
    topService: topServiceEntry ? { name: topServiceEntry[0], count: topServiceEntry[1] } : null,
    topClient: topClientEntry ? { name: topClientEntry[0], count: topClientEntry[1] } : null,
    paymentMethods, mostUsedMethod, chartData, recentCompleted,
    totalExpenses, profit,
  };
}

function buildChartData(completed: AppointmentRow[], period: PeriodFilter, expenses: ExpenseRow[] = []): { date: string; revenue: number; expense: number }[] {
  const now = new Date();
  const todayStart = startOfDay(now);
  const paid = completed.filter(a => a.payment_status === 'pago');

  const expenseForRange = (start: Date, end: Date) =>
    expenses.filter(e => { const d = parseISO(e.date); return d >= start && d <= end; })
      .reduce((s, e) => s + e.amount, 0);

  if (period === 'hoje') {
    return Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(todayStart); hourStart.setHours(hour);
      const hourEnd = new Date(todayStart); hourEnd.setHours(hour, 59, 59, 999);
      const revenue = paid.filter(a => {
        const d = a.completed_at ? parseISO(a.completed_at) : null;
        return d && d >= hourStart && d <= hourEnd;
      }).reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
      return { date: `${String(hour).padStart(2, '0')}h`, revenue, expense: expenseForRange(hourStart, hourEnd) };
    }).filter((_, i) => i >= 7 && i <= 20);
  }

  if (period === '7dias') {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(todayStart, 6 - i);
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
      const dayRevenue = paid
        .filter(a => { const d = a.completed_at ? parseISO(a.completed_at) : null; return d && d >= day && d <= dayEnd; })
        .reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
      return { date: format(day, 'dd/MM'), revenue: dayRevenue, expense: expenseForRange(day, dayEnd) };
    });
  }

  const { start, end } = getPeriodRange(period);
  const days = eachDayOfInterval({ start, end: end > now ? now : end });
  return days.map(day => {
    const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
    const dayRevenue = paid
      .filter(a => { const d = a.completed_at ? parseISO(a.completed_at) : null; return d && d >= day && d <= dayEnd; })
      .reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
    return { date: format(day, 'dd'), revenue: dayRevenue, expense: expenseForRange(day, dayEnd) };
  });
}

export function getAvailableMonths(appointments: AppointmentRow[]): string[] {
  const months = new Set<string>();
  appointments.forEach(a => {
    const d = a.completed_at || a.date;
    if (d) months.add(d.substring(0, 7));
  });
  return Array.from(months).sort().reverse();
}

export function getPeriodLabel(period: PeriodFilter): string {
  if (period === 'hoje') return 'Hoje';
  if (period === '7dias') return 'Últimos 7 dias';
  if (period === 'mes') return 'Mês atual';
  if (period.match(/^\d{4}-\d{2}$/)) {
    return format(parseISO(period + '-01'), "MMMM 'de' yyyy", { locale: ptBR });
  }
  return period;
}

export const fmtCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
