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
  Activity,
  ArrowRight,
  Save,
  Lock,
  Zap,
  RefreshCw
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { MODULES } from "@/components/hub/NewPlanModal";

const HubPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
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

  const updatePlanField = async (planId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ [field]: value })
        .eq('id', planId);

      if (error) throw error;
      
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
      toast.success("Plano atualizado");
    } catch (error: any) {
      toast.error("Erro ao atualizar plano");
    }
  };

  const toggleFeature = async (plan: any, moduleId: string) => {
    const isSelected = plan.features?.includes(moduleId);
    const newFeatures = isSelected 
      ? plan.features.filter((id: string) => id !== moduleId) 
      : [...(plan.features || []), moduleId];
    
    await updatePlanField(plan.id, 'features', newFeatures);
  };

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

        {/* Configuration Matrix */}
        <div className="bg-white dark:bg-[#0D1117] rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
             <Table>
               <TableHeader className="bg-gray-50/50 dark:bg-gray-800/20">
                 <TableRow className="border-gray-100 dark:border-gray-800 hover:bg-transparent">
                   <TableHead className="w-[140px] sm:w-[280px] p-3 sm:p-6 text-[10px] font-black uppercase tracking-widest text-[#2F7FD3] sticky left-0 bg-gray-50/95 dark:bg-gray-800/95 z-20 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.1)] sm:shadow-none backdrop-blur-sm">Módulo / Ferramenta</TableHead>
                   {plans.map((plan) => (
                     <TableHead key={plan.id} className="min-w-[140px] sm:min-w-[150px] p-3 sm:p-6 text-center">
                       <div className="flex flex-col items-center gap-2">
                         <span className="text-xs font-black uppercase tracking-tighter italic text-gray-900 dark:text-white">{plan.name}</span>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-[9px] font-bold text-[#2F7FD3]">R$</span>
                           <Input 
                             type="number"
                             value={plan.price}
                             onChange={(e) => updatePlanField(plan.id, 'price', parseFloat(e.target.value))}
                             className="h-7 w-20 bg-white dark:bg-gray-800/10 border-transparent hover:border-blue-500/30 text-xs font-black p-1 text-center focus-visible:ring-0"
                           />
                         </div>
                       </div>
                     </TableHead>
                   ))}
                   <TableHead className="w-[100px] p-3 sm:p-6 text-right font-bold text-gray-400 hidden sm:table-cell">AÇÕES</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {/* Capacidades & Limites */}
                 <TableRow className="bg-gray-50/20 dark:bg-gray-800/10 border-gray-100 dark:border-gray-800 pointer-events-none">
                    <TableCell colSpan={plans.length + 2} className="py-2 px-6">
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Capacidades & Limites da Frota</span>
                    </TableCell>
                 </TableRow>
                 
                 {/* Limite de Pets */}
                 <TableRow className="border-gray-100 dark:border-gray-800 hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors">
                    <TableCell className="p-3 sm:p-6 sticky left-0 bg-white/95 dark:bg-[#0D1117]/95 z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.05)] sm:shadow-none backdrop-blur-sm group-hover:bg-gray-50/95 dark:group-hover:bg-gray-800/95 transition-colors">
                       <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/10 text-blue-500 rounded-lg shrink-0"><Activity size={14} /></div>
                          <span className="text-[10px] sm:text-xs font-bold text-gray-500 leading-tight">Capacidade de Pets</span>
                       </div>
                    </TableCell>
                    {plans.map((plan) => (
                      <TableCell key={plan.id} className="p-3 sm:p-6 text-center">
                        <Input 
                          type="number"
                          value={plan.max_pets || ''}
                          placeholder="∞"
                          onChange={(e) => updatePlanField(plan.id, 'max_pets', e.target.value ? parseInt(e.target.value) : null)}
                          className="h-8 w-20 mx-auto bg-transparent border-gray-100 dark:border-gray-800/50 text-xs font-bold text-center"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="p-3 sm:p-6 text-right opacity-20 hidden sm:table-cell"><Lock size={12} className="ml-auto" /></TableCell>
                 </TableRow>

                 {/* Limite de Usuários */}
                 <TableRow className="border-gray-100 dark:border-gray-800 hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors">
                    <TableCell className="p-3 sm:p-6 border-b border-gray-100 dark:border-gray-800 sticky left-0 bg-white/95 dark:bg-[#0D1117]/95 z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.05)] sm:shadow-none backdrop-blur-sm group-hover:bg-gray-50/95 dark:group-hover:bg-gray-800/95 transition-colors">
                       <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1.5 sm:p-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-500 rounded-lg shrink-0"><Users size={14} /></div>
                          <span className="text-[10px] sm:text-xs font-bold text-gray-500 leading-tight">Usuários Ativos</span>
                       </div>
                    </TableCell>
                    {plans.map((plan) => (
                      <TableCell key={plan.id} className="p-3 sm:p-6 text-center border-b border-gray-100 dark:border-gray-800">
                        <Input 
                          type="number"
                          value={plan.max_users || ''}
                          placeholder="---"
                          onChange={(e) => updatePlanField(plan.id, 'max_users', e.target.value ? parseInt(e.target.value) : null)}
                          className="h-8 w-20 mx-auto bg-transparent border-gray-100 dark:border-gray-800/50 text-xs font-bold text-center"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="p-3 sm:p-6 text-right border-b border-gray-100 dark:border-gray-800 opacity-20 hidden sm:table-cell"><Lock size={12} className="ml-auto" /></TableCell>
                 </TableRow>

                 {/* Gating de Módulos */}
                 {['Base', 'Avançado'].map((category) => (
                   <React.Fragment key={category}>
                     {(category === 'Base' || isExpanded) && (
                       <>
                         <TableRow className="bg-gray-50/20 dark:bg-gray-800/10 border-gray-100 dark:border-gray-800">
                            <TableCell colSpan={plans.length + 2} className="py-2.5 px-4 sm:px-6 sticky left-0 bg-transparent">
                               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{category === 'Base' ? 'Módulos Operacionais' : 'Ferramentas de Escala'}</span>
                            </TableCell>
                         </TableRow>
                         {MODULES.filter(m => m.category === category).map((module) => (
                           <TableRow key={module.id} className="border-gray-100 dark:border-gray-800 group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                             <TableCell className="p-4 sm:p-6 sticky left-0 bg-white/95 dark:bg-[#0D1117]/95 z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.05)] sm:shadow-none backdrop-blur-sm group-hover:bg-gray-50/95 dark:group-hover:bg-gray-800/95 transition-colors">
                               <span className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-[#2F7FD3] transition-colors leading-tight line-clamp-2">{module.label}</span>
                             </TableCell>
                             {plans.map((plan) => (
                               <TableCell key={plan.id} className="p-3 sm:p-6 text-center">
                                 <Switch 
                                   checked={plan.features?.includes(module.id)}
                                   onCheckedChange={() => toggleFeature(plan, module.id)}
                                   className="mx-auto data-[state=checked]:bg-emerald-500"
                                 />
                               </TableCell>
                             ))}
                             <TableCell className="p-3 sm:p-6 text-right hidden sm:table-cell">
                               <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="text-gray-400 hover:text-[#2F7FD3] p-1"><Edit size={12} /></button>
                               </div>
                             </TableCell>
                           </TableRow>
                         ))}
                       </>
                     )}
                     
                     {category === 'Base' && !isExpanded && (
                       <TableRow className="border-gray-100 dark:border-gray-800 hover:bg-transparent">
                         <TableCell colSpan={plans.length + 2} className="p-4 sm:p-6 sticky left-0">
                           <button 
                             onClick={() => setIsExpanded(true)}
                             className="flex items-center gap-2 mx-auto px-6 py-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-[#2F7FD3] rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                           >
                             <Plus size={14} />
                             Ver mais funcionalidades
                           </button>
                         </TableCell>
                       </TableRow>
                     )}
                   </React.Fragment>
                 ))}
                 
                 {isExpanded && (
                   <TableRow className="border-gray-100 dark:border-gray-800 hover:bg-transparent">
                     <TableCell colSpan={plans.length + 2} className="p-4 sm:p-6 sticky left-0">
                       <button 
                         onClick={() => setIsExpanded(false)}
                         className="flex items-center gap-2 mx-auto px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-[#2F7FD3] rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                       >
                         <RefreshCw size={14} className="rotate-180" />
                         Recolher avançados
                       </button>
                     </TableCell>
                   </TableRow>
                 )}
               </TableBody>
             </Table>
           </div>

           {/* Bulk Update Legend */}
           <div className="p-6 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Acesso Liberado</div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-200" /> Acesso Gated</div>
              </div>
              <p>As alterações refletem instantaneamente nas licenças ativas</p>
           </div>
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
