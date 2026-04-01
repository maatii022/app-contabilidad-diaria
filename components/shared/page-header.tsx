import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="max-w-[34ch] text-sm leading-6 text-white/62">{description}</p>
        </div>
        {action}
      </div>
    </header>
  );
}
