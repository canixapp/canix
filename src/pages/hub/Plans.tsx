import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NewPlanModal from "@/components/hub/NewPlanModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CreditCard, 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  Sparkles, 
  DollarSign, 
  Shield,
  Trash2, 
  Edit,
  Users,
  Headset,
  Layout,
  Activity
} from "lucide-react";

const HubPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const primaryGradient = "from-[#1E3A8A] to-[#2F7FD3]";

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePlan(id: string) {
    if (!confirm("Tem certeza que deseja remover este plano?")) return;
    
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success("Plano removido com sucesso");
      fetchPlans();
    } catch (error: any) {
      toast.error("Erro ao remover plano");
    }
  }

  const stats = [
    { label: "PLANOS ATIVOS", value: plans.length, icon: CheckCircle2, color: "text-[#2F7FD3]" },
    { label: "PREÇO MÉDIO", value: "R$ 349", icon: DollarSign, color: "text-[#2F7FD3]" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Hub Toolbar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-[#161B22] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-5">
            <div className={`p-4 bg-gradient-to-br ${primaryGradient} rounded-2xl shadow-lg shadow-blue-500/20`}>
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#2F7FD3] mb-0.5">
                <Sparkles size={12} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">SaaS Infrastructure</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight dark:text-white italic">Console de Planos</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 px-6 py-2 border-x border-gray-100 dark:border-gray-800">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{stat.label}</span>
                  <span className={`text-sm font-black ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => {
                setEditingPlan(null);
                setIsModalOpen(true);
              }}
              className={`flex items-center gap-3 px-6 py-3.5 bg-gradient-to-br ${primaryGradient} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all`}
            >
              <Plus size={16} />
              Propagar Novo Plano
            </button>
          </div>
        </header>

        {/* Management List */}
        <div className="space-y-3">
          {/* List Header (Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
            <div className="col-span-3">Identificação do Ativo</div>
            <div className="col-span-3">Capacidade & Métricas</div>
            <div className="col-span-3">Escopo de Módulos</div>
            <div className="col-span-2 text-right">Valor Mensal</div>
            <div className="col-span-1 text-right">Ações</div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800/50 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : plans.map((plan) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={plan.id}
              className="group relative md:grid grid-cols-12 items-center gap-4 bg-white dark:bg-[#0D1117] p-6 md:px-8 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] hover:ring-2 hover:ring-[#2F7FD3]/10 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
            >
              {/* identification */}
              <div className="col-span-3 flex items-center gap-4 mb-4 md:mb-0">
                <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-[#2F7FD3] border border-gray-100 dark:border-gray-800`}>
                  {plan.name.includes("Premium") ? <Sparkles size={20} /> : plan.name.includes("Base") ? <Shield size={20} /> : <Activity size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white tracking-tighter text-lg leading-tight uppercase italic">{plan.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{plan.is_active ? 'Operacional' : 'Inativo'}</span>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="col-span-3 grid grid-cols-3 gap-2 mb-4 md:mb-0">
                <div className="bg-gray-50/50 dark:bg-gray-800/30 p-2 rounded-xl border border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-800 transition-colors">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
                    <Activity size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-tight">Pets</span>
                  </div>
                  <div className="text-xs font-black dark:text-white tracking-tighter">{plan.max_pets || '∞'}</div>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-800/30 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
                    <Layout size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-tight">Agend.</span>
                  </div>
                  <div className="text-xs font-black dark:text-white tracking-tighter text-ellipsis overflow-hidden whitespace-nowrap">{plan.max_appointments_month || '∞'}</div>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-800/30 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
                    <Users size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-tight">Users</span>
                  </div>
                  <div className="text-xs font-black dark:text-white tracking-tighter">{plan.max_users || '---'}</div>
                </div>
              </div>

              {/* Modules/Features */}
              <div className="col-span-3 flex flex-wrap gap-1.5 mb-4 md:mb-0">
                {plan.features?.slice(0, 3).map((feature: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/10 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-blue-100/50 dark:border-blue-900/20">
                    {feature}
                  </span>
                ))}
                {plan.features?.length > 3 && (
                  <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-400 text-[9px] font-bold uppercase rounded-lg">
                    +{plan.features.length - 3}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="col-span-2 text-right mb-6 md:mb-0 px-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">Mensalidade</div>
                <div className="text-2xl font-black text-[#141B2B] dark:text-white tracking-tighter">
                  <span className="text-sm font-bold text-[#2F7FD3] mr-1">R$</span>
                  {plan.price || '0'}
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setEditingPlan(plan);
                    setIsModalOpen(true);
                  }}
                  className="p-3 bg-gray-50 dark:bg-gray-800 text-[#141B2B] dark:text-white rounded-2xl border border-transparent hover:border-gray-200 transition-all active:scale-90"
                  title="Configurar Parâmetros"
                >
                  <Edit size={16} />
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-3 bg-gray-50 dark:bg-gray-800 text-[#6C7A73] rounded-2xl hover:text-red-500 transition-all focus:outline-none active:scale-90">
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-[#1A1F2B] border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-2 min-w-[180px]">
                    <div className="px-3 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Controles de Ativo</div>
                    <DropdownMenuItem 
                      onClick={() => handleDeletePlan(plan.id)}
                      className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl cursor-pointer transition-colors uppercase italic"
                    >
                      <Trash2 size={14} />
                      Desativar Ativo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Canix AI Add-on - Ilustrativo */}
        <div className="mt-16 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
               <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#141B2B] dark:text-white">Add-ons & Módulos Extras</h2>
              <p className="text-xs text-[#6C7A73]">Potencialize sua operação com recursos avançados.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-[#141B2B] rounded-[2.5rem] p-8 shadow-sm border border-purple-100 dark:border-purple-900/30 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg inline-block mb-3">
                    Disponível em breve
                  </div>
                  <h3 className="text-2xl font-black text-[#141B2B] dark:text-white italic">Canix <span className="text-purple-600">AI Agent</span></h3>
                  <p className="text-sm text-[#6C7A73] mt-2 leading-relaxed">Agente inteligente que atende clientes via WhatsApp, sugere horários e auxilia no agendamento.</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600">
                  <Sparkles size={32} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-[#141B2B] dark:text-white">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-purple-300" /> Modos de Operação
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-[#2F7FD3] flex items-center justify-center shrink-0">
                      <span className="font-bold text-xs">AI</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold">Automático</p>
                      <p className="text-[9px] text-[#6C7A73]">IA atende, agenda e confirma.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0">
                      <span className="font-bold text-xs">H</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold">Assistido</p>
                      <p className="text-[9px] text-[#6C7A73]">Humano aprova as sugestões da IA.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-purple-300" /> Funcionalidades
                  </p>
                  <ul className="space-y-2">
                    {["Atendimento WhatsApp", "Fila de Aprovação", "Insights de Atendimento", "Histórico Completo"].map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs font-medium">
                        <CheckCircle2 size={14} className="text-purple-500" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-[#6C7A73] rounded-2xl font-black uppercase tracking-widest text-[10px] opacity-60 cursor-not-allowed border border-gray-100 dark:border-gray-700">
                Em desenvolvimento
              </button>
            </motion.div>
          </div>
        </div>

        <NewPlanModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPlan(null);
          }}
          onSuccess={fetchPlans}
          plan={editingPlan}
        />
      </div>
  );
};

export default HubPlans;
