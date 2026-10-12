export const inputClassName = (hasError, { withIcon = false, mono = false } = {}) =>
  ['input', withIcon && 'pl-9', mono && 'font-mono', hasError && 'input-error'].filter(Boolean).join(' ');

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
      className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
        hasError ? 'text-danger' : 'text-faint'
      }`}
    />
  );
}

/** Label + control + hint + error message, consistently laid out. Pass `icon` for a leading icon. */
export default function FormField({ id, label, required = false, hint, error, icon, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            {' '}*
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
        <p id={fieldHintId(id)} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={fieldErrorId(id)} className="field-hint font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
