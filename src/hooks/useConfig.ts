import { useCallback } from 'react';
import { usePetshop } from '@/contexts/PetshopContext';
import { PetshopSettings, DateOverride, WHATSAPP_NUMBER } from '@/lib/constants';

export interface WeeklySchedule {
  dom: boolean;
  seg: boolean;
  ter: boolean;
  qua: boolean;
  qui: boolean;
  sex: boolean;
  sab: boolean;
}

export interface OpeningHours {
  openTime: string;
  closeTime: string;
}

export interface SocialLink {
  key: string;
  label: string;
  url: string;
  enabled: boolean;
}

export interface ShopAddress {
  address: string;
  phone: string;
  whatsapp: string;
}

export interface DisplayLimits {
  maxPhotos: number;
  maxReviews: number;
  moderationPageSizePhotos: number;
  moderationPageSizeReviews: number;
  userUploadPhotoDailyLimit: number;
}

export interface LocationSettings {
  latitude: string;
  longitude: string;
  zoom: number;
}

const DAY_MAP: (keyof WeeklySchedule)[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DAY_KEYS_TO_ABBR: Record<string, keyof WeeklySchedule> = {
  dom: 'dom', seg: 'seg', ter: 'ter', qua: 'qua', qui: 'qui', sex: 'sex', sab: 'sab',
};

function openDaysToSchedule(openDays: string[]): WeeklySchedule {
  const schedule: WeeklySchedule = { dom: false, seg: false, ter: false, qua: false, qui: false, sex: false, sab: false };
  openDays.forEach(d => {
    const key = DAY_KEYS_TO_ABBR[d];
    if (key) schedule[key] = true;
  });
  return schedule;
}

function scheduleToOpenDays(schedule: WeeklySchedule): string[] {
  return DAY_MAP.filter(k => schedule[k]);
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook',
  youtube: 'YouTube', whatsapp: 'WhatsApp', site: 'Site',
};

function settingsToSocialLinks(settings: PetshopSettings): SocialLink[] {
  const keys = ['instagram', 'tiktok', 'facebook', 'youtube', 'whatsapp', 'site'];
  return keys.map(key => ({
    key,
    label: SOCIAL_LABELS[key] || key,
    url: settings.social_links.links[`${key}_url`] || (key === 'whatsapp' ? `https://wa.me/${WHATSAPP_NUMBER}` : ''),
    enabled: !!settings.social_links.enabled[key],
  }));
}

function socialLinksToSettings(links: SocialLink[]): PetshopSettings['social_links'] {
  const enabled: Record<string, boolean> = {};
  const linksMap: Record<string, string> = {};
  links.forEach(l => {
    enabled[l.key] = l.enabled;
    linksMap[`${l.key}_url`] = l.url;
  });
  return { enabled, links: linksMap };
}

export function useConfig() {
  const { petshop, settings, updateSettings, updatePetshop } = usePetshop();

  const weeklySchedule = openDaysToSchedule(settings.openDaysDefault);
  const dateOverrides = settings.dateOverrides || [];
  const openingHours: OpeningHours = { openTime: settings.openTimeDefault, closeTime: settings.closeTimeDefault };
  const socialLinks = settingsToSocialLinks(settings);
  const shopAddress: ShopAddress = {
    address: petshop?.address || '',
    phone: petshop?.phone || '',
    whatsapp: WHATSAPP_NUMBER,
  };
  const displayLimits: DisplayLimits = {
    maxPhotos: settings.limiteHomeFotos,
    maxReviews: settings.limiteHomeAvaliacoes,
    moderationPageSizePhotos: settings.moderationPageSizePhotos,
    moderationPageSizeReviews: settings.moderationPageSizeReviews,
    userUploadPhotoDailyLimit: settings.userUploadPhotoDailyLimit,
  };
  const locationSettings: LocationSettings = {
    latitude: String(petshop?.latitude || '-23.404187'),
    longitude: String(petshop?.longitude || '-46.863688'),
    zoom: settings.locationZoom,
  };
  const appointmentInterval = settings.slotIntervalMinutes;

  const setWeeklySchedule = useCallback(async (updater: WeeklySchedule | ((prev: WeeklySchedule) => WeeklySchedule)) => {
    const newSchedule = typeof updater === 'function' ? updater(weeklySchedule) : updater;
    await updateSettings({ openDaysDefault: scheduleToOpenDays(newSchedule) });
  }, [weeklySchedule, updateSettings]);

  const setOpeningHours = useCallback(async (hours: OpeningHours) => {
    await updateSettings({ openTimeDefault: hours.openTime, closeTimeDefault: hours.closeTime });
  }, [updateSettings]);

  const setSocialLinks = useCallback(async (links: SocialLink[]) => {
    await updateSettings({ social_links: socialLinksToSettings(links) });
  }, [updateSettings]);

  const setShopAddress = useCallback(async (addr: ShopAddress) => {
    await updatePetshop({ address: addr.address, phone: addr.phone });
  }, [updatePetshop]);

  const setDisplayLimits = useCallback(async (limits: DisplayLimits) => {
    await updateSettings({
      limiteHomeFotos: limits.maxPhotos,
      limiteHomeAvaliacoes: limits.maxReviews,
      moderationPageSizePhotos: limits.moderationPageSizePhotos,
      moderationPageSizeReviews: limits.moderationPageSizeReviews,
      userUploadPhotoDailyLimit: limits.userUploadPhotoDailyLimit,
    });
  }, [updateSettings]);

  const setLocationSettings = useCallback(async (loc: LocationSettings) => {
    await Promise.all([
      updatePetshop({ latitude: Number(loc.latitude), longitude: Number(loc.longitude) }),
      updateSettings({ locationZoom: loc.zoom }),
    ]);
  }, [updatePetshop, updateSettings]);

  const setAppointmentInterval = useCallback(async (interval: number) => {
    await updateSettings({ slotIntervalMinutes: interval });
  }, [updateSettings]);

  const addDateOverride = useCallback(async (override: DateOverride) => {
    const filtered = dateOverrides.filter(o => o.date !== override.date);
    await updateSettings({ dateOverrides: [...filtered, override] });
  }, [dateOverrides, updateSettings]);

  const removeDateOverride = useCallback(async (date: string) => {
    await updateSettings({ dateOverrides: dateOverrides.filter(o => o.date !== date) });
  }, [dateOverrides, updateSettings]);

  const isOpenOnDate = useCallback((date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    const override = dateOverrides.find(o => o.date === dateStr);
    if (override) return override.isOpen;
    const dayIndex = date.getDay();
    const dayKey = DAY_MAP[dayIndex];
    return weeklySchedule[dayKey];
  }, [weeklySchedule, dateOverrides]);

  return {
    weeklySchedule, setWeeklySchedule,
    dateOverrides, addDateOverride, removeDateOverride,
    openingHours, setOpeningHours,
    socialLinks, setSocialLinks,
    shopAddress, setShopAddress,
    displayLimits, setDisplayLimits,
    locationSettings, setLocationSettings,
    appointmentInterval, setAppointmentInterval,
    isOpenOnDate,
  };
}
