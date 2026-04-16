import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  Sparkles, 
  Trash2, 
  Edit,
  Users,
  Activity,
  Save,
  Lock,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Zap,
  ChevronRight,
  Minus
} from "lucide-react";
import { insertAuditLog } from "@/services/auditLogService";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { MODULES } from "@/components/hub/NewPlanModal";

// --- SUB-COMPONENTE: STEPPER DE AJUSTE RÁPIDO ---
const LimitStepper = ({ 
  value, 
  onChange, 
  label, 
  icon: Icon,
  step = 10 
}: { 
  value: number | null, 
  onChange: (val: number | null) => void, 
  label: string, 
  icon: any,
  step?: number
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const displayValue = value === null ? "∞" : value;

  return (
    <div className="group relative flex flex-col gap-1.5 p-3 rounded-2xl transition-all hover:bg-muted/30">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{label}</span>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onChange(value === null ? 0 : Math.max(0, value - step))}
          className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/80 active:scale-90 transition-all"
        >
          <Minus size={12} />
        </button>

        <div className="flex-1 text-center min-w-[60px]">
          {isEditing ? (
            <input 
              autoFocus
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
              onBlur={() => setIsEditing(false)}
              className="w-full bg-transparent border-none text-lg font-black text-center focus:ring-0 outline-none p-0 text-foreground tabular-nums"
            />
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-lg font-black text-foreground hover:text-primary transition-colors tabular-nums tracking-tight"
            >
              {displayValue}
            </button>
          )}
        </div>

        <button 
          onClick={() => onChange(value === null ? step : value + step)}
          className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/80 active:scale-90 transition-all"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
};

const HubPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [planToRename, setPlanToRename] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (plans.length > 0 && !activePlanId) {
      setActivePlanId(plans[0].id);
    }
  }, [plans]);

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

  const seedDefaultPlans = async () => {
    const confirmSeed = confirm("Deseja restaurar os planos para o padrão (Free, Base, Premium)? Isso não excluirá planos existentes, mas criará os novos.");
    if (!confirmSeed) return;

    setLoading(true);
    try {
      const defaultPlans = [
        {
          name: "FREE (Trial)",
          price: 0,
          price_monthly: 0,
          max_pets: 50,
          max_users: 1,
          support_tier: "Standard",
          is_active: true,
          features: ['agendamentos', 'pacotes', 'clientes', 'pets', 'servicos', 'moderacao', 'audit-log']
        },
        {
          name: "BASE (Essencial)",
          price: 59.90,
          price_monthly: 59.90,
          max_pets: 200,
          max_users: 3,
          support_tier: "Standard",
          is_active: true,
          features: ['agendamentos', 'pacotes', 'clientes', 'pets', 'servicos', 'moderacao', 'audit-log']
        },
        {
          name: "PREMIUM (Avançado)",
          price: 99.90,
          price_monthly: 99.90,
          max_pets: null,
          max_users: null,
          support_tier: "Priority",
          is_active: true,
          features: MODULES.map(m => m.id)
        }
      ];

      const { error } = await supabase.from('plans').insert(defaultPlans);
      if (error) throw error;
      
      toast.success("Planos restaurados com sucesso!");
      fetchPlans();
    } catch (error: any) {
      toast.error("Erro ao restaurar planos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Tem certeza que deseja descontinuar este plano?")) return;
    
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success("Plano arquivado com sucesso");
      fetchPlans();
    } catch (error: any) {
      toast.error("Erro ao remover plano");
    }
  };

  const updatePlanField = async (planId: string, field: string, value: any) => {
    try {
      const { error, count } = await supabase
        .from('plans')
        .update({ [field]: value }, { count: 'exact' })
        .eq('id', planId);

      if (error) throw error;
      
      // Se count for 0, significa que o RLS bloqueou o update ou o ID não existe
      if (count === 0) {
        toast.error("Acesso Negado", {
          description: "Você não tem permissão para editar planos ou sua sessão expirou.",
          action: {
            label: "Sair",
            onClick: () => supabase.auth.signOut()
          }
        });
        return;
      }
      
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
      
      // Registrar log de auditoria
      if (user) {
        insertAuditLog({
          actor_id: user.id,
          action: 'update',
          entity: 'plan',
          target_id: planId,
          field: field,
          old_value: JSON.stringify(plans.find(p => p.id === planId)?.[field as keyof Plan] ?? null),
          new_value: JSON.stringify(value),
          details: { field, plan_id: planId }
        });
      }
      
      toast.dismiss();
      toast.custom((t) => (
        <div className="flex items-center gap-4 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl border-0 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)] rounded-[2.5rem] p-4 min-w-[340px] pointer-events-auto ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#34C759]/15 text-[#34C759] flex items-center justify-center border border-[#34C759]/20 shadow-lg shadow-[#34C759]/10">
            <Zap size={22} className="fill-[#34C759]"/>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-black tracking-tight text-[#1C1C1E] dark:text-white">Atualizado</span>
            <span className="text-[10px] text-[#8E8E93] uppercase tracking-[0.1em] font-black">MODIFICAÇÃO SALVA COM SUCESSO</span>
          </div>
        </div>
      ), { 
        duration: 5000,
        position: 'top-right',
        unstyled: true,
        className: "sonner-custom-clear !bg-transparent !border-0 !shadow-none !p-0 !m-0 !outline-none"
      });
    } catch (error: any) {
      console.error("Plan update error:", error);
      toast.error("Erro ao atualizar", {
        description: error.message || "Falha na comunicação com o servidor"
      });
    }
  };


  const handleRename = async () => {
    if (!planToRename || !newName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('plans')
        .update({ name: newName.trim() })
        .eq('id', planToRename.id);

      if (error) throw error;
      
      setPlans(plans.map(p => p.id === planToRename.id ? { ...p, name: newName.trim() } : p));
      setIsRenameModalOpen(false);
      setPlanToRename(null);
      setNewName("");
      
      toast.dismiss();
      toast.custom((t) => (
        <div className="flex items-center gap-4 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl border-0 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)] rounded-[2.5rem] p-4 min-w-[340px] pointer-events-auto ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#34C759]/15 text-[#34C759] flex items-center justify-center border border-[#34C759]/20 shadow-lg shadow-[#34C759]/10">
            <Zap size={22} className="fill-[#34C759]"/>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-black tracking-tight text-[#1C1C1E] dark:text-white">Renomeado</span>
            <span className="text-[10px] text-[#8E8E93] uppercase tracking-[0.1em] font-black">NOME ATUALIZADO COM SUCESSO</span>
          </div>
        </div>
      ), { 
        duration: 5000,
        position: 'top-right',
        unstyled: true,
        className: "sonner-custom-clear !bg-transparent !border-0 !shadow-none !p-0 !m-0 !outline-none"
      });
    } catch (error: any) {
      toast.error("Erro ao renomear");
    }
  };

  const toggleFeature = async (plan: any, moduleId: string) => {
    const isSelected = plan.features?.includes(moduleId);
    const newFeatures = isSelected 
      ? plan.features.filter((id: string) => id !== moduleId) 
      : [...(plan.features || []), moduleId];
    
    await updatePlanField(plan.id, 'features', newFeatures);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Synchronizing Hub…</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 text-foreground selection:bg-primary/30 selection:text-white pb-8">
        <style>
          {`
            [data-sonner-toast].sonner-custom-clear {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
          `}
        </style>
        <header className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#141B2B] dark:text-white italic leading-none">Configuração de Planos</h1>
            <p className="text-[#6C7A73] mt-3 text-sm font-medium">Configure os recursos, módulos e limites de acesso do seu sistema.</p>
          </div>
          
          <button 
            onClick={() => {
              setEditingPlan(null);
              setIsModalOpen(true);
            }}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-[#1E3A8A] to-[#2F7FD3] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_10px_25px_rgba(30,58,138,0.2)] hover:shadow-[0_15px_30px_rgba(30,58,138,0.3)] hover:scale-[1.02] transition-all transform active:scale-95 border border-white/10`}
          >
            <Plus size={18} strokeWidth={3} /> Novo Plano
          </button>
        </header>

        <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
          {plans.length === 0 && !loading && (
            <div className="p-12 border-2 border-dashed border-border rounded-[3rem] text-center space-y-6 bg-card/50">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Sparkles size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black italic">Nenhum plano ativo encontrado</h3>
                <p className="text-sm text-muted-foreground mt-2">Deseja carregar a estrutura recomendada para o Canix?</p>
              </div>
              <button 
                onClick={seedDefaultPlans}
                className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
              >
                Aplicar Estrutura Padrão
              </button>
            </div>
          )}

          {plans.length > 0 && (
            <section className="relative">
              {/* Desktop View (Matrix) */}
              <div className="hidden md:block overflow-x-auto no-scrollbar -mx-8 px-8 py-8 border-transparent">
                <div className="min-w-[1000px] border border-border rounded-[3rem] bg-card overflow-hidden shadow-xl ring-1 ring-border/50 shadow-primary/5">
                  <table className="w-full border-separate relative" style={{ borderSpacing: 0 }}>
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="py-12 px-8 w-[320px] sticky left-0 bg-card z-30 border-r border-border/60 border-b border-border/60 shadow-[8px_0_24px_-12px_rgba(0,0,0,0.15)] rounded-tl-[3rem] transition-colors">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-primary">
                              <Zap size={10} className="fill-primary" />
                              <span className="text-[10px] font-black uppercase tracking-[0.4em]">SaaS Matrix</span>
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tight text-foreground balance">Módulos & Capacidade</h2>
                          </div>
                        </th>
                        {plans.map((plan) => (
                          <th key={plan.id} className="p-8 group/th relative min-w-[240px] border-r border-border/20 border-b border-border/60 last:border-r-0 last:rounded-tr-[3rem]">
                            <div className="flex flex-col items-center gap-6">
                              <div className="flex items-center gap-3">
                                <input 
                                  type="text"
                                  value={plan.name}
                                  onChange={(e) => updatePlanField(plan.id, 'name', e.target.value)}
                                  className="w-full min-w-[120px] bg-transparent border border-transparent px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-widest text-foreground/90 text-center outline-none focus:bg-white dark:focus:bg-[#111827] focus:shadow-sm focus:border-border/50 hover:bg-muted/30 focus:text-primary transition-all"
                                />
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 hover:bg-muted/80 rounded-xl transition-all opacity-0 group-hover/th:opacity-100 border border-transparent hover:border-border shadow-sm">
                                      <MoreVertical size={14} className="text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-border/50 rounded-2xl p-2 shadow-2xl">
                                    <DropdownMenuItem onClick={() => handleDeletePlan(plan.id)} className="gap-2 text-destructive cursor-pointer text-[10px] font-bold uppercase tracking-wider rounded-xl focus:bg-destructive focus:text-destructive-foreground">
                                      <Trash2 size={14} /> Arquivar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              <div className="relative group/price">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-[10px] font-black text-primary transition-colors">R$</span>
                                  <input 
                                    type="number"
                                    value={plan.price}
                                    onChange={(e) => updatePlanField(plan.id, 'price', parseFloat(e.target.value))}
                                    className="w-24 bg-transparent border-none text-4xl font-black text-center focus:ring-0 outline-none p-0 tabular-nums tracking-tighter hover:text-primary transition-colors text-foreground"
                                  />
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-primary scale-x-0 group-hover/price:scale-x-100 transition-transform origin-center" />
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 'max_pets', label: 'Capacidade de Pets', icon: Activity },
                        { id: 'max_users', label: 'Operadores Ativos', icon: Users }
                      ].map((row, i) => (
                        <tr key={row.id} className={`group transition-colors hover:bg-muted/40 ${i % 2 === 1 ? 'bg-muted/10' : 'bg-transparent'}`}>
                          <td className="py-8 px-8 sticky left-0 bg-card z-20 border-r border-border/60 border-b border-border/30 shadow-[8px_0_24px_-12px_rgba(0,0,0,0.15)] transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-muted/50 rounded-2xl text-foreground/70 group-hover:text-primary group-hover:bg-primary/5 transition-all border border-border/50 group-hover:border-primary/20 bg-background/50 drop-shadow-sm">
                                <row.icon size={18} />
                              </div>
                              <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">{row.label}</span>
                            </div>
                          </td>
                          {plans.map(plan => (
                            <td key={plan.id} className="p-8 text-center border-r border-border/20 border-b border-border/30 last:border-r-0">
                              <div className="inline-flex items-center bg-background/60 border border-border/30 hover:border-primary/30 hover:bg-muted/50 transition-all rounded-2xl p-1 gap-2 shadow-inner">
                                <input 
                                  type="number"
                                  value={plan[row.id] || ''}
                                  placeholder="∞"
                                  onChange={(e) => updatePlanField(plan.id, row.id, e.target.value ? parseInt(e.target.value) : null)}
                                  className="h-10 w-24 bg-transparent text-lg font-black text-center focus:ring-0 outline-none tabular-nums placeholder:text-muted-foreground/40 text-foreground"
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}

                     {MODULES.filter(m => isExpanded || m.category === 'Base').map((module, index, array) => {
                       const isLast = index === array.length - 1;
                       return (
                         <tr key={module.id} className={`group transition-colors hover:bg-muted/40 ${index % 2 === 0 ? 'bg-muted/10' : 'bg-transparent'}`}>
                           <td className={`py-6 px-8 sticky left-0 bg-card z-20 border-r border-border/60 shadow-[8px_0_24px_-12px_rgba(0,0,0,0.15)] transition-colors ${!isLast ? 'border-b border-border/20' : ''} ${isLast && isExpanded ? 'rounded-bl-[3rem]' : ''}`}>
                             <div className="flex items-center gap-3">
                               <div className="w-1.5 h-6 rounded-full bg-primary/20 group-hover:bg-primary transition-all shadow-[0_0_10px_rgba(47,127,211,0)] group-hover:shadow-[0_0_10px_rgba(47,127,211,0.5)]" />
                               <span className="text-[11px] font-bold text-foreground/80 group-hover:text-foreground transition-colors">{module.label}</span>
                             </div>
                           </td>
                           {plans.map(plan => (
                             <td key={plan.id} className={`p-6 text-center border-r border-border/20 last:border-r-0 ${!isLast ? 'border-b border-border/20' : ''} ${isLast && isExpanded ? 'last:rounded-br-[3rem]' : ''}`}>
                               <Switch 
                                 checked={plan.features?.includes(module.id)}
                                 onCheckedChange={() => toggleFeature(plan, module.id)}
                                 className="data-[state=checked]:bg-[#34C759] data-[state=unchecked]:bg-muted/80 border-border/50 h-5 w-9 transition-all hover:scale-110 shadow-sm"
                               />
                             </td>
                           ))}
                         </tr>
                       );
                     })}

                      <tr className="bg-muted/30">
                        <td colSpan={plans.length + 1} className="py-12 border-b border-border/40">
                          <div className="flex items-center gap-4 px-8">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                            <button 
                              onClick={() => setIsExpanded(!isExpanded)} 
                              className="group flex items-center gap-2 px-6 py-2 rounded-full bg-background border border-border shadow-sm hover:border-primary/30 hover:bg-primary/5 transition-all"
                            >
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary">
                                {isExpanded ? "Ocultar Módulos Avançados" : "Expandir Todos os Módulos"}
                              </span>
                              <ChevronRight size={12} className={`text-primary transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View (Command Cards) */}
              <div className="md:hidden space-y-6">
                {/* Plan Switcher Tabs */}
                <div className="relative group">
                  <div className="flex gap-2 bg-muted rounded-[2rem] overflow-x-auto no-scrollbar scroll-smooth p-0.5">
                    {plans.map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => setActivePlanId(plan.id)}
                        className={`shrink-0 px-6 py-3.5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                          activePlanId === plan.id 
                            ? 'bg-[#2F7FD3] text-white shadow-lg shadow-blue-500/20 scale-[1.01]' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {plan.name}
                      </button>
                    ))}
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-muted pointer-events-none rounded-r-[2rem] flex items-center justify-end pr-3">
                    <ChevronRight size={12} className="text-muted-foreground/30 animate-pulse" />
                  </div>
                </div>

                {/* Active Plan Detail View */}
                <AnimatePresence mode="wait">
                  {plans.find(p => p.id === activePlanId) && (() => {
                    const plan = plans.find(p => p.id === activePlanId);
                    return (
                      <motion.div 
                        key={activePlanId}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-6"
                      >
                        {/* Pricing & Control Card */}
                        <div className="p-10 bg-card/80 backdrop-blur-2xl rounded-[3rem] border border-border/50 relative overflow-hidden group">
                          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                          
                          <div className="flex flex-col gap-6 mb-12">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-primary mb-1">
                                <Zap size={10} className="fill-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Plano</span>
                              </div>
                              <h2 className="text-4xl font-black italic tracking-tighter uppercase text-foreground leading-[0.9]">{plan?.name || "Sem Nome"}</h2>
                            </div>
                            
                            <div className="flex flex-col items-start gap-1 p-4 bg-primary/5 rounded-2xl border border-primary/10 w-fit">
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-black text-primary">R$</span>
                                <input 
                                  type="number"
                                  value={plan?.price ?? 0}
                                  onChange={(e) => updatePlanField(plan!.id, 'price', e.target.value ? parseFloat(e.target.value) : 0)}
                                  className="w-32 bg-transparent border-none text-4xl font-black focus:ring-0 p-0 tabular-nums outline-none text-foreground leading-none"
                                />
                              </div>
                              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest ml-1">Assinatura Mensal</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 bg-muted/20 p-2 rounded-[2rem] border border-border/30">
                            <LimitStepper 
                              label="Capacidade de Pets" 
                              icon={Activity} 
                              value={plan.max_pets} 
                              onChange={(val) => updatePlanField(plan.id, 'max_pets', val)}
                              step={50}
                            />
                            <div className="h-[1px] mx-4 bg-border/20" />
                            <LimitStepper 
                              label="Operadores Ativos" 
                              icon={Users} 
                              value={plan.max_users} 
                              onChange={(val) => updatePlanField(plan.id, 'max_users', val)}
                              step={5}
                            />
                          </div>

                          <div className="mt-10 flex gap-4">
                            <button 
                              onClick={() => {
                                setPlanToRename(plan);
                                setNewName(plan?.name || "");
                                setIsRenameModalOpen(true);
                              }}
                              className="flex-1 py-5 bg-muted/50 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                              <Edit size={14} /> Renomear
                            </button>
                            <button 
                               onClick={() => handleDeletePlan(plan!.id)}
                               className="w-16 h-16 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive flex items-center justify-center active:scale-90 transition-all hover:bg-destructive hover:text-white"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Feature Expansion List */}
                        <div className="bg-background/20 rounded-[2.5rem] border border-border/50 overflow-hidden">
                          <div className="p-6 bg-muted/10 border-b border-border/30">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Acesso a Módulos</h3>
                          </div>
                          <div className="divide-y divide-border/10">
                            {MODULES.filter(m => isExpanded || m.category === 'Base').map(module => (
                              <div key={module.id} className="flex items-center justify-between p-7 hover:bg-muted/5 transition-all group">
                                <div className="space-y-1">
                                  <span className="text-xs font-bold block tracking-tight group-hover:text-primary transition-colors">{module.label}</span>
                                  <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{module.category}</span>
                                </div>
                                <Switch 
                                  checked={plan.features?.includes(module.id)}
                                  onCheckedChange={() => toggleFeature(plan, module.id)}
                                  className="data-[state=checked]:bg-[#34C759] h-6 w-11 hover:scale-110 active:scale-90 transition-all shadow-sm"
                                />
                              </div>
                            ))}
                            <button 
                               onClick={() => setIsExpanded(!isExpanded)}
                               className="w-full py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-3 border-t border-border/30 bg-muted/5"
                             >
                               {isExpanded ? "Ocultar Módulos Avançados" : "Expandir Todos os Módulos"}
                               <ChevronRight size={14} className={`text-primary transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </section>
          )}

          <section className="pt-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1.5 h-8 bg-gradient-to-b from-primary to-transparent rounded-full" />
              <div>
                <h2 className="text-2xl font-black italic tracking-tight">Ecossistema Canix</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">IA Ad-ons & Integrações</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-48">
              <motion.div
                whileHover={{ y: -8, scale: 1.01 }}
                className="bg-card/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-border/50 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="relative">
                  <div className="flex justify-between items-start mb-12">
                    <div className="space-y-4">
                      <div className="px-5 py-2 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full inline-block border border-primary/20 shadow-lg shadow-primary/10">
                        IA Engine v1.0
                      </div>
                      <h3 className="text-4xl font-black italic leading-none tracking-tighter uppercase whitespace-pre-wrap">
                        Canix <span className="text-primary italic">AI Core</span>
                      </h3>
                      <p className="text-sm text-muted-foreground/80 max-w-sm leading-relaxed font-semibold">
                        Aumente a conversão em até 80% con automações inteligentes via WhatsApp e triagens por IA.
                      </p>
                    </div>
                    <div className="w-20 h-20 rounded-[2.5rem] bg-muted/50 border border-border/50 flex items-center justify-center text-primary shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                      <Zap size={40} className="fill-primary/20" />
                    </div>
                  </div>
                  <button disabled className="w-full py-6 bg-muted/50 text-muted-foreground rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] border border-border/50 transition-all flex items-center justify-center gap-3 backdrop-blur-md">
                    <Lock size={16} />
                    <span>Em Homologação…</span>
                  </button>
                </div>
              </motion.div>

              <div className="rounded-[3rem] p-12 border border-dashed border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center gap-8 group opacity-40 hover:opacity-100 transition-all duration-700 hover:bg-muted/10">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center group-hover:rotate-45 transition-transform duration-1000">
                  <ShieldCheck size={48} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-muted-foreground">Security Protocol</h3>
                   <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">Criptografia Militar em Testes</p>
                </div>
              </div>
            </div>
          </section>
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

        <AnimatePresence>
          {isRenameModalOpen && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRenameModalOpen(false)}
                className="absolute inset-0 bg-[#0D1117]/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-10 shadow-2xl border border-border/50"
              >
                <div className="flex flex-col gap-6">
                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Renomear Plano</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Altere o nome identificador do nó</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary ml-1">Novo Nome</label>
                       <input 
                         autoFocus
                         type="text"
                         value={newName}
                         onChange={(e) => setNewName(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                         placeholder="Ex: Start, Pro, Unlimited..."
                         className="w-full bg-muted/50 border border-border/50 focus:border-primary/30 rounded-2xl px-6 py-4 outline-none focus:ring-0 text-sm font-bold transition-all"
                       />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setIsRenameModalOpen(false)}
                      className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleRename}
                      disabled={!newName.trim()}
                      className="flex-[2] py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
                    >
                      Salvar Nome
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
  );
};

export default HubPlans;
