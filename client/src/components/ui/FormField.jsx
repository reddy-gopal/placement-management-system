export const inputClassName = (hasError, { withIcon = false } = {}) =>
  [
    'block min-h-11 w-full rounded-xl border bg-white py-2.5 text-sm text-slate-900 shadow-sm',
    withIcon ? 'pl-10 pr-3' : 'px-3',
    'placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none',
    'focus:outline-none focus:ring-4',
    'disabled:cursor-not-allowed disabled:opacity-60',
    'dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500',
    hasError
      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500/80'
      : 'border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-slate-700 dark:hover:border-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20',
  ].join(' ');

/** ids used to wire aria-describedby on the control inside a FormField */
export const fieldErrorId = (id) => `${id}-error`;
export const fieldHintId = (id) => `${id}-hint`;

export function describedBy(id, { error, hint }) {
  // The hint is hidden while an error is shown, so only reference what's rendered.
  return [!error && hint && fieldHintId(id), error && fieldErrorId(id)].filter(Boolean).join(' ') || undefined;
}

/** Decorative leading icon for inputs rendered with `inputClassName(_, { withIcon: true })`. */
export function InputIcon({ icon: Icon, hasError = false }) {
  return (
    <Icon
      aria-hidden="true"
      className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
        hasError ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
      }`}
    />
  );
}

/** Label + control + hint + error message, consistently laid out. Pass `icon` for a leading icon. */
export default function FormField({ id, label, required = false, hint, error, icon, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {required && (
          <span className="ml-0.5 text-rose-600 dark:text-rose-400" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {icon ? (
        <div className="relative">
          <InputIcon icon={icon} hasError={Boolean(error)} />
          {children}
        </div>
      ) : (
        children
      )}
      {hint && !error && (
        <p id={fieldHintId(id)} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={fieldErrorId(id)} className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
