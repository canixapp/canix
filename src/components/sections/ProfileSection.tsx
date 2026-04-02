import { useState } from 'react';
import { User, Edit2, Check, Plus, Dog, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, Pet } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function ProfileSection() {
  const { isAuthenticated, user, updateUser, addPet, updatePet } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPet, setIsEditingPet] = useState<string | null>(null);
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [petForm, setPetForm] = useState<Partial<Pet>>({ name: '', size: 'medio', breed: '' });

  if (!isAuthenticated || !user || user.role !== 'cliente') return null;

  const handleProfileSave = () => { updateUser({ name: profileForm.name, phone: profileForm.phone }); setIsEditingProfile(false); };
  const handlePetSave = (petId: string) => { updatePet(petId, petForm); setIsEditingPet(null); };
  const handleAddPet = () => { if (petForm.name && petForm.size && petForm.breed) { addPet({ name: petForm.name, size: petForm.size as Pet['size'], breed: petForm.breed }); setIsAddingPet(false); setPetForm({ name: '', size: 'medio', breed: '' }); } };
  const startEditPet = (pet: Pet) => { setIsEditingPet(pet.id); setPetForm({ name: pet.name, size: pet.size, breed: pet.breed }); };
  const getSizeLabel = (size: string) => { switch (size) { case 'pequeno': return 'Pequeno (até 10kg)'; case 'medio': return 'Médio (10-25kg)'; case 'grande': return 'Grande (acima de 25kg)'; default: return size; } };

  return (
    <section id="perfil" className="py-20 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* User Profile */}
          <div className="bg-background rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Perfil do Usuário
                </h3>
                {/* Package badge placeholder - will be connected to customer_packages */}
              </div>
              {!isEditingProfile && (
                <Button variant="ghost" size="sm" onClick={() => { setProfileForm({ name: user.name, phone: user.phone }); setIsEditingProfile(true); }}>
                  <Edit2 className="w-4 h-4 mr-1" /> Editar
                </Button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
                <div className="flex gap-2">
                  <Button onClick={handleProfileSave}><Check className="w-4 h-4 mr-1" /> Salvar</Button>
                  <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div><p className="text-sm text-muted-foreground">Nome</p><p className="font-medium text-foreground">{user.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Telefone</p><p className="font-medium text-foreground">{user.phone}</p></div>
              </div>
            )}
          </div>

          {/* Pets */}
          <div className="bg-background rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2"><Dog className="w-5 h-5 text-secondary" /> Meus Pets</h3>
              <Button variant="outline" size="sm" onClick={() => { setPetForm({ name: '', size: 'medio', breed: '' }); setIsAddingPet(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar Pet
              </Button>
            </div>

            <div className="space-y-4">
              {user.pets.map((pet) => (
                <div key={pet.id} className="p-4 bg-muted/50 rounded-xl flex items-center justify-between">
                  {isEditingPet === pet.id ? (
                    <div className="w-full space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>Nome</Label><Input value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} /></div>
                        <div className="space-y-2">
                          <Label>Porte</Label>
                          <Select value={petForm.size} onValueChange={(v) => setPetForm({ ...petForm, size: v as Pet['size'] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="pequeno">Pequeno</SelectItem><SelectItem value="medio">Médio</SelectItem><SelectItem value="grande">Grande</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Raça</Label><Input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} /></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handlePetSave(pet.id)}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingPet(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center"><Dog className="w-6 h-6 text-secondary" /></div>
                        <div>
                          <p className="font-semibold text-foreground">{pet.name}</p>
                          <p className="text-sm text-muted-foreground">{pet.breed} • {getSizeLabel(pet.size)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => startEditPet(pet)}><Edit2 className="w-4 h-4" /></Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isAddingPet} onOpenChange={setIsAddingPet}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Novo Pet</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Nome do Pet</Label><Input value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} placeholder="Nome do seu pet" /></div>
            <div className="space-y-2">
              <Label>Porte</Label>
              <Select value={petForm.size} onValueChange={(v) => setPetForm({ ...petForm, size: v as Pet['size'] })}>
                <SelectTrigger><SelectValue placeholder="Selecione o porte" /></SelectTrigger>
                <SelectContent><SelectItem value="pequeno">Pequeno (até 10kg)</SelectItem><SelectItem value="medio">Médio (10-25kg)</SelectItem><SelectItem value="grande">Grande (acima de 25kg)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Raça</Label><Input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} placeholder="Ex: Golden Retriever" /></div>
            <Button className="w-full" onClick={handleAddPet}>Adicionar Pet</Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
