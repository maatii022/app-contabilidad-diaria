export function PageHeader({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="space-y-2 px-1">
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-white">{title}</h1>
      {description ? <p className="max-w-[34ch] text-sm leading-6 text-white/56">{description}</p> : null}
    </header>
  );
}
