import { useState, useEffect, useMemo } from 'react';
import { ProCard } from '@/components/admin/ProGate';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign, TrendingDown, Package, AlertTriangle,
  BarChart3, FileText, Crown, Wallet, ShoppingBag, Bell,
  Download, ArrowUpRight, ArrowDownRight, Megaphone, MessageCircle,
} from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import * as expensesService from '@/services/expensesService';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* ══════════════════════════════════════
   FINANCEIRO PRO
   ══════════════════════════════════════ */
export function FinanceiroPro() {
  const { appointments } = useAdmin();
  const [expenses, setExpenses] = useState<expensesService.ExpenseRow[]>([]);

  useEffect(() => { expensesService.getExpenses().then(setExpenses); }, []);

  const metrics = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'realizado' && a.payment_status === 'pago');
    const revenue = completed.reduce((s, a) => s + (a.payment_amount || a.price || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const profit = revenue - totalExpenses;
    const ticketMedio = completed.length > 0 ? revenue / completed.length : 0;
    return { revenue, totalExpenses, profit, ticketMedio, completedCount: completed.length };
  }, [appointments, expenses]);

  return (
    <ProCard>
      <div id="pro-financeiro" className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Financeiro</h3>
            <p className="text-xs text-muted-foreground">Receitas, despesas e lucro</p>
          </div>
          <Badge className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Crown className="w-3 h-3 mr-1" /> PRO
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Receita', value: fmt(metrics.revenue), icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-500/5 border-emerald-500/20' },
            { label: 'Despesas', value: fmt(metrics.totalExpenses), icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-500/5 border-red-500/20' },
            { label: 'Lucro', value: fmt(metrics.profit), icon: Wallet, color: metrics.profit >= 0 ? 'text-emerald-500' : 'text-red-500', bg: metrics.profit >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20' },
            { label: 'Ticket Médio', value: fmt(metrics.ticketMedio), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
          ].map(s => (
            <Card key={s.label} className={`${s.bg}`}>
              <CardContent className="p-4 text-center">
                <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProCard>
  );
}

/* ══════════════════════════════════════
   ESTOQUE PRO
   ══════════════════════════════════════ */
export function EstoquePro() {
  return (
    <ProCard>
      <div id="pro-estoque" className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10">
            <ShoppingBag className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Estoque</h3>
            <p className="text-xs text-muted-foreground">Controle de produtos e insumos</p>
          </div>
          <Badge className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Crown className="w-3 h-3 mr-1" /> PRO
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Produtos', value: '0', icon: Package, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: 'Estoque baixo', value: '0', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map(s => (
            <Card key={s.label} className="border-border/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center py-2">
          Cadastre e controle produtos, insumos, quantidades e fornecedores.
        </p>
      </div>
    </ProCard>
  );
}

/* ══════════════════════════════════════
   RELATÓRIOS PRO
   ══════════════════════════════════════ */
export function RelatoriosPro() {
  const { appointments } = useAdmin();

  const stats = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'realizado');
    const serviceCounts: Record<string, number> = {};
    completed.forEach(a => {
      serviceCounts[a.service_name] = (serviceCounts[a.service_name] || 0) + 1;
    });
    const topServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total: completed.length, topServices };
  }, [appointments]);

  return (
    <ProCard>
      <div id="pro-relatorios" className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10">
            <BarChart3 className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Relatórios Avançados</h3>
            <p className="text-xs text-muted-foreground">Análises detalhadas do negócio</p>
          </div>
          <Badge className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Crown className="w-3 h-3 mr-1" /> PRO
          </Badge>
        </div>

        {stats.topServices.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Serviços mais realizados</p>
            {stats.topServices.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30">
                <span className="text-sm text-foreground font-medium truncate">{name}</span>
                <Badge variant="outline" className="text-[10px]">{count}x</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 opacity-60" disabled>
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 opacity-60" disabled>
            <FileText className="w-3.5 h-3.5" /> CSV
          </Button>
        </div>
      </div>
    </ProCard>
  );
}

/* ══════════════════════════════════════
   LEMBRETES PRO
   ══════════════════════════════════════ */
export function LembretesPro() {
  const { appointments } = useAdmin();

  const reminders = useMemo(() => {
    const now = new Date();
    const completed = appointments
      .filter(a => a.status === 'realizado')
      .sort((a, b) => b.date.localeCompare(a.date));

    const petLastService = new Map<string, { date: string; petName: string; service: string }>();
    completed.forEach(a => {
      a.pets?.forEach(p => {
        if (!petLastService.has(p.pet_id)) {
          petLastService.set(p.pet_id, { date: a.date, petName: p.pet_name, service: a.service_name });
        }
      });
    });

    return Array.from(petLastService.entries())
      .map(([id, info]) => {
        const days = differenceInDays(now, parseISO(info.date));
        return { ...info, petId: id, daysSince: days };
      })
      .filter(r => r.daysSince >= 25)
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 5);
  }, [appointments]);

  return (
    <ProCard>
      <div id="pro-lembretes" className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Lembretes Inteligentes</h3>
            <p className="text-xs text-muted-foreground">Pets que podem precisar de atendimento</p>
          </div>
          <Badge className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Crown className="w-3 h-3 mr-1" /> PRO
          </Badge>
        </div>

        {reminders.length > 0 ? (
          <div className="space-y-2">
            {reminders.map(r => (
              <div key={r.petId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {r.petName} pode precisar de {r.service.toLowerCase()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Último atendimento há {r.daysSince} dias
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum lembrete ativo no momento.
          </p>
        )}
      </div>
    </ProCard>
  );
}

/* ══════════════════════════════════════
   MARKETING PRO
   ══════════════════════════════════════ */
export function MarketingPro() {
  const { appointments } = useAdmin();

  const inactiveCount = useMemo(() => {
    const now = new Date();
    const completed = appointments.filter(a => a.status === 'realizado');
    const customerLast = new Map<string, string>();
    completed.forEach(a => {
      const prev = customerLast.get(a.customer_id);
      if (!prev || a.date > prev) customerLast.set(a.customer_id, a.date);
    });
    let count = 0;
    customerLast.forEach(date => {
      if (differenceInDays(now, parseISO(date)) >= 45) count++;
    });
    return count;
  }, [appointments]);

  return (
    <ProCard>
      <div id="pro-marketing" className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10">
            <Megaphone className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Marketing</h3>
            <p className="text-xs text-muted-foreground">Reativação e engajamento de clientes</p>
          </div>
          <Badge className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Crown className="w-3 h-3 mr-1" /> PRO
          </Badge>
        </div>

        <Card className="border-border/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/10">
              <MessageCircle className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-foreground">{inactiveCount}</p>
              <p className="text-[10px] text-muted-foreground">Clientes para reativar (45+ dias)</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center py-2">
          Envie mensagens promocionais e lembretes para clientes selecionados via WhatsApp.
        </p>
      </div>
    </ProCard>
  );
}
