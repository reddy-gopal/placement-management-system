import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import { applicationCompany } from './studentPortal';

const part = (date, options) => new Intl.DateTimeFormat('en-IN', options).format(date);

/** Next scheduled interview: company, role, a calendar tile and a link to the full details. */
export default function UpcomingInterviewCard({ application }) {
  const drive = application.driveId ?? {};
  const company = applicationCompany(application);
  const when = new Date(application.interview.scheduledAt);

  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-ink p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">{company.name}</p>
          <p className="mt-0.5 text-[13px] text-muted">{drive.title}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-13 shrink-0 flex-col items-center justify-center rounded-md border border-line">
          <span className="eyebrow text-[10px]">{part(when, { month: 'short' })}</span>
          <span className="text-[22px] font-semibold leading-none">{part(when, { day: 'numeric' })}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {part(when, { weekday: 'long' })} · {part(when, { hour: '2-digit', minute: '2-digit', hour12: false })}
          </p>
          {application.interview.notes && (
            <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{application.interview.notes}</p>
          )}
        </div>
      </div>
      <Link to={`/student/applications?application=${application._id}`} className="btn btn-sm self-start">
        Meeting link &amp; notes
      </Link>
    </div>
  );
}
