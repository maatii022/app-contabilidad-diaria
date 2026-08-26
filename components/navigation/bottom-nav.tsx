'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { BarChart3, BriefcaseBusiness, House, ReceiptText } from 'lucide-react';

type NavItem = {
  href: '/resumen' | '/movimientos' | '/analisis' | '/presupuesto';
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

const items: NavItem[] = [
  { href: '/resumen', label: 'Resumen', icon: House },
  { href: '/movimientos', label: 'Movimientos', icon: ReceiptText },
  { href: '/analisis', label: 'Análisis', icon: BarChart3 },
  { href: '/presupuesto', label: 'Presupuesto', icon: BriefcaseBusiness }
];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeIndex = items.findIndex((item) => item.href === pathname);

  return (
    <nav className="sticky bottom-4 z-20 mt-8">
      <div
        className="glass relative mx-auto grid max-w-md grid-cols-4 overflow-hidden p-2"
        style={{ borderRadius: 26, background: 'rgba(16, 21, 35, 0.92)' }}
      >
        {activeIndex >= 0 ? (
          <span
            aria-hidden
            className="nav-pill pointer-events-none absolute z-0"
            style={{
              top: 8,
              bottom: 8,
              left: 8,
              width: 'calc((100% - 16px) / 4)',
              borderRadius: 18,
              transform: `translateX(${activeIndex * 100}%)`
            }}
          />
        ) : null}

        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const href = buildNavHref(item.href, searchParams);

          return (
            <Link
              key={item.href}
              href={href}
              className={`relative z-10 flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-3 text-[11px] transition-colors duration-200 ${
                active ? 'text-white' : 'text-white/45 hover:text-white/75'
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function buildNavHref(pathname: NavItem['href'], searchParams: { get(name: string): string | null }) {
  const nextSearchParams = new URLSearchParams();
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (year) nextSearchParams.set('year', year);
  if (month) nextSearchParams.set('month', month);

  const search = nextSearchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}
