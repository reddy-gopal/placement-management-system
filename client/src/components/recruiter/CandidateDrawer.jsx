import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/format';
import { candidateOf, formatCgpa, interviewAt, offerSummary } from './recruiterData';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const initials = (name) =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

/**
 * Right-hand side panel (full width on phones). Escape and the backdrop close it, Tab stays inside,
 * and focus returns to whatever opened it.
 */
function SideDrawer({ open, onClose, label, children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    panel?.querySelector('[data-autofocus]')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-40">
      <div className="animate-fade-in absolute inset-0 bg-ink/20" aria-hidden="true" onClick={() => onCloseRef.current()} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="absolute inset-y-0 right-0 flex w-full flex-col gap-5 overflow-y-auto border-l border-line bg-white p-6 shadow-[-24px_0_48px_-24px_rgb(17_17_17/0.18)] sm:w-105"
      >
        {children}
      </aside>
    </div>,
    document.body
  );
}

function Row({ label, children, last = false }) {
  return (
    <div className={`grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-t border-line py-2.5 text-[13px] ${last ? 'border-b' : ''}`}>
      <dt className="eyebrow">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

/** Candidate details for one application, with the status actions the API allows next. */
export default function CandidateDrawer({ application, onClose, onShortlist, onSelect, onReject }) {
  const titleId = useId();
  const candidate = application ? candidateOf(application) : null;
  const interview = application ? interviewAt(application) : null;
  const offer = application ? offerSummary(application.offer) : '';

  return (
    <SideDrawer open={Boolean(application)} onClose={onClose} label="Candidate details">
      {application && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3.5">
              <span aria-hidden="true" className="grid h-12 w-12 flex-none place-items-center rounded-full bg-ink text-[15px] font-semibold text-white">
                {initials(candidate.name)}
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-lg font-semibold tracking-[-0.01em]">
                  {candidate.name}
                </h2>
                <p className="mt-0.5 break-all font-mono text-xs text-muted">
                  {candidate.rollNumber}
                  {candidate.email && ` · ${candidate.email}`}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close details" data-autofocus className="icon-btn h-9 w-9 flex-none">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div>
            <StatusBadge status={application.status} />
          </div>

          <dl>
            <Row label="Branch">
              {candidate.branch} · Class of {candidate.graduationYear}
            </Row>
            <Row label="CGPA">
              <span className="font-mono">{formatCgpa(candidate.cgpa)}</span>
            </Row>
            <Row label="Backlogs">
              <span className="font-mono">{candidate.activeBacklogs}</span>
            </Row>
            <Row label="Skills">{candidate.skills.length ? candidate.skills.join(', ') : '—'}</Row>
            <Row label="Resume">
              {candidate.resumeUrl ? (
                <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Open resume ↗
                </a>
              ) : (
                '—'
              )}
            </Row>
            <Row label="Applied" last>
              {formatDate(application.createdAt)}
            </Row>
          </dl>

          {interview && (
            <section aria-label="Interview" className="flex flex-col gap-2 rounded-lg border border-ink p-4">
              <span className="eyebrow text-ink">Interview</span>
              <p className="text-[15px] font-semibold">{formatDateTime(interview)}</p>
              {application.interview.meetingLink && (
                <a
                  href={application.interview.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-mono text-xs underline underline-offset-2"
                >
                  {application.interview.meetingLink}
                </a>
              )}
              {application.interview.notes && <p className="text-[13px] leading-normal text-muted">{application.interview.notes}</p>}
            </section>
          )}

          {offer && (
            <section aria-label="Offer" className="flex items-center justify-between gap-3 rounded-lg border border-line p-4">
              <span className="eyebrow text-ink">Offer</span>
              <span className="text-[13px] font-medium">{offer}</span>
            </section>
          )}

          <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
            {application.status === 'APPLIED' && (
              <>
                <button type="button" className="btn" onClick={() => onShortlist(application)}>
                  Shortlist
                </button>
                <button type="button" className="btn btn-danger" onClick={() => onReject(application)}>
                  Reject
                </button>
              </>
            )}
            {application.status === 'SHORTLISTED' && (
              <>
                <button type="button" className="btn" onClick={() => onSelect(application)}>
                  Mark selected
                </button>
                <button type="button" className="btn btn-danger" onClick={() => onReject(application)}>
                  Reject
                </button>
              </>
            )}
            {['SELECTED', 'REJECTED'].includes(application.status) && (
              <p className="text-[13px] text-muted">This application has a final outcome. No further actions.</p>
            )}
          </div>
        </>
      )}
    </SideDrawer>
  );
}
