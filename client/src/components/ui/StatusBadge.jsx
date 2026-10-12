const LABELS = {
  PENDING: 'Offer pending',
  ACCEPTED: 'Offer accepted',
  DECLINED: 'Offer declined',
  EXPIRED: 'Offer expired',
};

/**
 * Mono status badge for application (APPLIED/SHORTLISTED/SELECTED/REJECTED),
 * drive (DRAFT/OPEN/CLOSED/CANCELLED) and offer (PENDING/ACCEPTED/DECLINED/EXPIRED) states.
 * Pass `kind="offer"` for offer statuses so they read "Offer pending" etc.
 */
export default function StatusBadge({ status, kind, children, className = '' }) {
  if (!status) return null;
  const label = children ?? (kind === 'offer' ? LABELS[status] : status.replace(/_/g, ' '));
  return <span className={`badge status-${status} ${className}`.trim()}>{label}</span>;
}
