const base = [
  'inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold',
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500',
  'focus-visible:ring-offset-white dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-950',
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
].join(' ');

export const buttonClassName = {
  primary: `${base} bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 dark:shadow-none`,
  secondary: `${base} border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800`,
  ghost: `${base} text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10`,
};
