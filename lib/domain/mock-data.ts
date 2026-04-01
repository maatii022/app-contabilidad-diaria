import type { MonthlyBudget, Transaction } from '@/lib/domain/types';

export const mockTransactions: Transaction[] = [
  { id: 'tx-1', type: 'expense', transactionDate: '2026-03-02', amount: 42.86, description: 'Cuenta 25k Lucid', categoryName: 'Trading', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 5 },
  { id: 'tx-2', type: 'expense', transactionDate: '2026-03-02', amount: 16.99, description: 'PS Plus', categoryName: 'Ocio', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 6 },
  { id: 'tx-3', type: 'expense', transactionDate: '2026-03-02', amount: 26.56, description: 'WSF 5k', categoryName: 'Trading', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 7 },
  { id: 'tx-4', type: 'expense', transactionDate: '2026-03-02', amount: 26.56, description: 'WSF 5k', categoryName: 'Trading', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 8 },
  { id: 'tx-5', type: 'expense', transactionDate: '2026-03-02', amount: 26.56, description: 'WSF 5k', categoryName: 'Trading', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 9 },
  { id: 'tx-6', type: 'expense', transactionDate: '2026-03-02', amount: 19.01, description: 'ChatGPT', categoryName: 'Otros', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 10 },
  { id: 'tx-7', type: 'expense', transactionDate: '2026-03-03', amount: 420, description: 'Alquiler', categoryName: 'Vivienda', sourceSystem: 'mock' },
  { id: 'tx-8', type: 'expense', transactionDate: '2026-03-04', amount: 44.2, description: 'Compra Mercadona', categoryName: 'Comida', sourceSystem: 'mock' },
  { id: 'tx-9', type: 'expense', transactionDate: '2026-03-05', amount: 18.5, description: 'Gasolina', categoryName: 'Transporte', sourceSystem: 'mock' },
  { id: 'tx-10', type: 'expense', transactionDate: '2026-03-08', amount: 26.95, description: 'Cena fuera', categoryName: 'Ocio', sourceSystem: 'mock' },
  { id: 'tx-11', type: 'expense', transactionDate: '2026-03-11', amount: 250, description: 'Pago deuda', categoryName: 'Deuda', sourceSystem: 'mock' },
  { id: 'tx-12', type: 'expense', transactionDate: '2026-03-13', amount: 11.25, description: 'Café reunión', categoryName: 'Trabajo', sourceSystem: 'mock' },
  { id: 'tx-13', type: 'expense', transactionDate: '2026-03-14', amount: 31.7, description: 'Farmacia', categoryName: 'Gastos personales', sourceSystem: 'mock' },
  { id: 'tx-14', type: 'expense', transactionDate: '2026-03-18', amount: 65.4, description: 'Compra Lidl', categoryName: 'Comida', sourceSystem: 'mock' },
  { id: 'tx-15', type: 'expense', transactionDate: '2026-03-20', amount: 58, description: 'Factura luz y agua', categoryName: 'Suministros (luz, agua, gas, etc.)', sourceSystem: 'mock' },
  { id: 'tx-16', type: 'expense', transactionDate: '2026-03-23', amount: 14.9, description: 'Spotify y apps', categoryName: 'Otros', sourceSystem: 'mock' },
  { id: 'tx-17', type: 'expense', transactionDate: '2026-03-28', amount: 89, description: 'Regalo cumpleaños', categoryName: 'Regalos', sourceSystem: 'mock' },
  { id: 'tx-18', type: 'income', transactionDate: '2026-03-10', amount: 795.58, description: 'Paro', categoryName: 'Sueldo', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 5 },
  { id: 'tx-19', type: 'income', transactionDate: '2026-03-11', amount: 300, description: 'Pago Juandi', categoryName: 'Juandi', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 6 },
  { id: 'tx-20', type: 'income', transactionDate: '2026-03-18', amount: 760, description: 'Retiro trading', categoryName: 'Trading', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 7 },
  { id: 'tx-21', type: 'income', transactionDate: '2026-03-24', amount: 760, description: 'Retiro trading', categoryName: 'Trading', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 8 },
  { id: 'tx-22', type: 'income', transactionDate: '2026-03-26', amount: 760, description: 'Retiro Lucid', categoryName: 'Trading', sourceSystem: 'google_sheets', sourceFileName: 'Contabilidad Marzo', sourceSheetName: 'Transacciones', sourceRow: 9 },
  { id: 'tx-23', type: 'income', transactionDate: '2026-03-29', amount: 150, description: 'Traspaso a ahorro', categoryName: 'Ahorro', sourceSystem: 'mock' }
];

export const mockMonthlyBudgets: MonthlyBudget[] = [
  { id: 'budget-e-1', year: 2026, month: 3, type: 'expense', categoryName: 'Comida', plannedAmount: 220 },
  { id: 'budget-e-2', year: 2026, month: 3, type: 'expense', categoryName: 'Vivienda', plannedAmount: 420 },
  { id: 'budget-e-3', year: 2026, month: 3, type: 'expense', categoryName: 'Transporte', plannedAmount: 60 },
  { id: 'budget-e-4', year: 2026, month: 3, type: 'expense', categoryName: 'Deuda', plannedAmount: 250 },
  { id: 'budget-e-5', year: 2026, month: 3, type: 'expense', categoryName: 'Ocio', plannedAmount: 60 },
  { id: 'budget-e-6', year: 2026, month: 3, type: 'expense', categoryName: 'Trading', plannedAmount: 120 },
  { id: 'budget-e-7', year: 2026, month: 3, type: 'expense', categoryName: 'Suministros (luz, agua, gas, etc.)', plannedAmount: 60 },
  { id: 'budget-e-8', year: 2026, month: 3, type: 'expense', categoryName: 'Regalos', plannedAmount: 50 },
  { id: 'budget-e-9', year: 2026, month: 3, type: 'expense', categoryName: 'Otros', plannedAmount: 40 },
  { id: 'budget-i-1', year: 2026, month: 3, type: 'income', categoryName: 'Sueldo', plannedAmount: 795.58 },
  { id: 'budget-i-2', year: 2026, month: 3, type: 'income', categoryName: 'Juandi', plannedAmount: 300 },
  { id: 'budget-i-3', year: 2026, month: 3, type: 'income', categoryName: 'Trading', plannedAmount: 1520 },
  { id: 'budget-i-4', year: 2026, month: 3, type: 'income', categoryName: 'Ahorro', plannedAmount: 150 }
];

export const mockOpeningBalance = 950;
