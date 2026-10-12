import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Alert from '../ui/Alert';

/**
 * Confirmation step for irreversible actions (apply, withdraw, accept/decline an offer).
 * `tone="danger"` renders a solid red confirm button.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  busy = false,
  error = '',
  onConfirm,
  onClose,
}) {
  const confirmClass =
    tone === 'danger' ? 'btn border-danger bg-danger hover:bg-[#b9232b]' : 'btn';

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      className="max-w-[460px]"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} aria-busy={busy} className={confirmClass}>
            {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 px-4 py-4 text-sm leading-relaxed text-muted sm:px-5">
        <div>{children}</div>
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  );
}
