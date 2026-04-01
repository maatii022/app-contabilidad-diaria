import type { Category } from '@/lib/domain/types';

export const expenseCategories: Category[] = [
  'Comida',
  'Regalos',
  'Yo',
  'Vivienda',
  'Transporte',
  'Gastos personales',
  'Deuda',
  'Suministros (luz, agua, gas, etc.)',
  'Viajes',
  'Ocio',
  'Trabajo',
  'Trading',
  'Apuestas',
  'Otros'
].map((name, index) => ({
  id: `expense-${index + 1}`,
  type: 'expense' as const,
  name,
  slug: slugify(name),
  sortOrder: index + 1,
  isActive: true
}));

export const incomeCategories: Category[] = [
  'Ahorro',
  'Sueldo',
  'Trading',
  'Juandi',
  'MS Asesoría',
  'Otro'
].map((name, index) => ({
  id: `income-${index + 1}`,
  type: 'income' as const,
  name,
  slug: slugify(name),
  sortOrder: index + 1,
  isActive: true
}));

export const allCategories = [...expenseCategories, ...incomeCategories];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}
