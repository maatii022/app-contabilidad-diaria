const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short'
});

const monthFormatter = new Intl.DateTimeFormat('es-ES', {
  month: 'long',
  year: 'numeric'
});

export function formatShortDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

export function formatMonthLabel(year: number, month: number) {
  return monthFormatter.format(new Date(year, month - 1, 1));
}

export function toIsoDate(value: Date) {
  return value.toISOString().split('T')[0];
}
