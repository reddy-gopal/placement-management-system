/** Loading, error and empty states shared by every data-driven page. */

export function LoadingState({ label = 'Loading…', rows = 4 }) {
  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="sr-only">
        {label}
      </p>
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="skeleton h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong.', message, onRetry }) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-lg border border-line p-6">
      <span className="badge badge-danger">Error</span>
      <div role="alert">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {message && <p className="mt-1 text-sm text-muted">{message}</p>}
      </div>
      {onRetry && (
        <button type="button" onClick={() => onRetry()} className="btn btn-secondary btn-sm">
          Retry
        </button>
      )}
    </section>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {message && <p className="max-w-md text-sm text-muted">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}
