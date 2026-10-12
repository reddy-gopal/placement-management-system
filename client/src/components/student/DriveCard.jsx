import { Link } from 'react-router-dom';
import CompanyLogo from '../ui/CompanyLogo';
import StatusBadge from '../ui/StatusBadge';
import DeadlinePill from './DeadlinePill';
import { branchesLabel, isClosingSoon, shortIneligibility } from './studentPortal';
import { employmentTypeLabel, formatDate, formatLpa } from '../../utils/format';

/** Eligibility verdict shown on the right of a drive card. */
function Verdict({ drive, profile, application }) {
  if (application) return <StatusBadge status={application.status} />;
  const reason = shortIneligibility(drive, profile);
  return (
    <span className={`whitespace-nowrap text-xs font-medium ${reason ? 'text-muted' : 'text-success'}`}>
      {reason ?? '✓ You’re eligible'}
    </span>
  );
}

/** One open drive in the browse list. The whole card links to the drive's detail page. */
export default function DriveCard({ drive, profile, application }) {
  const company = drive.companyId ?? {};
  const { minCgpa = 6, maxBacklogs = 0, allowedBranches = [] } = drive.eligibility ?? {};

  return (
    <article className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-lg border border-line bg-white p-4 transition-colors hover:border-ink sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:gap-x-5 sm:p-5">
      <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={44} />

      <div className="flex min-w-0 flex-col gap-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-[-0.01em]">
              <Link
                to={`/student/drives/${drive._id}`}
                className="rounded-sm after:absolute after:inset-0 after:rounded-lg after:content-['']"
              >
                {drive.title}
              </Link>
            </h2>
            {isClosingSoon(drive.deadline) && <DeadlinePill deadline={drive.deadline} suffix=" left" />}
          </div>
          <p className="mt-0.5 text-sm text-muted">{company.name}</p>
        </div>
        <p className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-muted">
          <span>
            <strong className="font-semibold text-ink">{formatLpa(drive.packageLpa)}</strong> LPA
          </span>
          <span>{drive.location}</span>
          <span>{employmentTypeLabel(drive.employmentType)}</span>
          <span>Apply by {formatDate(drive.deadline, { withYear: false })}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
          <span className="eyebrow text-[10px]">Eligibility</span>
          <span>CGPA ≥ {minCgpa}</span>
          <span aria-hidden="true">·</span>
          <span>≤ {maxBacklogs} backlogs</span>
          <span aria-hidden="true">·</span>
          <span>{branchesLabel(allowedBranches, ', ')}</span>
        </p>
      </div>

      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
        <Verdict drive={drive} profile={profile} application={application} />
        <span aria-hidden="true" className="btn btn-secondary btn-sm">
          View details
        </span>
      </div>
    </article>
  );
}
