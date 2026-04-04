import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, Clock, CreditCard, Palette, CheckCircle2, 
  ChevronRight, ChevronLeft, Instagram, MessageSquare,
  MapPin, Building2, Sparkles, X
} from "lucide-react";
import { usePetshop } from "@/contexts/PetshopContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingWizard = ({ isOpen, onClose }: OnboardingWizardProps) => {
  const { petshop, updatePetshop, updateSettings } = usePetshop();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Step 1
    cnpj_cpf: petshop?.cnpj_cpf || "",
    address: petshop?.address || "",
    whatsapp: petshop?.phone || "",
    instagram: petshop?.instagram_url || "",
    // Step 2
    hours: petshop?.hours || "08:00 - 18:00",
    openDays: petshop?.settings?.openDaysDefault || ["seg", "ter", "qua", "qui", "sexta"],
    // Step 3
    payments: petshop?.settings?.paymentMethods || ["Cartão", "Pix", "Dinheiro"],
    // Step 4
    primaryColor: petshop?.theme || "emerald"
  });

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps + 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Salvar dados básicos
      await updatePetshop({
        cnpj_cpf: formData.cnpj_cpf,
        address: formData.address,
        phone: formData.whatsapp,
        instagram_url: formData.instagram,
        hours: formData.hours,
        theme: formData.primaryColor,
        onboarding_completed: true
      } as any);

      // 2. Salvar configurações
      await updateSettings({
        openDaysDefault: formData.openDays,
        paymentMethods: formData.payments
      });

      toast.success("Sistema configurado com sucesso!", {
        description: "Bem-vindo ao Canix 🚀"
      });
      
      setStep(5); // Success step
    } catch (error) {
      toast.error("Erro ao finalizar configuração");
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = async () => {
    if (window.confirm("Deseja configurar depois? Algumas funções podem estar limitadas.")) {
      await updatePetshop({ onboarding_completed: true } as any);
      onClose();
    }
  };

  if (!isOpen) return null;

  const renderStepIcon = (s: number, icon: any) => (
    <div className={`p-3 rounded-2xl transition-all ${step === s ? 'bg-[#02BF93] text-white shadow-lg' : step > s ? 'bg-[#02BF93]/20 text-[#02BF93]' : 'bg-gray-100 text-gray-400'}`}>
      {React.createElement(icon, { size: 20 })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0D1117]/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-[#161B22] w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        {/* Header / Progress */}
        <div className="p-8 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {renderStepIcon(1, Store)}
            <div className="w-8 h-px bg-gray-200 dark:bg-gray-800" />
            {renderStepIcon(2, Clock)}
            <div className="w-8 h-px bg-gray-200 dark:bg-gray-800" />
            {renderStepIcon(3, CreditCard)}
            <div className="w-8 h-px bg-gray-200 dark:bg-gray-800" />
            {renderStepIcon(4, Palette)}
          </div>
          
          <button onClick={skipOnboarding} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <header>
                  <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Seu Negócio</h3>
                  <p className="text-gray-500 mt-2">Dados fundamentais para notas e identificação.</p>
                </header>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">CNPJ / CPF</label>
                    <input 
                      value={formData.cnpj_cpf}
                      onChange={e => setFormData({...formData, cnpj_cpf: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#02BF93]" 
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Instagram</label>
                    <div className="relative">
                      <input 
                        value={formData.instagram}
                        onChange={e => setFormData({...formData, instagram: e.target.value})}
                        className="w-full pl-6 pr-12 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#02BF93]" 
                        placeholder="@seupetshop"
                      />
                      <Instagram size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Endereço Completo</label>
                  <div className="relative">
                    <input 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#02BF93]" 
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                    />
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#02BF93]" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <header>
                  <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Operação</h3>
                  <p className="text-gray-500 mt-2">Como seu petshop funciona no dia a dia.</p>
                </header>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Horário Padrão</label>
                    <input 
                      value={formData.hours}
                      onChange={e => setFormData({...formData, hours: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#02BF93]" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Dias de Atendimento</label>
                    <div className="flex flex-wrap gap-2">
                      {["seg", "ter", "qua", "qui", "sex", "sab", "dom"].map(day => (
                        <button 
                          key={day}
                          onClick={() => {
                            const newDays = formData.openDays.includes(day) 
                              ? formData.openDays.filter(d => d !== day)
                              : [...formData.openDays, day];
                            setFormData({...formData, openDays: newDays});
                          }}
                          className={`px-4 py-2 rounded-xl border-2 transition-all font-bold text-xs uppercase ${formData.openDays.includes(day) ? 'bg-[#02BF93] border-[#02BF93] text-white' : 'bg-gray-50 border-transparent text-gray-400'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <header>
                  <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Financeiro</h3>
                  <p className="text-gray-500 mt-2">Defina como você recebe dos seus clientes.</p>
                </header>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Formas de Pagamento Aceitas</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Cartão de Crédito", "Cartão de Débito", "Pix", "Dinheiro", "Boleto"].map(method => (
                      <button 
                        key={method}
                        onClick={() => {
                          const newMethods = formData.payments.includes(method)
                            ? formData.payments.filter(m => m !== method)
                            : [...formData.payments, method];
                          setFormData({...formData, payments: newMethods});
                        }}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${formData.payments.includes(method) ? 'border-[#02BF93] bg-[#D2F5EC]/20 text-[#006C51]' : 'border-transparent bg-gray-50 text-gray-400'}`}
                      >
                        <span className="font-bold text-sm">{method}</span>
                        {formData.payments.includes(method) && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <header>
                  <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Identidade</h3>
                  <p className="text-gray-500 mt-2">Sua marca, suas cores.</p>
                </header>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Cor de Destaque</label>
                    <div className="flex gap-4">
                      {['emerald', 'blue', 'purple', 'rose'].map(color => (
                        <button 
                          key={color}
                          onClick={() => setFormData({...formData, primaryColor: color})}
                          className={`w-12 h-12 rounded-2xl transition-all shadow-lg ${
                            color === 'emerald' ? 'bg-emerald-500' : 
                            color === 'blue' ? 'bg-blue-500' : 
                            color === 'purple' ? 'bg-purple-500' : 'bg-rose-500'
                          } ${formData.primaryColor === color ? 'ring-4 ring-offset-4 ring-gray-200 scale-110' : 'opacity-60 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Logo do Petshop</p>
                    <button className="mt-4 px-6 py-2 bg-white dark:bg-gray-800 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all">
                      Upload Logo
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-12"
              >
                <div className="w-24 h-24 bg-[#D2F5EC] text-[#02BF93] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-[#02BF93]/20">
                  <CheckCircle2 size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-4xl font-bold text-gray-900 dark:text-white">Tudo Pronto! 🚀</h3>
                  <p className="text-gray-500">Sua plataforma está configurada e pronta para crescer.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="px-12 py-5 bg-gradient-to-br from-[#006C51] to-[#02BF93] text-white rounded-3xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-[#02BF93]/30 hover:scale-[1.05] transition-all"
                >
                  Ir para o Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        {step <= totalSteps && (
          <div className="p-8 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
            <button 
              onClick={prevStep}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ChevronLeft size={16} /> Voltar
            </button>
            
            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
              Etapa {step} de {totalSteps}
            </div>

            <button 
              disabled={loading}
              onClick={step === totalSteps ? handleFinish : nextStep}
              className="flex items-center gap-2 px-8 py-4 bg-[#141B2B] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#02BF93] transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? "Salvando..." : step === totalSteps ? "Concluir" : "Avançar"} <ChevronRight size={16} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;
