import {
  AlertCircle,
  ArrowRight,
  Building2,
  Inbox,
  LoaderCircle,
  X
} from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-indigo-600 text-white shadow-glow hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300',
    subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/70 dark:text-slate-200 dark:hover:bg-slate-700',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  };
  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm'
  };

  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Field = ({ label, hint, error, required, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      {required && <span className="text-rose-500" aria-hidden="true">*</span>}
    </span>
    {children}
    {(error || hint) && (
      <span className={`mt-1.5 block text-xs ${error ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
        {error ?? hint}
      </span>
    )}
  </label>
);

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          {eyebrow}
        </p>
      )}
      <h1 className="page-title">{title}</h1>
      {description && <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const StatusBadge = ({ status }) => {
  const styles = {
    OPEN: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    DRAFT: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
    CLOSED: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300',
    CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700 dark:text-slate-300'
  };
  const dots = {
    OPEN: 'bg-emerald-500',
    DRAFT: 'bg-amber-500',
    CLOSED: 'bg-rose-500',
    CANCELLED: 'bg-slate-500'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ring-1 ring-inset ${styles[status] ?? styles.CANCELLED}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] ?? dots.CANCELLED}`} />
      {status}
    </span>
  );
};

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action
}) => (
  <div className="surface-card flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-4 rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
      <Icon size={24} />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const LoadingPanel = ({ label = 'Loading recruiter workspace…' }) => (
  <div className="flex min-h-80 items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
      <LoaderCircle className="animate-spin text-indigo-600 dark:text-indigo-400" size={28} />
      {label}
    </div>
  </div>
);

export const ErrorPanel = ({ message, onRetry }) => (
  <div className="surface-card border-rose-200 bg-rose-50/70 p-6 dark:border-rose-900/60 dark:bg-rose-950/20">
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-rose-100 p-2 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
        <AlertCircle size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-rose-900 dark:text-rose-100">Something needs attention</h3>
        <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-rose-700 hover:text-rose-600 dark:text-rose-300">
            Try again <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  </div>
);

export const Notice = ({ children, tone = 'indigo' }) => {
  const tones = {
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-200',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${tones[tone]}`}>{children}</div>;
};

export const Toast = ({ message, tone = 'success', onClose }) => (
  <div className="fixed bottom-5 right-5 z-50 animate-fade-up">
    <div className={`flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl ${tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200' : 'border-emerald-200 bg-white text-emerald-800 dark:border-emerald-900 dark:bg-slate-800 dark:text-emerald-300'}`}>
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="rounded-lg p-1 hover:bg-black/5" aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  </div>
);

export const CompanyAvatar = ({ company, size = 'md' }) => {
  const dimensions = size === 'lg' ? 'h-16 w-16 rounded-2xl text-xl' : 'h-10 w-10 rounded-xl text-sm';
  if (company?.logoUrl) {
    return <img src={company.logoUrl} alt="" className={`${dimensions} border bg-white object-contain p-1`} />;
  }
  return (
    <div className={`${dimensions} flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 font-black text-white shadow-lg shadow-indigo-500/20`}>
      {company?.name?.slice(0, 1).toUpperCase() ?? <Building2 size={18} />}
    </div>
  );
};
