import React from "react";
import { Shield, Lock, Eye } from "lucide-react";
import { motion } from "framer-motion";

const HubSecurity = () => {
  const primaryGradient = "from-[#1E3A8A] to-[#2F7FD3]";

  const logs = [
    { event: "Login Super Admin", user: "vitor@canix.app.br", ip: "189.122.34.11", status: "Sucesso", time: "Há 10 min" },
    { event: "Criação de Licença", user: "vitor@canix.app.br", ip: "189.122.34.11", status: "Sucesso", time: "Há 45 min" },
    { event: "Falha de Login", user: "admin@desconhecido.com", ip: "45.12.1.255", status: "Bloqueado", time: "Há 2 horas" },
  ];

  return (
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-[#141B2B] dark:text-white">Segurança do Ecossistema</h1>
          <p className="text-[#6C7A73] mt-1">Monitore acessos, logs de auditoria e configure políticas de acesso global.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white dark:bg-[#141B2B] rounded-[2.5rem] p-8 shadow-sm border border-gray-50 dark:border-gray-800">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <Eye size={20} className="text-[#2F7FD3]" /> Últimas Atividades Globais
               </h3>
               <div className="space-y-4">
                 {logs.map((log, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-gray-800/50 rounded-2xl">
                     <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-xl ${log.status === 'Sucesso' ? 'bg-blue-100/50 text-[#2F7FD3]' : 'bg-[#FFDAD4] text-[#A13E30]'}`}>
                         <Shield size={16} />
                       </div>
                       <div>
                         <p className="text-sm font-bold">{log.event}</p>
                         <p className="text-[10px] text-[#6C7A73] font-bold uppercase tracking-widest">{log.user} • IP: {log.ip}</p>
                       </div>
                     </div>
                     <span className="text-[10px] font-bold text-[#6C7A73] uppercase tracking-widest">{log.time}</span>
                   </div>
                 ))}
               </div>
             </div>
          </div>

          <div className="space-y-6">
            <div className={`bg-gradient-to-br ${primaryGradient} rounded-[2.5rem] p-8 text-white shadow-xl`}>
              <div className="p-3 bg-white/20 rounded-2xl w-fit mb-4">
                <Lock size={24} />
              </div>
              <h4 className="text-xl font-bold mb-2">Autenticação 2FA</h4>
              <p className="text-sm text-white/80 mb-6 italic">A autenticação de dois fatores é obrigatória para todos os Super Admins.</p>
              <button className="w-full py-4 bg-white text-[#1E3A8A] rounded-2xl font-bold uppercase tracking-widest text-[10px]">
                Configurar 2FA
              </button>
            </div>

            <div className="bg-white dark:bg-[#141B2B] rounded-[2.5rem] p-8 shadow-sm border border-gray-50 dark:border-gray-800">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6C7A73] mb-4">Integridade do Database</h4>
              <div className="flex items-center justify-between p-4 bg-blue-50/30 dark:bg-gray-800/50 rounded-2xl border border-[#2F7FD3]/20">
                <span className="text-sm font-bold">Supabase RLS</span>
                <span className="px-2 py-1 bg-blue-100/50 text-[#2F7FD3] text-[10px] font-bold rounded-md">ATIVO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default HubSecurity;
