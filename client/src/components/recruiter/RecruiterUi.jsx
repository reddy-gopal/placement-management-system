import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus, X } from 'lucide-react';
import { EmptyState } from '../ui/States';

export function Toast({ message, onDismiss, floating = false, duration = 6000 }) {
  useEffect(() => {
    if (!message || !onDismiss || !duration) return undefined;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, onDismiss, duration]);

  return (
    <div
      aria-live="polite"
      className={floating ? 'pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-8' : 'flex empty:hidden'}
    >
      {message && (
        <div
          role="status"
          className="animate-fade-in pointer-events-auto flex max-w-full items-center gap-3 rounded-lg bg-ink py-3 pl-4 pr-3 text-white shadow-[0_12px_32px_-12px_rgb(17_17_17/0.4)]"
        >
          <span aria-hidden="true" className="grid h-5 w-5 flex-none place-items-center rounded bg-lime">
            <Check className="h-3 w-3 text-ink" strokeWidth={3} />
          </span>
          <span className="min-w-0 text-sm">{message}</span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="grid h-7 w-7 flex-none place-items-center rounded text-white/80 hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function NoCompanyState({ message = 'You need a company profile before you can post job drives or review applications.' }) {
  return (
    <EmptyState
      title="Set up your company first"
      message={message}
      action={
        <Link to="/recruiter/company" className="btn">
          Create company profile
        </Link>
      }
    />
  );
}

export function CreateDriveLink({ className = 'btn' }) {
  return (
    <Link to="/recruiter/drives/new" className={className}>
      <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      Create job drive
    </Link>
  );
}

export function RecruiterHeader({ eyebrow, title, description, actions, badge }) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <div className={`flex flex-wrap items-center gap-2.5 ${eyebrow ? 'mt-2' : ''}`}>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[32px]">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </section>
  );
}

export const dangerSolidClassName = 'btn border-danger bg-danger hover:bg-[#b8242c] hover:shadow-none';
