import { ArrowRight, CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { cardClassName } from '../ui/cardStyles';

/** The 7 completeness items; open items jump to the matching form field. */
export default function ProfileChecklist({ completeness, onJumpToField }) {
  const { items, completed, total } = completeness;

  return (
    <section aria-labelledby="checklist-title" className={`${cardClassName} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="checklist-title" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <ListChecks className="h-4 w-4 text-indigo-500 dark:text-indigo-400" aria-hidden="true" />
          Profile checklist
        </h2>
        <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
          {completed}/{total}
        </span>
      </div>

      <ul className="mt-3 -mx-2 space-y-0.5">
        {items.map((item) =>
          item.done ? (
            <li key={item.key} className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-500" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              <span className="sr-only">(done)</span>
            </li>
          ) : (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onJumpToField(item.field)}
                className="group flex min-h-10 w-full items-center gap-3 rounded-lg px-2 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none dark:text-slate-100 dark:hover:bg-slate-800/60"
              >
                <Circle className="h-[18px] w-[18px] shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                <span className="sr-only">(to do)</span>
                <ArrowRight
                  className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </button>
            </li>
          )
        )}
      </ul>
    </section>
  );
}
