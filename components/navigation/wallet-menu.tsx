'use client';

import { useState, type ComponentType } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Banknote, Check, Coins, Landmark, Wallet } from 'lucide-react';

import type { AccountBalance } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

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

          <div
            className="glass z-50 w-[320px] max-w-[calc(100vw-32px)] p-2"
            style={{ borderRadius: 22, position: 'absolute', left: 0, top: 60 }}
          >
            <div className="flex items-center justify-between px-2.5 pb-2 pt-1.5">
              <span className="text-sm font-semibold text-text">Mis cuentas</span>
              <span className="text-[11px] text-text-faint">{accounts.length} cuentas</span>
            </div>

            <AccountOption
              href={hrefFor(null)}
              onClick={() => setOpen(false)}
              label="Total"
              balance={totalBalance}
              active={!selected}
              icon={Wallet}
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
                icon={accountIcon(account.name)}
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
  balance,
  active,
  icon: Icon,
  highlight = false
}: {
  href: string;
  onClick: () => void;
  label: string;
  balance: number;
  active: boolean;
  icon: IconType;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`mb-1 flex items-center gap-3 rounded-[14px] px-2.5 py-2.5 transition last:mb-0 ${
        active ? 'border border-accent bg-accent-soft' : 'border border-transparent hover:bg-white/[0.05]'
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${
          highlight ? 'bg-accent-soft text-[#8aa8ee]' : 'bg-white/[0.06] text-text-muted'
        }`}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{label}</span>
      <span className="tnum shrink-0 text-[13px] font-semibold text-text">{formatCurrency(balance)}</span>
      {active ? (
        <Check size={16} className="shrink-0 text-[#8aa8ee]" />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
    </Link>
  );
}

function accountIcon(name: string): IconType {
  const value = name.toLowerCase();

  if (/(efectivo|cash|met[aá]lico|billete)/.test(value)) {
    return Banknote;
  }

  if (/(eth|cripto|crypto|btc|bitcoin|binance|bybit|kraken|coinbase|wallet|ledger|metamask|solana|revolut)/.test(value)) {
    return Coins;
  }

  return Landmark;
}
