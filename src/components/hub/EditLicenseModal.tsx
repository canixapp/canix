import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle, Trash2, ShieldCheck, Zap, Upload, Camera, Store, Globe, User, Phone, Mail, Lock, RefreshCw, Sparkles, CreditCard, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { insertAuditLog } from "@/services/auditLogService";

interface EditLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenant: any;
}

const EditLicenseModal = ({ isOpen, onClose, onSuccess, tenant }: EditLicenseModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    status: "active",
    plan_id: "",
    address: "",
    phone: "",
    logo_url: "",
    owner_name: "",
    owner_email: ""
  });
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isReleaseNotesModalOpen, setIsReleaseNotesModalOpen] = useState(false);

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
    if (isOpen && tenant) {
      setFormData({
        name: tenant.name || "",
        slug: tenant.slug || "",
        status: tenant.status || "active",
        plan_id: tenant.plan_id || "Starter",
        address: "", 
        phone: "",
        logo_url: "",
        owner_name: "",
        owner_email: ""
      });

      const fetchPetshopData = async () => {
        const { data } = await supabase
          .from('petshops')
          .select('address, phone, logo_url, settings')
          .eq('id', tenant.id)
          .single();
        
        if (data) {
          const settings = data.settings as any;
          setFormData(prev => ({
            ...prev,
            address: data.address || "",
            phone: data.phone || "",
            logo_url: data.logo_url || "",
            owner_name: settings?.owner?.name || "",
            owner_email: settings?.owner?.email || ""
          }));
        }
      };
      
      fetchPetshopData();
      fetchPlans();
    }
  }, [isOpen, tenant]);

  async function fetchPlans() {
    const { data } = await (supabase.from as any)('plans').select('*');
    if (data) setPlans(data);
  }

  const handleFile = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${tenant.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success("Logo atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    handleFile(e.target.files[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Alerta de Mudança de Slug
    if (formData.slug !== tenant.slug) {
      const confirmSlug = window.confirm(
        "ATENÇÃO: Você está alterando o SLUG (URL) deste petshop.\n\n" +
        "Isso mudará o endereço de acesso do cliente. " +
        "Tem certeza que deseja continuar?"
      );
      if (!confirmSlug) return;
    }

    setLoading(true);

    try {
      // 1. Update Tenants Table (SaaS Hub)
      const { error: tenantErr } = await (supabase.from as any)('tenants')
        .update({
          name: formData.name,
          slug: formData.slug.toLowerCase().trim(),
          status: formData.status,
          plan_id: formData.plan_id,
        })
        .eq('id', tenant.id);

      if (tenantErr) throw tenantErr;

      // 2. Update Petshops Table (Operations)
      const { data: currentPetshop } = await supabase
        .from('petshops')
        .select('settings')
        .eq('id', tenant.id)
        .single();
      
      const updatedSettings = {
        ...(currentPetshop?.settings as any || {}),
        owner: {
          name: formData.owner_name,
          email: formData.owner_email,
          phone: formData.phone
        }
      };

      const { error: petshopErr } = await supabase
        .from('petshops')
        .update({
          name: formData.name,
          slug: formData.slug.toLowerCase().trim(),
          address: formData.address,
          phone: formData.phone,
          logo_url: formData.logo_url,
          settings: updatedSettings
        })
        .eq('id', tenant.id);

      if (petshopErr) throw petshopErr;

      // 3. Update Audit Logs
      if (user) {
        insertAuditLog({
          actor_id: user.id,
          action: 'update',
          entity: 'license',
          target_id: tenant.id,
          details: { 
            name: formData.name,
            slug_changed: formData.slug !== tenant.slug
          }
        });
      }

      toast.success("Licença atualizada!", {
        description: "As alterações foram replicadas com sucesso."
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao atualizar", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!formData.owner_email) {
      toast.error("E-mail não encontrado para recuperação.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.owner_email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Link enviado!", {
        description: `Um e-mail de recuperação foi enviado para ${formData.owner_email}.`
      });
    } catch (error: any) {
      toast.error("Erro ao enviar recuperação", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("CUIDADO: Isso removerá permanentemente este petshop e todos os seus dados. Deseja continuar?")) return;
    
    setLoading(true);
    try {
       // Primeiro deletar da tabela operacional (opcional dependendo do CASCADE)
       const { error: errorPetshop, count: countPetshop } = await supabase.from('petshops').delete({ count: 'exact' }).eq('id', tenant.id);
       
       const { error: errorTenant, count: countTenant } = await (supabase.from as any)('tenants').delete({ count: 'exact' }).eq('id', tenant.id);
       
       if (errorTenant) throw errorTenant;

       // Se count for 0 ou null, significa que a RLS bloqueou a deleção
       if (!countTenant && !countPetshop) {
         throw new Error("A deleção foi negada pelas políticas de segurança do banco (RLS). Verifique se o seu usuário tem permissão de exclusão.");
       }

       toast.success("Licença removida com sucesso");
       onSuccess();
       onClose();
    } catch (error: any) {
       console.error("Erro ao remover:", error);
       toast.error("Erro ao remover licença", {
         description: error.message || "Tente novamente mais tarde."
       });
    } finally {
       setLoading(false);
    }
  };

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

  if (!isOpen || !tenant) return null;

  return (
    <AnimatePresence>
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
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#2F7FD3]/10 to-[#63C3D8]/10 pointer-events-none" />
            
            <div className="p-8 sm:p-10 relative">
              <header className="flex justify-between items-start gap-4 mb-10">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[#2F7FD3] mb-1">
                     <ShieldCheck size={14} aria-hidden="true" className="shrink-0" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Central de Comando • Licença</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight dark:text-white italic truncate">Editar Licença</h2>
                  <p className="text-[#6C7A73] text-[9px] font-black uppercase tracking-widest mt-1 italic flex items-center gap-1.5 truncate">
                    <Zap size={10} className="text-[#2F7FD3] shrink-0" /> ID: {tenant.id.slice(0, 8)}…
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  aria-label="Fechar modal"
                  className="p-3 bg-gray-50 dark:bg-gray-800 text-[#6C7A73] rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-[#2F7FD3] focus-visible:ring-offset-2 outline-none shrink-0"
                >
                  <X size={20} />
                </button>
              </header>

              {/* Avatar Section with Drag & Drop */}
              <div className="flex flex-col items-center mb-10">
                 <div 
                    className={`relative group cursor-pointer transition-transform active:scale-95 ${isDragging ? "scale-105" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                 >
                    <div className={`w-28 h-28 rounded-[2.5rem] bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden border-2 border-dashed transition-all duration-300 ${
                      isDragging ? "border-[#2F7FD3] bg-[#2F7FD3]/5" : "border-gray-200 dark:border-gray-700 group-hover:border-[#2F7FD3]/50"
                    }`}>
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo do Petshop" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                          <Camera size={32} />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Arraste aqui</span>
                        </div>
                      )}
                    </div>
                    <label 
                      aria-label="Upload de logo"
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#2F7FD3] text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-[#1E3A8A] transition-colors focus-within:ring-2 focus-within:ring-white"
                    >
                      <Upload size={18} />
                      <input type="file" className="hidden" aria-hidden="true" accept="image/*" onChange={handleUploadLogo} disabled={uploading} />
                    </label>
                    {uploading && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2.5rem]"
                      >
                        <div className="w-6 h-6 border-2 border-[#2F7FD3] border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-[8px] font-black text-[#2F7FD3] uppercase tracking-widest">Enviando…</span>
                      </motion.div>
                    )}
                 </div>
                 <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] mt-5">Identidade Visual</p>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
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
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                    />
                  </div>

                  {/* Slug / URL */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                       <Globe size={12} className="text-[#2F7FD3]" /> Slug (URL de Acesso)
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
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
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
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
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
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                    />
                  </div>

                  {/* Gestão de Senha */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                      <Lock size={12} className="text-[#2F7FD3]" /> Segurança da Conta
                    </label>
                    <button
                      type="button"
                      onClick={handlePasswordRecovery}
                      className="w-full px-6 py-4 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center justify-center gap-2 group"
                    >
                      <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                      Enviar Link de Recuperação
                    </button>
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
                        <option value="">Nenhum Plano</option>
                        {plans.map(plan => (
                           <option key={plan.id} value={plan.id}>{plan.name} (R$ {plan.price})</option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                         <Sparkles size={16} />
                      </div>
                    </div>
                  </div>

                   {/* Status */}
                   <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1 flex items-center gap-2">
                      <Activity size={12} className="text-[#2F7FD3]" /> Status da Licença
                    </label>
                    <div className="relative group">
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none appearance-none font-black italic tracking-tight"
                      >
                        <option value="active">Ativa</option>
                        <option value="inactive">Inativa (Suspensa)</option>
                        <option value="trial">Trial (Degustação)</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                         <ShieldCheck size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-8 py-5 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-[2rem] font-black uppercase tracking-widest text-[9px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 group"
                  >
                    <Trash2 size={18} /> Remover Licença
                  </button>
                  <button
                    disabled={loading || uploading}
                    type="submit"
                    className={`flex-1 py-5 bg-gradient-to-br from-[#1E3A8A] to-[#2F7FD3] text-white rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-blue-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} /> Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditLicenseModal;
