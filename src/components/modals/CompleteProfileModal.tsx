import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { isValidPhone, toE164 } from '@/lib/phoneUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import * as petsService from '@/services/petsService';
import * as profilesService from '@/services/profilesService';
import * as accountsService from '@/services/accountsService';
import { convertImageToWebP, validateImageFile, createImagePreview, generateUniqueFileName } from '@/lib/imageUtils';
import { PawPrint, Phone, User, Mail, Camera, Loader2 } from 'lucide-react';

const BREEDS = [
  'SRD', 'Poodle', 'Shih Tzu', 'Yorkshire', 'Spitz AlemÃ£o', 'Golden Retriever',
  'Labrador', 'Bulldog FrancÃªs', 'Pinscher', 'Dachshund', 'Beagle',
  'Past. AlemÃ£o', 'Border Collie',
];

interface Props {
  userId: string;
  userName: string;
  userEmail?: string;
  onComplete: () => void;
  onLogout: () => void;
}

export function CompleteProfileModal({ userId, userName, userEmail, onComplete, onLogout }: Props) {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [customBreed, setCustomBreed] = useState('');
  const [size, setSize] = useState('');
  const [petPhoto, setPetPhoto] = useState<File | null>(null);
  const [petPhotoPreview, setPetPhotoPreview] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Imagem invÃ¡lida.');
      return;
    }
    setPetPhoto(file);
    const preview = await createImagePreview(file);
    setPetPhotoPreview(preview);
  };

  const uploadPetPhoto = async (petId: string): Promise<string | null> => {
    if (!petPhoto) return null;
    setPhotoUploading(true);
    try {
      const webpBlob = await convertImageToWebP(petPhoto, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
      const fileName = `${userId}/${generateUniqueFileName(`pet-${petId}`)}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars-pets')
        .upload(fileName, webpBlob, { contentType: 'image/webp' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars-pets').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Pet photo upload error:', err);
      return null;
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    if (!isValidPhone(phone)) { setError('Telefone invÃ¡lido. Use DDD + nÃºmero.'); return; }
    if (!petName.trim()) { setError('Informe o nome do pet.'); return; }

    const e164 = toE164(phone);
    if (!e164) { setError('Telefone invÃ¡lido.'); return; }

    // Check phone uniqueness
    const existing = await accountsService.lookupByPhone(phone);
    if (existing) {
      // Phone already registered to some account - could be this user or another
      // Since we can't check ID from the lookup, do a best-effort check
      setError('Este telefone jÃ¡ estÃ¡ vinculado a outra conta.');
      return;
    }

    setLoading(true);
    try {
      // Update profile
      await profilesService.updateProfile(userId, {
        name: name.trim(),
        phone: e164,
        profile_completed: true,
      } as any);

      // Update user_accounts phone
      await supabase.from('user_accounts').update({
        phone_e164: e164,
        full_name: name.trim(),
      } as any).eq('id', userId);

      // Create pet
      const finalBreed = breed === 'Outros' ? customBreed : breed;
      const pet = await petsService.createPet({
        owner_id: userId,
        name: petName.trim(),
        size: size || 'MÃ©dio',
        breed: finalBreed || '',
      });

      // Upload photo if selected
      if (pet && petPhoto) {
        const photoUrl = await uploadPetPhoto(pet.id);
        if (photoUrl) {
          await petsService.updatePet(pet.id, { photo_url: photoUrl } as any);
        }
      }

      toast({ title: 'Cadastro completo!' });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Erro ao completar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Complete seu cadastro</DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Para agendar e acompanhar seu pet, precisamos de mais algumas informaÃ§Ãµes.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Nome completo
            </Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              className="h-[48px] rounded-xl"
            />
          </div>

          {/* Email (read-only confirmation) */}
          {email && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> E-mail
              </Label>
              <Input
                value={email}
                readOnly
                className="h-[48px] rounded-xl bg-muted/50 text-muted-foreground cursor-default"
              />
            </div>
          )}

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Telefone
            </Label>
            <PhoneInput id="complete-phone" value={phone} onChange={setPhone} />
          </div>

          {/* Pet section */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <PawPrint className="w-4 h-4 text-primary" /> Dados do seu pet
            </p>

            {/* Pet photo */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 bg-muted/30 flex items-center justify-center overflow-hidden transition-colors shrink-0"
              >
                {petPhotoPreview ? (
                  <img src={petPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground/50" />
                )}
              </button>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">Foto do pet (opcional)</p>
                <p>JPG, PNG â€” mÃ¡x. 8MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Nome do pet</Label>
              <Input
                value={petName}
                onChange={e => setPetName(e.target.value)}
                placeholder="Ex: Rex, Luna..."
                className="h-[48px] rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">RaÃ§a</Label>
              <Select value={breed} onValueChange={setBreed}>
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
              {breed === 'Outros' && (
                <Input
                  value={customBreed}
                  onChange={e => setCustomBreed(e.target.value)}
                  placeholder="Digite a raÃ§a"
                  className="h-[48px] rounded-xl mt-2"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Porte</Label>
              <Select value={size} onValueChange={setSize}>
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
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            className="w-full h-[52px] rounded-[14px] text-base font-semibold gap-2"
            onClick={handleSubmit}
            disabled={loading || photoUploading}
          >
            {(loading || photoUploading) ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              'Concluir cadastro'
            )}
          </Button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Sair da conta
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
