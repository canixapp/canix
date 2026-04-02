import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProAccess } from '@/hooks/useProAccess';
import { ProCard } from '@/components/admin/ProGate';
import { PremiumCard } from '@/components/dashboard/PremiumCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as petsService from '@/services/petsService';
import * as petNotesService from '@/services/petNotesService';
import * as profilesService from '@/services/profilesService';
import { ArrowLeft, Dog, Calendar, Scissors, Clock, Plus, Trash2, StickyNote } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PetProfile() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { appointments } = useAdmin();
  const { user } = useAuth();
  const { isProActive } = useProAccess();

  const [pet, setPet] = useState<petsService.PetRow | null>(null);
  const [owner, setOwner] = useState<profilesService.ProfileRow | null>(null);
  const [notes, setNotes] = useState<petNotesService.PetNoteRow[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!petId) return;
    loadData();
  }, [petId]);

  const loadData = async () => {
    if (!petId) return;
    setLoading(true);
    const allPets = await petsService.getAllPets();
    const found = allPets.find(p => p.id === petId);
    setPet(found || null);

    if (found) {
      const profiles = await profilesService.getClientProfiles();
      setOwner(profiles.find(p => p.user_id === found.owner_id) || null);
      const n = await petNotesService.getPetNotes(petId);
      setNotes(n);
    }
    setLoading(false);
  };

  const petAppointments = useMemo(() => {
    if (!petId) return [];
    return appointments
      .filter(a => a.pets?.some(p => p.pet_id === petId))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, petId]);

  const stats = useMemo(() => {
    const completed = petAppointments.filter(a => a.status === 'realizado');
    const total = completed.length;
    const last = completed[0];
    let avgReturn = 0;
    if (completed.length >= 2) {
      const dates = completed.map(a => parseISO(a.date)).sort((a, b) => a.getTime() - b.getTime());
      const diffs = dates.slice(1).map((d, i) => differenceInDays(d, dates[i]));
      avgReturn = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length);
    }
    return { total, lastDate: last?.date, avgReturn };
  }, [petAppointments]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !petId) return;
    const result = await petNotesService.createPetNote(petId, newNote.trim(), user?.id);
    if (result) {
      setNotes(prev => [result, ...prev]);
      setNewNote('');
      toast.success('Observação adicionada');
    } else {
      toast.error('Erro ao salvar observação');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const ok = await petNotesService.deletePetNote(noteId);
    if (ok) setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Carregando...</div>;
  }

  if (!pet) {
    return (
      <div className="text-center py-20 space-y-4">
        <Dog className="w-12 h-12 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">Pet não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  const STATUS_BADGE: Record<string, string> = {
    realizado: 'border-emerald-400/60 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5',
    cancelado: 'border-destructive/40 text-destructive bg-destructive/5',
    confirmado: 'border-primary/40 text-primary bg-primary/5',
    pendente: 'border-amber-400/60 text-amber-700 dark:text-amber-400 bg-amber-500/5',
    remarcado: 'border-violet-400/60 text-violet-700 dark:text-violet-400 bg-violet-500/5',
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Prontuário do Pet</h1>
      </div>

      {/* Pet Info Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[14px] border border-border/60 bg-card shadow-sm p-5">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            {pet.photo_url ? <AvatarImage src={pet.photo_url} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {pet.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground">{pet.name}</h2>
            <p className="text-sm text-muted-foreground">{pet.breed || 'Raça não informada'} • {pet.size}</p>
            {owner && <p className="text-xs text-muted-foreground mt-1">Tutor: {owner.name}</p>}
            <p className="text-[11px] text-muted-foreground mt-0.5">Cadastrado em {format(parseISO(pet.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
        </div>

        {/* Extended pet profile info */}
        {((pet as any).age || (pet as any).weight || (pet as any).behavior || (pet as any).allergies || (pet as any).coat_type || (pet as any).observations) && (
          <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-2 gap-3">
            {(pet as any).age && (
              <div><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Idade</span><p className="text-sm font-medium text-foreground">{(pet as any).age}</p></div>
            )}
            {(pet as any).weight && (
              <div><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Peso</span><p className="text-sm font-medium text-foreground">{(pet as any).weight}</p></div>
            )}
            {(pet as any).coat_type && (
              <div><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pelagem</span><p className="text-sm font-medium text-foreground">{(pet as any).coat_type}</p></div>
            )}
            {(pet as any).behavior && (
              <div className="col-span-2"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Comportamento</span><p className="text-sm font-medium text-foreground">{(pet as any).behavior}</p></div>
            )}
            {(pet as any).allergies && (
              <div className="col-span-2"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alergias</span><p className="text-sm font-medium text-destructive">{(pet as any).allergies}</p></div>
            )}
            {(pet as any).observations && (
              <div className="col-span-2"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Observações</span><p className="text-sm font-medium text-foreground">{(pet as any).observations}</p></div>
            )}
          </div>
        )}
      </motion.div>

      {/* Stats (PRO) */}
      <ProCard>
        <div className="grid grid-cols-3 gap-3">
          <PremiumCard label="Atendimentos" value={String(stats.total)} icon={<Scissors className="w-5 h-5 text-primary" />} accentClass="text-foreground" bgClass="bg-primary/10" tooltip="Total de atendimentos concluídos." index={0} />
          <PremiumCard label="Último" value={stats.lastDate ? format(parseISO(stats.lastDate), "dd/MM") : '—'} icon={<Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />} accentClass="text-sky-600 dark:text-sky-400" bgClass="bg-sky-500/10" tooltip="Data do último atendimento." index={1} />
          <PremiumCard label="Freq. Média" value={stats.avgReturn > 0 ? `${stats.avgReturn}d` : '—'} icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />} accentClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-500/10" tooltip="Frequência média de retorno em dias." index={2} />
        </div>
      </ProCard>

      {/* Appointment History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Histórico de Atendimentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {petAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum atendimento registrado.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {petAppointments.slice(0, 20).map(a => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0">
                    <Scissors className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.service_name}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(a.date), "dd MMM yyyy", { locale: ptBR })} às {a.time?.substring(0, 5)}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[a.status] || ''}`}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <StickyNote className="w-4 h-4" /> Observações do Pet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Ex: medo de secador, pele sensível..."
              className="text-sm min-h-[60px]"
              style={{ fontSize: '16px' }}
            />
            <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()} className="shrink-0 self-end">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhuma observação registrada.</p>
          ) : (
            <div className="space-y-2">
              {notes.map(n => (
                <div key={n.id} className="flex items-start gap-2 rounded-xl bg-muted/30 p-3">
                  <p className="text-sm text-foreground flex-1">{n.note}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{format(parseISO(n.created_at), "dd/MM/yy")}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteNote(n.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
