import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Plus, Search, Filter, MoreVertical, ExternalLink, Calendar, CheckCircle2, Clock, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NewLicenseModal from "@/components/hub/NewLicenseModal";
import EditLicenseModal from "@/components/hub/EditLicenseModal";

const HubLicenses = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const primaryGradient = "from-[#1E3A8A] to-[#2F7FD3]";

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const { data, error } = await (supabase.from as any)('tenants')
        .select(`
          *,
          plan:plans(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { label: "LICENÇAS ATIVAS", value: tenants.filter(t => t.status === 'active').length, icon: CheckCircle2, color: "text-[#2F7FD3]" },
    { label: "EXPIRANDO EM BREVE", value: "3", icon: Clock, color: "text-[#A13E30]" },
    { label: "NOVAS (7 DIAS)", value: tenants.filter(t => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(t.created_at) > sevenDaysAgo;
    }).length, icon: Calendar, color: "text-[#63C3D8]" },
  ];

  return (
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#141B2B] dark:text-white italic">Gestão de Licenças</h1>
            <p className="text-[#6C7A73] mt-1 text-sm">Monitore e gerencie as permissões de acesso de todos os petshops.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br ${primaryGradient} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform active:scale-95`}
          >
            <Plus size={20} /> Nova Licença
          </button>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-[#141B2B] rounded-[2rem] p-6 shadow-sm border border-gray-50 dark:border-gray-800"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 bg-[#F9F9FF] dark:bg-gray-800/50 rounded-2xl ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-[#6C7A73] uppercase">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-[#141B2B] dark:text-white">{stat.value}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters & Search - Responsivo */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white dark:bg-[#141B2B] p-4 rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6C7A73]" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome, slug ou proprietário..." 
                className="w-full pl-12 pr-4 py-4 bg-[#F9F9FF] dark:bg-gray-800/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#2F7FD3] transition-all"
              />
            </div>
            <button className="p-4 bg-[#F9F9FF] dark:bg-gray-800/50 rounded-2xl text-[#6C7A73] hover:bg-[#F1F3FF] transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Table/List View - Responsivo */}
        <div className="bg-white dark:bg-[#141B2B] rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-800 overflow-hidden text-[#141B2B] dark:text-white">
          {/* Card View for Mobile */}
          <div className="lg:hidden divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-8 h-8 border-4 border-[#2F7FD3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#6C7A73] font-black uppercase tracking-widest text-[10px]">Carregando...</p>
              </div>
            ) : tenants.length === 0 ? (
              <div className="p-20 text-center text-[#6C7A73] font-black uppercase tracking-widest text-[10px]">Nenhuma licença encontrada.</div>
            ) : tenants.map((tenant) => (
              <div key={tenant.id} className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F1F3FF] dark:bg-gray-800 flex items-center justify-center overflow-hidden font-bold text-[#2F7FD3] border border-gray-100 dark:border-gray-700">
                      {tenant.logo_url ? <img src={tenant.logo_url} className="w-full h-full object-cover" /> : tenant.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-sm italic">{tenant.name}</p>
                      <p className="text-[10px] font-bold text-[#6C7A73] uppercase tracking-widest">{tenant.slug}.canix.app.br</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    tenant.status === 'active' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#2F7FD3]' : 'bg-red-50 text-red-500'
                  }`}>
                    {tenant.status === 'active' ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <p className="text-[8px] font-black text-[#6C7A73] uppercase tracking-widest mb-1">Plano</p>
                    <p className="text-xs font-bold flex items-center gap-2"><CreditCard size={12} /> {tenant.plan?.name || 'Standard'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <p className="text-[8px] font-black text-[#6C7A73] uppercase tracking-widest mb-1">Expiração</p>
                    <p className="text-xs font-bold">31 Dez, 2024</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => window.open(`http://localhost:8080/?tenant=${tenant.slug}`, '_blank')}
                    className="flex-1 py-3 bg-blue-50 dark:bg-blue-900/20 text-[#2F7FD3] rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={14} /> Abrir
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTenant(tenant);
                      setIsEditModalOpen(true);
                    }}
                    className="flex-1 py-3 bg-gray-50 dark:bg-gray-800 text-[#6C7A73] rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2"
                  >
                    <MoreVertical size={14} /> Gerenciar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F9FF] dark:bg-gray-800/30">
                  <th className="p-6 text-[10px] font-bold tracking-widest text-[#6C7A73] uppercase">Petshop</th>
                  <th className="p-6 text-[10px] font-bold tracking-widest text-[#6C7A73] uppercase">Status</th>
                  <th className="p-6 text-[10px] font-bold tracking-widest text-[#6C7A73] uppercase">Plano</th>
                  <th className="p-6 text-[10px] font-bold tracking-widest text-[#6C7A73] uppercase">Expiração</th>
                  <th className="p-6 text-[10px] font-bold tracking-widest text-[#6C7A73] uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="w-8 h-8 border-4 border-[#2F7FD3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-[#6C7A73] font-medium">Carregando licenças...</p>
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-[#6C7A73]">Nenhuma licença encontrada.</td>
                  </tr>
                ) : tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-[#F9F9FF] dark:hover:bg-white/5 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#F1F3FF] dark:bg-gray-800 flex items-center justify-center overflow-hidden font-bold text-[#2F7FD3] dark:text-[#63C3D8] border border-gray-100 dark:border-gray-700 shadow-sm">
                          {tenant.logo_url ? (
                            <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover" />
                          ) : (
                            tenant.name[0]
                          )}
                        </div>
                        <div>
                          <p className="font-bold">{tenant.name}</p>
                          <p className="text-xs text-[#6C7A73]">{tenant.slug}.canix.app.br</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        tenant.status === 'active' 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-[#2F7FD3]' 
                          : 'bg-[#FFDAD4] text-[#A13E30]'
                      }`}>
                        {tenant.status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-[#6C7A73]" />
                        <span className="font-medium text-sm">{tenant.plan?.name || tenant.plan_id || 'Não definido'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">31 Dez, 2024</span>
                        <span className="text-[10px] text-[#6C7A73] uppercase font-bold tracking-widest">Renovação automática</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => window.open(`http://localhost:8080/?tenant=${tenant.slug}`, '_blank')}
                          className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-[#6C7A73] hover:text-[#2F7FD3] shadow-sm transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-[#6C7A73] hover:text-[#2F7FD3] shadow-sm transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <NewLicenseModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchTenants}
        />

        <EditLicenseModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={fetchTenants}
          tenant={selectedTenant}
        />
      </div>
  );
};

export default HubLicenses;
