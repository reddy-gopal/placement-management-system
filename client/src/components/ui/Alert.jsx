import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const VARIANTS = {
  success: { icon: CheckCircle2, classes: 'border-[#c5e6cf] bg-[#eef8f1] text-success' },
  error: { icon: AlertCircle, classes: 'border-[#f3c6c8] bg-[#fdf1f1] text-danger' },
  info: { icon: Info, classes: 'border-line bg-subtle text-ink' },
};

export default function Alert({ variant = 'info', children, action, className = '' }) {
  const { icon: Icon, classes } = VARIANTS[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-md border px-3.5 py-2.5 text-[13px] ${classes} ${className}`}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      {action}
    </div>
  );
}
