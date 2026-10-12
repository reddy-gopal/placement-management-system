import FormField, { describedBy, inputClassName } from '../ui/FormField';
import { buttonClassName } from '../ui/buttonStyles';
import ProfileSection from './ProfileSection';
import { isHttpUrl } from '../../utils/studentProfileForm';

export default function ResumeSection({ value, error, onChange, onPreview }) {
  const trimmed = value.trim();
  const isInsecure = trimmed.toLowerCase().startsWith('http://');
  const hint = isInsecure
    ? 'HTTPS links are recommended — browsers may block previews of http:// links.'
    : 'Recruiters open this link when they review your application.';

  return (
    <ProfileSection
      title="Resume"
      description="A public link (Drive, Dropbox, personal site) to your resume PDF."
    >
      <FormField id="resumeUrl" label="Resume URL" hint={hint} error={error} className="max-w-140">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="resumeUrl"
            name="resumeUrl"
            type="url"
            inputMode="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://drive.example.com/resume.pdf"
            autoComplete="url"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy('resumeUrl', { error, hint })}
            className={`${inputClassName(Boolean(error))} min-w-0 sm:flex-1`}
          />
          <div className="flex gap-2">
            <button type="button" onClick={onPreview} className={buttonClassName.secondary}>
              Preview
            </button>
            {isHttpUrl(trimmed) && (
              <a href={trimmed} target="_blank" rel="noopener noreferrer" className={buttonClassName.secondary}>
                Open ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </FormField>
    </ProfileSection>
  );
}
