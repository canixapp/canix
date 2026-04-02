import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Users, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
type UserRole = 'dev' | 'admin' | 'midia' | 'cliente';

export default function Usuarios() {
  const { adminUsersList, addAdminUser, deleteAdminUser } = useAdmin();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' as UserRole });

  const handleAdd = () => {
    if (!form.name || !form.email || !form.password) return;
    addAdminUser(form);
    setAddOpen(false);
    setForm({ name: '', email: '', password: '', role: 'admin' });
  };

  const roleLabel = (role: UserRole) => {
    switch (role) {
      case 'dev': return 'Desenvolvedor';
      case 'admin': return 'Administrador';
      case 'midia': return 'Mídia Social';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Usuários Administrativos</h1>
        <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" /> Novo Usuário</Button>
      </div>

      <div className="space-y-3">
        {adminUsersList.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{u.name}</p>
                    <Badge variant={u.role === 'dev' ? 'default' : u.role === 'admin' ? 'secondary' : 'outline'}>
                      {roleLabel(u.role)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
              </div>
              {u.id !== 'dev1' && (
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAdminUser(u.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Usuário Administrativo</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Senha</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Nível</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="midia">Mídia Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAdd}>Criar Usuário</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
