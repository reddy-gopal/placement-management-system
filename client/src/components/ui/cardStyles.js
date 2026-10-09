/** Shared surface styles: crisp 1px border, soft layered shadow (light) / inner highlight (dark). */
export const cardClassName = [
  'rounded-2xl border border-slate-200 bg-white',
  'shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(15_23_42/0.12)]',
  'dark:border-slate-800 dark:bg-slate-900 dark:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]',
].join(' ');

/** Small uppercase label used above metrics and in card headers. */
export const eyebrowClassName = 'text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400';

/** Status chip colours — colour carries meaning only (success / warning / danger / neutral / accent). */
export const chipClassName = {
  base: 'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/25',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/40',
  accent: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/25',
};

export const chip = (tone) => `${chipClassName.base} ${chipClassName[tone]}`;
