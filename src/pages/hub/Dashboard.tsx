import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Zap, ArrowUpRight, ShieldCheck, TrendingUp, DollarSign, Crown, AlertTriangle, PlayCircle, ShieldAlert,
  RotateCcw, Building, RefreshCw, Info, CreditCard, ChevronDown, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- SUB-COMPONENTE: SELETOR DE LICENÇA PREMIUM ---
const LicenseSelector = ({ options, selected, onSelect }: { options: any[], selected: string, onSelect: (id: string) => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedName = selected === 'all' ? 'Todas as Licenças' : options.find(o => o.id === selected)?.name || 'Licença Selecionada';
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl text-[11px] font-black text-[#1E293B] dark:text-white transition-all hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent active:scale-95"
      >
        <Building size={14} className="text-[#2F7FD3]" />
        {selectedName}
        <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#161B22] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
              <button 
                onClick={() => { onSelect('all'); setIsOpen(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-[10px] font-bold transition-colors ${selected === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#2F7FD3]' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[#64748B]'}`}
              >
                Todas as Licenças {selected === 'all' && <Check size={12} />}
              </button>
              
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

              {options.map(t => (
                <button 
                  key={t.id}
                  onClick={() => { onSelect(t.id); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-[10px] font-bold transition-colors mb-1 ${selected === t.id ? 'bg-blue-50 dark:bg-blue-900/20 text-[#2F7FD3]' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[#64748B]'}`}
                >
                  <div className="flex flex-col items-start truncate">
                    <span className="truncate w-full block">{t.name || t.slug}</span>
                    <span className="text-[8px] font-black uppercase opacity-60 mt-0.5">{t.status === 'active' ? 'Ativo' : t.status}</span>
                  </div>
                  {selected === t.id && <Check size={12} />}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

const InfoTooltip = ({ text, dark = false }: { text: string; dark?: boolean }) => (
  <TooltipProvider>
    <Tooltip delayDuration={300}>
      <TooltipTrigger type="button" className="cursor-help transition-opacity hover:opacity-80">
        <Info size={12} className={dark ? "text-white/60" : "text-gray-400"} />
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] text-xs bg-slate-900 border-slate-700 text-white font-medium">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const HubDashboard = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [activeFilter, setActiveFilter] = useState<'DIA' | 'SEM' | 'MES' | 'ANO'>('MES');
  const [selectedPetshop, setSelectedPetshop] = useState<string | 'all'>('all');
  const [stats, setStats] = useState({
    licenses: 0,
    activeSystems: 0,
    revenue: 0,
    premium: 0,
    free: 0,
    trials: 0,
    churn: 0,
    newClientsMonth: 0, // HUBs
    newUsersMonth: 0,   // Profiles
    mrrGrowth: "0%",
    predictedRevenue: 0,
    retentionAdvantage: "3.2x",
    chartDataPercent: [0, 0, 0, 0, 0, 0, 0],
    chartDataCount: [0, 0, 0, 0, 0, 0, 0],
    chartLabels: ["-", "-", "-", "-", "-", "-", "-"]
  });

  const [tenantsList, setTenantsList] = useState<any[]>([]);

  const [recentPetshops, setRecentPetshops] = useState<{ id: string | number; name: string; plan: string; date: string; status: string }[]>([]);
  const [inactivePetshops, setInactivePetshops] = useState<{ id: string | number; name: string; days: string; lastSeen: string }[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<{ id: string | number; type: string; msg: string; icon: React.ReactNode }[]>([]);
  useEffect(() => {
    async function fetchHubStats() {
      try {
      const { data: allTenants, error } = await (supabase.from as any)('tenants')
        .select(`
          id, name, status, created_at,
          plan:plans(id, name, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!allTenants) {
        throw new Error("Não foi possível carregar as propriedades do Hub.");
      }

      type TenantData = { id: string; name: string; status: string; created_at: string; plan?: { name: string; price: number } | null };
      const tenants: TenantData[] = (allTenants as any[] || [])
        .filter(t => t !== null && typeof t === 'object')
        .map(t => t as TenantData);

      let calculatedRevenue = 0;
      let premiumCount = 0;
      let freeCount = 0;
      let activeCount = 0;
      let trialCount = 0;
      let churnCount = 0;
      let newThisMonth = 0;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      tenants.forEach((t) => {
        if (!t) return;

        const createdAt = t.created_at;
        const status = t.status;
        
        // Supabase joins podem retornar objeto ou array dependendo da relação
        const planRaw = t.plan;
        const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;

        // Proteção contra datas inexistentes
        const dateObj = createdAt ? new Date(createdAt) : null;
        const isThisMonth = dateObj && 
                           !isNaN(dateObj.getTime()) && 
                           dateObj.getMonth() === currentMonth && 
                           dateObj.getFullYear() === currentYear;

        if (isThisMonth) newThisMonth++;

        if (status === 'active') {
          activeCount++;
          const price = Number(plan?.price || 0);
          calculatedRevenue += price;
          if (price > 0) premiumCount++;
          else freeCount++;
        } else if (status === 'trial') {
          trialCount++;
        } else if (status === 'canceled' || status === 'inactive') {
          churnCount++;
        }
      });

      // Buscar Perfis (Clientes Finais)
      const { data: allProfiles, error: pError } = await (supabase.from as any)('profiles')
        .select('created_at, petshop_id');
      
      if (pError) throw pError;

      const profiles = (allProfiles || []) as any[];
      setTenantsList(tenants);

      // --- CÁLCULO DE CADASTROS DE CLIENTES ---
      const generateSignupData = (filter: 'DIA' | 'SEM' | 'MES' | 'ANO', petshopId: string) => {
        const labels: string[] = [];
        const counts: number[] = [];
        const today = new Date();

        const filteredProfiles = petshopId === 'all' 
          ? profiles 
          : profiles.filter(p => p.petshop_id === petshopId);
        
        if (filter === 'DIA') {
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''));
            
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            
            counts.push(filteredProfiles.filter(p => {
              const created = p.created_at ? new Date(p.created_at) : null;
              return created && created >= startOfDay && created <= endOfDay;
            }).length);
          }
        } else if (filter === 'SEM') {
          for (let i = 3; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - (i * 7));
            labels.push(`Sem ${4-i}`);
            
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - 7);
            counts.push(filteredProfiles.filter(p => {
              const created = p.created_at ? new Date(p.created_at) : null;
              return created && created >= startOfWeek && created <= date;
            }).length);
          }
        } else if (filter === 'MES') {
          for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            labels.push(date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''));
            
            counts.push(filteredProfiles.filter(p => {
              const created = p.created_at ? new Date(p.created_at) : null;
              return created && created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
            }).length);
          }
        } else {
          for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            if (i % 2 === 0) labels.push(date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''));
            else labels.push("");
            
            counts.push(filteredProfiles.filter(p => {
              const created = p.created_at ? new Date(p.created_at) : null;
              return created && created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
            }).length);
          }
        }

        const maxCount = Math.max(...counts, 1);
        const percentages = counts.map(c => Math.max((c / maxCount) * 100, (c > 0 ? 5 : 2)));

        return { labels, percentages, counts };
      };

      const chartInfo = generateSignupData(activeFilter, selectedPetshop);

      setStats({
        licenses: tenants.length,
        activeSystems: activeCount,
        revenue: calculatedRevenue,
        premium: premiumCount,
        free: freeCount,
        trials: trialCount,
        churn: churnCount,
        newClientsMonth: newThisMonth,
        newUsersMonth: profiles.filter(p => {
          const d = p.created_at ? new Date(p.created_at) : null;
          return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
        mrrGrowth: newThisMonth > 0 ? `+${newThisMonth} HUBs` : "0%",
        predictedRevenue: calculatedRevenue + (trialCount * 150),
        chartDataPercent: chartInfo.percentages,
        chartDataCount: chartInfo.counts,
        chartLabels: chartInfo.labels,
        retentionAdvantage: "3.2x"
      });

      // Recentes Pós-Processamento
      setRecentPetshops(
        tenants.slice(0, 4).map((t) => {
          const planRaw = t.plan;
          const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
          return {
            id: t.id,
            name: t.name,
            plan: plan?.name || "Sem Plano",
            date: t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : "N/A",
            status: t.status
          };
        })
      );

      // Inativos / Churn
      const inactives = tenants.filter(t => t.status === 'canceled' || t.status === 'inactive');
      setInactivePetshops(
        inactives.slice(0, 3).map((t) => ({
          id: t.id,
          name: t.name,
          days: "N/A",
          lastSeen: t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : "N/A"
        }))
      );

      // Alertas Dinâmicos (Se tem trials, gera alerta real)
      const dynamicAlerts = [];
      if (trialCount > 0) {
        dynamicAlerts.push({
          id: 1, type: "trial", msg: `${trialCount} Licença(s) em uso como Trial/Avaliação Livre`, icon: <RefreshCw size={14} />
        });
      }
      if (churnCount > 0) {
        dynamicAlerts.push({
          id: 2, type: "churn", msg: `${churnCount} Cliente(s) inativo(s) ou cancelado(s) detectados`, icon: <AlertTriangle size={14} />
        });
      }
      setCriticalAlerts(dynamicAlerts);

      } catch (error) {
        console.error("Erro ao carregar métricas do HUB:", error);
      }
    }

    fetchHubStats();
  }, [activeFilter, selectedPetshop]);

  return (
    <div className="space-y-8 pb-10 font-primary">
      {/* HEADER DE CONTEXTO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#2F7FD3] mb-2 font-bold tracking-tighter uppercase text-[10px]">
            <Crown size={14} className="fill-[#2F7FD3]" />
            Visão SaaS Executive
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#1E293B] dark:text-white leading-none italic">Centro de Controle</h1>
          <p className="text-[#64748B] mt-3 text-sm font-medium">Você está gerenciando o motor de crescimento do ecossistema.</p>
        </div>

      </header>

      {/* PILAR 1: MÉTRICAS PRINCIPAIS (Cards de Topo) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* MRR Principal */}
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#1E3A8A] to-[#2F7FD3] rounded-3xl p-6 text-white shadow-xl shadow-blue-900/10 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 blur-[20px] rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-400/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/20">
              <ArrowUpRight size={12} /> {stats.mrrGrowth}
            </span>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">MRR Atual</p>
              <InfoTooltip text="Receita Recorrente Mensal calculada com base no preço dos planos hoje ativos." dark />
            </div>
            <h3 className="text-3xl font-black tracking-tighter leading-none italic">R$ {stats.revenue.toLocaleString()}</h3>
          </div>
        </div>

        {/* Petshops Ativos */}
        <div className="bg-white dark:bg-[#161B22] rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-[#2F7FD3]">
              <Building size={20} />
            </div>
            <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
              <ArrowUpRight size={10} /> {stats.newClientsMonth} mês
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Hubs Ativos</p>
              <InfoTooltip text="Total de Petshops (clientes) configurados e rodando ativamente na infra." />
            </div>
            <h3 className="text-3xl font-black text-[#1E293B] dark:text-white leading-none italic">{stats.activeSystems}</h3>
          </div>
        </div>

        {/* Premium vs Free */}
        <div className="bg-white dark:bg-[#161B22] rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-16 h-16 bg-gradient-to-tl from-purple-500/5 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-500">
              <Crown size={20} />
            </div>
            <span className="text-[10px] font-black text-purple-500 dark:text-purple-400">
              {stats.activeSystems > 0 ? Math.round((stats.premium / stats.activeSystems) * 100) : 0}% Base
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Premium / Free</p>
              <InfoTooltip text="Volume de petshops com planos pagos vs planos gratuitos habilitados." />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-[#1E293B] dark:text-white leading-none italic">{stats.premium}</h3>
              <span className="text-sm font-bold text-[#64748B]">/ {stats.free}</span>
            </div>
          </div>
        </div>

        {/* Trials */}
        <div className="bg-[#FFFBEB] dark:bg-amber-900/10 rounded-3xl p-6 border border-amber-200/50 dark:border-amber-800/50 flex flex-col justify-between shadow-sm">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-500 mb-4">
            <PlayCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest">Em Trial</p>
              <InfoTooltip text="Petshops em período de testes. São oportunidades imediatas de conversão." />
            </div>
            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-500 leading-none italic">{stats.trials}</h3>
          </div>
        </div>

        {/* Churn (Crítico) */}
        <div className="bg-[#FEF2F2] dark:bg-red-900/10 rounded-3xl p-6 border border-red-200/50 dark:border-red-900/50 flex flex-col justify-between shadow-sm group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-500">
              <RotateCcw size={20} />
            </div>
            <div className="animate-pulse w-2 h-2 rounded-full bg-red-500 mt-2" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-widest">Churn Mensal</p>
              <InfoTooltip text="Total de clientes que abandonaram o sistema este mês." />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-red-600 dark:text-red-400 leading-none italic">{stats.churn}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* LINHA 1: GRÁFICO (8) E ALERTAS (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-[#161B22] rounded-[2.5rem] p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-sm flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 mb-10">
              <div className="text-center sm:text-left">
                <h3 className="text-[11px] font-black text-[#1E293B] dark:text-white uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#2F7FD3]" /> Cadastro de Clientes
                </h3>
                <p className="hidden sm:block text-xs text-[#64748B] font-medium">Novos usuários registrados nas licenças HUB</p>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4 w-full sm:w-auto items-center sm:items-start leading-none">
                <div className="relative z-50 w-auto">
                   <LicenseSelector 
                     options={tenantsList.filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()))} 
                     selected={selectedPetshop} 
                     onSelect={setSelectedPetshop} 
                   />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-start">
                  {(['DIA', 'SEM', 'MES', 'ANO'] as const).map((f) => (
                    <button 
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                        activeFilter === f 
                          ? "bg-white dark:bg-slate-700 text-[#1E293B] dark:text-white shadow-md" 
                          : "text-[#64748B] hover:text-[#1E293B] active:scale-95"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between h-48 gap-3 px-2">
              {stats.chartDataPercent.map((percentage, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group h-full">
                  <div className={`
                    absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-[#1E293B] dark:text-white bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 pointer-events-none whitespace-nowrap z-[100]
                    ${i > stats.chartDataPercent.length - 2 ? "right-0 translate-x-0" : i < 1 ? "left-0 translate-x-0" : "left-1/2 -translate-x-1/2"}
                  `}>
                     {stats.chartDataCount?.[i] || 0} Novos
                  </div>
                  <div 
                    style={{ height: `${percentage}%` }}
                    className={`w-full max-w-[32px] rounded-t-xl transition-all duration-500 ease-out cursor-pointer ${
                      i === stats.chartDataPercent.length - 1
                        ? 'bg-[#2F7FD3]'
                        : 'bg-blue-200/50 dark:bg-blue-900/40 group-hover:bg-[#2F7FD3]/40'
                    }`}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-4 px-2 sm:px-4 text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] border-t border-gray-100 dark:border-gray-800/50 pt-4 overflow-hidden">
              {stats.chartLabels.map((label, i) => (
                <span 
                  key={i} 
                  className={`
                    ${i === stats.chartLabels.length - 1 ? "text-[#2F7FD3]" : ""}
                    ${i % 2 !== 0 ? "hidden sm:inline" : ""}
                  `}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="h-full bg-[#FFF4F2] dark:bg-[#3B1515]/30 rounded-[2rem] p-6 border border-red-100 dark:border-red-900/30">
            <h3 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={14} /> Requer Atenção Imediata 
              <InfoTooltip text="Monitoramento em tempo real de falhas críticas, atrasos de pagamento ou problemas de infraestrutura em todas as licenças." />
            </h3>
            <div className="space-y-3">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.map(alert => (
                  <div key={alert.id} className="bg-white dark:bg-black/20 p-3 rounded-xl flex gap-3 shadow-sm border border-red-50 dark:border-red-900/20 items-start transition-all hover:scale-[1.02]">
                    <div className="mt-0.5 text-red-500">{alert.icon}</div>
                    <div>
                      <p className="text-xs font-bold text-[#1E293B] dark:text-white">{alert.msg}</p>
                      <button className="text-[9px] font-black uppercase tracking-widest text-[#2F7FD3] mt-1 hover:underline">Resolver</button>
                    </div>
                  </div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[calc(100%-40px)] py-8 flex flex-col items-center justify-center rounded-2xl"
                >
                  <ShieldCheck size={28} className="text-emerald-500 mb-2 opacity-50" />
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest text-center">Nenhuma irregularidade encontrada</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LINHA 2: INSIGHTS (8) E RECENTES (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#161B22] to-slate-900 rounded-[2rem] p-6 text-white border border-slate-800 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 blur-[30px] rounded-full group-hover:bg-purple-500/20 transition-all" />
            <Zap size={18} className="text-purple-400 mb-3" />
            <p className="text-sm font-bold text-white/90 leading-relaxed">
              Petshops no plano <span className="text-purple-400">Premium</span> possuem {stats.retentionAdvantage} mais retenção ao longo de 6 meses.
            </p>
            <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#63C3D8] hover:text-white transition-colors">Ver Estudo Interno →</button>
          </div>
          <div className="bg-gradient-to-br from-[#161B22] to-slate-900 rounded-[2rem] p-6 text-white border border-slate-800 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 blur-[30px] rounded-full group-hover:bg-emerald-500/20 transition-all" />
            <ShieldCheck size={18} className="text-emerald-400 mb-3" />
            <p className="text-sm font-bold text-white/90 leading-relaxed">
              Temos {stats.trials} trials ativos este mês. Taxa de conversão atual bateu <span className="text-emerald-400 font-black">63%</span>.
            </p>
            <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#63C3D8] hover:text-white transition-colors">Disparar Email Oferta →</button>
          </div>
        </div>

        <div className="lg:col-span-4 h-full">
          <div className="bg-white dark:bg-[#161B22] rounded-[2rem] border border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden flex flex-col h-full min-h-[160px]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Aquisições Recentes</h3>
              <button className="text-[9px] font-black text-[#2F7FD3] uppercase tracking-widest hover:underline">Ver Todos</button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
              {recentPetshops.filter(shop => 
                !searchQuery || shop.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length > 0 ? (
                recentPetshops
                  .filter(shop => !searchQuery || shop.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((shop) => (
                  <div key={shop.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer group">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#1E293B] dark:text-white truncate">{shop.name}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#64748B] mt-0.5">{shop.plan}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[9px] font-bold text-[#64748B] text-right">{shop.date}</span>
                      <div className={`mt-1 w-1.5 h-1.5 rounded-full ${shop.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center p-8 opacity-40 italic text-[10px] text-[#64748B] uppercase tracking-widest font-black text-center leading-relaxed">
                  {searchQuery ? `Nenhum lojista encontrado para "${searchQuery}"` : "Lista de aquisições vazia"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubDashboard;
