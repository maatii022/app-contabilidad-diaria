'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <nav className="sticky bottom-4 z-20 mt-8">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-[28px] border border-white/10 bg-black/50 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-3 text-[11px] transition ${
                active
                  ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                  : 'text-white/45 hover:bg-white/5 hover:text-white/75'
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
