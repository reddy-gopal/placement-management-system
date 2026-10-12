import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  IndianRupee,
  MapPin,
  Pencil,
  UsersRound
} from 'lucide-react';
import { Button, StatusBadge } from './ui.jsx';

const formatDeadline = (value) => new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}).format(new Date(value));

export default function DriveCard({ drive, onStatusChange, changingStatus = false }) {
  const canOpen = drive.status === 'DRAFT' || drive.status === 'CLOSED';
  const company = typeof drive.companyId === 'object' ? drive.companyId : null;

  return (
    <article className="surface-card group flex h-full flex-col p-5 transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:hover:border-indigo-800">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <StatusBadge status={drive.status} />
          <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-6 text-slate-950 dark:text-white">
            {drive.title}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
            {company?.name ?? 'Your company'}
          </p>
        </div>
        <Link
          to={`/recruiter/drives/${drive._id}/edit`}
          className="focus-ring rounded-xl border bg-white p-2.5 text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300"
          aria-label={`Edit ${drive.title}`}
        >
          <Pencil size={17} />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/60">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400"><IndianRupee size={12} /> Package</p>
          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">₹{drive.packageLpa} LPA</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/60">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400"><MapPin size={12} /> Location</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">{drive.location}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {formatDeadline(drive.deadline)}</span>
        <span className="flex items-center gap-1.5"><UsersRound size={14} /> Applicants via M5</span>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {drive.status !== 'CANCELLED' && (
          <Button
            variant={canOpen ? 'primary' : 'secondary'}
            size="sm"
            className="flex-1"
            disabled={changingStatus}
            onClick={() => onStatusChange?.(drive, canOpen ? 'OPEN' : 'CLOSED')}
          >
            {canOpen ? 'Open drive' : 'Close drive'}
          </Button>
        )}
        <Link
          to={`/recruiter/drives/${drive._id}/edit`}
          className="focus-ring inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
        >
          Details <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}
