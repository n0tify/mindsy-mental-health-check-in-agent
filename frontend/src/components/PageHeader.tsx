export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="m-fade-up mb-8">
      <p className="m-eyebrow">{eyebrow}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-lg leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </header>
  );
}
