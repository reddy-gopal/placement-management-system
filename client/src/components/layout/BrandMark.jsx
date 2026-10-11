/** NexStep logo: indigo gradient tile with an upward "next step" mark. */
export default function BrandMark({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_16px_-6px_rgb(79_70_229/0.7)]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 18h5v-5h5V8h6" />
          <path d="M16 4h4v4" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-tight text-slate-900 dark:text-white">
        Nex<span className="text-indigo-600 dark:text-indigo-400">Step</span>
      </span>
    </span>
  );
}
