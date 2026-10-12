/**
 * Bordered row of metrics separated by hairlines (2 columns on phones, `columns` from md up).
 * items: [{ label, value, note?, highlight? }] — `highlight` puts the lime marker behind the value.
 */
export default function MetricStrip({ items, label = 'Summary', columns = items.length }) {
  return (
    <section aria-label={label} className="overflow-hidden rounded-lg border border-line">
      <dl
        className={`grid grid-cols-2 ${
          columns > 4
            ? 'md:grid-cols-3 xl:grid-cols-[repeat(var(--cols),minmax(0,1fr))]'
            : 'md:grid-cols-[repeat(var(--cols),minmax(0,1fr))]'
        }`}
        style={{ '--cols': columns }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            className="-mb-px -mr-px flex flex-col gap-3 border-b border-r border-line px-5 py-5 md:px-6"
          >
            <dt className="eyebrow">{item.label}</dt>
            <dd className={typeof item.value === 'string' && item.value.length > 6 ? 'pt-2 text-[22px] font-semibold leading-tight tracking-[-0.02em]' : 'metric-value'}>
              {item.highlight ? <span className="highlight">{item.value}</span> : item.value}
            </dd>
            {item.note && <dd className="text-xs text-muted">{item.note}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
