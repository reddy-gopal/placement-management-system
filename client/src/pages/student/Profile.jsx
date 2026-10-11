import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, Loader2, Pencil, RotateCw, Save, Sparkles } from 'lucide-react';
import useStudentProfile from '../../hooks/useStudentProfile';
import AcademicInfoSection from '../../components/student/AcademicInfoSection';
import SkillsTagInput from '../../components/student/SkillsTagInput';
import ResumeSection from '../../components/student/ResumeSection';
import ResumePreviewModal from '../../components/student/ResumePreviewModal';
import StudentProfileSummary from '../../components/student/StudentProfileSummary';
import SectionHeading from '../../components/student/SectionHeading';
import ReadinessHero from '../../components/student/ReadinessHero';
import ProfileStats from '../../components/student/ProfileStats';
import ProfileChecklist from '../../components/student/ProfileChecklist';
import EligibilitySnapshot from '../../components/student/EligibilitySnapshot';
import ProfileDashboardSkeleton from '../../components/student/ProfileDashboardSkeleton';
import { useDashboardIdentity } from '../../components/layout/dashboardIdentity';
import Alert from '../../components/ui/Alert';
import { buttonClassName } from '../../components/ui/buttonStyles';
import { cardClassName } from '../../components/ui/cardStyles';
import { profileToForm, toProfilePayload, validateProfileForm } from '../../utils/studentProfileForm';
import { getProfileCompleteness } from '../../utils/profileInsights';

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Bring a form control into view and focus it. */
function focusField(element) {
  if (!element) return;
  element.scrollIntoView?.({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  element.focus({ preventScroll: true });
}

/** Comparable snapshot of form values, used to detect unsaved edits. */
const formSignature = (form) =>
  JSON.stringify([
    String(form.rollNumber).trim(),
    form.branch,
    String(form.graduationYear),
    String(form.cgpa),
    String(form.activeBacklogs),
    form.skills,
    String(form.resumeUrl).trim(),
  ]);

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

function PageHeader({ profile, onEdit }) {
  const updated = formatDate(profile?.updatedAt);
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Keep your academic details, skills and resume up to date for placement drives.
          {updated && <span className="text-slate-500 dark:text-slate-500"> Last updated {updated}.</span>}
        </p>
      </div>
      {onEdit && profile && (
        <div className="flex flex-wrap gap-2">
          {profile?.resumeUrl && (
            <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className={buttonClassName.secondary}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View resume
            </a>
          )}
          <button type="button" onClick={onEdit} className={buttonClassName.primary}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Update details
          </button>
        </div>
      )}
    </header>
  );
}

export default function Profile() {
  const { profile, status, loadError, reload, save } = useStudentProfile();

  const [form, setForm] = useState(() => profileToForm(null));
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // { type: 'success' | 'error', message }
  const [previewOpen, setPreviewOpen] = useState(false);
  const rollNumberRef = useRef(null);

  useDashboardIdentity(profile);

  // Populate the form once the saved profile arrives (or reset to empty if none).
  useEffect(() => {
    if (status === 'ready') setForm(profileToForm(profile));
    // Depends on `status` only: re-sync when a (re)load finishes, not after every save.
  }, [status]);

  const completeness = useMemo(() => getProfileCompleteness(profile), [profile]);
  const isDirty = status === 'ready' && formSignature(form) !== formSignature(profileToForm(profile));

  const updateField = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    setSaveResult(null);
    // After the first submit, re-validate live so errors clear as they're fixed.
    if (submitAttempted) setErrors(validateProfileForm(next));
    else if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSubmitAttempted(true);
    const validationErrors = validateProfileForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setSaveResult({ type: 'error', message: 'Please fix the highlighted fields.' });
      document.getElementById(Object.keys(validationErrors)[0])?.focus();
      return;
    }

    setSaving(true);
    setSaveResult(null);
    try {
      const result = await save(toProfilePayload(form));
      setForm(profileToForm(result.profile));
      setSaveResult({ type: 'success', message: result.message || 'Profile updated successfully' });
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setSaveResult({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const focusForm = () => focusField(rollNumberRef.current);
  const jumpToField = (fieldId) => focusField(document.getElementById(fieldId));

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader profile={null} />
        <ProfileDashboardSkeleton />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader profile={null} />
        <section className={`${cardClassName} mx-auto max-w-xl p-6 text-center sm:p-10`}>
          <span
            aria-hidden="true"
            className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20"
          >
            <AlertCircle className="h-6 w-6" />
          </span>
          <div role="alert">
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">We couldn't load your profile.</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{loadError}</p>
          </div>
          <button type="button" onClick={reload} className={`${buttonClassName.primary} mt-6`}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader profile={profile} onEdit={focusForm} />

      <div className="animate-rise">
        <ReadinessHero
          completeness={completeness}
          hasProfile={Boolean(profile)}
          onStart={focusForm}
          onJumpToField={jumpToField}
        />
      </div>

      <ProfileStats profile={profile} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
        <form
          noValidate
          onSubmit={handleSubmit}
          aria-label="Edit student profile"
          className={`${cardClassName} animate-rise xl:col-span-2`}
          style={{ '--delay': '300ms' }}
        >
          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:px-7 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile details</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Fields marked <span className="text-rose-600 dark:text-rose-400">*</span> are required.
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {!profile && (
              <div className="px-5 pt-6 sm:px-7">
                <Alert variant="info">Fill in your details below and save to create your profile.</Alert>
              </div>
            )}

            <div className="px-5 py-6 sm:px-7 sm:py-7">
              <AcademicInfoSection
                form={form}
                errors={errors}
                onFieldChange={updateField}
                rollNumberRef={rollNumberRef}
              />
            </div>

            <div className="px-5 py-6 sm:px-7 sm:py-7">
              <SectionHeading
                icon={Sparkles}
                title="Skills"
                description="Languages, frameworks and tools — recruiters search by these."
              />
              <div className="mt-6">
                <SkillsTagInput
                  value={form.skills}
                  onChange={(skills) => updateField('skills', skills)}
                  error={errors.skills}
                />
              </div>
            </div>

            <div className="px-5 py-6 sm:px-7 sm:py-7">
              <ResumeSection
                value={form.resumeUrl}
                error={errors.resumeUrl}
                onChange={(value) => updateField('resumeUrl', value)}
                onPreview={() => setPreviewOpen(true)}
              />
            </div>
          </div>

          {/* Sticky save bar: pinned to the viewport bottom while the form is on screen. */}
          <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-b-2xl border-t border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-slate-800 dark:bg-slate-900/90">
            <div className="min-h-5 min-w-0 sm:flex-1">
              <div aria-live="polite">{saveResult && <Alert variant={saveResult.type}>{saveResult.message}</Alert>}</div>
              {!saveResult && (
                <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${isDirty ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  />
                  {isDirty ? 'You have unsaved changes' : profile ? 'All changes saved' : 'Not saved yet'}
                </p>
              )}
            </div>
            <button type="submit" disabled={saving} aria-busy={saving} className={`${buttonClassName.primary} min-h-11 sm:w-auto`}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <div className="animate-rise md:row-span-2 xl:row-span-1" style={{ '--delay': '340ms' }}>
            <StudentProfileSummary profile={profile} onEdit={focusForm} />
          </div>
          <div className="animate-rise" style={{ '--delay': '380ms' }}>
            <ProfileChecklist completeness={completeness} onJumpToField={jumpToField} />
          </div>
          <div className="animate-rise" style={{ '--delay': '420ms' }}>
            <EligibilitySnapshot profile={profile} />
          </div>
        </div>
      </div>

      <ResumePreviewModal open={previewOpen} url={form.resumeUrl} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
