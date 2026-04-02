import {
  Bath, Scissors, Sparkles, Star, Heart, Sun, Dog, Plus,
  Droplets, Flower2, Shield, Zap, Crown, Gem, Palette,
  Wind, ThermometerSun, Brush, Hand, Eye, Ear, Footprints,
  Pill, Syringe, Stethoscope, Baby, Waves, CloudRain,
  type LucideIcon
} from 'lucide-react';

export interface ServiceCategory {
  value: string;
  label: string;
  icon: string; // lucide icon key
  color: string; // tailwind text color
  gradient: string; // tailwind gradient classes
  glow: string; // glow bg class
  bgBadge: string; // badge classes
}

// Default built-in categories
export const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { value: 'banho', label: 'Banho', icon: 'bath', color: 'text-sky-500', gradient: 'from-sky-500 to-cyan-400', glow: 'bg-sky-500/20', bgBadge: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:text-sky-400 dark:border-sky-800' },
  { value: 'tosa', label: 'Tosa', icon: 'scissors', color: 'text-violet-500', gradient: 'from-violet-500 to-purple-400', glow: 'bg-violet-500/20', bgBadge: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:text-violet-400 dark:border-violet-800' },
  { value: 'combo', label: 'Banho e Tosa', icon: 'sparkles', color: 'text-amber-500', gradient: 'from-amber-500 to-orange-400', glow: 'bg-amber-500/20', bgBadge: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800' },
  { value: 'estetica', label: 'Estética', icon: 'star', color: 'text-pink-500', gradient: 'from-pink-500 to-rose-400', glow: 'bg-pink-500/20', bgBadge: 'bg-pink-500/10 text-pink-600 border-pink-200 dark:text-pink-400 dark:border-pink-800' },
  { value: 'tratamento', label: 'Tratamentos', icon: 'heart', color: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-400', glow: 'bg-emerald-500/20', bgBadge: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800' },
  { value: 'extra', label: 'Serviços Extras', icon: 'sun', color: 'text-slate-500', gradient: 'from-slate-500 to-gray-400', glow: 'bg-slate-500/20', bgBadge: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800' },
  { value: 'outro', label: 'Outros', icon: 'plus', color: 'text-gray-500', gradient: 'from-gray-500 to-gray-400', glow: 'bg-gray-500/20', bgBadge: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800' },
];

export const ICON_MAP: Record<string, LucideIcon> = {
  bath: Bath,
  scissors: Scissors,
  sparkles: Sparkles,
  star: Star,
  heart: Heart,
  sun: Sun,
  dog: Dog,
  plus: Plus,
  droplets: Droplets,
  flower: Flower2,
  shield: Shield,
  zap: Zap,
  crown: Crown,
  gem: Gem,
  palette: Palette,
  wind: Wind,
  thermometer: ThermometerSun,
  brush: Brush,
  hand: Hand,
  eye: Eye,
  ear: Ear,
  footprints: Footprints,
  pill: Pill,
  syringe: Syringe,
  stethoscope: Stethoscope,
  baby: Baby,
  waves: Waves,
  rain: CloudRain,
};

export const ICON_LABELS: Record<string, string> = {
  bath: 'Banho',
  scissors: 'Tesoura',
  sparkles: 'Brilho',
  star: 'Estrela',
  heart: 'Coração',
  sun: 'Sol',
  dog: 'Cachorro',
  plus: 'Mais',
  droplets: 'Gotas',
  flower: 'Flor',
  shield: 'Escudo',
  zap: 'Raio',
  crown: 'Coroa',
  gem: 'Gema',
  palette: 'Paleta',
  wind: 'Vento',
  thermometer: 'Temp.',
  brush: 'Pincel',
  hand: 'Mão',
  eye: 'Olho',
  ear: 'Orelha',
  footprints: 'Patas',
  pill: 'Remédio',
  syringe: 'Seringa',
  stethoscope: 'Esteto.',
  baby: 'Filhote',
  waves: 'Ondas',
  rain: 'Chuva',
};

export function getIconComponent(iconKey: string): LucideIcon {
  return ICON_MAP[iconKey] || Scissors;
}

export function getCategoryByValue(value: string, customCategories: ServiceCategory[] = []): ServiceCategory {
  const all = [...DEFAULT_CATEGORIES, ...customCategories];
  return all.find(c => c.value === value) || {
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    icon: 'scissors',
    color: 'text-gray-500',
    gradient: 'from-gray-500 to-gray-400',
    glow: 'bg-gray-500/20',
    bgBadge: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800',
  };
}

/** Merge default + custom, dedup by value */
export function getAllCategories(customCategories: ServiceCategory[] = []): ServiceCategory[] {
  const map = new Map<string, ServiceCategory>();
  DEFAULT_CATEGORIES.forEach(c => map.set(c.value, c));
  customCategories.forEach(c => map.set(c.value, c));
  return Array.from(map.values());
}

// Color presets for new categories
export const CATEGORY_COLOR_PRESETS = [
  { label: 'Azul', color: 'text-sky-500', gradient: 'from-sky-500 to-cyan-400', glow: 'bg-sky-500/20', bgBadge: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:text-sky-400 dark:border-sky-800' },
  { label: 'Roxo', color: 'text-violet-500', gradient: 'from-violet-500 to-purple-400', glow: 'bg-violet-500/20', bgBadge: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:text-violet-400 dark:border-violet-800' },
  { label: 'Âmbar', color: 'text-amber-500', gradient: 'from-amber-500 to-orange-400', glow: 'bg-amber-500/20', bgBadge: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800' },
  { label: 'Rosa', color: 'text-pink-500', gradient: 'from-pink-500 to-rose-400', glow: 'bg-pink-500/20', bgBadge: 'bg-pink-500/10 text-pink-600 border-pink-200 dark:text-pink-400 dark:border-pink-800' },
  { label: 'Verde', color: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-400', glow: 'bg-emerald-500/20', bgBadge: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800' },
  { label: 'Vermelho', color: 'text-red-500', gradient: 'from-red-500 to-rose-400', glow: 'bg-red-500/20', bgBadge: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800' },
  { label: 'Índigo', color: 'text-indigo-500', gradient: 'from-indigo-500 to-blue-400', glow: 'bg-indigo-500/20', bgBadge: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800' },
  { label: 'Cinza', color: 'text-slate-500', gradient: 'from-slate-500 to-gray-400', glow: 'bg-slate-500/20', bgBadge: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800' },
];
