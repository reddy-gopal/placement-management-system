import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import useStudentProfile from '../../hooks/useStudentProfile';
import useCurrentUser from '../../hooks/useCurrentUser';
import ProfileHeader from '../../components/student/ProfileHeader';
import AccountSection from '../../components/student/AccountSection';
import AcademicInfoSection from '../../components/student/AcademicInfoSection';
import ProfileSection from '../../components/student/ProfileSection';
import SkillsTagInput from '../../components/student/SkillsTagInput';
import ResumeSection from '../../components/student/ResumeSection';
import PlacementSection from '../../components/student/PlacementSection';
import ResumePreviewModal from '../../components/student/ResumePreviewModal';
import ProfileDashboardSkeleton from '../../components/student/ProfileDashboardSkeleton';
import { useDashboardIdentity } from '../../components/layout/dashboardIdentity';
import Alert from '../../components/ui/Alert';
import { buttonClassName } from '../../components/ui/buttonStyles';
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

export default function Profile() {
  const { profile, status, loadError, reload, save } = useStudentProfile();
  const user = useCurrentUser();

  const [form, setForm] = useState(() => profileToForm(null));
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // { type: 'success' | 'error', message }
  const [previewOpen, setPreviewOpen] = useState(false);
  const rollNumberRef = useRef(null);

  useDashboardIdentity(profile || user ? { ...profile, name: user?.name } : null);

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

  const discardChanges = () => {
    setForm(profileToForm(profile));
    setErrors({});
    setSubmitAttempted(false);
    setSaveResult(null);
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

  const jumpToField = (fieldId) => focusField(document.getElementById(fieldId));

  if (status === 'loading') return <ProfileDashboardSkeleton />;

  if (status === 'error') {
    return (
      <section className="mx-auto mt-8 flex max-w-md flex-col items-center gap-2 rounded-lg border border-line px-6 py-10 text-center">
        <span className="badge badge-danger">Error</span>
        <div role="alert">
          <h1 className="mt-2 text-lg font-semibold text-ink">We couldn't load your profile.</h1>
          <p className="mt-1 text-sm text-muted">{loadError}</p>
        </div>
        <button type="button" onClick={reload} className={`${buttonClassName.primary} mt-4`}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ProfileHeader profile={profile} user={user} completeness={completeness} onJumpToField={jumpToField} />

      {!profile && <Alert variant="info">Fill in your details below and save to create your profile.</Alert>}

      <form noValidate onSubmit={handleSubmit} aria-label="Edit student profile" className="flex flex-col">
        <AccountSection user={user} />

        <AcademicInfoSection form={form} errors={errors} onFieldChange={updateField} rollNumberRef={rollNumberRef} />

        <ProfileSection title="Skills" description="Recruiters see these on your application. Add at least 3.">
          <SkillsTagInput
            value={form.skills}
            onChange={(skills) => updateField('skills', skills)}
            error={errors.skills}
          />
        </ProfileSection>

        <ResumeSection
          value={form.resumeUrl}
          error={errors.resumeUrl}
          onChange={(value) => updateField('resumeUrl', value)}
          onPreview={() => setPreviewOpen(true)}
        />

        <PlacementSection profile={profile} />

        {/* Action bar: sticky from md up so it stays reachable; inline on phones (where the tab bar sits). */}
        <div className="z-10 flex md:sticky md:bottom-0 flex-col gap-3 border-t border-ink bg-white py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 min-w-0 sm:flex-1">
            <div aria-live="polite">{saveResult && <Alert variant={saveResult.type}>{saveResult.message}</Alert>}</div>
            {!saveResult && (
              <p className="flex items-center gap-2 text-[13px] text-muted">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-sm ${isDirty ? 'bg-lime shadow-[0_0_0_1px_#111]' : 'bg-line-strong'}`}
                />
                {isDirty ? 'You have unsaved changes' : profile ? 'All changes saved' : 'Not saved yet'}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={discardChanges} disabled={!isDirty || saving} className={buttonClassName.secondary}>
              Discard changes
            </button>
            <button type="submit" disabled={saving} aria-busy={saving} className={buttonClassName.primary}>
              {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>

      <ResumePreviewModal open={previewOpen} url={form.resumeUrl} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
