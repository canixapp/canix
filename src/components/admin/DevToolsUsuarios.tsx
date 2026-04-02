import { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Shield, Crown, Users, Eye, KeyRound, Copy, Check, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { staggerItem, staggerContainer, cardAnimProps } from '@/lib/animations';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileWithRole {
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  active: boolean;
  role: AppRole;
  is_pro: boolean;
  created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Shield }> = {
  dev: { label: 'DEV', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: Crown },
  admin: { label: 'ADMIN', color: 'text-primary', bg: 'bg-primary/10', icon: Shield },
  midia: { label: 'MÃDIA', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', icon: Users },
};

// â”€â”€â”€ User Card â”€â”€â”€
const UserCard = memo(function UserCard({
  user,
  onEdit,
  onViewAccount,
  onTogglePro,
  onChangeRole,
  onDelete,
}: {
  user: ProfileWithRole;
  onEdit: () => void;
  onViewAccount: () => void;
  onTogglePro: () => void;
  onChangeRole: (role: AppRole) => void;
  onDelete: () => void;
}) {
  const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.admin;
  const RoleIcon = cfg.icon;
  const isDev = user.role === 'dev';

  return (
    <motion.div variants={staggerItem}>
      <Card className="group hover:shadow-md transition-shadow duration-200 border-border/60">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: avatar + info */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 ring-1 ring-border/30`}>
                <RoleIcon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="font-semibold text-foreground text-sm truncate leading-tight">{user.name}</p>
                {user.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 font-semibold border ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0 h-5 font-semibold border ${
                      user.is_pro
                        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-muted/40 text-muted-foreground border-border/60'
                    }`}
                  >
                    {user.is_pro ? 'â­ PRO' : 'Comum'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-lg gap-1.5 border-border/60"
                onClick={onViewAccount}
              >
                <Eye className="w-3.5 h-3.5" /> Ver conta
              </Button>

              {!isDev && (
                <>
                  <Select value={user.role} onValueChange={(v) => onChangeRole(v as AppRole)}>
                    <SelectTrigger className="w-24 h-8 text-xs rounded-lg border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">ADMIN</SelectItem>
                      <SelectItem value="midia">MÃDIA</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/40">
                    <Crown className={`w-3 h-3 ${user.is_pro ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <span className={`text-[11px] font-semibold ${user.is_pro ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>PRO</span>
                    <Switch checked={user.is_pro} onCheckedChange={onTogglePro} className="scale-90" />
                  </div>

                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onEdit}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" onClick={onDelete}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// â”€â”€â”€ Main Component â”€â”€â”€
export function DevToolsUsuarios() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editUser, setEditUser] = useState<ProfileWithRole | null>(null);
  const [viewUser, setViewUser] = useState<ProfileWithRole | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'admin' as AppRole, is_pro: false });
  const [creating, setCreating] = useState(false);

  // Temp password state
  const [resetLoading, setResetLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .in('role', ['dev', 'admin', 'midia']);

    if (!roles || roles.length === 0) { setUsers([]); setLoading(false); return; }

    const userIds = roles.map(r => r.user_id);
    const [{ data: profiles }, { data: subscriptions }, { data: accounts }] = await Promise.all([
      supabase.from('profiles').select('*').in('user_id', userIds),
      supabase.from('user_subscriptions').select('*').in('user_id', userIds),
      supabase.from('user_accounts').select('id, email').in('id', userIds),
    ]);

    if (profiles) {
      const merged: ProfileWithRole[] = profiles.map((p: any) => {
        const userRole = roles.find((r: any) => r.user_id === p.user_id);
        const userSub = subscriptions?.find((s: any) => s.user_id === p.user_id);
        const account = accounts?.find((a: any) => a.id === p.user_id);
        return {
          user_id: p.user_id,
          name: p.name,
          email: account?.email || null,
          phone: p.phone,
          avatar_url: p.avatar_url,
          active: p.active,
          role: (userRole?.role as AppRole) || 'admin',
          is_pro: userSub?.is_pro || false,
          created_at: p.created_at,
        };
      });
      setUsers(merged);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({ title: 'Preencha todos os campos obrigatÃ³rios', variant: 'destructive' });
      return;
    }
    if (createForm.password.length < 6) {
      toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setCreating(true);
    const response = await supabase.rpc('rpc_seed_user' as any, {
      p_email: createForm.email, 
      p_password: createForm.password, 
      p_name: createForm.name, 
      p_role: createForm.role
    });
    
    const data = response.data as any;
    const error = response.error || (data && data.error);

    if (error) {
      toast({ title: 'Erro ao criar usuário', description: typeof error === 'string' ? error : error.message, variant: 'destructive' });
      setCreating(false);
      return;
    }

    toast({ title: 'UsuÃ¡rio criado com sucesso âœ“' });

    if (createForm.is_pro) {
      setTimeout(async () => {
        const { data: newRoles } = await supabase.from('user_roles').select('user_id').in('role', ['dev', 'admin', 'midia']);
        const { data: newProfiles } = await supabase.from('profiles').select('user_id, name').in('user_id', newRoles?.map(r => r.user_id) || []);
        const newUser = newProfiles?.find(p => p.name === createForm.name);
        if (newUser) {
          await supabase.from('user_subscriptions').upsert({ user_id: newUser.user_id, is_pro: true } as any, { onConflict: 'user_id' });
        }
        fetchUsers();
      }, 1000);
    } else {
      fetchUsers();
    }

    setShowCreateDialog(false);
    setCreateForm({ name: '', email: '', password: '', role: 'admin', is_pro: false });
    setCreating(false);
  };

  const toggleProStatus = async (userId: string, currentPro: boolean) => {
    const { data: existing } = await supabase.from('user_subscriptions').select('id').eq('user_id', userId).single();
    if (existing) {
      await supabase.from('user_subscriptions').update({ is_pro: !currentPro }).eq('user_id', userId);
    } else {
      await supabase.from('user_subscriptions').insert({ user_id: userId, is_pro: !currentPro } as any);
    }
    toast({ title: !currentPro ? 'Plano PRO ativado â­' : 'Plano PRO desativado' });
    fetchUsers();
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    if (newRole === 'dev') {
      toast({ title: 'NÃ£o Ã© permitido definir role como DEV', variant: 'destructive' });
      return;
    }
    await supabase.from('user_roles').update({ role: newRole as any }).eq('user_id', userId);
    toast({ title: `Role alterado para ${newRole.toUpperCase()}` });
    fetchUsers();
  };

  const updateUserName = async (userId: string, name: string) => {
    await supabase.from('profiles').update({ name }).eq('user_id', userId);
    toast({ title: 'Nome atualizado âœ“' });
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    toast({ title: 'UsuÃ¡rio removido' });
    fetchUsers();
  };
  const handleResetPassword = async (userId: string) => {
    setResetLoading(true);
    setTempPassword(null);
    const response = await supabase.rpc('rpc_reset_password' as any, {
      p_user_id: userId
    });
    
    const data = response.data as any;
    const error = response.error || (data && data.error);

    if (error) {
      toast({ title: 'Erro ao gerar senha temporária', description: typeof error === 'string' ? error : error.message, variant: 'destructive' });
      setResetLoading(false);
      return;
    }

    setTempPassword(data.temp_password);
    toast({ title: 'Senha temporária gerada ✓' });
    setResetLoading(false);
  };

  const handleCopyPassword = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    toast({ title: 'Senha copiada!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const counts = {
    dev: users.filter(u => u.role === 'dev').length,
    admin: users.filter(u => u.role === 'admin').length,
    midia: users.filter(u => u.role === 'midia').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Equipe</h2>
          <p className="text-xs text-muted-foreground">Gerencie contas administrativas do sistema</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2 rounded-xl shadow-sm h-10">
          <Plus className="w-4 h-4" /> Novo UsuÃ¡rio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Desenvolvedores', count: counts.dev, ...ROLE_CONFIG.dev },
          { label: 'Administradores', count: counts.admin, ...ROLE_CONFIG.admin },
          { label: 'MÃ­dia Social', count: counts.midia, ...ROLE_CONFIG.midia },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4 text-center space-y-1">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mx-auto`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum usuÃ¡rio administrativo encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-2.5"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {users.map(u => (
            <UserCard
              key={u.user_id}
              user={u}
              onEdit={() => setEditUser(u)}
              onViewAccount={() => { setViewUser(u); setTempPassword(null); setCopied(false); }}
              onTogglePro={() => toggleProStatus(u.user_id, u.is_pro)}
              onChangeRole={(role) => updateUserRole(u.user_id, role)}
              onDelete={() => deleteUser(u.user_id)}
            />
          ))}
        </motion.div>
      )}

      {/* â”€â”€â”€ Create Dialog â”€â”€â”€ */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Criar Novo UsuÃ¡rio</DialogTitle>
            <DialogDescription className="text-xs">Preencha os dados para criar uma conta administrativa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome completo</Label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nome do usuÃ¡rio"
                className="h-11 rounded-xl text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@dominio.com"
                  className="h-11 rounded-xl text-base pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Senha inicial</Label>
              <Input
                type="password"
                value={createForm.password}
                onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                placeholder="MÃ­nimo 6 caracteres"
                className="h-11 rounded-xl text-base"
              />
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cargo</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['admin', 'midia'] as const).map(role => {
                  const cfg = ROLE_CONFIG[role];
                  const Icon = cfg.icon;
                  const isSelected = createForm.role === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setCreateForm(p => ({ ...p, role }))}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-150 ${
                        isSelected
                          ? `${cfg.bg} border-current ${cfg.color} shadow-sm`
                          : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRO toggle */}
            <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-150 ${
              createForm.is_pro ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5' : 'border-border/60 bg-muted/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${createForm.is_pro ? 'bg-amber-500/15' : 'bg-muted'}`}>
                  <Crown className={`w-4 h-4 ${createForm.is_pro ? 'text-amber-500' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Plano PRO</p>
                  <p className="text-[11px] text-muted-foreground">Acesso a recursos avanÃ§ados</p>
                </div>
              </div>
              <Switch checked={createForm.is_pro} onCheckedChange={v => setCreateForm(p => ({ ...p, is_pro: v }))} />
            </div>
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating} className="rounded-xl gap-2 min-w-[100px]">
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : 'Criar UsuÃ¡rio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€â”€ Edit Dialog â”€â”€â”€ */}
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Editar UsuÃ¡rio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</Label>
                <Input
                  value={editUser.name}
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                  className="h-11 rounded-xl text-base"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-xl">Cancelar</Button>
              <Button onClick={() => { updateUserName(editUser.user_id, editUser.name); setEditUser(null); }} className="rounded-xl">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* â”€â”€â”€ View Account Dialog â”€â”€â”€ */}
      {viewUser && (
        <Dialog open={!!viewUser} onOpenChange={() => { setViewUser(null); setTempPassword(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">InformaÃ§Ãµes da Conta</DialogTitle>
              <DialogDescription className="text-xs">Dados detalhados do usuÃ¡rio.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              {/* User header */}
              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-muted/30 border border-border/40">
                <div className={`w-12 h-12 rounded-xl ${ROLE_CONFIG[viewUser.role]?.bg || 'bg-muted'} flex items-center justify-center ring-1 ring-border/30`}>
                  {(() => { const Icon = ROLE_CONFIG[viewUser.role]?.icon || Shield; return <Icon className={`w-6 h-6 ${ROLE_CONFIG[viewUser.role]?.color || 'text-foreground'}`} />; })()}
                </div>
                <div>
                  <p className="font-bold text-foreground">{viewUser.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 ${ROLE_CONFIG[viewUser.role]?.bg} ${ROLE_CONFIG[viewUser.role]?.color}`}>
                      {ROLE_CONFIG[viewUser.role]?.label || viewUser.role}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 ${viewUser.is_pro ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : ''}`}>
                      {viewUser.is_pro ? 'â­ PRO' : 'Comum'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                {[
                  { label: 'E-mail', value: viewUser.email || 'â€”' },
                  { label: 'Telefone', value: viewUser.phone || 'â€”' },
                  { label: 'Status', value: viewUser.active ? 'Ativo' : 'Inativo' },
                  { label: 'Criado em', value: viewUser.created_at ? formatDistanceToNow(new Date(viewUser.created_at), { addSuffix: true, locale: ptBR }) : 'â€”' },
                  { label: 'ID', value: viewUser.user_id },
                ].map(item => (
                  <div key={item.label} className="flex items-start justify-between gap-2 py-2 border-b border-border/30 last:border-0">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">{item.label}</span>
                    <span className={`text-xs text-foreground text-right truncate max-w-[220px] ${item.label === 'ID' ? 'font-mono text-[10px]' : ''}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Password reset section */}
              <div className="p-4 rounded-xl border-2 border-dashed border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">RecuperaÃ§Ã£o de senha</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Gera uma senha temporÃ¡ria segura. O usuÃ¡rio serÃ¡ obrigado a criar uma nova senha no prÃ³ximo login.
                </p>

                {tempPassword ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/40">
                      <code className="text-sm font-mono text-foreground flex-1 select-all">{tempPassword}</code>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopyPassword}>
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      âš  Copie agora. Essa senha nÃ£o serÃ¡ exibida novamente.
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg gap-2"
                    onClick={() => handleResetPassword(viewUser.user_id)}
                    disabled={resetLoading}
                  >
                    {resetLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</> : <><KeyRound className="w-3.5 h-3.5" /> Gerar senha temporÃ¡ria</>}
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setViewUser(null); setTempPassword(null); }} className="rounded-xl w-full">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
