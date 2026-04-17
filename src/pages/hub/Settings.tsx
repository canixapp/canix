import React from "react";
import { Globe, Mail, Database, Sparkles, History } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HubSettings = () => {
  const navigate = useNavigate();
  const primaryGradient = "from-[#1E3A8A] to-[#2F7FD3]";

  const sections = [
    { title: "Configurações Globais", icon: Globe, description: "Gerencie o domínio principal e configurações de rede.", path: "/settings" },
    { title: "Comunicação", icon: Mail, description: "Servidor SMTP, notificações push e marketing global.", path: "/settings" },
    { title: "Infraestrutura", icon: Database, description: "Monitoramento de recursos Supabase e Storage.", path: "/settings" },
    { title: "Logs de Auditoria", icon: History, description: "Rastreador de alterações globais e infraestrutura.", path: "/auditoria" },
  ];

  return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-[#141B2B] dark:text-white">Configurações Gerais</h1>
          <p className="text-[#6C7A73] mt-1">Gerencie as configurações fundamentais do ecossistema Canix.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {sections.map((section, i) => (
              <motion.button
                key={section.title}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(section.path)}
                className="w-full text-left bg-white dark:bg-[#141B2B] rounded-[2rem] p-6 shadow-sm border border-gray-50 dark:border-gray-800 flex items-center gap-6 group transition-all"
              >
                <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl text-[#2F7FD3] group-hover:scale-110 transition-transform shadow-sm">
                  <section.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#141B2B] dark:text-white">{section.title}</h3>
                  <p className="text-xs text-[#6C7A73] font-medium">{section.description}</p>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="bg-white dark:bg-[#141B2B] rounded-[2.5rem] p-8 shadow-sm border border-gray-50 dark:border-gray-800 self-start">
             <div className="flex items-center gap-2 mb-6 text-[#2F7FD3]">
              <Sparkles size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Estado do Ecossistema</span>
            </div>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-gray-800/50 rounded-2xl border border-[#2F7FD3]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#2F7FD3] rounded-full animate-ping" />
                    <span className="text-sm font-bold">API Central</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#1E3A8A]">OPERACIONAL</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F9F9FF] dark:bg-gray-800/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#2F7FD3] rounded-full" />
                    <span className="text-sm font-bold">Supabase Backend</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#1E3A8A]">CONECTADO</span>
                </div>

               <div className="flex items-center justify-between p-4 bg-[#F9F9FF] dark:bg-gray-800/50 rounded-2xl opacity-50">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-gray-400 rounded-full" />
                   <span className="text-sm font-bold">CDN / Assets</span>
                 </div>
                 <span className="text-[10px] font-bold text-[#6C7A73]">MANUTENÇÃO</span>
               </div>
            </div>

            <button className={`w-full mt-8 py-4 bg-gradient-to-br ${primaryGradient} text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg hover:opacity-90 transition-opacity`}>
              Salvar Alterações Globais
            </button>
          </div>
        </div>
      </div>
  );
};

export default HubSettings;
