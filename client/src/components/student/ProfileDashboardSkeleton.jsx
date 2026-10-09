import { Loader2 } from 'lucide-react';
import { cardClassName } from '../ui/cardStyles';

const bone = 'rounded-lg bg-slate-200/80 dark:bg-slate-800';

/** Placeholder layout shown while the profile loads. */
export default function ProfileDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div role="status" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-500 motion-reduce:animate-none" aria-hidden="true" />
        Loading profile...
      </div>

      <div aria-hidden="true" className="animate-pulse space-y-6 motion-reduce:animate-none">
        <div className={`${cardClassName} flex items-center justify-between gap-6 p-5 sm:p-7`}>
          <div className="flex-1 space-y-3">
            <div className={`${bone} h-3 w-32`} />
            <div className={`${bone} h-6 w-56 max-w-full`} />
            <div className={`${bone} h-3 w-72 max-w-full`} />
            <div className={`${bone} mt-5 h-1.5 w-full max-w-md`} />
          </div>
          <div className="hidden h-36 w-36 shrink-0 rounded-full border-[10px] border-slate-200/80 sm:block dark:border-slate-800" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className={`${cardClassName} space-y-4 p-5`}>
              <div className="flex justify-between">
                <div className={`${bone} h-3 w-20`} />
                <div className={`${bone} h-9 w-9 rounded-xl`} />
              </div>
              <div className={`${bone} h-8 w-24`} />
              <div className={`${bone} h-2 w-full`} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className={`${cardClassName} space-y-5 p-6 xl:col-span-2`}>
            <div className={`${bone} h-5 w-48`} />
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="space-y-2">
                  <div className={`${bone} h-3 w-24`} />
                  <div className={`${bone} h-11 w-full rounded-xl`} />
                </div>
              ))}
            </div>
          </div>
          <div className={`${cardClassName} space-y-3 p-5`}>
            <div className={`${bone} h-3 w-28`} />
            <div className={`${bone} h-12 w-full`} />
            <div className={`${bone} h-12 w-full`} />
          </div>
        </div>
      </div>
    </div>
  );
}
