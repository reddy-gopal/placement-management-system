import { CircleCheck, CircleDashed, CircleX, ShieldCheck } from 'lucide-react';
import { cardClassName, chip } from '../ui/cardStyles';
import { getEligibilitySnapshot } from '../../utils/profileInsights';

const STATUS = {
  meets: { tone: 'success', icon: CircleCheck, text: 'Meets' },
  below: { tone: 'danger', icon: CircleX, text: 'Below' },
  unknown: { tone: 'neutral', icon: CircleDashed, text: 'Pending' },
};

function Criterion({ label, requirement, yours, status }) {
  const { tone, icon: Icon, text } = STATUS[status];
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 py-3">
      <dt className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</dt>
      <dd className="col-start-2 row-span-2 row-start-1">
        <span className={chip(tone)}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {text}
        </span>
      </dd>
      <dd className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
        Needs {requirement} · Yours {yours}
      </dd>
    </div>
  );
}

/** Student's standing against typical campus-drive criteria (informational only). */
export default function EligibilitySnapshot({ profile }) {
  const { cgpa, backlogs, eligible } = getEligibilitySnapshot(profile);
  const unknown = cgpa.status === 'unknown' || backlogs.status === 'unknown';

  let verdict;
  if (unknown) verdict = 'Save your profile to see how you compare.';
  else if (eligible) verdict = 'You meet the typical criteria for most drives.';
  else verdict = 'Some drives may be out of reach — check each drive’s criteria before applying.';

  return (
    <section aria-labelledby="eligibility-title" className={`${cardClassName} p-5`}>
      <h2 id="eligibility-title" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <ShieldCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-400" aria-hidden="true" />
        Eligibility snapshot
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Typical criteria across campus drives</p>

      <dl className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
        <Criterion
          label="Minimum CGPA"
          requirement={`≥ ${cgpa.threshold.toFixed(1)}`}
          yours={cgpa.value === null ? '—' : cgpa.value.toFixed(2)}
          status={cgpa.status}
        />
        <Criterion
          label="Active backlogs"
          requirement={`${backlogs.threshold}`}
          yours={backlogs.value === null ? '—' : backlogs.value}
          status={backlogs.status}
        />
      </dl>

      <p
        className={`mt-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
          unknown
            ? 'bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
            : eligible
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200'
        }`}
      >
        {verdict}
      </p>
    </section>
  );
}
