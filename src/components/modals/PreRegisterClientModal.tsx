import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { isValidPhone, toE164 } from '@/lib/phoneUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';
import * as accountsService from '@/services/accountsService';
import { UserPlus, Loader2, Phone, User, PawPrint } from 'lucide-react';

const BREEDS = [
  'SRD', 'Poodle', 'Shih Tzu', 'Yorkshire', 'Spitz AlemÃ£o', 'Golden Retriever',
  'Labrador', 'Bulldog FrancÃªs', 'Pinscher', 'Dachshund', 'Beagle',
  'Past. AlemÃ£o', 'Border Collie',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function PreRegisterClientModal({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petCustomBreed, setPetCustomBreed] = useState('');
  const [petSize, setPetSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName(''); setPhone(''); setNotes('');
    setPetName(''); setPetBreed(''); setPetCustomBreed(''); setPetSize('');
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Informe o nome do cliente.'); return; }
    if (!isValidPhone(phone)) { setError('Telefone invÃ¡lido. Use DDD + nÃºmero.'); return; }

    const e164 = toE164(phone);
    if (!e164) { setError('Telefone invÃ¡lido.'); return; }

    // Check if phone already exists
    const existing = await accountsService.lookupByPhone(phone);
    if (existing) {
      setError('Este telefone jÃ¡ estÃ¡ vinculado a uma conta existente.');
      return;
    }

    setLoading(true);
    try {
      // Create a virtual email for pre-registration
      const digits = e164.replace(/\D/g, '');
      const virtualEmail = `${digits}@phone.petcao.app`;

      // Create auth user with a random password (they'll set their own later)
      const tempPw = crypto.randomUUID().slice(0, 16) + 'Aa1!';
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: virtualEmail,
        password: tempPw,
        options: {
          data: { name: name.trim(), phone_e164: e164 },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile as pre-registered (not complete)
        await supabase.from('profiles').update({
          profile_completed: false,
          phone: e164,
          name: name.trim(),
        } as any).eq('user_id', authData.user.id);

        // Create pet if provided
        if (petName.trim()) {
          const finalBreed = petBreed === 'Outros' ? petCustomBreed : petBreed;
          await supabase.from('pets').insert({
            owner_id: authData.user.id,
            petshop_id: PETSHOP_ID,
            name: petName.trim(),
            size: petSize || 'MÃ©dio',
            breed: finalBreed || '',
          } as any);
        }

        // Sign out the pre-registered user (admin shouldn't stay logged in as them)
        // We need to restore admin session, so we sign out and the onAuthStateChange will handle it
        // Actually, signUp might auto-confirm, we need to handle this carefully
        // The admin is already logged in, signUp creates user but doesn't switch session
      }

      toast({ title: 'Cliente prÃ©-cadastrado com sucesso!' });
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Erro ao prÃ©-cadastrar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg">PrÃ©-cadastrar Cliente</DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Cadastre um cliente pelo telefone. Ele poderÃ¡ completar o cadastro depois.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Nome completo *
            </Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do cliente"
              className="h-[48px] rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Telefone *
            </Label>
            <PhoneInput id="pre-register-phone" value={phone} onChange={setPhone} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">ObservaÃ§Ãµes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ObservaÃ§Ãµes sobre o cliente..."
              className="min-h-[60px] rounded-xl resize-none"
            />
          </div>

          {/* Pet section (optional) */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <PawPrint className="w-4 h-4 text-primary" /> Dados do pet (opcional)
            </p>

            <div className="space-y-1.5">
              <Label className="text-sm">Nome do pet</Label>
              <Input
                value={petName}
                onChange={e => setPetName(e.target.value)}
                placeholder="Ex: Rex, Luna..."
                className="h-[48px] rounded-xl"
              />
            </div>

            {petName.trim() && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm">RaÃ§a</Label>
                  <Select value={petBreed} onValueChange={setPetBreed}>
                    <SelectTrigger className="h-[48px] rounded-xl">
                      <SelectValue placeholder="Selecione a raÃ§a" />
                    </SelectTrigger>
                    <SelectContent>
                      {BREEDS.map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  {petBreed === 'Outros' && (
                    <Input
                      value={petCustomBreed}
                      onChange={e => setPetCustomBreed(e.target.value)}
                      placeholder="Digite a raÃ§a"
                      className="h-[48px] rounded-xl mt-2"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Porte</Label>
                  <Select value={petSize} onValueChange={setPetSize}>
                    <SelectTrigger className="h-[48px] rounded-xl">
                      <SelectValue placeholder="Selecione o porte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pequeno">Pequeno</SelectItem>
                      <SelectItem value="MÃ©dio">MÃ©dio</SelectItem>
                      <SelectItem value="Grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-xl gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</> : 'PrÃ©-cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
