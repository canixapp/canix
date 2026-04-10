import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus, MoreVertical, CheckCircle2, Sparkles, DollarSign, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NewPlanModal from "@/components/hub/NewPlanModal";

const HubPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const primaryGradient = "from-[#1E3A8A] to-[#2F7FD3]";

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const { data, error } = await (supabase.from as any)('plans')
        .select('*')
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

  const stats = [
    { label: "PLANOS ATIVOS", value: plans.length, icon: CheckCircle2, color: "text-[#2F7FD3]" },
    { label: "PREÇO MÉDIO", value: "R$ 349", icon: DollarSign, color: "text-[#2F7FD3]" },
  ];

  return (
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#141B2B] dark:text-white">Planos de Assinatura</h1>
            <p className="text-[#6C7A73] mt-1">Configure os modelos de negócio e limites de cada plano.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-br ${primaryGradient} text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform active:scale-95`}
          >
            <Plus size={20} /> Novo Plano
          </button>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-[#141B2B] rounded-[2rem] p-6 shadow-sm border border-gray-50 dark:border-gray-800"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 bg-blue-50 dark:bg-gray-800/50 rounded-2xl ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-[#6C7A73] uppercase">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-[#141B2B] dark:text-white">{stat.value}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Functional Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full p-20 text-center">
                <div className="w-8 h-8 border-4 border-[#2F7FD3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#6C7A73] font-medium">Carregando planos comerciais...</p>
             </div>
          ) : plans.length === 0 ? (
            <div className="col-span-full p-20 text-center bg-white dark:bg-[#141B2B] rounded-[2.5rem]">
              <p className="text-[#6C7A73]">Nenhum plano cadastrado. Clique em "Novo Plano" para começar.</p>
            </div>
          ) : plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-[#141B2B] rounded-[2.5rem] p-8 shadow-sm border border-gray-50 dark:border-gray-800 relative group overflow-hidden"
            >
              {plan.name === 'Pro' && (
                <div className="absolute top-6 right-6 px-3 py-1 bg-blue-50 text-[#2F7FD3] text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> Popular
                </div>
              )}

              <div className="mb-6">
                <p className="text-[10px] font-bold text-[#6C7A73] uppercase tracking-widest mb-1">Modelo de Negócio</p>
                <h3 className="text-2xl font-bold text-[#141B2B] dark:text-white">{plan.name}</h3>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#141B2B] dark:text-white">R$ {plan.price}</span>
                  <span className="text-[#6C7A73] text-sm">/mês</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-[#2F7FD3]" />
                  <span className="text-sm font-medium">Até {plan.max_pets || '∞'} pets registrados</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-[#2F7FD3]" />
                  <span className="text-sm font-medium">Até {plan.max_appointments_month || '∞'} agendamentos/mês</span>
                </div>
                {plan.features?.map((feature: string, idx: number) => (
                   <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#2F7FD3]" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-4 bg-[#F9F9FF] dark:bg-gray-800 text-[#141B2B] dark:text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#F1F3FF] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                  Editar Plano
                </button>
                <button className="p-4 bg-[#F9F9FF] dark:bg-gray-800 text-[#6C7A73] rounded-2xl hover:text-red-500 transition-colors">
                  <MoreVertical size={16} />
                </button>
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
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchPlans}
        />
      </div>
  );
};

export default HubPlans;
