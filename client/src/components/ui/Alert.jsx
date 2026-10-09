import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    classes:
      'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  error: {
    icon: AlertCircle,
    classes:
      'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300',
  },
  info: {
    icon: Info,
    classes:
      'border-indigo-200 bg-indigo-50/70 text-indigo-900 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200',
  },
};

export default function Alert({ variant = 'info', children, action, className = '' }) {
  const { icon: Icon, classes } = VARIANTS[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${classes} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      {action}
    </div>
  );
}
