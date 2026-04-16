import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, ShieldCheck, User, Store, Globe, Sparkles, CreditCard, Phone, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { insertAuditLog } from "@/services/auditLogService";

interface NewLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewLicenseModal = ({ isOpen, onClose, onSuccess }: NewLicenseModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    owner_name: "",
    owner_email: "",
    owner_password: "",
    phone: "",
    plan_id: ""
  });

  // Bloqueio de Scroll do Body (Background) - Reforçado para Drawer
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Ajuste para evitar "jump" no layout de alguns browsers mobile
      document.body.style.paddingRight = '0px'; 
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  async function fetchPlans() {
    try {
      const { data, error } = await (supabase.from as any)('plans').select('*');
      if (error) throw error;
      setPlans(data || []);
      if (data && data.length > 0 && !formData.plan_id) {
        setFormData(prev => ({ ...prev, plan_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  }

  // Sugestão automática de Slug (Mágica)
  useEffect(() => {
    if (formData.name && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: formData.name.toLowerCase()
          .trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove acentos
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
      }));
    }
  }, [formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const slug = formData.slug.toLowerCase().trim();
      
      // 1. Criar o Petshop (Tabela operacional)
      const trialDays = 7;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
      const selectedPlan = plans.find(p => p.id === formData.plan_id);

      const { data: petshopData, error: petshopError } = await supabase
        .from('petshops')
        .insert([{
          name: formData.name,
          slug: slug,
          phone: formData.phone,
          theme: 'emerald',
          onboarding_completed: false,
          settings: {
            owner: {
              name: formData.owner_name,
              email: formData.owner_email,
              phone: formData.phone
            },
            plan: {
              id: formData.plan_id,
              name: selectedPlan?.name || 'Trial',
              trial_ends_at: trialEndsAt.toISOString(),
              active: true
            }
          }
        } as any])
        .select()
        .single();

      if (petshopError) throw petshopError;

      const petshopId = petshopData.id;

      // 2. Criar a Licença no HUB (Tabela de gestão tenants)
      const { error: tenantError } = await (supabase.from as any)('tenants')
        .insert([{
          id: petshopId,
          name: formData.name,
          slug: slug,
          plan_id: formData.plan_id || null,
          status: 'active'
        }]);

      if (tenantError) throw tenantError;

      // 3. Criar a Conta de Usuário (Auth) para o Dono
      const { error: authError } = await supabase.auth.signUp({
        email: formData.owner_email,
        password: formData.owner_password,
        options: {
          data: {
            name: formData.owner_name,
            role: 'admin',
            petshop_id: petshopId
          }
        }
      });

      if (authError) {
        console.warn('Auth signup error (maybe email exists):', authError.message);
      }

      // Registrar log de auditoria
      if (user) {
        insertAuditLog({
          actor_id: user.id,
          action: 'insert',
          entity: 'license',
          target_id: petshopId,
          details: { name: formData.name, slug: slug, plan_id: formData.plan_id }
        });
      }

      toast.success("Licença criada com sucesso!", {
        description: "Redirecionando para o onboarding..."
      });
      
      onSuccess();
      
      // Mágica do Redirecionamento Automático
      setTimeout(() => {
        window.location.href = `/?tenant=${slug}&onboarding=true`;
      }, 1500);

    } catch (error: any) {
      toast.error("Erro ao criar licença", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const primaryGradient = "from-[#1E3A8A] to-[#2F7FD3]";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0D1117]/80 backdrop-blur-md"
          />
          
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            initial={{ opacity: 0, scale: 0.9, y: "100%" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#161B22] rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[92vh] flex flex-col"
          >
            {/* Mobile Handle & Drag Area - Topo Absoluto (Fora do Scroll) */}
            <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing sm:hidden z-50 shrink-0">
               <div className="w-12 h-1.5 bg-gray-200/50 dark:bg-gray-800/50 rounded-full" />
            </div>

            <div className="relative overflow-y-auto flex-1 custom-scrollbar">
               {/* Gradiente reposicionado para subir com o scroll */}
               <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-br ${primaryGradient} opacity-5 pointer-events-none`} />
               
               <div className="p-8 sm:p-10 relative">
              <header className="flex justify-between items-start gap-4 mb-8">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[#2F7FD3] mb-1">
                     <ShieldCheck size={14} className="shrink-0" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Canix Hub Admin</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-tight italic truncate">Nova Licença <span className="text-[#2F7FD3]">SaaS</span></h2>
                  <p className="text-[#64748B] text-[9px] font-black uppercase tracking-widest mt-1 opacity-60 truncate">Sistema escalável pronto para uso</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 bg-gray-50 dark:bg-gray-800 text-[#6C7A73] rounded-2xl hover:bg-gray-100 transition-colors shrink-0"
                >
                  <X size={20} />
                </button>

              </header>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nome do Petshop */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                      <Store size={12} className="text-[#2F7FD3]" /> Nome do Petshop
                    </label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: PetCão Matriz"
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium placeholder:text-gray-400"
                    />
                  </div>

                  {/* Slug / URL */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                      <Globe size={12} className="text-[#2F7FD3]" /> Slug (URL Amigável)
                    </label>
                    <div className="relative">
                      <input
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full pl-6 pr-24 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-bold text-sm tracking-tight"
                        placeholder="petcao-matriz"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#2F7FD3] uppercase tracking-tighter bg-white dark:bg-[#161B22] px-2 py-1 rounded-lg">
                        .canix.app.br
                      </div>
                    </div>
                  </div>

                  {/* Proprietário */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                      <User size={12} className="text-[#2F7FD3]" /> Proprietário
                    </label>
                    <input
                      required
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      placeholder="Nome completo"
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium placeholder:text-gray-400"
                    />
                  </div>

                  {/* Email Admin */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                      <Mail size={12} className="text-[#2F7FD3]" /> Email de Acesso
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.owner_email}
                      onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                      placeholder="exemplo@gmail.com"
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium placeholder:text-gray-400"
                    />
                  </div>

                  {/* Senha Admin */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                      <Lock size={12} className="text-[#2F7FD3]" /> Senha Inicial
                    </label>
                    <input
                      required
                      type="password"
                      value={formData.owner_password}
                      onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium placeholder:text-gray-400"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                      <Phone size={12} className="text-[#2F7FD3]" /> WhatsApp / Telefone
                    </label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium placeholder:text-gray-400"
                    />
                  </div>

                  {/* Plano */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                      <CreditCard size={12} className="text-[#2F7FD3]" /> Plano do Cliente
                    </label>
                    <div className="relative group">
                      <select
                        value={formData.plan_id}
                        onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none appearance-none font-black italic tracking-tight"
                      >
                        {plans.length === 0 ? (
                           <option value="">Carregando planos…</option>
                        ) : (
                          plans.map(plan => (
                             <option key={plan.id} value={plan.id}>{plan.name} (R$ {plan.price})</option>
                          ))
                        )}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                         <Sparkles size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            </div>

            {/* Footer Fixado */}
            <div className="p-8 sm:p-10 pt-0 sm:pt-0 bg-white dark:bg-[#161B22] border-t border-gray-100/50 dark:border-gray-800/50">
                <button
                  onClick={(e) => handleSubmit(e as any)}
                  disabled={loading}
                  className={`w-full py-5 bg-gradient-to-br ${primaryGradient} text-white rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Criar Licença</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                         <Globe size={18} />
                      </motion.div>
                    </>
                  )}
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewLicenseModal;
