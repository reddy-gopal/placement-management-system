import { useId } from 'react';

/**
 * One row of the profile form: title + description in a 240px left column,
 * fields on the right, separated from the previous row by a hairline.
 */
export default function ProfileSection({ title, description, children }) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="grid grid-cols-1 gap-4 border-t border-line py-7 min-[1050px]:grid-cols-[240px_minmax(0,1fr)] min-[1050px]:gap-8"
    >
      <div>
        <h2 id={titleId} className="text-base font-semibold text-ink">
          {title}
        </h2>
        {description && <p className="field-hint">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
