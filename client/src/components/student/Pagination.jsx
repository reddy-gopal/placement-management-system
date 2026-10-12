/** Page numbers to show: all when few, otherwise a window around the current page. */
function pageWindow(page, pageCount, size = 5) {
  const start = Math.max(1, Math.min(page - Math.floor(size / 2), pageCount - size + 1));
  return Array.from({ length: Math.min(size, pageCount) }, (_, i) => start + i);
}

/** "Page 1 of 3" with previous / numbered / next buttons. Hidden when there's a single page. */
export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-3 text-[13px] text-muted">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          className="page-btn"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ‹
        </button>
        {pageWindow(page, pageCount).map((n) => (
          <button
            key={n}
            type="button"
            className="page-btn"
            aria-current={n === page ? 'page' : undefined}
            aria-label={`Page ${n}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          ›
        </button>
      </div>
    </nav>
  );
}
