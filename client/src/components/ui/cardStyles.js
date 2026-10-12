/** Shared surface: flat white panel with a 1px hairline border, no shadow. */
export const cardClassName = 'rounded-lg border border-line bg-white';

/** Mono uppercase label used above metrics and in card headers. */
export const eyebrowClassName = 'eyebrow';

/** Status badge tones — colour carries meaning only (success / warning / danger / neutral / accent). */
const BADGE_TONES = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  neutral: '',
  accent: 'badge-open',
};

export const chip = (tone) => `badge ${BADGE_TONES[tone] ?? ''}`.trim();
