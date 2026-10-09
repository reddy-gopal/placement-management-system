import { BadgeCheck, ClipboardList, GraduationCap, Sparkles } from 'lucide-react';
import { cardClassName, chip, eyebrowClassName } from '../ui/cardStyles';
import { TYPICAL_MIN_CGPA } from '../../constants/studentProfile';

const TILE_TONES = {
  accent: 'bg-indigo-50 text-indigo-600 ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20',
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  warning: 'bg-amber-50 text-amber-600 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/40',
};

const PLACEHOLDER = '—';

function StatCard({ label, icon: Icon, tone = 'accent', value, suffix, badge, children, delay }) {
  return (
    <div className={`${cardClassName} animate-rise flex flex-col p-5`} style={{ '--delay': `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <dt className={eyebrowClassName}>{label}</dt>
        <span aria-hidden="true" className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ${TILE_TONES[tone]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <dd className="mt-1 flex flex-1 flex-col">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</span>
          {suffix && <span className="text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400">{suffix}</span>}
          {badge}
        </span>
        <span className="mt-auto block pt-4 text-xs text-slate-500 dark:text-slate-400">{children}</span>
      </dd>
    </div>
  );
}

/** KPI strip: CGPA, backlogs, skills and placement status from the SAVED profile. */
export default function ProfileStats({ profile }) {
  const cgpa = profile ? Number(profile.cgpa) : null;
  const backlogs = profile ? Number(profile.activeBacklogs) : null;
  const skills = profile?.skills ?? [];

  return (
    <section aria-label="Profile at a glance">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="CGPA"
          icon={GraduationCap}
          value={cgpa === null ? PLACEHOLDER : cgpa.toFixed(2)}
          suffix={cgpa === null ? null : '/ 10'}
          delay={60}
        >
          <span className="relative block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-[width] duration-700 ease-out motion-reduce:transition-none dark:bg-indigo-400"
              style={{ width: `${cgpa === null ? 0 : Math.min(cgpa, 10) * 10}%` }}
            />
            <span className="absolute inset-y-0 w-px bg-slate-400/70 dark:bg-slate-500" style={{ left: `${TYPICAL_MIN_CGPA * 10}%` }} />
          </span>
          <span className="mt-2 block">
            {cgpa === null
              ? 'Add your CGPA to see where you stand'
              : cgpa >= TYPICAL_MIN_CGPA
                ? `Above the typical ${TYPICAL_MIN_CGPA.toFixed(1)} cutoff`
                : `Below the typical ${TYPICAL_MIN_CGPA.toFixed(1)} cutoff`}
          </span>
        </StatCard>

        <StatCard
          label="Active backlogs"
          icon={ClipboardList}
          tone={backlogs === null ? 'neutral' : backlogs === 0 ? 'success' : 'warning'}
          value={backlogs === null ? PLACEHOLDER : backlogs}
          badge={
            backlogs === null ? null : backlogs === 0 ? (
              <span className={chip('success')}>Clear</span>
            ) : (
              <span className={chip('warning')}>Needs attention</span>
            )
          }
          delay={120}
        >
          Most drives require 0 active backlogs
        </StatCard>

        <StatCard label="Skills" icon={Sparkles} value={profile ? skills.length : PLACEHOLDER} suffix={profile ? 'listed' : null} delay={180}>
          <span className="block truncate">
            {skills.length ? `Top: ${skills.slice(0, 3).join(', ')}` : 'Add skills recruiters search for'}
          </span>
        </StatCard>

        <StatCard
          label="Placement status"
          icon={BadgeCheck}
          tone={profile?.isPlaced ? 'success' : 'neutral'}
          value={!profile ? PLACEHOLDER : profile.isPlaced ? 'Placed' : 'Open'}
          badge={profile && !profile.isPlaced ? <span className={chip('neutral')}>Open to offers</span> : null}
          delay={240}
        >
          Updated by your placement cell
        </StatCard>
      </dl>
    </section>
  );
}
