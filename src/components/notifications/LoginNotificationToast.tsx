import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function LoginNotificationToast() {
  const { user } = useAuth();

  useEffect(() => {
    // Evita notificações duplicadas na mesma sessão
    const lastNotified = sessionStorage.getItem('login_notified_user');
    
    if (user && lastNotified !== user.id) {
      toast.success(`Bem-vindo de volta, ${user.name || 'Usuário'}!`, {
        description: "Login realizado com sucesso.",
        duration: 4000,
      });
      sessionStorage.setItem('login_notified_user', user.id);
    }
  }, [user]);

  return null;
}
