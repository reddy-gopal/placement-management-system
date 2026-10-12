import { Link } from 'react-router-dom';
import CompanyLogo from '../ui/CompanyLogo';
import StatusBadge from '../ui/StatusBadge';
import { formatDate } from '../../utils/format';
import { applicationCompany, lpaLabel } from './studentPortal';

/** Black-outlined banner for an offer that still needs a response. */
export default function OfferBanner({ application }) {
  const drive = application.driveId ?? {};
  const company = applicationCompany(application);

  return (
    <section
      aria-label="Offer awaiting response"
      className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink px-4 py-4 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold">Offer from {company.name ?? 'a recruiter'}</span>
            <StatusBadge status="PENDING" kind="offer" />
          </div>
          <p className="mt-0.5 text-[13px] text-muted">
            {drive.title} · {lpaLabel(drive.packageLpa)} · respond by {formatDate(application.offer.deadline)}
          </p>
        </div>
      </div>
      <Link to={`/student/applications?application=${application._id}`} className="btn">
        Review offer
      </Link>
    </section>
  );
}
