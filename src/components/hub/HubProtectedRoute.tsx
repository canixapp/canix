import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const HubProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const hubSession = sessionStorage.getItem("canix_hub_session") === "true";

  useEffect(() => {
    const checkSession = async () => {
      // Definimos um timeout de 2 segundos para a verificação do Supabase
      // Se demorar mais, confiamos na hubSession local para evitar white screen/travamento
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Supabase check timeout")), 2000)
      );

      try {
        await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        // Se chegamos aqui, o Supabase respondeu
        setIsAuth(hubSession);
      } catch (err) {
        console.warn("[Hub Auth] Usando fallback de sessão local devido a lentidão ou erro:", err);
        setIsAuth(hubSession);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [hubSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="w-8 h-8 border-2 border-[#2F7FD3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default HubProtectedRoute;
