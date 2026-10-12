/**
 * Page title block: optional mono eyebrow, 30px title, muted description, actions on the right.
 */
export default function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-ink">{title}</h1>
        {description && <p className="text-[15px] text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}
