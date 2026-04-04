import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle, Trash2, ShieldCheck, Zap, Upload, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenant: any;
}

const EditLicenseModal = ({ isOpen, onClose, onSuccess, tenant }: EditLicenseModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    status: "active",
    plan_id: "",
    address: "",
    phone: "",
    logo_url: ""
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
        status: tenant.status || "active",
        plan_id: tenant.plan_id || "Starter",
        address: "", 
        phone: "",
        logo_url: ""
      });

      const fetchPetshopData = async () => {
        const { data } = await supabase
          .from('petshops')
          .select('address, phone, logo_url')
          .eq('id', tenant.id)
          .single();
        
        if (data) {
          setFormData(prev => ({
            ...prev,
            address: data.address || "",
            phone: data.phone || "",
            logo_url: data.logo_url || ""
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
    setLoading(true);

    try {
      const { error: tenantErr } = await (supabase.from as any)('tenants')
        .update({
          name: formData.name,
          status: formData.status,
          plan_id: formData.plan_id,
        })
        .eq('id', tenant.id);

      if (tenantErr) throw tenantErr;

      const { error: petshopErr } = await supabase
        .from('petshops')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          logo_url: formData.logo_url
        })
        .eq('id', tenant.id);

      if (petshopErr) throw petshopErr;

      toast.success("Licença atualizada!", {
        description: "As alterações foram replicadas para o petshop."
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao atualizar", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("CUIDADO: Isso removerá permanentemente este petshop e todos os seus dados. Deseja continuar?")) return;
    
    setLoading(true);
    try {
       // Primeiro deletar da tabela operacional (opcional dependendo do CASCADE)
       await supabase.from('petshops').delete().eq('id', tenant.id);
       
       const { error } = await (supabase.from as any)('tenants').delete().eq('id', tenant.id);
       if (error) throw error;

       toast.success("Licença removida com sucesso");
       onSuccess();
       onClose();
    } catch (error) {
       toast.error("Erro ao remover licença");
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

              <form onSubmit={handleUpdate} className="space-y-8">
                {/* Seção: Identificação */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#2F7FD3] uppercase tracking-[0.2em]">
                    <span className="w-4 h-[1px] bg-[#2F7FD3]/30" /> Dados Operacionais
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="shop-name" className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2">Nome do Estabelecimento</label>
                    <input
                      id="shop-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: PetCão Boutique…"
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/30 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="shop-address" className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2">Endereço de Faturamento</label>
                    <input
                      id="shop-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/30 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                      placeholder="Rua, Número, Bairro, Cidade…"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="shop-phone" className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2">Contato Estratégico</label>
                    <input
                      id="shop-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/30 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none font-medium"
                      placeholder="(11) 99999-9999…"
                    />
                  </div>
                </div>

                {/* Seção: Contrato */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#2F7FD3] uppercase tracking-[0.2em]">
                    <span className="w-4 h-[1px] bg-[#2F7FD3]/30" /> Gestão de Licenciamento
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2">Status do Tenant</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/30 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none appearance-none font-black italic tracking-tight"
                      >
                        <option value="active">Ativa</option>
                        <option value="inactive">Inativa (Suspensa)</option>
                        <option value="trial">Trial (Degustação)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-2">Plano Vigente</label>
                      <select
                        value={formData.plan_id}
                        onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/30 border-none rounded-2xl focus:ring-2 focus:ring-[#2F7FD3]/20 transition-all dark:text-white outline-none appearance-none font-black italic tracking-tight"
                      >
                        <option value="">Nenhum</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.id}>{plan.name} • R$ {plan.price}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleDelete}
                    aria-label="Remover esta licença permanentemente"
                    className="w-full sm:w-auto px-6 py-4 bg-red-50 dark:bg-red-500/5 text-red-600 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <Trash2 size={16} className="group-hover:scale-110" /> Remover Licença
                  </button>
                  <button
                    disabled={loading || uploading}
                    type="submit"
                    className="flex-1 py-4 bg-[#2F7FD3] hover:bg-[#1E3A8A] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando…
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Salvar Alterações
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
