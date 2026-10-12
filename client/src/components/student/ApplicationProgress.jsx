import { formatDate } from '../../utils/format';

const TONES = {
  done: { circle: 'border-ink bg-ink', dot: 'bg-lime', text: 'text-ink' },
  todo: { circle: 'border-[#d4d4d9] bg-white', dot: 'bg-white', text: 'text-muted' },
  success: { circle: 'border-success bg-success', dot: 'bg-white', text: 'text-success' },
  danger: { circle: 'border-danger bg-danger', dot: 'bg-white', text: 'text-danger' },
  warning: { circle: 'border-warning bg-white', dot: 'bg-warning', text: 'text-warning' },
};

/**
 * Timeline steps for an application. Only dates the API records are shown
 * (applied = createdAt, interview, offer deadline / response); other steps describe the stage.
 */
export function getApplicationSteps(application) {
  const { status, offer, interview } = application;
  const offerStatus = offer?.status ?? null;
  const reachedSelected = status === 'SELECTED' || Boolean(offerStatus);
  const reachedShortlist = status === 'SHORTLISTED' || reachedSelected || Boolean(interview?.scheduledAt);

  const steps = [{ label: 'Applied', sub: formatDate(application.createdAt), tone: 'done' }];

  if (reachedShortlist) {
    steps.push({
      label: 'Shortlisted',
      sub: interview?.scheduledAt ? `Interview ${formatDate(interview.scheduledAt)}` : 'Shortlisted by the recruiter',
      tone: 'done',
    });
  } else {
    steps.push({ label: 'Shortlisted', sub: status === 'REJECTED' ? 'Not shortlisted' : 'Pending review', tone: 'todo' });
  }

  if (reachedSelected) {
    steps.push({ label: 'Selected', sub: 'Offer made', tone: 'done' });
    if (offerStatus === 'ACCEPTED') {
      steps.push({ label: 'Offer accepted', sub: `Final · placed · ${formatDate(offer.respondedAt)}`, tone: 'success' });
    } else if (offerStatus === 'DECLINED') {
      steps.push({ label: 'Offer declined', sub: `Final · ${formatDate(offer.respondedAt)}`, tone: 'todo' });
    } else if (offerStatus === 'EXPIRED') {
      steps.push({ label: 'Offer expired', sub: `No response by ${formatDate(offer.deadline)}`, tone: 'todo' });
    } else {
      steps.push({ label: 'Offer pending', sub: `Respond by ${formatDate(offer?.deadline)}`, tone: 'warning' });
    }
  } else if (status === 'REJECTED') {
    steps.push({ label: 'Not selected', sub: `Final · ${formatDate(application.updatedAt)}`, tone: 'danger' });
  } else {
    steps.push({ label: 'Outcome', sub: 'Selected or not selected', tone: 'todo' });
  }
  return steps;
}

/** Vertical stepper: filled black dots for reached stages, hollow for upcoming ones. */
export default function ApplicationProgress({ application, className = '' }) {
  const steps = getApplicationSteps(application);
  return (
    <ol aria-label="Progress" className={`flex flex-col ${className}`}>
      {steps.map((step, index) => {
        const tone = TONES[step.tone];
        const next = steps[index + 1];
        const last = !next;
        return (
          <li key={step.label} className={`relative grid grid-cols-[24px_minmax(0,1fr)] gap-3.5 ${last ? '' : 'pb-6'}`}>
            <span aria-hidden="true" className={`z-[1] grid h-6 w-6 place-items-center rounded-full border ${tone.circle}`}>
              <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
            </span>
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-[11.5px] top-6 w-px ${next.tone === 'todo' ? 'bg-line' : 'bg-ink'}`}
              />
            )}
            <span>
              <span className={`block text-sm font-semibold ${tone.text}`}>{step.label}</span>
              <span className="mt-0.5 block text-xs text-muted">{step.sub}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
