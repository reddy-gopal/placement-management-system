/** Placeholder layout shown while the profile loads; mirrors the header + sectioned form. */
export default function ProfileDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <p role="status" className="sr-only">
        Loading profile...
      </p>

      <div aria-hidden="true" className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="skeleton h-18 w-18 rounded-full" />
            <div className="space-y-2.5">
              <div className="skeleton h-7 w-56" />
              <div className="skeleton h-3.5 w-64" />
            </div>
          </div>
          <div className="skeleton h-19 w-52 rounded-lg" />
        </div>

        <div>
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="grid grid-cols-1 gap-4 border-t border-line py-7 min-[1050px]:grid-cols-[240px_minmax(0,1fr)] min-[1050px]:gap-8"
            >
              <div className="space-y-2.5">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-44" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {[0, 1].map((field) => (
                  <div key={field} className="space-y-2">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
