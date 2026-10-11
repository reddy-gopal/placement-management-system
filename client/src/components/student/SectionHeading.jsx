/**
 * Form/card section title with a tinted icon tile.
 * Render `as="legend"` as the first child of a <fieldset>.
 */
export default function SectionHeading({ as: Tag = 'h3', icon: Icon, title, description, id }) {
  return (
    <Tag id={id} className="flex w-full items-start gap-3">
      <span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20"
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-slate-900 dark:text-slate-100">{title}</span>
        {description && (
          <span className="mt-0.5 block text-sm font-normal text-slate-500 dark:text-slate-400">{description}</span>
        )}
      </span>
    </Tag>
  );
}
