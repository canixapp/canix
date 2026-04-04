import React, { useState, useEffect, useRef } from "react";
import { 
  ExternalLink, 
  CheckCircle2, 
  Lock, 
  Layers, 
  Zap,
  Copy,
  Activity,
  ArrowUpCircle,
  Settings2,
  AlertTriangle,
  History,
  ShieldCheck,
  Check,
  X,
  ShieldAlert,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const HubPrototype = () => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [prototypeData, setPrototypeData] = useState<any>(null);
  const [stats, setStats] = useState({ licenses: 0, active: 0, adoption: 0 });
  const [masterVersion, setMasterVersion] = useState("");
  const [currentMasterVersion, setCurrentMasterVersion] = useState("");
  
  // Modals state
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isReleaseNotesModalOpen, setIsReleaseNotesModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");

  // Bloqueio de Scroll do Body (Background) - Reforçado para Drawer
  useEffect(() => {
    if (isReleaseNotesModalOpen || isPasswordModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      document.body.style.paddingRight = '0px';
    };
  }, [isReleaseNotesModalOpen, isPasswordModalOpen]);

  useEffect(() => {
    fetchPrototypeInfo();
  }, []);

  const fetchPrototypeInfo = async () => {
    setLoading(true);
    try {
      const { data: petshop, error: pError } = await supabase
        .from('petshops')
        .select('*')
        .eq('slug', 'prototipo')
        .maybeSingle();

      if (pError) throw pError;
      
      if (petshop) {
        setPrototypeData(petshop);
        const version = (petshop as any).app_version || "1.0";
        setMasterVersion(version);
        setCurrentMasterVersion(version);
          
        const { data: allTenants, error: tError } = await (supabase.from as any)('tenants').select('*');
        if (tError) throw tError;

        const otherTenants = allTenants?.filter((t: any) => 
          (t.slug?.toLowerCase() !== 'prototipo')
        ) || [];
        
        const activeCount = otherTenants.filter((t: any) => t.status === 'active').length;
        const upToDateCount = otherTenants.filter((t: any) => t.app_version === version).length || 0;

        setStats({
          licenses: otherTenants.length,
          active: activeCount,
          adoption: otherTenants.length > 0 ? Math.round((upToDateCount / otherTenants.length) * 100) : 0
        });

        const settings = (petshop.settings as any) || {};
        if (settings.last_release_notes) {
          setReleaseNotes(settings.last_release_notes);
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar protótipo:", error);
      toast.error("Erro ao carregar dados do ambiente mestre");
    } finally {
      setLoading(false);
    }
  };

  const isMajorChange = (oldV: string, newV: string) => {
    const oldMajor = parseInt(String(oldV).split('.')[0]);
    const newMajor = parseInt(String(newV).split('.')[0]);
    return newMajor > oldMajor;
  };

  const handleStartSync = () => {
    // Agora solicita senha SEMPRE, conforme regra de segurança reforçada
    if (isMajorChange(currentMasterVersion, masterVersion) && !releaseNotes) {
      toast.error("Por favor, edite as notas de lançamento para esta versão major.");
      setIsReleaseNotesModalOpen(true);
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  const executeSync = async () => {
    setSyncing(true);
    try {
      if (masterVersion !== currentMasterVersion) {
         await supabase.from('petshops').update({ 
           app_version: masterVersion 
         } as any).eq('id', prototypeData.id);
      }

      const { data: tenants, error: tError } = await (supabase.from as any)('tenants')
        .select('id, slug, petshop_id')
        .eq('status', 'active')
        .neq('slug', 'prototipo');
        
      if (tError) throw tError;

      let successCount = 0;

      for (const tenant of (tenants || [])) {
        try {
          const targetPetshopId = tenant.petshop_id;

          await supabase.from('petshops').update({ 
             app_version: masterVersion 
          } as any).eq('id', targetPetshopId);
          
          await (supabase.from as any)('tenants').update({ 
             app_version: masterVersion 
          }).eq('slug', tenant.slug);

          if (releaseNotes && isMajorChange(currentMasterVersion, masterVersion)) {
             const { data: pData } = await supabase.from('petshops').select('settings').eq('id', targetPetshopId).single();
             const settings = (pData?.settings as any) || {};
             await supabase.from('petshops').update({
                settings: { ...settings, last_release_notes: releaseNotes }
             } as any).eq('id', targetPetshopId);
          }
          
          successCount++;
        } catch (err) {
          console.error(`Falha no tenant ${tenant.slug}:`, err);
        }
      }
      
      toast.success(`Propagação concluída: ${successCount} licenças atualizadas.`);
      setReleaseNotes("");
      fetchPrototypeInfo();
    } catch (error: any) {
      toast.error("Erro crítico na sincronização: " + error.message);
    } finally {
      setSyncing(false);
      setIsPasswordModalOpen(false);
      setPasswordInput("");
    }
  };

  const updateMasterLocal = async () => {
     if (!prototypeData) return;
     const settings = (prototypeData.settings as any) || {};
     await supabase
       .from('petshops')
       .update({ 
         app_version: masterVersion,
         settings: isMajorChange(currentMasterVersion, masterVersion) 
           ? { ...settings, last_release_notes: releaseNotes }
           : settings
       } as any)
       .eq('id', prototypeData.id);
       
     setCurrentMasterVersion(masterVersion);
     toast.success("Estado do protótipo salvo localmente.");
  };

  return (
    <div className="space-y-8 pb-20 text-[#141B2B] dark:text-white">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 font-primary">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden p-0 shrink-0">
            <img src="/src/assets/logoredondo.png" alt="Canix Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[#2F7FD3] mb-2 font-bold tracking-tighter uppercase text-[10px]">
              <Zap size={14} className="fill-[#2F7FD3]" />
              Console de Orquestração SaaS
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Central de Comando</h1>
            <p className="text-[#6C7A73] mt-2 max-w-xl text-xs md:text-sm leading-relaxed italic">
              Gerencie o estado global do ecossistema. Alterações feitas aqui no protótipo <span className="font-bold text-[#2F7FD3]">não afetam</span> as licenças até que você sincronize manualmente.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('/?tenant=prototipo', '_blank')} 
            className="rounded-2xl h-14 px-6 border border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-[#161B22] hover:bg-gradient-to-r hover:from-transparent hover:to-[#2F7FD3]/5 hover:border-[#2F7FD3]/30 hover:text-[#2F7FD3] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 font-bold uppercase tracking-widest text-[10px] flex-1 sm:flex-none focus-visible:ring-2 focus-visible:ring-[#2F7FD3] focus-visible:ring-offset-2 outline-none group"
          >
            <Eye size={18} aria-hidden="true" className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity" /> Ver Protótipo
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchPrototypeInfo} 
            className="rounded-2xl h-14 px-6 border border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-[#161B22] hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 font-bold uppercase tracking-widest text-[10px] flex-1 sm:flex-none focus-visible:ring-2 focus-visible:ring-[#2F7FD3] focus-visible:ring-offset-2 outline-none group"
          >
            <History size={18} aria-hidden="true" className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity" /> Histórico
          </Button>
        </div>
      </header>

      {/* Centralized Master Action */}
      <div className="flex w-full justify-center items-center py-4 sm:py-6">
        <HoldToSyncButton 
          onComplete={handleStartSync} 
          disabled={syncing || masterVersion === ""}
          loading={syncing}
          label={stats.active === 1 ? 'Sincronizar com 1 Licença' : `Sincronizar com ${stats.active} Licenças`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1 rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-[#161B22] flex flex-col">
          <CardContent className="p-8 flex-1 flex flex-col">
            <h3 className="text-sm font-bold mb-6 flex items-center gap-2 text-gray-400">
              <ArrowUpCircle size={18} /> ADOÇÃO DE VERSÃO
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center py-10">
               <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="88" cy="88" r="75" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                    <circle cx="88" cy="88" r="75" stroke="currentColor" strokeWidth="14" fill="transparent" strokeDasharray={471} strokeDashoffset={471 - (471 * stats.adoption) / 100} className="text-[#2F7FD3] transition-all duration-1000 ease-out" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black tracking-tighter">{stats.adoption}%</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Upgrade Rate</span>
                  </div>
               </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center text-sm p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[1.5rem]">
                 <span className="text-gray-500 font-bold uppercase text-[10px]">Versão Atual</span>
                 <Badge 
                   onClick={() => setIsReleaseNotesModalOpen(true)}
                   className="bg-[#E0F2FE] text-[#1E3A8A] border-none font-bold cursor-pointer hover:bg-[#BAE6FD] transition-colors"
                 >
                   v{currentMasterVersion}
                 </Badge>
              </div>
              <div className="flex justify-between items-center text-sm p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[1.5rem]">
                 <span className="text-gray-500 font-bold uppercase text-[10px]">Licenças Totais</span>
                 <span className="font-bold">{(stats as any).licenses}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[1.5rem]">
                 <span className="text-gray-500 font-bold uppercase text-[10px]">Licenças Ativas</span>
                 <span className="font-bold text-[#1E3A8A]">{(stats as any).active}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-8">
           <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-[#161B22]">
             <CardContent className="p-6 md:p-10">
                <div className="flex flex-col md:flex-row items-center md:items-start lg:items-center gap-6 md:gap-10">
                   <div className="shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-[2rem] bg-[#2F7FD3]/10 flex items-center justify-center text-[#2F7FD3]">
                      <Settings2 size={32} className="md:hidden" />
                      <Settings2 size={48} className="hidden md:block" />
                   </div>
                   <div className="flex-1 space-y-2 text-center md:text-left">
                      <h3 className="text-xl md:text-2xl font-bold tracking-tight">Configuração da Versão Master</h3>
                      <p className="text-xs md:text-sm text-[#6C7A73] leading-relaxed italic">
                        Defina a versão estável no ambiente de protótipo. Lembre-se: as alterações <span className="font-bold underline">não são aplicadas automaticamente</span> aos clientes.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-6">
                         <div className="relative flex-1 sm:max-w-[200px]">
                            <Input 
                              value={masterVersion} 
                              onChange={(e) => setMasterVersion(e.target.value)}
                              className="h-14 rounded-2xl bg-gray-50 dark:bg-gray-800/50 px-6 font-mono text-xl font-black border-none focus:ring-2 focus:ring-[#2F7FD3] transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#2F7FD3] tracking-widest">MASTER</div>
                         </div>
                         
                         <Button onClick={updateMasterLocal} className="h-14 rounded-2xl px-8 bg-[#141B2B] hover:bg-black text-white font-black uppercase tracking-widest text-[10px] transition-all transform active:scale-95 border-none flex-1 sm:flex-none">
                            Salvar Local
                         </Button>

                         {isMajorChange(currentMasterVersion, masterVersion) && (
                            <Button 
                              onClick={() => setIsReleaseNotesModalOpen(true)}
                              className="h-14 rounded-2xl px-6 bg-[#2F7FD3]/10 hover:bg-[#2F7FD3]/20 text-[#2F7FD3] font-black uppercase tracking-widest text-[10px] border-none transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
                            >
                               <Zap size={18} /> Notas
                            </Button>
                         )}
                      </div>
                   </div>
                </div>
             </CardContent>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Sincronização de Código", desc: "Aplica as últimas alterações de lógica e banco de dados para todas as licenças ativas.", icon: Zap, color: "text-[#2F7FD3]" },
                { title: "Propagação de Design", desc: "Atualiza tokens de UI, cores globais e ativos visuais baseados no protótipo.", icon: Copy, color: "text-[#2F7FD3]" },
              ].map((mod, i) => (
                <div 
                  key={mod.title}
                  className="group relative p-8 rounded-[2.5rem] border-none bg-white dark:bg-[#161B22] shadow-sm hover:shadow-md transition-all cursor-default"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${mod.color}`}>
                       <mod.icon size={26} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">{mod.title}</h4>
                    <p className="text-xs text-[#6C7A73] leading-relaxed">{mod.desc}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Release Notes Modal */}
      <Dialog open={isReleaseNotesModalOpen} onOpenChange={setIsReleaseNotesModalOpen}>
        <DialogContent hideClose className="rounded-t-[3rem] sm:rounded-[3rem] p-0 max-w-2xl border-none overflow-hidden shadow-2xl bg-white dark:bg-[#161B22] flex flex-col max-h-[92vh]">
          {/* Mobile Handle & Drag Area - Topo Absoluto (Fora do Scroll) */}
          <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing sm:hidden z-50 shrink-0">
             <div className="w-12 h-1.5 bg-gray-200/50 dark:bg-gray-800/50 rounded-full" />
          </div>

          <motion.div 
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) setIsReleaseNotesModalOpen(false);
            }}
            className="relative overflow-y-auto flex-1 custom-scrollbar"
          >
            {/* Gradiente reposicionado para subir com o scroll */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#2F7FD3]/10 to-[#63C3D8]/10 pointer-events-none" />
            
            <div className="p-8 sm:p-10 relative mt-4 sm:mt-0">
              <header className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-4 mb-8">
                <div className="w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-[#2F7FD3] mb-1">
                     <Zap size={14} fill="#2F7FD3" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Canix Release System</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight dark:text-white italic">Notas da Versão {masterVersion}</h2>
                  <p className="text-[#6C7A73] text-[9px] font-black uppercase tracking-widest mt-1">
                    v{currentMasterVersion} ➔ v{masterVersion}
                  </p>
                </div>
                <div className="flex w-full sm:w-auto justify-end gap-2 shrink-0">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsPreviewActive(!isPreviewActive)}
                    className={`rounded-xl h-10 px-4 flex items-center gap-2 transition-all font-black uppercase tracking-widest text-[9px] ${isPreviewActive ? 'bg-[#2F7FD3] text-white hover:bg-[#1E3A8A]' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'}`}
                  >
                    {isPreviewActive ? <Eye size={14} /> : <Eye size={14} />} {isPreviewActive ? "Editar" : "Preview"}
                  </Button>
                  <button 
                    onClick={() => setIsReleaseNotesModalOpen(false)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-800 text-[#6C7A73] rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              <p className="text-[#64748B] text-sm leading-relaxed mb-6 italic">
                {!isPreviewActive 
                  ? `Descreva as melhorias para esta nova versão principal.`
                  : `Prévia visual da mensagem para os licenciados.`
                }
              </p>

          
          <div className="py-6 min-h-[300px]">
            <AnimatePresence mode="wait">
              {!isPreviewActive ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Textarea 
                    placeholder="Ex: Novo módulo de vendas, redesign do checkout, melhorias de performance..."
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    className="min-h-[250px] rounded-[1.5rem] bg-gray-50 dark:bg-gray-800/10 border-none p-6 text-sm focus:ring-2 focus:ring-[#2F7FD3] ring-offset-0"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="w-full max-w-md p-8 rounded-[2rem] bg-gradient-to-br from-[#141B2B] to-[#1E293B] text-white shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                     <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Zap size={100} />
                     </div>
                     <Badge className="bg-[#2F7FD3] text-white border-none mb-4 font-bold tracking-widest text-[10px]">NOVIDADE NO CANIX</Badge>
                     <h4 className="text-2xl font-black mb-4 tracking-tight">O sistema evoluiu!</h4>
                     <p className="text-gray-400 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                        {releaseNotes || "Nenhuma nota escrita ainda..."}
                     </p>
                     <Button className="w-full h-12 rounded-xl bg-white text-black font-bold hover:bg-gray-100 border-none">
                        Entendi, vamos lá!
                     </Button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-10 pt-0">
            <Button 
              onClick={() => {
                setIsPreviewActive(false);
                setIsReleaseNotesModalOpen(false);
              }}
              disabled={!releaseNotes}
              className="w-full h-14 rounded-2xl bg-[#2F7FD3] hover:bg-[#1E3A8A] text-white font-black uppercase tracking-widest text-[10px] border-none shadow-lg shadow-blue-500/20"
            >
              Concluir e Salvar Notas
            </Button>
          </div>
          </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Security Gate Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent hideClose className="p-0 border-none bg-transparent shadow-none max-w-[420px] focus:outline-none flex flex-col justify-end sm:justify-center h-full">
          {/* Mobile Handle & Drag Area - Topo Absoluto */}
          <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing sm:hidden z-50">
             <div className="w-12 h-1.5 bg-gray-200/50 dark:bg-gray-800/50 rounded-full" />
          </div>

          <motion.div 
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) setIsPasswordModalOpen(false);
            }}
            className="w-full bg-white dark:bg-[#161B22] rounded-t-[3rem] sm:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-10 flex flex-col items-center overflow-hidden border border-gray-100 dark:border-gray-800 relative"
          >
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
            
            {/* Header Icon */}
            <div className="w-20 h-20 rounded-[2rem] bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-8 relative">
               <div className="absolute inset-0 rounded-[2rem] bg-red-100/50 dark:bg-red-500/5 animate-pulse" />
               <div className="relative w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg">
                  <ShieldAlert size={24} fill="currentColor" />
               </div>
            </div>

            {/* Title & Description */}
            <div className="text-center space-y-3 mb-10 relative z-10">
               <h3 className="text-3xl font-black tracking-tighter text-[#1E293B] dark:text-white italic leading-none">Acesso Restrito</h3>
               <p className="text-[#64748B] text-xs leading-relaxed max-w-[280px] mx-auto font-bold uppercase tracking-widest text-[9px]">
                 Confirme a senha mestre para propagar alterações globais.
               </p>
            </div>
            
            {/* Input Section */}
            <div className="w-full space-y-3 mb-10">
               <label className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-1">Autenticação Master</label>
               <div className="relative group">
                  <Input 
                    type={isPreviewActive ? "text" : "password"}
                    placeholder="Sua senha master"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="h-14 w-full rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-none px-6 text-sm font-semibold text-[#1E293B] dark:text-white transition-all focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-500 outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => setIsPreviewActive(!isPreviewActive)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  >
                    <Eye size={18} />
                  </button>
               </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-6 flex flex-col items-center">
              <Button 
                onClick={executeSync}
                disabled={passwordInput !== "@C4n1x2603"}
                className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                Autorizar Propagação
              </Button>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-[#64748B] text-[10px] font-black uppercase tracking-widest hover:text-[#1E293B] transition-colors"
              >
                Cancelar Operação
              </button>
            </div>

            {/* Footer Tag */}
            <div className="mt-12 flex items-center gap-2 opacity-30">
               <div className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
               <span className="text-[8px] font-black text-[#64748B] uppercase tracking-[0.2em]">Canix Security Protocol v2.4</span>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const HoldToSyncButton = ({ onComplete, disabled, loading, label }: any) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<any>(null);

  const startHold = () => {
    if (disabled || loading) return;
    setHolding(true);
    setProgress(0);
    
    const startTime = Date.now();
    const duration = 2500;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);

      if (p >= 100) {
        clearInterval(timerRef.current);
        setHolding(false);
        setProgress(0);
        onComplete();
      }
    }, 50);
  };

  const endHold = () => {
    setHolding(false);
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="relative group select-none">
       <button
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          disabled={disabled || loading}
          aria-label={label}
          className={`relative h-14 min-w-[280px] px-10 rounded-2xl font-black text-sm transition-all duration-300 overflow-hidden shadow-lg active:scale-[0.98] outline-none touch-none focus-visible:ring-2 focus-visible:ring-[#2F7FD3] focus-visible:ring-offset-2 ${
            holding 
              ? 'bg-[#1E3A8A] text-white shadow-[0_10px_30px_rgba(30,58,138,0.3)]' 
              : 'bg-gradient-to-r from-[#1E3A8A] via-[#2F7FD3] to-[#63C3D8] text-white hover:shadow-[0_10px_30px_rgba(47,127,211,0.3)] hover:-translate-y-0.5'
          } ${disabled ? 'opacity-50 grayscale cursor-not-allowed hover:-translate-y-0 hover:shadow-lg' : ''}`}
       >
          <motion.div 
            className="absolute inset-0 bg-[#63C3D8] origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
          />

          {holding && (
             <motion.div 
               className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
               animate={{ x: ['-100%', '100%'] }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             />
          )}

          <div className="relative z-10 flex items-center justify-center gap-4">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <div className="relative flex items-center justify-center w-8 h-8">
                  <ShieldCheck size={22} className={`relative z-10 ${holding ? 'scale-110' : ''}`} />
                  {holding && (
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                       <circle 
                         cx="16" cy="16" r="14" 
                         stroke="white" strokeWidth="2.5" 
                         fill="transparent" 
                         className="opacity-20"
                       />
                       <motion.circle 
                         cx="16" cy="16" r="14" 
                         stroke="white" strokeWidth="2.5" 
                         fill="transparent" 
                         strokeDasharray={88}
                         strokeDashoffset={88 - (88 * progress) / 100}
                         strokeLinecap="round"
                       />
                    </svg>
                  )}
               </div>
            )}
            
            <span className="tracking-tighter uppercase">
              {holding ? `SEGURE... ${Math.round(progress)}%` : label}
            </span>
          </div>
       </button>
    </div>
  );
};

export default HubPrototype;
