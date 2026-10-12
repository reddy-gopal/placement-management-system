import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

/** Black confirmation toast pinned to the bottom (above the phone tab bar). Auto-dismisses. */
export default function Toast({ message, onDismiss, duration = 6000 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, onDismiss, duration]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-20 z-40 flex justify-center md:bottom-8">
      {message && (
        <div
          role="status"
          className="animate-modal-in pointer-events-auto flex max-w-full items-center gap-3 rounded-lg bg-ink px-4 py-3 text-white shadow-[0_12px_32px_-12px_rgb(17_17_17/0.4)]"
        >
          <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded bg-lime text-ink">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="text-sm">{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded p-1 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
