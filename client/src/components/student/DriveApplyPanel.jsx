import { Link } from 'react-router-dom';
import { Check, Minus, X } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { formatDate } from '../../utils/format';
import { branchesLabel, getEligibilityChecks } from './studentPortal';

const CHECK_STYLES = {
  meets: { icon: Check, classes: 'border-[#c5e6cf] bg-[#eef8f1] text-success' },
  fails: { icon: X, classes: 'border-[#f3c6c8] bg-[#fdf1f1] text-danger' },
  unknown: { icon: Minus, classes: 'border-line bg-subtle text-faint' },
};

const INELIGIBLE_TITLES = {
  cgpa: 'You don’t meet the CGPA requirement',
  backlogs: 'You have too many active backlogs',
  branch: 'Your branch isn’t eligible',
};

function ineligibilityMessage(drive, profile, failed) {
  const { minCgpa, maxBacklogs, allowedBranches } = drive.eligibility ?? {};
  const sentences = failed.map((check) => {
    if (check.key === 'cgpa') return `This drive needs CGPA ${minCgpa}; yours is ${profile.cgpa}.`;
    if (check.key === 'backlogs')
      return `It allows at most ${maxBacklogs} active backlog${maxBacklogs === 1 ? '' : 's'}; you have ${profile.activeBacklogs}.`;
    return `It’s open to ${branchesLabel(allowedBranches, ', ')} only.`;
  });
  return `${sentences.join(' ')} Applications are checked against your profile.`;
}

/** "ananya-iyer-resume.pdf" from a resume URL. */
function resumeName(url) {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : url;
  } catch {
    return url;
  }
}

function Note({ title, children }) {
  return (
    <div role="note" className="rounded-lg border border-line bg-subtle p-3.5 text-[13px] leading-normal">
      <strong className="block font-semibold">{title}</strong>
      <span className="text-muted">{children}</span>
    </div>
  );
}

function CheckRow({ check }) {
  const { icon: Icon, classes } = CHECK_STYLES[check.status];
  const statusText = { meets: 'meets requirement', fails: 'does not meet requirement', unknown: 'not checked' }[check.status];
  return (
    <li className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-line py-3 text-sm">
      <span className={`grid h-5 w-5 place-items-center rounded-full border ${classes}`}>
        <Icon className="h-[11px] w-[11px]" strokeWidth={3.2} aria-hidden="true" />
        <span className="sr-only">{statusText}</span>
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{check.label}</span>
        <span className="mt-0.5 block text-xs text-muted">
          You: {check.status === 'unknown' ? '— no profile yet' : check.mine}
        </span>
      </span>
      <span className="text-right font-mono text-xs text-muted">{check.requirement}</span>
    </li>
  );
}

/** What the student can do next: apply, see their application, or why they can't apply. */
function Actions({ drive, profile, application, onApply, onWithdraw }) {
  if (application) {
    return (
      <>
        <div role="status" className="flex items-start gap-2.5 rounded-lg border border-ink p-3.5">
          <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded bg-lime">
            <Check className="h-[11px] w-[11px]" strokeWidth={3.2} />
          </span>
          <span className="text-[13px] leading-normal">
            <strong className="block font-semibold">You applied on {formatDate(application.createdAt)}</strong>
            <span className="text-muted">
              Status <StatusBadge status={application.status} className="mx-0.5 align-middle" />. Track it in My
              applications.
            </span>
          </span>
        </div>
        <Link to={`/student/applications?application=${application._id}`} className="btn btn-secondary w-full">
          View application
        </Link>
        {application.status === 'APPLIED' && (
          <button type="button" onClick={onWithdraw} className="link self-center p-2.5 text-[13px] font-medium text-danger">
            Withdraw application
          </button>
        )}
      </>
    );
  }

  if (profile?.isPlaced) {
    return (
      <>
        <Note title="You’ve already accepted an offer">Placed students can’t apply to new drives.</Note>
        <Link to="/student/applications" className="btn btn-secondary w-full">
          View my offer
        </Link>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Note title="Set up your profile to apply">
          Eligibility is checked against your CGPA, backlogs and branch, so you need a profile before applying.
        </Note>
        <Link to="/student/profile" className="btn w-full">
          Complete profile
        </Link>
      </>
    );
  }

  if (!drive.isEligible) {
    const failed = getEligibilityChecks(drive, profile).filter((check) => check.status === 'fails');
    const title = failed.length === 1 ? INELIGIBLE_TITLES[failed[0].key] : 'You don’t meet the eligibility criteria';
    return (
      <>
        <Note title={title}>
          {failed.length ? ineligibilityMessage(drive, profile, failed) : drive.ineligibilityReasons?.join('. ')}
        </Note>
        <button type="button" className="btn w-full" disabled>
          Apply now
        </button>
      </>
    );
  }

  if (!profile.resumeUrl) {
    return (
      <>
        <Note title="Add a resume link to apply">Each application uses the resume link saved on your profile.</Note>
        <Link to="/student/profile" className="btn w-full">
          Add resume link
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="text-[13px] leading-normal text-muted">
        Your profile resume will be attached:{' '}
        <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="break-all text-ink underline underline-offset-2">
          {resumeName(profile.resumeUrl)}
        </a>
      </p>
      <button type="button" onClick={onApply} className="btn w-full">
        Apply now
      </button>
    </>
  );
}

/** Eligibility checklist and the apply / applied / blocked states for one drive. */
export default function DriveApplyPanel({ drive, profile, application, notice, onApply, onWithdraw }) {
  const checks = getEligibilityChecks(drive, profile);
  let summary = { text: '✓ Eligible', classes: 'text-success' };
  if (!profile) summary = { text: 'Profile needed', classes: 'text-muted' };
  else if (!drive.isEligible) summary = { text: 'Not eligible', classes: 'text-danger' };

  return (
    <aside aria-labelledby="eligibility-title" className="flex flex-col gap-5 rounded-[10px] border border-line p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="eligibility-title" className="text-base font-semibold">
          Eligibility
        </h2>
        <span className={`text-xs font-medium ${summary.classes}`}>{summary.text}</span>
      </div>
      <ul className="flex flex-col">
        {checks.map((check) => (
          <CheckRow key={check.key} check={check} />
        ))}
      </ul>
      <div className="flex flex-col gap-3 pt-1">
        {notice && (
          <div role="status" className="rounded-lg border border-line bg-subtle px-3.5 py-3 text-[13px]">
            {notice}
          </div>
        )}
        <Actions drive={drive} profile={profile} application={application} onApply={onApply} onWithdraw={onWithdraw} />
      </div>
    </aside>
  );
}
