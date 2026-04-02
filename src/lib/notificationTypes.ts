import {
  CalendarDays, CalendarCheck, CalendarX, CheckCircle2,
  Camera, CameraOff, Star, StarOff,
  Package, Clock, AlertTriangle, Info, Bell,
  type LucideIcon,
} from 'lucide-react';

export interface NotificationTypeConfig {
  icon: LucideIcon;
  title: string;
  defaultMessage: string;
  colorClass: string;
  bgClass: string;
}

export const NOTIFICATION_TYPE_MAP: Record<string, NotificationTypeConfig> = {
  // Agendamentos
  agendamento_confirmado: {
    icon: CalendarCheck,
    title: 'Agendamento confirmado',
    defaultMessage: 'Seu horário foi confirmado. Estamos te esperando! 🐾',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
  agendamento_atualizado: {
    icon: CalendarDays,
    title: 'Agendamento atualizado',
    defaultMessage: 'Seu agendamento foi atualizado. Verifique os novos detalhes.',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  agendamento_cancelado: {
    icon: CalendarX,
    title: 'Agendamento cancelado',
    defaultMessage: 'Seu agendamento foi cancelado.',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
  agendamento_concluido: {
    icon: CheckCircle2,
    title: 'Atendimento concluído',
    defaultMessage: 'O atendimento do seu pet foi finalizado. Esperamos vê-los novamente!',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
  // Fotos
  foto_aprovada: {
    icon: Camera,
    title: 'Sua foto foi aprovada',
    defaultMessage: 'Sua foto foi aprovada e já está visível na galeria.',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
  foto_recusada: {
    icon: CameraOff,
    title: 'Foto não aprovada',
    defaultMessage: 'Sua foto não foi aprovada.',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
  // Avaliações
  avaliacao_aprovada: {
    icon: Star,
    title: 'Avaliação publicada',
    defaultMessage: 'Sua avaliação foi aprovada e publicada.',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  avaliacao_recusada: {
    icon: StarOff,
    title: 'Avaliação não publicada',
    defaultMessage: 'Sua avaliação não foi publicada.',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
  // Pacotes
  pacote_ativado: {
    icon: Package,
    title: 'Pacote ativado',
    defaultMessage: 'Seu pacote foi ativado com sucesso.',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
  pacote_expirando: {
    icon: Clock,
    title: 'Seu pacote está acabando',
    defaultMessage: 'Seu pacote está próximo do fim.',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  pacote_expirado: {
    icon: AlertTriangle,
    title: 'Pacote expirado',
    defaultMessage: 'Seu pacote expirou.',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
  // Sistema
  sistema: {
    icon: Info,
    title: 'Aviso do sistema',
    defaultMessage: 'Você tem uma nova mensagem do sistema.',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  // Legacy fallbacks
  foto: {
    icon: Camera,
    title: 'Foto',
    defaultMessage: '',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  avaliacao: {
    icon: Star,
    title: 'Avaliação',
    defaultMessage: '',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  agendamento: {
    icon: CalendarDays,
    title: 'Agendamento',
    defaultMessage: '',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  pacote: {
    icon: Package,
    title: 'Pacote',
    defaultMessage: '',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
};

const FALLBACK: NotificationTypeConfig = {
  icon: Bell,
  title: 'Notificação',
  defaultMessage: '',
  colorClass: 'text-muted-foreground',
  bgClass: 'bg-muted',
};

export function getNotificationConfig(type: string): NotificationTypeConfig {
  return NOTIFICATION_TYPE_MAP[type] ?? FALLBACK;
}

// Labels for the admin notification settings toggles
export const NOTIFICATION_SETTING_LABELS: Record<string, { label: string; description: string }> = {
  agendamento_confirmado: { label: 'Agendamento confirmado', description: 'Notificar quando agendamento for confirmado' },
  agendamento_atualizado: { label: 'Agendamento atualizado', description: 'Notificar quando agendamento for alterado' },
  agendamento_cancelado: { label: 'Agendamento cancelado', description: 'Notificar quando agendamento for cancelado' },
  agendamento_concluido: { label: 'Agendamento concluído', description: 'Notificar quando atendimento for concluído' },
  foto_aprovada: { label: 'Foto aprovada', description: 'Notificar quando foto for aprovada' },
  foto_recusada: { label: 'Foto recusada', description: 'Notificar quando foto for recusada' },
  avaliacao_aprovada: { label: 'Avaliação aprovada', description: 'Notificar quando avaliação for aprovada' },
  avaliacao_recusada: { label: 'Avaliação recusada', description: 'Notificar quando avaliação for recusada' },
  pacote_ativado: { label: 'Pacote ativado', description: 'Notificar quando pacote for ativado' },
  pacote_expirando: { label: 'Pacote expirando', description: 'Avisar quando pacote estiver perto de expirar' },
  pacote_expirado: { label: 'Pacote expirado', description: 'Notificar quando pacote expirar' },
  show_login_notification: { label: 'Notificação ao login', description: 'Mostrar última atualização ao entrar' },
};
