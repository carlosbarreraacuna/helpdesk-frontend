export const TICKET_STATUS_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  asignado: 'Asignado',
  en_progreso: 'En progreso',
  escalado: 'Escalado',
  pendiente_validacion: 'Pendiente de validación',
  resuelto: 'Resuelto y aprobado',
  cerrado: 'Cerrado',
  reabierto: 'Reabierto',
};

export function ticketStatusLabel(name: string): string {
  return TICKET_STATUS_LABEL[name] ?? name;
}
