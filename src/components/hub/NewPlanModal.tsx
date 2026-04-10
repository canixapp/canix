import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, CreditCard, Sparkles, Shield, CheckCircle2, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewPlanModal = ({ isOpen, onClose, onSuccess }: NewPlanModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    max_pets: "",
    max_appointments_month: "",
    features: [""]
  });

  const handleAddFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ""] }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await (supabase.from as any)('plans').insert([{
        name: formData.name,
        price: parseFloat(formData.price),
        price_monthly: parseFloat(formData.price),
        max_pets: formData.max_pets ? parseInt(formData.max_pets) : null,
        max_appointments_month: formData.max_appointments_month ? parseInt(formData.max_appointments_month) : null,
        features: formData.features.filter(f => f.trim() !== ""),
        is_active: true
      }]);

      if (error) throw error;

      toast.success("Plano criado com sucesso!");
      onSuccess();
      onClose();
      setFormData({ name: "", price: "", max_pets: "", max_appointments_month: "", features: [""] });
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
                <h2 className="text-2xl font-black tracking-tight dark:text-white leading-tight italic">Novo Plano Comercial</h2>
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
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                    <List size={12} className="text-[#2F7FD3]" /> Funcionalidades Inclusas
                  </label>
                  <button 
                    type="button"
                    onClick={handleAddFeature}
                    className="text-[10px] font-black text-[#2F7FD3] uppercase tracking-widest hover:underline"
                  >
                    + Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder={`Funcionalidade ${index + 1}`}
                        className="flex-1 px-5 py-3 bg-gray-50 dark:bg-gray-800/40 border-none rounded-xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none text-sm"
                      />
                      {formData.features.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="p-3 text-red-400 hover:text-red-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      )}
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
                    <span>Criar Plano Comercial</span>
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
