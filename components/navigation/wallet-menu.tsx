'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Check, Wallet } from 'lucide-react';

import type { AccountBalance } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

export function WalletMenu({ accounts }: { accounts: AccountBalance[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const selected = searchParams.get('account');
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  function hrefFor(accountName: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (accountName) {
      next.set('account', accountName);
    } else {
      next.delete('account');
    }
    const search = next.toString();
    return search ? `${pathname}?${search}` : pathname;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Mis cuentas"
        aria-expanded={open}
        className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] bg-accent text-white shadow-[0_4px_12px_rgba(61,99,194,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transition active:scale-95"
      >
        <Wallet size={20} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="glass absolute left-0 top-[60px] z-50 w-[300px] p-2" style={{ borderRadius: 22 }}>
            <div className="flex items-center justify-between px-3 pb-2 pt-2.5">
              <span className="text-sm font-semibold text-text">Mis cuentas</span>
              <span className="text-[11px] text-text-faint">{accounts.length} cuentas</span>
            </div>

            <AccountOption
              href={hrefFor(null)}
              onClick={() => setOpen(false)}
              label="Todas las cuentas"
              caption="total combinado"
              balance={totalBalance}
              active={!selected}
              avatar={<Wallet size={17} />}
              highlight
            />

            {accounts.map((account) => (
              <AccountOption
                key={account.id}
                href={hrefFor(account.name)}
                onClick={() => setOpen(false)}
                label={account.name}
                balance={account.balance}
                active={selected === account.name}
                avatar={initials(account.name)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function AccountOption({
  href,
  onClick,
  label,
  caption,
  balance,
  active,
  avatar,
  highlight = false
}: {
  href: string;
  onClick: () => void;
  label: string;
  caption?: string;
  balance: number;
  active: boolean;
  avatar: ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`mb-1.5 flex items-center gap-3 rounded-[16px] px-3 py-3 transition last:mb-0 ${
        active
          ? 'border border-accent bg-accent-soft'
          : 'border border-transparent bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-sm font-semibold ${
          highlight ? 'bg-accent-soft text-[#8aa8ee]' : 'bg-white/[0.06] text-text-muted'
        }`}
      >
        {avatar}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text">{label}</span>
        {caption ? <span className="mt-0.5 block text-[11px] text-text-faint">{caption}</span> : null}
      </span>
      <span className="tnum shrink-0 text-sm font-semibold text-text">{formatCurrency(balance)}</span>
      {active ? <Check size={17} className="ml-1 shrink-0 text-[#8aa8ee]" /> : null}
    </Link>
  );
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}
