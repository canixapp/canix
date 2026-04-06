import React, { useState } from "react";
import { motion } from "framer-motion";
import { Key, Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

const HubLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Tenta Autenticação Real no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      // 2. Fallback Estratégico: Se falhar no Supabase mas a senha hardcoded 
      // do Super Admin bater, permitimos o acesso para evitar bloqueio total.
      const isHardcodedAdmin = email === "canixapp@gmail.com" && password === "@C4n1x2603";

      if (error && !isHardcodedAdmin) {
        toast.error("Erro de autenticação", {
          description: error.message === "Invalid login credentials" 
            ? "E-mail ou senha administrativa incorretos." 
            : error.message
        });
        setLoading(false);
        return;
      }

      if (error && isHardcodedAdmin) {
        console.warn("[Hub Auth] Supabase rejeitou, mas permitindo via fallback Admin.", error);
      }

      // 3. Sucesso: Define a sessão do Hub e navega
      sessionStorage.setItem("canix_hub_session", "true");
      toast.success("Acesso autorizado", {
        description: isHardcodedAdmin && error ? "Aviso: Autenticação via fallback seguro." : "Bem-vindo ao centro de comando Canix."
      });
      
      setTimeout(() => {
        setLoading(false);
        navigate("/");
      }, 500);

    } catch (err) {
      console.error("Erro inesperado no login do Hub:", err);
      toast.error("Erro interno", {
        description: "Ocorreu uma falha ao tentar conectar com os servidores Canix."
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorativo (Digital Sanctuary Style) */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] bg-[#2F7FD3] rounded-full blur-[160px] animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[80%] h-[80%] bg-[#1E3A8A] rounded-full blur-[160px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 overflow-hidden p-0">
              <img src="/src/assets/logoredondo.png" alt="Canix Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2 mb-2 text-[#2F7FD3]">
              <Sparkles size={12} fill="currentColor" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Canix Hub Security</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-tight">Central de Comando</h1>
            <p className="text-[#64748B] mt-1 text-xs font-medium">Autentique-se para gerenciar o ecossistema.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#64748B] ml-2 flex items-center gap-2">
                <Mail size={10} /> E-mail Institucional
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#2F7FD3] focus:border-transparent transition-all text-sm text-white placeholder:text-gray-600 outline-none font-medium"
                placeholder="nome@canix.app.br"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#64748B] ml-2 flex items-center gap-2">
                <Lock size={10} /> Senha Administrativa
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#2F7FD3] focus:border-transparent transition-all text-sm text-white placeholder:text-gray-600 outline-none font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-[#2F7FD3] hover:bg-[#1E3A8A] text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[0_10px_30px_rgba(47,127,211,0.2)] hover:scale-[1.02] transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 border-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Entrar no Hub <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[#64748B] text-[8px] font-black uppercase tracking-[0.2em]">
            <ShieldCheck size={12} />
            Acesso Restrito • Canix Corp 2024
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HubLogin;
