import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Alert from '../ui/Alert';
import FormField, { describedBy, inputClassName } from '../ui/FormField';
import { formatDate, formatLpa, toDateInputValue } from '../../utils/format';
import { isHttpUrl } from '../../utils/studentProfileForm';
import { candidateOf, endOfDay } from './recruiterData';
import { dangerSolidClassName } from './RecruiterUi';

/** The server keeps offers open for at least this many days (helper.getOfferDeadline). */
export const MIN_OFFER_DAYS = 7;
const DAY = 86_400_000;

const EMPTY_INTERVIEW = { date: '', time: '', meetingLink: '', notes: '' };

/** Interview fields are optional; when any is filled, date + time must describe a future moment. */
export function validateInterview(values, now = new Date()) {
  const errors = {};
  const wantsInterview = Object.values(values).some((value) => value.trim());
  if (!wantsInterview) return errors;
  if (!values.date) errors.date = 'Pick the interview date.';
  if (!values.time) errors.time = 'Pick the interview time.';
  if (values.date && values.time) {
    const at = new Date(`${values.date}T${values.time}`);
    if (Number.isNaN(at.getTime())) errors.date = 'Enter a valid date.';
    else if (at <= now) errors.date = 'The interview must be in the future.';
  }
  if (values.meetingLink.trim() && !isHttpUrl(values.meetingLink.trim()))
    errors.meetingLink = 'Enter a full link, e.g. https://meet.example.com/abc';
  return errors;
}

/** Runs `action`, keeping the dialog open with the server's message if it fails. */
function useSubmit(open) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setBusy(false);
      setError('');
    }
  }, [open]);
  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function DialogFooter({ onCancel, busy, confirmLabel, busyLabel, confirmClassName = 'btn', formId, onConfirm }) {
  return (
    <>
      <button type="button" onClick={onCancel} disabled={busy} className="btn btn-secondary">
        Cancel
      </button>
      <button
        type={formId ? 'submit' : 'button'}
        form={formId}
        onClick={formId ? undefined : onConfirm}
        disabled={busy}
        aria-busy={busy}
        className={confirmClassName}
      >
        {busy ? busyLabel : confirmLabel}
      </button>
    </>
  );
}

/** Shortlist, optionally scheduling the interview (the API only accepts it with the shortlist). */
export function ShortlistDialog({ application, drive, onClose, onConfirm }) {
  const open = Boolean(application);
  const [values, setValues] = useState(EMPTY_INTERVIEW);
  const [errors, setErrors] = useState({});
  const { busy, error, run } = useSubmit(open);

  useEffect(() => {
    if (open) {
      setValues(EMPTY_INTERVIEW);
      setErrors({});
    }
  }, [open]);

  const update = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validateInterview(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const scheduled = Boolean(values.date && values.time);
    run(() =>
      onConfirm(
        scheduled
          ? {
              interviewDate: new Date(`${values.date}T${values.time}`).toISOString(),
              meetingLink: values.meetingLink.trim() || undefined,
              notes: values.notes.trim() || undefined,
            }
          : {}
      )
    );
  };

  const input = (field, props = {}) => ({
    id: `iv-${field}`,
    value: values[field],
    onChange: (event) => update(field, event.target.value),
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': describedBy(`iv-${field}`, { error: errors[field], hint: props.hint }),
    className: inputClassName(Boolean(errors[field])),
  });
  const scheduling = Object.values(values).some((value) => value.trim());
  const name = application ? candidateOf(application).name : '';

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title={`Shortlist ${name}`}
      className="max-w-130"
      footer={
        <DialogFooter
          onCancel={onClose}
          busy={busy}
          formId="shortlist-form"
          confirmLabel={scheduling ? 'Shortlist & schedule' : 'Shortlist'}
          busyLabel="Saving…"
        />
      }
    >
      <form id="shortlist-form" noValidate onSubmit={submit} className="flex flex-col gap-4.5 p-5" aria-label="Shortlist candidate">
        <p className="text-[13px] text-muted">
          {name} · {drive?.title}. Optionally schedule the interview now — it can’t be added after shortlisting.
        </p>
        {error && <Alert variant="error">{error}</Alert>}
        <fieldset className="m-0 flex flex-col gap-3.5 border-0 p-0">
          <legend className="eyebrow mb-3.5 text-ink">Schedule interview (optional)</legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField id="iv-date" label="Date" error={errors.date}>
              <input type="date" min={toDateInputValue(new Date())} {...input('date')} />
            </FormField>
            <FormField id="iv-time" label="Time" error={errors.time}>
              <input type="time" {...input('time')} />
            </FormField>
          </div>
          <FormField id="iv-meetingLink" label="Meeting link" error={errors.meetingLink}>
            <input type="url" placeholder="https://" {...input('meetingLink')} />
          </FormField>
          <FormField id="iv-notes" label="Notes for the candidate" hint="Visible to the student in My applications.">
            <textarea rows={3} placeholder="Round, duration, what to prepare" {...input('notes', { hint: true })} />
          </FormField>
        </fieldset>
      </form>
    </Modal>
  );
}

/** Confirm a final rejection. */
export function RejectDialog({ application, drive, onClose, onConfirm }) {
  const open = Boolean(application);
  const { busy, error, run } = useSubmit(open);
  const name = application ? candidateOf(application).name : '';
  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title={`Reject ${name}?`}
      className="max-w-115"
      footer={
        <DialogFooter
          onCancel={onClose}
          busy={busy}
          onConfirm={() => run(() => onConfirm({}))}
          confirmLabel="Reject candidate"
          busyLabel="Rejecting…"
          confirmClassName={dangerSolidClassName}
        />
      }
    >
      <div className="flex flex-col gap-3 p-5">
        <p className="text-sm leading-[1.55] text-muted">
          This is a final outcome for {drive?.title}. The student will see REJECTED and can’t be moved back to another stage.
        </p>
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  );
}

/** Select the candidate and send an offer with an optional response deadline (min 7 days out). */
export function SelectDialog({ application, drive, onClose, onConfirm }) {
  const open = Boolean(application);
  const { busy, error, run } = useSubmit(open);
  const [deadline, setDeadline] = useState('');
  const [deadlineError, setDeadlineError] = useState('');
  const earliest = new Date(Date.now() + MIN_OFFER_DAYS * DAY);

  useEffect(() => {
    if (open) {
      setDeadline('');
      setDeadlineError('');
    }
  }, [open]);

  const confirm = () => {
    if (deadline) {
      const chosen = endOfDay(deadline);
      if (!chosen || chosen < earliest) {
        setDeadlineError(`Pick ${formatDate(earliest)} or later — offers stay open for at least ${MIN_OFFER_DAYS} days.`);
        return;
      }
    }
    run(() => onConfirm(deadline ? { offerDeadline: endOfDay(deadline).toISOString() } : {}));
  };

  const name = application ? candidateOf(application).name : '';
  const hint = `Optional — leave blank to use the earliest allowed deadline (${formatDate(earliest)}). Unanswered offers expire after it.`;

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title={`Select ${name}?`}
      className="max-w-115"
      footer={
        <DialogFooter onCancel={onClose} busy={busy} onConfirm={confirm} confirmLabel="Select & send offer" busyLabel="Sending…" />
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <p className="text-sm leading-[1.55] text-muted">
          They’ll see SELECTED and an offer for {drive?.title} at {formatLpa(drive?.packageLpa)} LPA. They’re marked placed only
          once they accept; if they decline, the application becomes REJECTED.
        </p>
        {error && <Alert variant="error">{error}</Alert>}
        <FormField id="offer-deadline" label="Offer response deadline" hint={hint} error={deadlineError}>
          <input
            id="offer-deadline"
            type="date"
            min={toDateInputValue(earliest)}
            value={deadline}
            onChange={(event) => {
              setDeadline(event.target.value);
              setDeadlineError('');
            }}
            aria-invalid={Boolean(deadlineError)}
            aria-describedby={describedBy('offer-deadline', { error: deadlineError, hint })}
            className={inputClassName(Boolean(deadlineError))}
          />
        </FormField>
      </div>
    </Modal>
  );
}
