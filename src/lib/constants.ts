// Single-tenant petshop ID
export const PETSHOP_ID = 'a0000000-0000-0000-0000-000000000001';

export const WHATSAPP_NUMBER = '5511986907487';
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao' | 'outro';
export type PaymentStatus = 'pago' | 'pendente' | 'nao_cobrado';
export type ModerationStatus = 'pendente' | 'aprovado' | 'rejeitado';
export type AppointmentStatus = 'pendente' | 'confirmado' | 'realizado' | 'cancelado' | 'remarcado';

export interface DateOverride {
  date: string;
  isOpen: boolean;
  note?: string;
}

export interface HeroImages {
  image1: string;
  image2: string;
  image3: string;
}

export interface HomeContent {
  hero: {
    title: string;
    subtitle: string;
    buttonPrimary: string;
    buttonSecondary: string;
    imageUrl: string;
    heroImages?: HeroImages;
  };
  reviews: { title: string; subtitle: string };
  gallery: { title: string };
  location: { description: string };
}

export interface NotificationSettingsConfig {
  agendamento_confirmado: boolean;
  agendamento_atualizado: boolean;
  agendamento_cancelado: boolean;
  agendamento_concluido: boolean;
  foto_aprovada: boolean;
  foto_recusada: boolean;
  avaliacao_aprovada: boolean;
  avaliacao_recusada: boolean;
  pacote_ativado: boolean;
  pacote_expirando: boolean;
  pacote_expirado: boolean;
  show_login_notification: boolean;
  login_toast_duration: number;
}

export interface PetshopSettings {
  // Schedule & hours
  slotIntervalMinutes: number;
  openDaysDefault: string[];
  openTimeDefault: string;
  closeTimeDefault: string;
  dateOverrides: DateOverride[];

  // Display limits
  limiteHomeFotos: number;
  limiteHomeAvaliacoes: number;
  moderationPageSizePhotos: number;
  moderationPageSizeReviews: number;
  userUploadPhotoDailyLimit: number;

  // Social links
  social_links: {
    enabled: Record<string, boolean>;
    links: Record<string, string>;
  };

  // Location (zoom only — lat/lng are petshop columns)
  locationZoom: number;

  // Branding (name/logo are petshop columns)
  primaryColor: string;
  templateSelected: string;

  // Home CMS content
  homeContent: HomeContent;

  // Notification settings
  notification_settings: NotificationSettingsConfig;

  // Inauguration date (ISO string, e.g. "2023-05-13")
  inauguratedAt: string;

  // Custom service categories (beyond defaults)
  custom_categories?: Array<{
    value: string;
    label: string;
    icon: string;
    color: string;
    gradient: string;
    glow: string;
    bgBadge: string;
  }>;
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    title: 'Seu pet merece carinho e cuidado',
    subtitle: 'Banho, tosa e muito amor. Agende pelo WhatsApp e deixe seu amigo nas melhores mãos de Cajamar.',
    buttonPrimary: 'Agendar Agora',
    buttonSecondary: 'Ver Serviços',
    imageUrl: '',
    heroImages: { image1: '', image2: '', image3: '' },
  },
  reviews: { title: 'Avaliações', subtitle: 'O que dizem nossos clientes' },
  gallery: { title: 'Galeria de Fotos' },
  location: { description: 'Venha nos visitar! Estamos no coração de Cajamar' },
};

export const DEFAULT_NOTIFICATION_SETTINGS_CONFIG: NotificationSettingsConfig = {
  agendamento_confirmado: true,
  agendamento_atualizado: true,
  agendamento_cancelado: true,
  agendamento_concluido: true,
  foto_aprovada: true,
  foto_recusada: true,
  avaliacao_aprovada: true,
  avaliacao_recusada: true,
  pacote_ativado: true,
  pacote_expirando: true,
  pacote_expirado: true,
  show_login_notification: true,
  login_toast_duration: 6,
};

export const DEFAULT_SETTINGS: PetshopSettings = {
  slotIntervalMinutes: 30,
  openDaysDefault: ['ter', 'qua', 'qui', 'sex', 'sab'],
  openTimeDefault: '09:00',
  closeTimeDefault: '18:00',
  dateOverrides: [],

  limiteHomeFotos: 10,
  limiteHomeAvaliacoes: 10,
  moderationPageSizePhotos: 10,
  moderationPageSizeReviews: 10,
  userUploadPhotoDailyLimit: 1,

  social_links: {
    enabled: { instagram: false, tiktok: false, facebook: false, whatsapp: true },
    links: { instagram_url: '', tiktok_url: '', facebook_url: '', whatsapp_url: `https://wa.me/${WHATSAPP_NUMBER}` },
  },

  locationZoom: 15,
  primaryColor: '#0A7AE6',
  templateSelected: 'modern',

  homeContent: DEFAULT_HOME_CONTENT,

  notification_settings: DEFAULT_NOTIFICATION_SETTINGS_CONFIG,

  inauguratedAt: '2023-05-13',
};

export function generateWhatsAppMessage(data: {
  service?: string;
  date?: string;
  time?: string;
  petName?: string;
  petNames?: string;
  ownerName?: string;
  ownerPhone?: string;
  action?: 'agendar' | 'alterar' | 'cancelar';
  cancelReason?: string;
  address?: string;
}): string {
  const { service, date, time, petName, petNames, ownerName, ownerPhone, action = 'agendar', cancelReason, address } = data;
  const petsLabel = petNames || petName || 'Meu pet';
  let message = '';

  switch (action) {
    case 'agendar':
      message = `Olá! 🐕 Gostaria de agendar um serviço no PetCão.\n\n`;
      if (service) message += `📋 Serviço: ${service}\n`;
      message += `🐾 Pets: ${petsLabel}\n`;
      if (ownerName) message += `👤 Responsável: ${ownerName}\n`;
      if (ownerPhone) message += `📞 Telefone: ${ownerPhone}\n`;
      if (date) message += `📅 Data: ${date}\n`;
      if (time) message += `⏰ Horário: ${time}\n`;
      if (address) message += `📍 Endereço: ${address}\n`;
      message += `\nAguardo confirmação. Obrigado!`;
      break;
    case 'alterar':
      message = `Olá! 🐕 Preciso alterar meu agendamento no PetCão.\n\n`;
      message += `🐾 Pet: ${petsLabel}\n`;
      if (date) message += `📅 Data atual: ${date}\n`;
      if (time) message += `⏰ Horário atual: ${time}\n`;
      message += `\nQual nova data/horário disponível?`;
      break;
    case 'cancelar':
      message = `Olá! 🐕 Preciso cancelar meu agendamento no PetCão.\n\n`;
      message += `🐾 Pet: ${petsLabel}\n`;
      if (date) message += `📅 Data: ${date}\n`;
      if (time) message += `⏰ Horário: ${time}\n`;
      if (cancelReason) message += `❌ Motivo: ${cancelReason}\n`;
      message += `\nObrigado pela compreensão.`;
      break;
  }

  return encodeURIComponent(message);
}

export function getWhatsAppUrl(message: string, phone?: string): string {
  return `https://wa.me/${phone || WHATSAPP_NUMBER}?text=${message}`;
}
