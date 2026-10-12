import { formatCount } from '../../utils/format';
import { niceAxis, formatPercent, percentOf } from './adminInsights';

const W = 600;
const H = 220;

const shortDate = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);

/** SVG polyline points for `values` scaled to the 600×220 viewBox. */
const toPoints = (values, max) =>
  values
    .map((v, i) => `${((i / Math.max(values.length - 1, 1)) * W).toFixed(1)},${(H - (v / max) * H).toFixed(1)}`)
    .join(' ');

/**
 * Line chart of cumulative placements (accepted offers): black line this season,
 * dashed violet line for the same weeks a year earlier (only when that year has data).
 * `series` comes from `cumulativePlacements()`.
 */
export default function CumulativePlacementChart({ series }) {
  const { dates, current, previous } = series;
  const latest = current[current.length - 1] ?? 0;
  const previousLatest = previous[previous.length - 1] ?? 0;
  const showPrevious = previousLatest > 0;
  const axis = niceAxis(Math.max(latest, showPrevious ? previousLatest : 0));
  const markerTop = 100 - percentOf(latest, axis.max);
  const yoy = showPrevious ? percentOf(latest - previousLatest, previousLatest) : null;
  const labelIndexes = [0, Math.round((dates.length - 1) / 3), Math.round(((dates.length - 1) * 2) / 3), dates.length - 1];

  const summary =
    `Cumulative students placed over the last ${dates.length} weeks: ${latest} as of ${shortDate(dates[dates.length - 1])}` +
    (showPrevious ? ` versus ${previousLatest} at the same point last season.` : '.');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Students placed, cumulative</h2>
        <div className="flex gap-4 text-xs text-muted" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-ink" />
            This season
          </span>
          {showPrevious && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-violet" />
              Last season
            </span>
          )}
        </div>
      </div>

      <figure role="img" aria-label={summary} className="m-0 grid grid-cols-[36px_minmax(0,1fr)] gap-2">
        <div className="flex h-55 flex-col justify-between text-right font-mono text-[11px] text-muted">
          {axis.ticks.map((tick) => (
            <span key={tick} className="leading-none">
              {formatCount(tick)}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="relative h-55 border-b border-ink">
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="border-t border-dashed border-line" />
              <div className="border-t border-dashed border-line" />
              <div className="border-t border-dashed border-line" />
              <div />
            </div>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              {showPrevious && (
                <polyline
                  points={toPoints(previous, axis.max)}
                  fill="none"
                  stroke="#9B5CFF"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <polyline
                points={toPoints(current, axis.max)}
                fill="none"
                stroke="#111"
                strokeWidth="2.25"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div
              aria-hidden="true"
              className="absolute left-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-lime"
              style={{ top: `${markerTop}%` }}
            />
            <div
              aria-hidden="true"
              className="absolute right-3 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs font-semibold text-white"
              style={{ top: markerTop < 20 ? `calc(${markerTop}% + 14px)` : `calc(${markerTop}% - 34px)` }}
            >
              {formatCount(latest)}
              {yoy !== null && ` · ${yoy >= 0 ? '+' : ''}${formatPercent(yoy)} YoY`}
            </div>
          </div>
          <div className="flex justify-between font-mono text-[11px] text-muted" aria-hidden="true">
            {labelIndexes.map((index, i) => (
              <span key={i}>{shortDate(dates[index])}</span>
            ))}
          </div>
        </div>
      </figure>
      <p className="text-xs text-muted">Each placement is dated by when the student accepted the offer.</p>
    </div>
  );
}
