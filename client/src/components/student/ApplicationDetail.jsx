import { Link } from 'react-router-dom';
import { ArrowLeft, Video } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import ApplicationProgress from './ApplicationProgress';
import { applicationCompany, lpaLabel } from './studentPortal';
import { daysUntil, formatDate, formatDateTime } from '../../utils/format';

function Pill({ children, muted = false }) {
  return (
    <span
      className={`whitespace-nowrap rounded border px-1.5 py-[3px] font-mono text-[11px] uppercase leading-none ${
        muted ? 'border-line bg-subtle text-muted' : 'border-ink bg-lime text-ink'
      }`}
    >
      {children}
    </span>
  );
}

function interviewPill(scheduledAt) {
  const days = daysUntil(scheduledAt);
  if (new Date(scheduledAt) < new Date()) return <Pill muted>Done</Pill>;
  if (days <= 0) return <Pill>Today</Pill>;
  if (days === 1) return <Pill>Tomorrow</Pill>;
  return <Pill>In {days} days</Pill>;
}

function OfferCard({ application, onAccept, onDecline }) {
  const drive = application.driveId ?? {};
  const expired = new Date(application.offer.deadline) <= new Date();
  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-ink p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow text-ink">Offer</span>
        <Pill>Respond by {formatDate(application.offer.deadline, { withYear: false })}</Pill>
      </div>
      <p className="text-[15px] font-semibold">
        {applicationCompany(application).name} · {lpaLabel(drive.packageLpa)}
      </p>
      <p className="text-[13px] leading-normal text-muted">
        Accepting marks you placed and closes your other open applications. Declining moves this one to REJECTED. Both
        are final.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={onAccept} disabled={expired}>
          Accept offer
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDecline} disabled={expired}>
          Decline
        </button>
      </div>
    </div>
  );
}

function InterviewCard({ interview }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-ink p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow text-ink flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 text-lime-600" />
          Online Interview
        </span>
        {interviewPill(interview.scheduledAt)}
      </div>
      <p className="text-[17px] font-semibold lg:text-[15px]">{formatDateTime(interview.scheduledAt)}</p>
      {interview.meetingLink && (
        <div className="flex flex-col gap-2 pt-1">
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="btn flex items-center justify-center gap-2 h-11 w-full bg-[#0f172a] text-white hover:bg-slate-800 transition-colors"
          >
            <Video className="h-4 w-4" />
            Join Online Meeting ↗
          </a>
          <span className="text-[11px] text-muted truncate text-center" title={interview.meetingLink}>
            Link: {interview.meetingLink}
          </span>
        </div>
      )}
      {interview.notes && (
        <p className="border-t border-line pt-2.5 text-[13px] leading-relaxed text-muted">
          <strong className="font-medium text-ink">Recruiter notes ·</strong> {interview.notes}
        </p>
      )}
    </div>
  );
}

function waitingText(application) {
  const { status, interview, offer } = application;
  if (status === 'APPLIED')
    return 'Waiting for the recruiter to review. Interview details appear here if you’re shortlisted.';
  if (status === 'SHORTLISTED' && !interview?.scheduledAt)
    return 'Shortlisted — the recruiter hasn’t scheduled an interview yet.';
  if (status === 'REJECTED' && !offer?.status) return 'This application is closed.';
  return '';
}

const OFFER_NOTES = {
  ACCEPTED: (company) => (
    <div role="status" className="flex flex-wrap gap-x-2.5 rounded-lg border border-[#c5e6cf] bg-[#eef8f1] px-4 py-3.5 text-[13px] text-success">
      <strong className="font-semibold">Offer accepted.</strong>
      <span className="text-ink">You’re placed at {company}.</span>
    </div>
  ),
  DECLINED: () => (
    <p className="rounded-lg border border-line bg-subtle px-4 py-3.5 text-[13px] text-muted">You declined this offer.</p>
  ),
  EXPIRED: () => (
    <p className="rounded-lg border border-dashed border-line-strong px-4 py-3.5 text-[13px] text-muted">
      This offer expired — it wasn’t accepted before the deadline.
    </p>
  ),
};

/** Right-hand panel of My applications: progress, offer / interview details and actions. */
export default function ApplicationDetail({ application, onAccept, onDecline, onWithdraw, onBack }) {
  const drive = application.driveId ?? {};
  const company = applicationCompany(application);
  const offerStatus = application.offer?.status;
  const wait = waitingText(application);

  return (
    <aside aria-label="Application detail" className="flex flex-col gap-6 rounded-lg border-line lg:border lg:p-6">
      {onBack && (
        <button type="button" onClick={onBack} className="btn btn-ghost btn-sm -ml-3 self-start lg:hidden">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All applications
        </button>
      )}
      <div>
        <p className="eyebrow">{company.name}</p>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] lg:text-xl">{drive.title ?? 'Job drive'}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
          <StatusBadge status={application.status} className="lg:hidden" />
          <span>
            {lpaLabel(drive.packageLpa)} · Applied {formatDate(application.createdAt)}
          </span>
        </p>
      </div>

      <ApplicationProgress
        application={application}
        className="rounded-lg border border-line p-4 lg:rounded-none lg:border-0 lg:p-0"
      />

      {offerStatus === 'PENDING' && application.status === 'SELECTED' && (
        <OfferCard application={application} onAccept={onAccept} onDecline={onDecline} />
      )}
      {OFFER_NOTES[offerStatus]?.(company.name)}

      {application.status === 'SHORTLISTED' && application.interview?.scheduledAt && (
        <InterviewCard interview={application.interview} />
      )}

      {wait && (
        <p className="rounded-lg border border-dashed border-[#d4d4d9] p-3.5 text-[13px] leading-normal text-muted">{wait}</p>
      )}

      <div className="flex flex-col gap-1">
        {drive._id && (
          <Link to={`/student/drives/${drive._id}`} className="btn btn-secondary self-start">
            View job drive
          </Link>
        )}
        {application.status === 'APPLIED' && (
          <button type="button" onClick={onWithdraw} className="link self-start py-2 text-[13px] font-medium text-danger">
            Withdraw application
          </button>
        )}
      </div>
    </aside>
  );
}
