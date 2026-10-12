import { Link } from 'react-router-dom';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import { employmentTypeLabel, formatDate, formatLpa } from '../../utils/format';
import { eligibilitySummary } from './driveForm';

function Fact({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/** Read-only view of one of the recruiter's drives, as students see its details. */
export default function DriveDetailsModal({ drive, applications, onClose }) {
  return (
    <Modal
      open={Boolean(drive)}
      onClose={onClose}
      title={drive?.title ?? ''}
      className="max-w-160"
      footer={
        drive && (
          <>
            {drive.status !== 'CANCELLED' && (
              <Link to={`/recruiter/drives/${drive._id}/edit`} className="btn btn-secondary">
                Edit drive
              </Link>
            )}
            <Link to={`/recruiter/applications?drive=${drive._id}`} className="btn">
              View applicants
            </Link>
          </>
        )
      }
    >
      {drive && (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-muted">
            <StatusBadge status={drive.status} />
            <span>Posted {formatDate(drive.createdAt)}</span>
            {applications !== null && applications !== undefined && (
              <span>
                · {applications} application{applications === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fact label="Package">
              <strong className="font-semibold">{formatLpa(drive.packageLpa)}</strong> <span className="text-xs text-muted">LPA</span>
            </Fact>
            <Fact label="Location">{drive.location}</Fact>
            <Fact label="Type">{employmentTypeLabel(drive.employmentType)}</Fact>
            <Fact label="Deadline">
              <span className="font-mono text-[13px]">{formatDate(drive.deadline)}</span>
            </Fact>
          </dl>
          <div className="rounded-md border border-line px-3.5 py-3 text-[13px]">
            <span className="eyebrow mr-2">Eligibility</span>
            {eligibilitySummary(drive.eligibility)}
          </div>
          <div>
            <h3 className="eyebrow mb-2">Description</h3>
            <p className="prose-body">{drive.description}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
