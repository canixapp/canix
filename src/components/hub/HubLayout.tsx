import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { 
  Activity, 
  Key, 
  CreditCard, 
  Shield, 
  Settings, 
  Search, 
  Bell, 
  LogOut,
  Sparkles,
  Zap,
  Menu,
  X as CloseIcon,
  RefreshCw,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import HubErrorBoundary from "./HubErrorBoundary";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HubLayoutProps {
  children?: React.ReactNode;
}

const HubLayout = ({ children }: HubLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
   const [searchResults, setSearchResults] = useState<{ tenants: any[], profiles: any[] }>({ tenants: [], profiles: [] });
   const [isSearching, setIsSearching] = useState(false);
   const [selectedIndex, setSelectedIndex] = useState(-1);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  
   // Custom Hook for click detection
   useClickOutside(notificationsRef, () => setIsNotificationsOpen(false), isNotificationsOpen);
   useClickOutside(searchBarRef, () => setIsSearchOpen(false), isSearchOpen);
 
   // Keyboard shortcut for search
   useEffect(() => {
     const down = (e: KeyboardEvent) => {
       if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
         e.preventDefault();
         setIsSearchOpen((open) => !open);
       }
     };
     document.addEventListener("keydown", down);
     return () => document.removeEventListener("keydown", down);
   }, []);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Nova Licença Ativada', msg: 'PetCão Master acaba de se tornar Premium!', type: 'success', time: '5m atrás', unread: true },
    { id: 2, title: 'Falha de Sincronização', msg: 'Licença "Patinhas" falhou no backup automático.', type: 'error', time: '1h atrás', unread: true },
    { id: 3, title: 'Atualização de Sistema', msg: 'Global Hub v1.0.4 aplicada com sucesso.', type: 'info', time: '3h atrás', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const menuItems = [
    { label: "Dashboard", path: "/", icon: Activity },
    { label: "Licenças", path: "/licenses", icon: Key },
    { label: "Assinaturas", path: "/plans", icon: CreditCard },
    { label: "Protótipo", path: "/prototype", icon: Sparkles },
    { label: "Configurações", path: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("canix_hub_session");
    navigate("/login");
  };

  // Global Search Logic (Live Results)
  useEffect(() => {
    const fetchResults = async () => {
       if (!searchQuery || searchQuery.length < 2) {
         setSearchResults({ tenants: [], profiles: [] });
         setSelectedIndex(-1);
         return;
       }

      setIsSearching(true);
      try {
        const { data: tenants, error: tErr } = await (supabase.from as any)('tenants')
          .select('id, name, slug, status, plan:plans(name)')
          .or(`name.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`)
          .limit(5);

        if (tErr) console.error("Erro busca tenants:", tErr);

        const { data: profiles, error: pErr } = await (supabase.from as any)('profiles')
          .select('id, name, petshops(name)')
          .ilike('name', `%${searchQuery}%`)
          .limit(5);

        if (pErr) console.error("Erro busca profiles:", pErr);

        setSearchResults({ 
          tenants: tenants || [], 
          profiles: (profiles || []).map((p: any) => ({
            ...p,
            full_name: p.name,
            tenant: p.petshops
          }))
        });
      } catch (err) {
        console.error("Erro na busca global:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Close mobile menu on navigation
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#F9F9FF] dark:bg-[#0D1117] transition-colors duration-500 overflow-x-hidden">
      {/* Sidebar Slim - Desktop Only */}
      <aside className="fixed left-0 top-0 h-screen w-20 lg:w-24 bg-white dark:bg-[#161B22] border-r border-gray-100 dark:border-gray-800 hidden lg:flex flex-col items-center py-10 z-50 transition-colors">
        <div className="w-14 h-14 flex items-center justify-center mb-12 overflow-hidden p-0.5">
          <img src="/src/assets/logoquadrado.png" alt="Canix Icon" className="w-full h-full object-contain" />
        </div>

        <nav className="flex-1 flex flex-col gap-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`p-4 rounded-2xl transition-all group relative ${
                  isActive 
                    ? "bg-blue-50 dark:bg-[#2F7FD3]/10 text-[#2F7FD3]" 
                    : "text-[#6C7A73] hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <Icon size={22} />
                <span className="sr-only">{item.label}</span>
                
                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100]">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="p-4 text-[#6C7A73] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all mt-auto group relative"
        >
          <LogOut size={22} />
          <div className="absolute left-full ml-4 px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100]">
            Sair do Hub
          </div>
        </button>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#0D1117]/60 backdrop-blur-sm z-[200] lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-[#161B22] z-[210] lg:hidden flex flex-col p-8 shadow-2xl border-r border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img src="/src/assets/logoquadrado.png" alt="Canix Icon" className="w-full h-full object-contain" />
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#6C7A73]">
                  <CloseIcon size={24} />
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-2">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all ${
                        isActive 
                          ? "bg-blue-50 dark:bg-[#2F7FD3]/10 text-[#2F7FD3]" 
                          : "text-[#6C7A73] hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <button 
                onClick={handleLogout}
                className="mt-auto flex items-center gap-4 px-6 py-4 text-[#6C7A73] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all"
              >
                <LogOut size={20} /> Sair do Hub
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Espaçador para compensar a Sidebar fixa - Desktop Only */}
      <div className="w-20 lg:w-24 shrink-0 hidden lg:block" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/70 dark:bg-[#161B22]/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-[100] transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu lateral"
              className="p-2.5 bg-gray-50 dark:bg-gray-800/50 text-[#141B2B] dark:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden mr-2"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block px-3 py-1 bg-blue-50 dark:bg-[#2F7FD3]/10 text-[#2F7FD3] text-[9px] font-bold uppercase tracking-[0.2em] rounded-full border border-[#2F7FD3]/20 whitespace-nowrap overflow-hidden text-ellipsis">
              Canix Global Hub • v1.0.4
            </div>
          </div>

           <div className="flex items-center gap-3 sm:gap-6">
             <button 
               onClick={() => setIsSearchOpen(true)}
               className="p-2.5 bg-gray-50 dark:bg-gray-800/50 text-[#6C7A73] dark:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors xl:hidden"
               aria-label="Abrir pesquisa"
             >
               <Search size={20} />
             </button>
             
             <div className="hidden sm:block">
               <ThemeToggle />
             </div>
            
            <div className="relative group hidden xl:block" ref={searchBarRef}>
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchOpen ? 'text-[#2F7FD3]' : 'text-[#6C7A73]'}`} size={16} />
               <input 
                 ref={(el) => { if (el && isSearchOpen) el.focus(); }}
                 placeholder="Pesquisar lojistas ou donos… (Ctrl+K)" 
                 aria-label="Pesquisar lojistas ou donos"
                 value={searchQuery}
                 onFocus={() => setIsSearchOpen(true)}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     if (selectedIndex >= 0) {
                       const combined = [...searchResults.tenants, ...searchResults.profiles];
                       const item = combined[selectedIndex];
                       if (item) {
                         const path = 'slug' in item ? `/licenses?q=${item.slug}` : `/licenses?q=${item.full_name}`;
                         navigate(path);
                         setIsSearchOpen(false);
                       }
                     } else {
                       const params = new URLSearchParams(location.search);
                       if (searchQuery) params.set('q', searchQuery);
                       else params.delete('q');
                       navigate(`${location.pathname}?${params.toString()}`, { replace: true });
                       setIsSearchOpen(false);
                     }
                   }
                   if (e.key === 'ArrowDown') {
                     e.preventDefault();
                     const total = searchResults.tenants.length + searchResults.profiles.length;
                     setSelectedIndex(prev => (prev + 1) % total);
                   }
                   if (e.key === 'ArrowUp') {
                     e.preventDefault();
                     const total = searchResults.tenants.length + searchResults.profiles.length;
                     setSelectedIndex(prev => (prev - 1 + total) % total);
                   }
                   if (e.key === 'Escape') {
                     setIsSearchOpen(false);
                   }
                 }}
                 className="bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-[#2F7FD3]/30 rounded-xl pl-12 pr-10 py-2.5 text-sm transition-all w-48 md:w-80 dark:text-white outline-none focus:bg-white dark:focus:bg-[#1C2128] shadow-sm"
               />
              
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <RefreshCw className="w-3 h-3 text-[#2F7FD3] animate-spin" />
                </div>
              )}

             {/* SEARCH RESULTS PANEL */}
             <AnimatePresence>
               {isSearchOpen && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10, scale: 0.98 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 10, scale: 0.98 }}
                   className="absolute top-full left-0 right-0 xl:right-auto xl:w-[450px] mt-3 bg-white dark:bg-[#161B22] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-2xl z-[150] overflow-hidden"
                 >
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-3">
                      {searchResults.tenants.length > 0 && (
                        <div className="mb-4">
                           {searchResults.tenants.map((t, idx) => {
                             const isFocused = selectedIndex === idx;
                             return (
                               <button 
                                 key={t.id}
                                 onMouseEnter={() => setSelectedIndex(idx)}
                                 onClick={() => { navigate('/licenses?q=' + t.slug); setIsSearchOpen(false); }}
                                 className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors group ${isFocused ? 'bg-blue-50 dark:bg-[#2F7FD3]/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                               >
                                 <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isFocused ? 'bg-[#2F7FD3] text-white' : 'bg-blue-50 dark:bg-[#2F7FD3]/10 text-[#2F7FD3]'}`}>
                                     <Key size={14} />
                                   </div>
                                   <div className="text-left">
                                     <p className={`text-[11px] font-bold ${isFocused ? 'text-[#2F7FD3]' : 'text-[#1E293B] dark:text-white'}`}>{t.name}</p>
                                     <p className="text-[9px] font-bold text-[#6C7A73] dark:text-slate-500">{t.plan?.name || 'Plano Básico'}</p>
                                   </div>
                                 </div>
                                 <ArrowUpRight size={12} className={`text-[#6C7A73] transition-opacity ${isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                               </button>
                             );
                           })}
                         </div>
                       )}
 
                       {searchResults.profiles.length > 0 && (
                         <div>
                           <p className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#6C7A73]">Proprietários / Contatos</p>
                           {searchResults.profiles.map((p, idx) => {
                             const absoluteIndex = searchResults.tenants.length + idx;
                             const isFocused = selectedIndex === absoluteIndex;
                             return (
                               <button 
                                 key={p.id}
                                 onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                                 onClick={() => { navigate('/licenses?q=' + p.full_name); setIsSearchOpen(false); }}
                                 className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors group ${isFocused ? 'bg-purple-50 dark:bg-purple-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                               >
                                 <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isFocused ? 'bg-purple-500 text-white' : 'bg-purple-50 dark:bg-purple-900/10 text-purple-500'}`}>
                                     <Sparkles size={14} />
                                   </div>
                                   <div className="text-left">
                                     <p className={`text-[11px] font-bold ${isFocused ? 'text-purple-500' : 'text-[#1E293B] dark:text-white'}`}>{p.full_name}</p>
                                     <p className="text-[9px] font-bold text-[#6C7A73] dark:text-slate-500">
                                       {p.tenant?.name || 'Administrador'}
                                     </p>
                                   </div>
                                 </div>
                                 <ArrowUpRight size={12} className={`text-[#6C7A73] transition-opacity ${isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                               </button>
                             );
                           })}
                         </div>
                       )}

                      {!isSearching && searchResults.tenants.length === 0 && searchResults.profiles.length === 0 && searchQuery.length >= 2 && (
                        <div className="py-10 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#6C7A73] opacity-50 italic">Nenhum resultado encontrado</p>
                        </div>
                      )}
                    </div>
                    {searchQuery.length >= 2 && (
                       <div className="p-3 bg-gray-50 dark:bg-black/20 border-t border-gray-50 dark:border-gray-800">
                         <button 
                           onClick={() => {
                             const params = new URLSearchParams(location.search);
                             params.set('q', searchQuery);
                             navigate(`${location.pathname}?${params.toString()}`, { replace: true });
                             setIsSearchOpen(false);
                           }}
                           className="w-full py-2.5 bg-white dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#2F7FD3] border border-gray-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
                         >
                            Filtrar visão atual →
                         </button>
                       </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            <div className="flex items-center gap-2 sm:gap-4 border-l dark:border-gray-700 pl-3 sm:pl-6">
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 text-[#141B2B] dark:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#161B22]" />
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div 
                      ref={notificationsRef}
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 mt-4 sm:mt-4 bg-white dark:bg-[#161B22] border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl z-[130] overflow-hidden sm:w-96"
                    >
                      <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#1E293B] dark:text-white">Central de Notificações</h3>
                        <div className="flex gap-4">
                          {unreadCount > 0 && (
                            <button 
                              onClick={markAllRead}
                              className="text-[9px] font-black uppercase tracking-[0.15em] text-[#2F7FD3] hover:underline"
                            >
                              Lidas
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button 
                              onClick={clearNotifications}
                              className="text-[9px] font-black uppercase tracking-[0.15em] text-red-500 hover:underline"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-5 flex gap-4 transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 ${n.unread ? 'bg-blue-50/30 dark:bg-[#2F7FD3]/5' : ''}`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                                n.type === 'error' ? 'bg-red-500/10 text-red-500' : 
                                'bg-blue-500/10 text-blue-500'
                              }`}>
                                {n.type === 'success' ? <Zap size={16} /> : 
                                 n.type === 'error' ? <Shield size={16} /> : 
                                 <Bell size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="text-[11px] font-bold text-[#1E293B] dark:text-white truncate">{n.title}</p>
                                  <span className="text-[9px] font-medium text-[#6C7A73]">{n.time}</span>
                                </div>
                                <p className="text-[10px] text-[#6C7A73] leading-relaxed line-clamp-2">{n.msg}</p>
                                {n.unread && (
                                  <div className="mt-2 w-1.5 h-1.5 bg-[#2F7FD3] rounded-full" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#6C7A73] opacity-40">Nenhuma notificação</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50/50 dark:bg-black/20 border-t border-gray-50 dark:border-gray-800 flex justify-center">
                        <button className="text-[9px] font-black uppercase tracking-widest text-[#6C7A73] hover:text-[#2F7FD3] transition-colors">
                          Ver Histórico Completo →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#2F7FD3] transition-all">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          <HubErrorBoundary>
            {children || <Outlet />}
          </HubErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default HubLayout;
