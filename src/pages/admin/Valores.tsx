import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { ServiceRow } from '@/services/servicesService';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Droplets, Scissors, Sparkles, Package, DollarSign, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type SizeKey = 'pequeno' | 'medio' | 'grande';

const sizeLabels: { key: SizeKey; label: string; emoji: string }[] = [
  { key: 'pequeno', label: 'Pequeno', emoji: '🐕' },
  { key: 'medio', label: 'Médio', emoji: '🐕‍🦺' },
  { key: 'grande', label: 'Grande', emoji: '🦮' },
];

const categoryConfig: Record<string, { icon: typeof Droplets; color: string; gradient: string; label: string }> = {
  banho: { icon: Droplets, color: 'text-sky-500', gradient: 'from-sky-500/20 to-sky-500/5', label: 'Banho' },
  tosa: { icon: Scissors, color: 'text-cyan-500', gradient: 'from-cyan-500/20 to-cyan-500/5', label: 'Tosa' },
  combo: { icon: Sparkles, color: 'text-amber-500', gradient: 'from-amber-500/20 to-amber-500/5', label: 'Combo' },
};

import { cardAnimProps as cardAnim } from '@/lib/animations';

export default function Valores() {
  const { servicesList, servicesLoading, updateService } = useAdmin();
  const [drafts, setDrafts] = useState<Record<string, { price_pequeno: number; price_medio: number; price_grande: number }>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d: typeof drafts = {};
    servicesList.forEach(s => {
      d[s.id] = {
        price_pequeno: s.price_pequeno ?? 0,
        price_medio: s.price_medio ?? 0,
        price_grande: s.price_grande ?? 0,
      };
    });
    setDrafts(d);
    setDirty(new Set());
  }, [servicesList]);

  const handleChange = (id: string, size: SizeKey, value: string) => {
    const num = value === '' ? 0 : Number(value);
    const key = size === 'pequeno' ? 'price_pequeno' : size === 'medio' ? 'price_medio' : 'price_grande';
    setDrafts(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: num },
    }));
    setDirty(prev => new Set(prev).add(id));
  };

  const handleSave = async () => {
    setSaving(true);
    const promises = Array.from(dirty).map(id => {
      const d = drafts[id];
      if (!d) return Promise.resolve();
      return updateService(id, d);
    });
    await Promise.all(promises);
    setDirty(new Set());
    setSaving(false);
    toast.success('Valores salvos com sucesso!');
  };

  // Group by category
  const grouped = servicesList.reduce<Record<string, ServiceRow[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  // Stats
  const totalServices = servicesList.length;
  const avgPrice = servicesList.length > 0
    ? Math.round(servicesList.reduce((sum, s) => sum + ((s.price_pequeno || 0) + (s.price_medio || 0) + (s.price_grande || 0)) / 3, 0) / servicesList.length)
    : 0;

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Premium Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 border border-emerald-500/10 shadow-lg shadow-emerald-500/5">
            <DollarSign className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Valores</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie preços por serviço e porte</p>
          </div>
        </div>
        <Button
          size="default"
          className="h-11 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20 gap-2"
          onClick={handleSave}
          disabled={dirty.size === 0 || saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : dirty.size > 0 ? (
            <Save className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {saving ? 'Salvando...' : dirty.size > 0 ? `Salvar (${dirty.size})` : 'Salvo'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <motion.div {...cardAnim}>
          <Card className="border-border/30 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{totalServices}</p>
                  <p className="text-xs text-muted-foreground font-medium">Serviços ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.05 }}>
          <Card className="border-border/30 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    R$ {avgPrice}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Preço médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.1 }} className="col-span-2 sm:col-span-1">
          <Card className={`border-border/30 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden ${dirty.size > 0 ? 'border-amber-500/30' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${dirty.size > 0 ? 'bg-amber-500/10' : 'bg-muted/50'} flex items-center justify-center`}>
                  <Save className={`w-5 h-5 ${dirty.size > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{dirty.size}</p>
                  <p className="text-xs text-muted-foreground font-medium">Alterações pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Services by Category */}
      {Object.entries(grouped).map(([category, services], catIndex) => {
        const config = categoryConfig[category.toLowerCase()] || { icon: Package, color: 'text-muted-foreground', gradient: 'from-muted/50 to-muted/20', label: category };
        const Icon = config.icon;
        
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: catIndex * 0.1 }}
            className="space-y-4"
          >
            {/* Category Header */}
            <div className="flex items-center gap-3 px-1">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <h2 className="text-lg font-bold text-foreground">{config.label}</h2>
              <Badge variant="outline" className="text-[10px] font-semibold">{services.length} serviço{services.length !== 1 ? 's' : ''}</Badge>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service, i) => (
                <motion.div
                  key={service.id}
                  {...cardAnim}
                  transition={{ ...cardAnim.transition, delay: i * 0.03 }}
                >
                  <Card className={`border-border/30 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border/60 ${dirty.has(service.id) ? 'ring-2 ring-primary/20 border-primary/30' : ''}`}>
                    <CardContent className="p-5 space-y-4">
                      {/* Service Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{service.name}</h3>
                            {service.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                            )}
                          </div>
                        </div>
                        {dirty.has(service.id) && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-amber-500 border-amber-500/30 bg-amber-500/10">
                            Alterado
                          </Badge>
                        )}
                      </div>

                      {/* Price Inputs */}
                      <div className="space-y-3">
                        {sizeLabels.map(({ key: sizeKey, label: sizeLabel, emoji }) => {
                          const priceKey = sizeKey === 'pequeno' ? 'price_pequeno' : sizeKey === 'medio' ? 'price_medio' : 'price_grande';
                          return (
                            <div key={sizeKey} className="flex items-center gap-3">
                              <div className="w-24 flex items-center gap-2">
                                <span className="text-base">{emoji}</span>
                                <Label className="text-sm text-muted-foreground font-medium">{sizeLabel}</Label>
                              </div>
                              <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
                                <Input
                                  type="number"
                                  min={0}
                                  step={5}
                                  value={drafts[service.id]?.[priceKey] ?? 0}
                                  onChange={e => handleChange(service.id, sizeKey, e.target.value)}
                                  className="pl-12 h-11 rounded-xl text-base font-semibold tabular-nums border-border/40 focus-visible:ring-primary/30"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {servicesList.length === 0 && (
        <motion.div {...cardAnim} className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Package className="w-9 h-9 text-muted-foreground/40" />
          </div>
          <p className="text-base font-semibold text-muted-foreground">Nenhum serviço cadastrado</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Crie serviços na página de Serviços</p>
        </motion.div>
      )}
    </div>
  );
}
