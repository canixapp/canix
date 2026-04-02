import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Dog, PawPrint, X } from 'lucide-react';
import * as petsService from '@/services/petsService';
import * as profilesService from '@/services/profilesService';
import { motion, AnimatePresence } from 'framer-motion';
import { cardAnimProps as cardAnim } from '@/lib/animations';

export default function Pets() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<petsService.PetRow[]>([]);
  const [profiles, setProfiles] = useState<profilesService.ProfileRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      petsService.getAllPets(),
      profilesService.getClientProfiles(),
    ]).then(([p, pr]) => {
      setPets(p);
      setProfiles(pr);
      setLoading(false);
    });
  }, []);

  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach(p => map.set(p.user_id, p.name));
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    if (!search.trim()) return pets;
    const q = search.toLowerCase();
    return pets.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.breed || '').toLowerCase().includes(q) ||
      (profileMap.get(p.owner_id) || '').toLowerCase().includes(q)
    );
  }, [pets, search, profileMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
            <PawPrint className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Todos os pets cadastrados</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-bold tabular-nums border-border/60 bg-card px-3 py-1.5 rounded-xl">
          {pets.length} pets
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
        <Input
          placeholder="Buscar por nome, raça ou tutor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-12 h-12 rounded-2xl border-border/40 bg-card/80 backdrop-blur-sm text-base placeholder:text-muted-foreground/50"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((pet, i) => (
            <motion.div
              key={pet.id}
              {...cardAnim}
              transition={{ ...cardAnim.transition, delay: i * 0.02 }}
              layout
            >
              <Card
                className="group cursor-pointer border-border/30 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
                onClick={() => navigate(`/admin/pet/${pet.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 rounded-xl border-2 border-primary/10 group-hover:border-primary/30 transition-colors shadow-md">
                      {pet.photo_url ? <AvatarImage src={pet.photo_url} /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold rounded-xl">
                        {pet.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground text-base truncate group-hover:text-primary transition-colors">
                        {pet.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {pet.breed || 'Raça não informada'} • {pet.size}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                        <Dog className="w-3 h-3" />
                        {profileMap.get(pet.owner_id) || 'Tutor desconhecido'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
            <PawPrint className="w-9 h-9 text-muted-foreground/40" />
          </div>
          <p className="text-base font-semibold text-muted-foreground">Nenhum pet encontrado</p>
        </div>
      )}
    </div>
  );
}
