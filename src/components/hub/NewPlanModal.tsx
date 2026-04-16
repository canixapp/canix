import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, CreditCard, Sparkles, Shield, CheckCircle2, List, Zap, Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan?: any; // Novo: Prop opcional para edição
}

export const MODULES = [
  { id: 'agendamentos', label: 'Agenda & Horários', category: 'Base' },
  { id: 'pacotes', label: 'Pacotes de Serviço', category: 'Base' },
  { id: 'clientes', label: 'Base de Clientes (CRM)', category: 'Base' },
  { id: 'pets', label: 'Prontuário de Pets', category: 'Base' },
  { id: 'servicos', label: 'Serviços e Valores', category: 'Base' },
  { id: 'moderacao', label: 'Galeria e Avaliações', category: 'Base' },
  { id: 'audit-log', label: 'Registro de Alterações', category: 'Base' },
  { id: 'financeiro', label: 'Controle Financeiro', category: 'Avançado' },
  { id: 'estoque', label: 'Gestão de Estoque', category: 'Avançado' },
  { id: 'relatorios', label: 'Relatórios & BI', category: 'Avançado' },
  { id: 'lembretes', label: 'Lembretes Inteligentes', category: 'Avançado' },
  { id: 'marketing', label: 'Marketing & CRM', category: 'Avançado' }
];

const NewPlanModal = ({ isOpen, onClose, onSuccess, plan }: NewPlanModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    max_pets: "",
    max_appointments_month: "",
    max_users: "",
    support_tier: "Standard",
    features: [] as string[]
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        price: plan.price?.toString() || "",
        max_pets: plan.max_pets?.toString() || "",
        max_appointments_month: plan.max_appointments_month?.toString() || "",
        max_users: plan.max_users?.toString() || "",
        support_tier: plan.support_tier || "Standard",
        features: Array.isArray(plan.features) ? plan.features : []
      });
    } else {
      setFormData({
        name: "",
        price: "",
        max_pets: "",
        max_appointments_month: "",
        max_users: "",
        support_tier: "Standard",
        features: []
      });
    }
  }, [plan, isOpen]);

  const handleToggleModule = (moduleId: string) => {
    setFormData(prev => {
      const isSelected = prev.features.includes(moduleId);
      return {
        ...prev,
        features: isSelected 
          ? prev.features.filter(id => id !== moduleId) 
          : [...prev.features, moduleId]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const planData = {
        name: formData.name,
        price: parseFloat(formData.price),
        price_monthly: parseFloat(formData.price),
        max_pets: formData.max_pets ? parseInt(formData.max_pets) : null,
        max_appointments_month: formData.max_appointments_month ? parseInt(formData.max_appointments_month) : null,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        support_tier: formData.support_tier,
        features: formData.features.filter(f => f.trim() !== ""),
        is_active: true
      };

      if (plan?.id) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', plan.id);
        if (error) throw error;
        toast.success("Plano atualizado!", { icon: "🛸" });
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([planData]);
        if (error) throw error;
        toast.success("Plano propagado com sucesso!", { icon: "🚀" });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Critical System Error", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            className="relative w-full max-w-3xl bg-card/60 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-border/50 flex flex-col max-h-[92vh]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#2F7FD3] to-transparent opacity-50" />
            
            <header className="px-12 pt-12 pb-8 flex justify-between items-start relative">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2rem] bg-muted/50 border border-border/50 flex items-center justify-center text-primary shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  <Cpu size={32} strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary">
                    <Zap size={10} className="fill-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Management Console</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground leading-none italic uppercase">
                    {plan ? "Update Node" : "Deploy Protocol"}
                  </h2>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-4 bg-muted/40 text-muted-foreground rounded-full hover:text-foreground hover:bg-muted/80 transition-all border border-border/50"
              >
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-12 py-8 space-y-12 custom-scrollbar no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Plan Identifier</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: ENTERPRISE_V1"
                    className="w-full px-8 py-5 bg-background/50 border border-border/50 rounded-3xl focus:border-primary/50 transition-all text-foreground outline-none font-bold placeholder:text-muted-foreground/20 text-lg tracking-tight"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 ml-2">Value (BRL / Mês)</label>
                  <div className="relative group/input">
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-xs font-black text-primary/40 group-focus-within/input:text-primary transition-colors">R$</div>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-16 pr-8 py-5 bg-background/50 border border-border/50 rounded-3xl focus:border-primary/50 transition-all text-foreground outline-none font-black tabular-nums text-2xl tracking-tighter"
                    />
                  </div>
                </div>

                {[
                  { id: 'max_pets', label: 'Pet Capacity', icon: Shield },
                  { id: 'max_appointments_month', label: 'Booking Limit', icon: CheckCircle2 },
                  { id: 'max_users', label: 'Operator Limit', icon: Shield },
                ].map(field => (
                  <div key={field.id} className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">{field.label}</label>
                    <input
                      type="number"
                      value={(formData as any)[field.id]}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      placeholder="Unlimited (∞)"
                      className="w-full px-8 py-5 bg-background/50 border border-border/50 rounded-3xl focus:border-primary/50 transition-all text-foreground outline-none font-bold placeholder:text-muted-foreground/20 tabular-nums text-lg"
                    />
                  </div>
                ))}

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Support Tier</label>
                  <select
                    value={formData.support_tier}
                    onChange={(e) => setFormData({ ...formData, support_tier: e.target.value })}
                    className="w-full px-8 py-5 bg-background/50 border border-border/50 rounded-3xl focus:border-primary/50 transition-all text-foreground outline-none font-bold appearance-none cursor-pointer text-lg"
                  >
                    <option value="Standard">Standard (24h)</option>
                    <option value="Priority">Priority (1h)</option>
                    <option value="Dedicated">Dedicated (Real-time)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-8 pb-12">
                <div className="flex items-center gap-6">
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Module Access Control</span>
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  {['Base', 'Avançado'].map(category => (
                    <div key={category} className="space-y-6">
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <p className="text-[11px] font-black text-foreground uppercase tracking-tight">{category}</p>
                      </div>
                      <div className="space-y-3">
                        {MODULES.filter(m => m.category === category).map(module => (
                          <label 
                            key={module.id}
                            className={`flex items-center justify-between p-5 rounded-3xl cursor-pointer border transition-all duration-300 group ${
                              formData.features.includes(module.id)
                                ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/5' 
                                : 'bg-background/40 border-border/50 text-muted-foreground hover:border-primary/20 hover:bg-background/60 hover:-translate-y-0.5'
                            }`}
                          >
                            <span className={`text-[11px] font-bold uppercase leading-tight transition-colors ${
                              formData.features.includes(module.id) ? 'text-primary' : ''
                            }`}>{module.label}</span>
                            <div className="relative">
                              <input 
                                type="checkbox"
                                className="sr-only"
                                checked={formData.features.includes(module.id)}
                                onChange={() => handleToggleModule(module.id)}
                              />
                              <div className={`w-6 h-6 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
                                formData.features.includes(module.id)
                                  ? 'bg-primary border-primary scale-110' 
                                  : 'border-border/60 group-hover:border-primary/40'
                              }`}>
                                {formData.features.includes(module.id) && <CheckCircle2 size={14} className="text-white fill-white/20" />}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <footer className="p-12 bg-muted/20 border-t border-border/30">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => handleSubmit(e as any)}
                disabled={loading}
                className={`w-full py-6 bg-primary text-primary-foreground rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    <span>{plan ? "Commit Protocol" : "Deploy SaaS Node"}</span>
                  </>
                )}
              </motion.button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewPlanModal;
