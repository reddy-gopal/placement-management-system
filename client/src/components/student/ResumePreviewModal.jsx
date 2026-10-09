import { useEffect, useState } from 'react';
import { ExternalLink, FileWarning, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { buttonClassName } from '../ui/buttonStyles';
import { isHttpUrl, toEmbeddableResumeUrl } from '../../utils/studentProfileForm';

const LOAD_TIMEOUT_MS = 15000;
export const PREVIEW_ERROR_MESSAGE = 'Unable to preview this resume. Please check the URL.';

function PreviewMessage({ title, children }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <FileWarning className="h-10 w-10 text-slate-400" aria-hidden="true" />
      <p className="font-medium text-slate-800 dark:text-slate-100">{title}</p>
      {children && <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{children}</p>}
    </div>
  );
}

export default function ResumePreviewModal({ open, url, onClose }) {
  const trimmedUrl = (url || '').trim();
  const isValid = isHttpUrl(trimmedUrl);
  const [loadState, setLoadState] = useState('loading'); // loading | loaded | failed

  useEffect(() => {
    if (!open || !isValid) return undefined;
    setLoadState('loading');
    // Cross-origin iframes don't reliably report failures, so time out instead of spinning forever.
    const timer = setTimeout(() => {
      setLoadState((state) => (state === 'loading' ? 'failed' : state));
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [open, isValid, trimmedUrl]);

  let body;
  if (!trimmedUrl) {
    body = (
      <PreviewMessage title="No resume URL added yet.">
        Enter a link to your resume PDF in the Resume field, then preview it here.
      </PreviewMessage>
    );
  } else if (!isValid) {
    body = <PreviewMessage title={PREVIEW_ERROR_MESSAGE}>Links must start with https:// (or http://).</PreviewMessage>;
  } else {
    body = (
      <div className="relative h-full">
        {loadState !== 'loaded' && (
          <div className="absolute inset-0 bg-white dark:bg-slate-900">
            {loadState === 'loading' ? (
              <div role="status" className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Loading preview…
              </div>
            ) : (
              <PreviewMessage title={PREVIEW_ERROR_MESSAGE}>
                The file may be private, missing, or its host may block embedding. Try opening it in a new tab.
              </PreviewMessage>
            )}
          </div>
        )}
        <iframe
          key={trimmedUrl}
          src={toEmbeddableResumeUrl(trimmedUrl)}
          title="Resume preview"
          referrerPolicy="no-referrer"
          className="h-full w-full border-0"
          onLoad={() => setLoadState('loaded')}
          onError={() => setLoadState('failed')}
        />
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Resume Preview"
      className="h-[90vh] max-w-4xl"
      footer={
        <>
          {isValid && (
            <>
              <p className="mr-auto hidden text-xs text-slate-500 md:block dark:text-slate-400">
                Preview blank? Some hosts block embedding — open it in a new tab instead.
              </p>
              <a href={trimmedUrl} target="_blank" rel="noopener noreferrer" className={buttonClassName.secondary}>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open Resume
              </a>
            </>
          )}
          <button type="button" onClick={onClose} className={buttonClassName.primary}>
            Close
          </button>
        </>
      }
    >
      {body}
    </Modal>
  );
}
