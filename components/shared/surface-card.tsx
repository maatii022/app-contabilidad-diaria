import type { ReactNode } from 'react';

export function SurfaceCard({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`surface-card ${className}`}>{children}</section>;
}
