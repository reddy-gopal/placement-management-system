/** NexStep logo: black tile with a lime "next step" stair mark. */
export default function BrandMark({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
        <rect width="24" height="24" rx="6" fill="#111" />
        <path d="M6 17h4v-4h4V9h4" fill="none" stroke="#C6FF00" strokeWidth="2.2" strokeLinecap="square" />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">NexStep</span>
    </span>
  );
}
