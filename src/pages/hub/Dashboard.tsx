import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, CreditCard, Activity, Zap, ArrowUpRight, ShieldCheck, Key, 
  TrendingUp, AlertCircle, Clock, CheckCircle2,
  DollarSign, ArrowDownRight, Crown, AlertTriangle, PlayCircle, BarChart3, ShieldAlert,
  Calendar, RotateCcw, Building, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const HubDashboard = () => {
  const [stats, setStats] = useState({
    licenses: 0,
    activeSystems: 0,
    revenue: 0,
    premium: 0,
    free: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHubStats();
  }, []);

  async function fetchHubStats() {
    try {
      const { count: tenantCount } = await (supabase.from as any)('tenants')
        .select('*', { count: 'exact', head: true });
      
      const { data: activeTenants } = await (supabase.from as any)('tenants')
        .select('plan_id, status')
        .eq('status', 'active');

      const { data: plans } = await (supabase.from as any)('plans').select('id, price');

      let calculatedRevenue = 0;
      let premiumCount = 0;
      let freeCount = 0;

      if (activeTenants && plans) {
        activeTenants.forEach((tenant: any) => {
          const plan = plans.find((p: any) => p.id === tenant.plan_id);
          if (plan) {
             const price = Number(plan.price);
             calculatedRevenue += price;
             if (price > 0) premiumCount++;
             else freeCount++;
          }
        });
      }

      setStats({
        licenses: tenantCount || 0,
        activeSystems: activeTenants?.length || 0,
        revenue: calculatedRevenue,
        premium: premiumCount,
        free: freeCount
      });

    } catch (error) {
      console.error("Erro ao carregar métricas do HUB:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- MOCK DATA PARA MVP/VISUALIZAÇÃO ---
  const mockData = {
    mrrGrowth: "+12.4%",
    newClientsMonth: "+8",
    trials: 6,
    churn: 2,
    predictedRevenue: stats.revenue + 450,
    lostRevenue: 150,
    chartDataRev: [60, 65, 75, 70, 85, 95, 100], // 7 months history
    retentionAdvantage: "3.2x"
  };

  const criticalAlerts = [
    { id: 1, type: "trial", msg: "3 Licenças em risco (Trial expirando amanhã)", icon: <RefreshCw size={14} /> },
    { id: 2, type: "payment", msg: "2 Pagamentos pendentes (R$ 598,00)", icon: <AlertTriangle size={14} /> },
  ];

  const recentPetshops = [
    { id: 1, name: "PetCão Matriz", plan: "Premium Flex", date: "Hoje, 09:41", status: "active" },
    { id: 2, name: "VetLife Express", plan: "Free Trial", date: "Ontem, 15:20", status: "trial" },
    { id: 3, name: "Boutique Animal", plan: "Premium Plus", date: "02 Abr, 11:10", status: "active" }
  ];

  const inactivePetshops = [
    { id: 4, name: "Dogão Shop", days: "22", lastSeen: "12 Mar" },
    { id: 5, name: "Gatos & Cia", days: "18", lastSeen: "16 Mar" }
  ];

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
        
        {/* AÇÕES RÁPIDAS NO TOPO (Pilar 6) */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#161B22] p-2 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#2F7FD3]/10 hover:bg-[#2F7FD3]/20 text-[#2F7FD3] font-bold rounded-xl transition-colors text-[11px] uppercase tracking-wider">
            <Users size={14} /> Trials
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl transition-colors text-[11px] uppercase tracking-wider">
            <DollarSign size={14} /> Recebíveis
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-[#1E293B] dark:text-gray-300 font-bold rounded-xl transition-colors text-[11px] uppercase tracking-wider">
            <BarChart3 size={14} /> Relatórios
          </button>
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
               <ArrowUpRight size={12} /> {mockData.mrrGrowth}
             </span>
          </div>
          <div className="relative z-10">
             <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">MRR Atual</p>
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
               <ArrowUpRight size={10} /> {mockData.newClientsMonth} mês
             </span>
           </div>
           <div>
             <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Hubs Ativos</p>
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
             <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Premium / Free</p>
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
             <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest mb-1">Em Trial</p>
             <h3 className="text-3xl font-black text-amber-600 dark:text-amber-500 leading-none italic">{mockData.trials}</h3>
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
             <p className="text-[10px] font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-widest mb-1">Churn Mensal</p>
             <div className="flex items-baseline gap-2">
               <h3 className="text-3xl font-black text-red-600 dark:text-red-400 leading-none italic">{mockData.churn}</h3>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* LADO ESQUERDO: Gráficos & Insights */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* PILAR 2: GRÁFICOS (Evolução MRR) */}
          <div className="bg-white dark:bg-[#161B22] rounded-[2.5rem] p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-sm flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#2F7FD3]/[0.02] to-transparent">
             <div className="flex justify-between items-start mb-10">
               <div>
                  <h3 className="text-[11px] font-black text-[#1E293B] dark:text-white uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#2F7FD3]" /> Crescimento de Receita (MRR)
                  </h3>
                  <p className="text-xs text-[#64748B] font-medium">Evolução orgânica dos últimos 7 meses</p>
               </div>
               <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex items-center">
                 <button className="px-3 py-1 bg-white dark:bg-slate-700 rounded-md text-[10px] font-bold shadow-sm">6M</button>
                 <button className="px-3 py-1 text-[#64748B] text-[10px] font-bold">1A</button>
               </div>
             </div>
             
             {/* Gráfico Visual Mock (Framer Motion Base) */}
             <div className="flex-1 flex items-end justify-between h-48 gap-2 px-2">
                {mockData.chartDataRev.map((val, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-[#1E293B] dark:text-white mb-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                        R$ {Math.round(val * 43.2)}
                      </div>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${val}%` }}
                        transition={{ duration: 1, delay: i * 0.1, type: 'spring' }}
                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-300 ${
                          i === mockData.chartDataRev.length - 1 
                            ? 'bg-[#2F7FD3] shadow-[0_0_15px_rgba(47,127,211,0.4)]' 
                            : 'bg-blue-100 dark:bg-blue-900/30 group-hover:bg-[#2F7FD3]/40'
                        }`} 
                      />
                   </div>
                ))}
             </div>
             <div className="flex justify-between mt-4 px-4 text-[10px] font-black text-[#64748B] uppercase tracking-widest border-t border-gray-100 dark:border-gray-800/50 pt-4">
                <span>Set</span><span>Out</span><span>Nov</span><span>Dez</span><span>Jan</span><span>Fev</span><span className="text-[#2F7FD3]">Mar</span>
             </div>
          </div>

          {/* PILAR 7: INSIGHTS (Dois blocos lado a lado) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-gradient-to-br from-[#161B22] to-slate-900 rounded-[2rem] p-6 text-white border border-slate-800 relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 blur-[30px] rounded-full group-hover:bg-purple-500/20 transition-all" />
               <Zap size={18} className="text-purple-400 mb-3" />
               <p className="text-sm font-bold text-white/90 leading-relaxed">
                 Petshops no plano <span className="text-purple-400">Premium</span> possuem {mockData.retentionAdvantage} mais retenção ao longo de 6 meses.
               </p>
               <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#63C3D8] hover:text-white transition-colors">Ver Estudo Interno →</button>
             </div>
             <div className="bg-gradient-to-br from-[#161B22] to-slate-900 rounded-[2rem] p-6 text-white border border-slate-800 relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 blur-[30px] rounded-full group-hover:bg-emerald-500/20 transition-all" />
               <ShieldCheck size={18} className="text-emerald-400 mb-3" />
               <p className="text-sm font-bold text-white/90 leading-relaxed">
                 Temos {mockData.trials} trials ativos este mês. Taxa de conversão atual bateu <span className="text-emerald-400 font-black">63%</span>.
               </p>
               <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#63C3D8] hover:text-white transition-colors">Disparar Email Oferta →</button>
             </div>
          </div>

        </div>

        {/* LADO DIREITO: Alertas, Financeiro Rápido & Listas */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* PILAR 3: ALERTAS CRÍTICOS */}
          <div className="bg-[#FFF4F2] dark:bg-[#3B1515]/30 rounded-[2rem] p-6 border border-red-100 dark:border-red-900/30">
            <h3 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={14} /> Requer Atenção Imediata
            </h3>
            <div className="space-y-3">
              {criticalAlerts.map(alert => (
                <div key={alert.id} className="bg-white dark:bg-black/20 p-3 rounded-xl flex gap-3 shadow-sm border border-red-50 dark:border-red-900/20 items-start">
                  <div className="mt-0.5 text-red-500">{alert.icon}</div>
                  <div>
                    <p className="text-xs font-bold text-[#1E293B] dark:text-white">{alert.msg}</p>
                    <button className="text-[9px] font-black uppercase tracking-widest text-[#2F7FD3] mt-1 hover:underline">Resolver</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PILAR 5: VISÃO FINANCEIRA */}
          <div className="bg-white dark:bg-[#161B22] rounded-[2rem] p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
             <h3 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-4 flex items-center gap-2">
               <CreditCard size={14} /> Fechamento do Mês
             </h3>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs font-bold text-[#1E293B] dark:text-white mb-1">
                   <span>Faturado Até Agora</span>
                   <span>R$ {stats.revenue}</span>
                 </div>
                 <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="w-[85%] h-full bg-emerald-500 rounded-full" />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs font-bold text-[#64748B] mb-1">
                   <span>Previsto (Trials + Renovações)</span>
                   <span>R$ {mockData.predictedRevenue}</span>
                 </div>
                 <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="w-[15%] h-full bg-[#2F7FD3] rounded-full" />
                 </div>
               </div>
             </div>
          </div>

          {/* PILAR 4: LISTAS (Recentes) */}
          <div className="flex-1 bg-white dark:bg-[#161B22] rounded-[2rem] border border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Aquisições Recentes</h3>
              <button className="text-[9px] font-black text-[#2F7FD3] uppercase tracking-widest hover:underline">Ver Todos</button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
              {recentPetshops.map((shop) => (
                <div key={shop.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#1E293B] dark:text-white truncate">{shop.name}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#64748B] mt-0.5">{shop.plan}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[9px] font-bold text-[#64748B]">{shop.date}</span>
                    <div className={`mt-1 w-1.5 h-1.5 rounded-full ${shop.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HubDashboard;
