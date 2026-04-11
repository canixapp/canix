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
  Eye,
  RefreshCw,
  Info,
  Rocket
} from "lucide-react";
import { 
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider 
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { WhatIsNewModal } from "@/components/modals/WhatIsNewModal";

const HubPrototype = () => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [prototypeData, setPrototypeData] = useState<any>(null);
  const [stats, setStats] = useState({ licenses: 0, active: 0, adoption: 0 });
  
  // __APP_VERSION__ é injetado pelo Vite baseado no package.json
  const codeVersion = __APP_VERSION__;
  
  const [masterVersion, setMasterVersion] = useState(codeVersion);
  const [currentMasterVersion, setCurrentMasterVersion] = useState("");
  const [currentFrotaVersion, setCurrentFrotaVersion] = useState("1.0.0");
  
  // Modals state
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isReleaseNotesModalOpen, setIsReleaseNotesModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const needsUpdate = codeVersion !== currentMasterVersion;

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
        const dbVersion = (petshop as any).app_version || "1.0.0";
        setCurrentMasterVersion(dbVersion);
        
        // Se a versão do código for maior, sugerimos ela
        if (parseFloat(codeVersion) > parseFloat(dbVersion)) {
           setMasterVersion(codeVersion);
        } else {
           setMasterVersion(dbVersion);
        }
          
        // 1. Buscar apenas tenants ativos (exceto o protótipo)
        const { data: activeTenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, slug, status')
          .eq('status', 'active')
          .neq('slug', 'prototipo');

        if (tenantsError) throw tenantsError;

        const { data: allPetshops, error: petshopsError } = await supabase.from('petshops').select('*');
        if (petshopsError) throw petshopsError;

        // Filtrar petshops que pertencem a tenants ativos
        const activeIds = new Set(activeTenants?.map(t => t.id) || []);
        const otherTenants = allPetshops?.filter((t: any) => 
          activeIds.has(t.id) && t.slug?.toLowerCase() !== 'prototipo'
        ) || [];
        
        const activeCount = otherTenants.length;
        const upToDateCount = otherTenants.filter((t: any) => t.app_version === dbVersion).length || 0;

        // Calcula a versão predominante na frota ativa
        if (activeCount > 0) {
          const versions = otherTenants.map((t: any) => t.app_version || "1.0.0");
          const counts = versions.reduce((acc: any, v: string) => {
            acc[v] = (acc[v] || 0) + 1;
            return acc;
          }, {});
          const mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
          setCurrentFrotaVersion(mostCommon);
        } else {
          // Se não houver outros tenants ativos, a frota está sincronizada com o mestre por definição
          setCurrentFrotaVersion(dbVersion);
        }

        setStats({
          licenses: activeCount,
          active: activeCount,
          adoption: activeCount > 0 ? Math.round((upToDateCount / activeCount) * 100) : 100
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
    if (!oldV || !newV) return false;
    const oldMajor = parseInt(String(oldV).split('.')[0]);
    const newMajor = parseInt(String(newV).split('.')[0]);
    return newMajor > oldMajor;
  };

  const handleStartSync = () => {
    if (isMajorChange(currentMasterVersion, codeVersion) && (!releaseNotes || releaseNotes.trim().length < 10)) {
      toast.error("Por favor, descreva as novidades (mínimo 10 caracteres) para esta versão major.");
      setIsReleaseNotesModalOpen(true);
    } else {
      setIsPasswordModalOpen(true);
    }
  };
  const executeSync = async () => {
    setSyncing(true);
    try {
      const settings = (prototypeData?.settings as any) || {};
      await supabase.from('petshops').update({ 
         app_version: codeVersion,
         settings: {
           ...settings,
           last_app_sync_at: new Date().toISOString(),
           ...(isMajorChange(currentMasterVersion, codeVersion) ? { last_release_notes: releaseNotes } : {})
         }
      } as any).eq('id', prototypeData.id);

      // 2. Propagar para todos os tenants ativos
      const { data: tenants, error: tError } = await (supabase.from as any)('tenants')
        .select('id, slug')
        .eq('status', 'active')
        .neq('slug', 'prototipo');
        
      if (tError) throw tError;

      let successCount = 0;

      for (const tenant of (tenants || [])) {
        try {
          const targetPetshopId = tenant.id;

          // Busca as configurações atuais do petshop para não sobrescrevê-las
          const { data: pData } = await supabase.from('petshops').select('settings').eq('id', targetPetshopId).single();
          const pSettings = (pData?.settings as any) || {};

          await supabase.from('petshops').update({ 
             app_version: codeVersion,
             settings: {
               ...pSettings,
               ...(isMajorChange(currentMasterVersion, codeVersion) ? { last_release_notes: releaseNotes } : {})
             }
          } as any).eq('id', targetPetshopId);
          
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
         app_version: codeVersion,
         settings: {
           ...settings,
           last_lab_update_at: new Date().toISOString(),
           ...(isMajorChange(currentMasterVersion, codeVersion) 
             ? { last_release_notes: releaseNotes }
             : {})
         }
       } as any)
       .eq('id', prototypeData.id);
         

        
     setCurrentMasterVersion(codeVersion);
     toast.success("Estado do protótipo salvo localmente.");
  };

  return (
    <div className="space-y-6 pb-20 text-[#141B2B] dark:text-white">
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
               Gerencie o estado global do ecossistema a partir do <span className="text-[#2F7FD3] font-bold">Protótipo</span>. 
               As alterações no código só afetam os clientes após a sincronização manual.
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
            <RefreshCw size={18} aria-hidden="true" className={cn("mr-2 opacity-70 group-hover:opacity-100 transition-opacity", loading && "animate-spin")} /> Atualizar
          </Button>
        </div>
      </header>

      {/* Version Status Banner */}
       <AnimatePresence>
        {needsUpdate && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="overflow-hidden mb-6 flex justify-center"
          >
            <div className="inline-flex items-center gap-3 p-2 px-6 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
                <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-500 shrink-0">
                  <AlertTriangle size={14} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Novo Código Detectado: v{codeVersion}</p>
                  <span className="hidden sm:block w-1 h-1 rounded-full bg-amber-500/30" />
                  <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/50 uppercase tracking-wider">Banco desatualizado (v{currentMasterVersion})</p>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centralized Master Action */}
      <div className="flex w-full justify-center items-center py-2 sm:py-4">
        <HoldToSyncButton 
          onComplete={handleStartSync} 
          disabled={syncing || masterVersion === "" || needsUpdate || currentFrotaVersion === currentMasterVersion}
          loading={syncing}
          label={
            needsUpdate 
              ? "Sincronize com o banco primeiro" 
              : currentFrotaVersion === currentMasterVersion 
                ? "Sistema 100% Atualizado"
                : (stats.active === 1 ? `Lançar v${masterVersion} para 1 Licença` : `Lançar v${masterVersion} para ${stats.active} Licenças`)
          }
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
                 <span className="text-gray-500 font-bold uppercase text-[10px]">CÓDIGO (package.json)</span>
                 <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
                   v{codeVersion}
                 </Badge>
              </div>
              <div className="flex justify-between items-center text-sm p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[1.5rem]">
                 <span className="text-gray-500 font-bold uppercase text-[10px]">PROTÓTIPO (DB)</span>
                 <Badge 
                   onClick={() => setIsReleaseNotesModalOpen(true)}
                   className={cn("border-none font-bold cursor-pointer transition-colors", needsUpdate ? "bg-amber-500/10 text-amber-600" : "bg-[#E0F2FE] text-[#1E3A8A]")}
                 >
                   v{currentMasterVersion}
                 </Badge>
              </div>
              <div className="flex justify-between items-center text-sm p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[1.5rem]">
                 <span className="text-gray-500 font-bold uppercase text-[10px]">Licenças Ativas</span>
                 <span className="font-bold text-[#1E3A8A]">{(stats as any).active}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-8">
           <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-[#161B22] overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Settings2 size={120} />
             </div>
             <CardContent className="p-6 md:p-10 relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-start lg:items-center gap-6 md:gap-10">
                    <div className="shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-[2rem] bg-gradient-to-br from-[#2F7FD3] to-[#1E3A8A] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 relative group overflow-hidden">
                       <Zap size={42} className="hidden md:block relative z-10 group-hover:scale-110 transition-transform duration-500" />
                       <Zap size={32} className="md:hidden relative z-10" />
                       <motion.div 
                         className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                         animate={{ x: ['-100%', '100%'] }}
                         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                       />
                    </div>
                   <div className="flex-1 space-y-4 text-center md:text-left">
                       <div className="flex items-center justify-center md:justify-start gap-2">
                         <h3 className="text-xl md:text-2xl font-black tracking-tight italic">Orquestração de Lançamento</h3>
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <button className="p-1 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors">
                                 <Info size={14} />
                               </button>
                             </TooltipTrigger>
                             <TooltipContent className="max-w-[300px] text-xs p-5 leading-relaxed bg-[#141B2B] text-white border-blue-500/20 rounded-2xl shadow-2xl">
                                <p className="font-bold mb-3 text-blue-400 text-sm italic">Orquestração de Release:</p>
                                <div className="space-y-4">
                                  <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                                    <p><strong>STATUS LAB:</strong> Ambiente de desenvolvimento local. Onde o código novo nasce e é testado.</p>
                                  </div>
                                  <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                                    <p><strong>STATUS BANCO:</strong> Repositório central de homologação. Versão certificada pronta para distribuição.</p>
                                  </div>
                                  <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                                    <p><strong>STATUS APP:</strong> O ecossistema de clientes. Todas as licenças ativas operando em produção (Frota).</p>
                                  </div>
                                </div>
                              </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                       </div>
                       <p className="text-xs md:text-sm text-[#6C7A73] leading-relaxed italic mt-1">
                          A versão do código (<span className="text-[#2F7FD3] font-bold">Lab: v{codeVersion}</span>) é sincronizada com o banco e depois propagada para a frota.
                       </p>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 pt-4">
                         {/* Display Automático de Versão */}
                         <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-800/40 px-6 py-4 rounded-3xl border border-gray-100 dark:border-gray-800/50">
                            <div className="text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Lab</p>
                              <p className="text-lg font-black font-mono text-[#2F7FD3]">v{codeVersion}</p>
                            </div>
                            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                            <div className="text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Banco</p>
                               <p className="text-lg font-black font-mono text-[#F59E0B]">v{currentMasterVersion}</p>
                            </div>
                            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                            <div className="text-center relative">
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status App</p>
                               <div className="flex items-center justify-center gap-1.5">
                                 <p className="text-lg font-black font-mono text-emerald-500">v{currentFrotaVersion}</p>
                                 {currentFrotaVersion !== currentMasterVersion && (
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500 animate-pulse cursor-help border border-emerald-500/20">
                                           <Rocket size={12} fill="currentColor" />
                                         </div>
                                       </TooltipTrigger>
                                       <TooltipContent className="text-[10px] bg-[#141B2B] text-white border-none py-1.5 px-3">
                                         Pronto para ser lançado para a frota
                                       </TooltipContent>
                                     </Tooltip>
                                   </TooltipProvider>
                                 )}
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex flex-1 gap-3">
                           {needsUpdate ? (
                             <Button 
                               onClick={updateMasterLocal} 
                               className="h-16 rounded-2xl px-8 bg-[#2F7FD3] hover:bg-[#1E3A8A] text-white font-black uppercase tracking-widest text-[11px] transition-all transform active:scale-95 border-none flex-1 shadow-lg shadow-blue-500/20"
                             >
                                <RefreshCw size={18} className="mr-2" /> ATUALIZAR O BANCO
                             </Button>
                           ) : (
                             <div className="h-16 flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                                <CheckCircle2 size={18} /> Sistema Sincronizado
                             </div>
                           )}

                           {isMajorChange(currentMasterVersion, codeVersion) && (
                              <Button 
                                onClick={() => setIsReleaseNotesModalOpen(true)}
                                className="h-16 rounded-2xl px-6 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 hover:border-[#2F7FD3] text-[#2F7FD3] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 group"
                              >
                                 <History size={18} className="group-hover:rotate-12 transition-transform" /> Changelog Major
                              </Button>
                           )}
                         </div>
                      </div>
                   </div>
                </div>
             </CardContent>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Sincronização de Código", desc: "Aplica as últimas alterações de lógica e interface para todas as licenças ativas.", icon: Zap, color: "text-[#2F7FD3]" },
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

            <div className="p-10 pt-0 flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline"
                onClick={() => setIsTestModalOpen(true)}
                className="h-14 rounded-2xl border-gray-200 dark:border-gray-800 text-gray-500 font-black uppercase tracking-widest text-[10px] flex-1"
              >
                <Eye size={16} className="mr-2" /> Testar Visual Real
              </Button>
              <Button 
                onClick={() => {
                  setIsPreviewActive(false);
                  setIsReleaseNotesModalOpen(false);
                }}
                disabled={!releaseNotes || releaseNotes.trim().length < 10}
                className="h-14 rounded-2xl bg-[#2F7FD3] hover:bg-[#1E3A8A] text-white font-black uppercase tracking-widest text-[10px] border-none shadow-lg shadow-blue-500/20 flex-[2]"
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
            
            <div className="w-20 h-20 rounded-[2rem] bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-8 relative">
               <div className="absolute inset-0 rounded-[2rem] bg-red-100/50 dark:bg-red-500/5 animate-pulse" />
               <div className="relative w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg">
                  <ShieldAlert size={24} fill="currentColor" />
               </div>
            </div>

            <div className="text-center space-y-3 mb-10 relative z-10">
               <h3 className="text-3xl font-black tracking-tighter text-[#1E293B] dark:text-white italic leading-none">Acesso Restrito</h3>
               <p className="text-[#64748B] text-xs leading-relaxed max-w-[280px] mx-auto font-bold uppercase tracking-widest text-[9px]">
                 Confirme a senha mestre para propagar alterações globais.
               </p>
            </div>
            
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

            <div className="w-full space-y-6 flex flex-col items-center">
              <Button 
                onClick={executeSync}
                disabled={passwordInput !== "@C4n1x2603"}
                className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
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

            <div className="mt-12 flex items-center gap-2 opacity-30">
               <div className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
               <span className="text-[8px] font-black text-[#64748B] uppercase tracking-[0.2em]">Canix Security Protocol v2.4</span>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <WhatIsNewModal 
        version={codeVersion}
        notes={releaseNotes}
        forceOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
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

// Função auxiliar para Tailwind (opcional, dependendo do setup)
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default HubPrototype;
