import { daysLeftLabel, isClosingSoon } from './studentPortal';

/** Mono "2 days" pill; lime when the deadline is three days away or less. */
export default function DeadlinePill({ deadline, suffix = '', className = '' }) {
  const soon = isClosingSoon(deadline);
  return (
    <span
      className={`whitespace-nowrap rounded border px-1.5 py-[3px] font-mono text-[11px] font-medium leading-none text-ink ${
        soon ? 'border-ink bg-lime' : 'border-line bg-white'
      } ${className}`}
    >
      {daysLeftLabel(deadline)}
      {suffix}
    </span>
  );
}
