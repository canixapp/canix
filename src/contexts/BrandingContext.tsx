import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { usePetshop } from '@/contexts/PetshopContext';

export type TemplateId = 'modern' | 'minimal' | 'playful' | 'premiumDark';

export interface Branding {
  shopName: string;
  logoUrl: string;
  primaryColor: string;
  templateSelected: TemplateId;
}

export interface ShopStatus {
  isOpen: boolean;
  statusLabel: string;
  timeLabel: string;
  tooltipLabel: string;
}

type TokenMap = Record<string, string>;

const TEMPLATE_TOKENS: Record<TemplateId, { light: TokenMap; dark: TokenMap }> = {
  modern: { light: {}, dark: {} },
  minimal: {
    light: {
      '--primary': '0 0% 20%', '--primary-foreground': '0 0% 100%',
      '--secondary': '0 0% 50%', '--secondary-foreground': '0 0% 100%',
      '--accent': '0 0% 96%', '--accent-foreground': '0 0% 20%', '--ring': '0 0% 20%',
    },
    dark: {
      '--primary': '0 0% 82%', '--primary-foreground': '0 0% 10%',
      '--secondary': '0 0% 55%', '--secondary-foreground': '0 0% 10%',
      '--accent': '0 0% 16%', '--accent-foreground': '0 0% 82%', '--ring': '0 0% 82%',
    },
  },
  playful: {
    light: {
      '--primary': '330 80% 55%', '--primary-foreground': '0 0% 100%',
      '--secondary': '160 70% 45%', '--secondary-foreground': '0 0% 100%',
      '--accent': '330 80% 95%', '--accent-foreground': '330 80% 55%', '--ring': '330 80% 55%',
    },
    dark: {
      '--primary': '330 75% 65%', '--primary-foreground': '0 0% 100%',
      '--secondary': '160 65% 55%', '--secondary-foreground': '0 0% 100%',
      '--accent': '330 50% 16%', '--accent-foreground': '330 75% 65%',
      '--card': '270 15% 14%', '--card-foreground': '0 0% 92%', '--ring': '330 75% 65%',
    },
  },
  premiumDark: {
    light: {
      '--primary': '45 90% 42%', '--primary-foreground': '0 0% 100%',
      '--background': '240 10% 96%', '--foreground': '240 10% 8%',
      '--card': '240 10% 92%', '--card-foreground': '240 10% 8%',
      '--muted': '240 10% 88%', '--muted-foreground': '240 10% 40%',
      '--border': '240 10% 82%', '--accent': '45 90% 92%',
      '--accent-foreground': '45 90% 30%', '--ring': '45 90% 42%',
    },
    dark: {
      '--background': '240 10% 8%', '--foreground': '0 0% 95%',
      '--primary': '45 90% 55%', '--primary-foreground': '240 10% 8%',
      '--secondary': '45 60% 40%', '--secondary-foreground': '0 0% 100%',
      '--card': '240 10% 12%', '--card-foreground': '0 0% 95%',
      '--muted': '240 10% 15%', '--muted-foreground': '0 0% 60%',
      '--border': '240 10% 20%', '--input': '240 10% 20%',
      '--accent': '240 10% 15%', '--accent-foreground': '45 90% 55%',
      '--popover': '240 10% 12%', '--popover-foreground': '0 0% 95%', '--ring': '45 90% 55%',
    },
  },
};

const ALL_TEMPLATE_VARS: string[] = [
  '--primary', '--primary-foreground', '--secondary', '--secondary-foreground',
  '--accent', '--accent-foreground', '--background', '--foreground',
  '--card', '--card-foreground', '--muted', '--muted-foreground',
  '--border', '--input', '--ring', '--popover', '--popover-foreground',
];

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

type WeeklySchedule = Record<string, boolean>;
const DAY_MAP = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface BrandingContextValue {
  branding: Branding;
  saveBranding: (partial: Partial<Branding>) => Promise<void>;
  shopStatus: ShopStatus;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const { petshop, settings, updateSettings, updatePetshop } = usePetshop();

  const branding: Branding = {
    shopName: petshop?.name || 'PetCão',
    logoUrl: petshop?.logo_url || '',
    primaryColor: settings.primaryColor || '#0A7AE6',
    templateSelected: (settings.templateSelected || 'modern') as TemplateId,
  };

  useEffect(() => {
    document.title = branding.shopName;
  }, [branding.shopName]);

  useEffect(() => {
    const root = document.documentElement;
    const templateId = branding.templateSelected;
    const tokens = TEMPLATE_TOKENS[templateId]?.[currentTheme] || {};
    ALL_TEMPLATE_VARS.forEach(v => root.style.removeProperty(v));
    Object.entries(tokens).forEach(([prop, value]) => { root.style.setProperty(prop, value); });
    const hex = branding.primaryColor;
    if (hex && hex !== '#0A7AE6' && templateId === 'modern') {
      const hsl = hexToHsl(hex);
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--ring', hsl);
    }
  }, [branding.templateSelected, branding.primaryColor, currentTheme]);

  const saveBranding = useCallback(async (partial: Partial<Branding>) => {
    const petshopUpdates: Record<string, any> = {};
    const settingsUpdates: Record<string, any> = {};

    if (partial.shopName !== undefined) petshopUpdates.name = partial.shopName;
    if (partial.logoUrl !== undefined) petshopUpdates.logo_url = partial.logoUrl;
    if (partial.primaryColor !== undefined) settingsUpdates.primaryColor = partial.primaryColor;
    if (partial.templateSelected !== undefined) settingsUpdates.templateSelected = partial.templateSelected;

    const promises: Promise<any>[] = [];
    if (Object.keys(petshopUpdates).length > 0) promises.push(updatePetshop(petshopUpdates));
    if (Object.keys(settingsUpdates).length > 0) promises.push(updateSettings(settingsUpdates));
    await Promise.all(promises);
  }, [updatePetshop, updateSettings]);

  // Compute shop status from settings
  const shopStatus = (() => {
    try {
      const schedule: WeeklySchedule = {};
      (settings.openDaysDefault || []).forEach(d => { schedule[d] = true; });
      const openTime = settings.openTimeDefault;
      const closeTime = settings.closeTimeDefault;
      const now = new Date();
      const dayKey = DAY_MAP[now.getDay()];
      const isOpenDay = !!schedule[dayKey];

      const openDays = DAY_MAP.filter(k => schedule[k]);
      const shortNames = openDays.map(k => DAY_NAMES_SHORT[DAY_MAP.indexOf(k)]);
      const rangeLabel = shortNames.length > 0 ? shortNames[0] + '–' + shortNames[shortNames.length - 1] : '—';
      const baseTooltip = `Funcionamento: ${rangeLabel}, ${openTime}–${closeTime}`;

      const findNextOpenInfo = (): string => {
        for (let offset = 1; offset <= 7; offset++) {
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + offset);
          const nextDayKey = DAY_MAP[nextDate.getDay()];
          if (schedule[nextDayKey]) {
            if (offset === 1) return `Abre amanhã às ${openTime}`;
            return `Abre ${DAY_NAMES[nextDate.getDay()]} às ${openTime}`;
          }
        }
        return '';
      };

      if (!isOpenDay) {
        return { isOpen: false, statusLabel: 'Fechado hoje', timeLabel: findNextOpenInfo(), tooltipLabel: baseTooltip };
      }

      const [openH, openM] = openTime.split(':').map(Number);
      const [closeH, closeM] = closeTime.split(':').map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;
      const isOpenNow = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

      if (isOpenNow) {
        return { isOpen: true, statusLabel: 'Aberto agora', timeLabel: `Fecha às ${closeTime}`, tooltipLabel: baseTooltip };
      } else if (currentMinutes < openMinutes) {
        return { isOpen: false, statusLabel: 'Fechado agora', timeLabel: `Abre hoje às ${openTime}`, tooltipLabel: baseTooltip };
      } else {
        return { isOpen: false, statusLabel: 'Fechado agora', timeLabel: findNextOpenInfo() || `Abre às ${openTime}`, tooltipLabel: baseTooltip };
      }
    } catch {
      return { isOpen: false, statusLabel: 'Fechado agora', timeLabel: '', tooltipLabel: '' };
    }
  })();

  return (
    <BrandingContext.Provider value={{ branding, saveBranding, shopStatus }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used inside BrandingProvider');
  return ctx;
}
