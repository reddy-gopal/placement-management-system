import { Eye, FileText, Link2 } from 'lucide-react';
import FormField, { describedBy, inputClassName } from '../ui/FormField';
import { buttonClassName } from '../ui/buttonStyles';
import SectionHeading from './SectionHeading';

export default function ResumeSection({ value, error, onChange, onPreview }) {
  const isInsecure = value.trim().toLowerCase().startsWith('http://');
  const hint = isInsecure
    ? 'HTTPS links are recommended — browsers may block previews of http:// links.'
    : 'Paste a public link to your resume PDF (Google Drive, Dropbox, etc.).';

  return (
    <fieldset>
      <SectionHeading
        as="legend"
        icon={FileText}
        title="Resume"
        description="Recruiters open this link when they review your application."
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
        <FormField id="resumeUrl" label="Resume PDF URL" hint={hint} error={error} icon={Link2} className="min-w-0 flex-1">
          <input
            id="resumeUrl"
            name="resumeUrl"
            type="url"
            inputMode="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://example.com/resume.pdf"
            autoComplete="url"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy('resumeUrl', { error, hint })}
            className={inputClassName(Boolean(error), { withIcon: true })}
          />
        </FormField>
        <button type="button" onClick={onPreview} className={`${buttonClassName.secondary} min-h-11 sm:mt-7`}>
          <Eye className="h-4 w-4" aria-hidden="true" />
          Preview Resume
        </button>
      </div>
    </fieldset>
  );
}
