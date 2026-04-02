import { AppointmentRow } from '@/services/appointmentsService';
import { format } from 'date-fns';

export type ExportFilter = 'todos' | 'pagos' | 'pendentes' | 'cancelados';

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  remarcado: 'Remarcado',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  nao_cobrado: 'Não cobrado',
};

export function filterForExport(appointments: AppointmentRow[], filter: ExportFilter): AppointmentRow[] {
  switch (filter) {
    case 'pagos': return appointments.filter(a => a.payment_status === 'pago');
    case 'pendentes': return appointments.filter(a => a.payment_status === 'pendente');
    case 'cancelados': return appointments.filter(a => a.status === 'cancelado');
    default: return appointments;
  }
}

export function exportToCSV(appointments: AppointmentRow[], filter: ExportFilter): void {
  const data = filterForExport(appointments, filter);
  const now = new Date();
  const filename = `relatorio-petcao-${format(now, 'MM-yyyy')}.csv`;

  const headers = ['ID', 'Data', 'Hora', 'Cliente', 'Pet', 'Serviço', 'Status', 'Valor', 'Forma de Pagamento', 'Pagamento', 'Data Conclusão'];
  const rows = data.map(a => [
    a.id,
    a.date,
    a.time,
    a.customer_name || '',
    a.pets?.map(p => p.pet_name).join(', ') || '',
    a.service_name,
    STATUS_LABELS[a.status] || a.status,
    (a.payment_amount || a.price || 0).toString(),
    a.payment_method ? (PAYMENT_LABELS[a.payment_method] || a.payment_method) : '',
    PAYMENT_STATUS_LABELS[a.payment_status || ''] || a.payment_status || '',
    a.completed_at || '',
  ]);

  const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
