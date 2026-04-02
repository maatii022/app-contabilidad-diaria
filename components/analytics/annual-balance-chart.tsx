import { SurfaceCard } from '@/components/shared/surface-card';
import type { AnnualBalancePoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

export function AnnualBalanceChart({ months }: { months: AnnualBalancePoint[] }) {
  const maxAbs = Math.max(...months.map((item) => Math.abs(item.closingBalance)), 1);
  const current = months[months.length - 1];

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/55">evolución anual del saldo</p>
          <p className="mt-1 text-xs text-white/38">saldo de cierre por mes</p>
        </div>
        <p className={`text-sm font-medium ${current && current.closingBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {current ? formatCurrency(current.closingBalance) : '0 €'}
        </p>
      </div>

      <div className="flex h-[156px] items-end gap-2">
        {months.map((month, index) => {
          const height = Math.max(18, Math.round((Math.abs(month.closingBalance) / maxAbs) * 108));
          const positive = month.closingBalance >= 0;
          const active = index === months.length - 1;

          return (
            <div key={month.month} className="flex min-w-0 flex-1 flex-col items-center gap-3">
              <div className="flex h-[124px] items-end">
                <div
                  className={`w-full rounded-[16px] transition-all ${
                    positive
                      ? active
                        ? 'bg-[linear-gradient(180deg,rgba(168,237,255,0.98),rgba(82,164,255,0.78))] shadow-[0_14px_26px_rgba(82,164,255,0.18)]'
                        : 'bg-[linear-gradient(180deg,rgba(154,224,255,0.92),rgba(70,130,255,0.7))]'
                      : active
                        ? 'bg-[linear-gradient(180deg,rgba(255,186,198,0.98),rgba(255,95,128,0.84))] shadow-[0_14px_26px_rgba(255,95,128,0.18)]'
                        : 'bg-[linear-gradient(180deg,rgba(255,182,194,0.9),rgba(255,104,139,0.74))]'
                  }`}
                  style={{ height: `${height}px` }}
                />
              </div>
              <span className="text-[11px] text-white/45">{month.label}</span>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
