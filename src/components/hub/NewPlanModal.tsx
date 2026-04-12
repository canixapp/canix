import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, CreditCard, Sparkles, Shield, CheckCircle2, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan?: any; // Novo: Prop opcional para edição
}

const MODULES = [
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
        toast.success("Plano atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([planData]);
        if (error) throw error;
        toast.success("Plano criado com sucesso!");
      }

      onSuccess();
      onClose();
      setFormData({ name: "", price: "", max_pets: "", max_appointments_month: "", max_users: "", support_tier: "Standard", features: [] });
    } catch (error: any) {
      toast.error("Erro ao criar plano", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const primaryGradient = "from-[#1E3A8A] to-[#2F7FD3]";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0D1117]/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#161B22] rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]"
          >
            <div className={`h-24 bg-gradient-to-br ${primaryGradient} opacity-5 absolute top-0 left-0 w-full pointer-events-none`} />
            
            <header className="p-8 pb-4 flex justify-between items-start relative">
              <div>
                <div className="flex items-center gap-2 text-[#2F7FD3] mb-1">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Canix Hub Business</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight dark:text-white leading-tight italic">
                  {plan ? "Editar Plano Comercial" : "Novo Plano Comercial"}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-50 dark:bg-gray-800 text-[#6C7A73] rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-4 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2 flex items-center gap-2">
                    <Shield size={12} className="text-[#2F7FD3]" /> Nome do Plano
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Plano Base"
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2 flex items-center gap-2">
                    <CreditCard size={12} className="text-[#2F7FD3]" /> Valor Mensal (R$)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="199.90"
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#2F7FD3]" /> Limite de Pets
                  </label>
                  <input
                    type="number"
                    value={formData.max_pets}
                    onChange={(e) => setFormData({ ...formData, max_pets: e.target.value })}
                    placeholder="50 (opcional)"
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#2F7FD3]" /> Limite Agendamentos
                  </label>
                  <input
                    type="number"
                    value={formData.max_appointments_month}
                    onChange={(e) => setFormData({ ...formData, max_appointments_month: e.target.value })}
                    placeholder="200 (opcional)"
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2 flex items-center gap-2">
                    <Shield size={12} className="text-[#2F7FD3]" /> Limite Usuários
                  </label>
                  <input
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                    placeholder="10 (opcional)"
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2 flex items-center gap-2">
                    <Sparkles size={12} className="text-[#2F7FD3]" /> Nível de Suporte
                  </label>
                  <select
                    value={formData.support_tier}
                    onChange={(e) => setFormData({ ...formData, support_tier: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium appearance-none"
                  >
                    <option value="Standard">Standard (Ticket)</option>
                    <option value="Priority">Priority (Chat)</option>
                    <option value="Dedicated">Dedicated (Manager)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2 flex items-center gap-2">
                  <List size={12} className="text-[#2F7FD3]" /> Configuração de Módulos (Gated)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Base', 'Avançado'].map(category => (
                    <div key={category} className="space-y-3">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter px-2">{category}</p>
                      <div className="space-y-2">
                        {MODULES.filter(m => m.category === category).map(module => (
                          <label 
                            key={module.id}
                            className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                              formData.features.includes(module.id)
                                ? 'bg-blue-50/50 dark:bg-blue-600/10 border-blue-200 dark:border-blue-900/40 text-[#2F7FD3]' 
                                : 'bg-gray-50/50 dark:bg-gray-800/30 border-transparent text-gray-400 opacity-60'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              className="hidden"
                              checked={formData.features.includes(module.id)}
                              onChange={() => handleToggleModule(module.id)}
                            />
                            {formData.features.includes(module.id) ? (
                              <div className="w-4 h-4 bg-[#2F7FD3] rounded-md flex items-center justify-center">
                                <CheckCircle2 size={10} className="text-white" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-md border-2 border-gray-300 dark:border-gray-700" />
                            )}
                            <span className="text-[11px] font-black uppercase tracking-tight">{module.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <footer className="p-8 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={(e) => handleSubmit(e as any)}
                disabled={loading}
                className={`w-full py-4 bg-gradient-to-br ${primaryGradient} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>{plan ? "Salvar Alterações" : "Criar Plano Comercial"}</span>
                  </>
                )}
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewPlanModal;
