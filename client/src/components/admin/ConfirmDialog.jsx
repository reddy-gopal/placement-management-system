import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Alert from '../ui/Alert';

/**
 * Confirmation modal for destructive admin actions. `onConfirm` may return a promise;
 * while it runs the buttons are disabled, and a rejection shows the server's message.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busyLabel = 'Working…',
  cancelLabel = 'Keep it',
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setBusy(false);
      setError('');
    }
  }, [open]);

  const close = () => {
    if (!busy) onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      className="max-w-md"
      footer={
        <>
          <button type="button" className="btn btn-secondary btn-sm" onClick={close} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? busyLabel : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3 px-4 py-4 text-sm leading-relaxed text-ink-soft sm:px-5">
        {children}
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  );
}
