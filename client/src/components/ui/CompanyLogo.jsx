import { useState } from 'react';
import { monogram } from '../../utils/format';

/** Company logo tile: the logo image when it loads, otherwise a two-letter monogram. */
export default function CompanyLogo({ name, logoUrl, size = 36, className = '' }) {
  const [failed, setFailed] = useState(false);
  const showImage = logoUrl && !failed;
  return (
    <span
      aria-hidden="true"
      className={`logo-tile ${className}`}
      style={{ width: size, height: size, borderRadius: size >= 40 ? 8 : 6, fontSize: size >= 44 ? 14 : 13 }}
    >
      {showImage ? <img src={logoUrl} alt="" onError={() => setFailed(true)} /> : monogram(name)}
    </span>
  );
}
