export const PRIORITY_LABEL: Record<string, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export const PRIORITY_COLOR: Record<string, string> = {
  alta: 'text-red-600 bg-red-50 border-red-200',
  media: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  baja: 'text-green-600 bg-green-50 border-green-200',
};

export const STATUS_LABEL: Record<string, string> = {
  met: 'Cumplido',
  on_track: 'En curso',
  at_risk: 'En riesgo',
  breached: 'Incumplido',
};

export const STATUS_COLOR: Record<string, string> = {
  met: 'text-green-600 bg-green-50',
  on_track: 'text-blue-600 bg-blue-50',
  at_risk: 'text-yellow-600 bg-yellow-50',
  breached: 'text-red-600 bg-red-50',
};
