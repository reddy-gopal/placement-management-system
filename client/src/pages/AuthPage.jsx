import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BrandMark from '../components/layout/BrandMark';
import Alert from '../components/ui/Alert';
import { describedBy, fieldErrorId, inputClassName } from '../components/ui/FormField';
import { ROLE_HOME, useAuth } from '../context/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where a brand-new account goes first. */
const FIRST_STEP = { STUDENT: '/student/profile', RECRUITER: '/recruiter/company' };

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Student', note: 'Find & apply to drives' },
  { value: 'RECRUITER', label: 'Recruiter', note: 'Hire from campus' },
];

function validate(mode, form) {
  const errors = {};
  if (mode === 'signup' && !form.name.trim()) errors.name = 'Enter your full name.';
  if (!form.email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email, e.g. you@university.edu';
  if (!form.password) errors.password = 'Enter your password.';
  else if (mode === 'signup' && form.password.length < 4) errors.password = 'Use at least 4 characters.';
  return errors;
}

function Field({ id, label, error, aside, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error && (
        <p id={fieldErrorId(id)} className="field-hint font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** "Sign in" / "Create account" screen. `mode` comes from the route (/login or /signup). */
export default function AuthPage({ mode: initialMode = 'login' }) {
  const { user, login, signup, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user && !submitting) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;

  const isLogin = mode === 'login';
  const from = location.state?.from?.pathname;

  const switchMode = (next) => {
    setMode(next);
    setErrors({});
    setSubmitError('');
    navigate(next === 'login' ? '/login' : '/signup', { replace: true, state: location.state });
  };

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validate(mode, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(`auth-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const signedIn = isLogin
        ? await login({ email: form.email.trim(), password: form.password })
        : await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role });
      const home = ROLE_HOME[signedIn.role] ?? '/';
      // New accounts start by filling in their profile; returning users go back where they were
      // (only if that page belongs to their portal) or to their dashboard.
      let target = home;
      if (!isLogin) target = FIRST_STEP[signedIn.role] ?? home;
      else if (from?.startsWith(home)) target = from;
      navigate(target, { replace: true });
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  const bind = (field, extra = {}) => ({
    id: `auth-${field}`,
    value: form[field],
    onChange: update(field),
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': describedBy(`auth-${field}`, { error: errors[field] }),
    className: inputClassName(Boolean(errors[field])),
    ...extra,
  });

  const roleWord = form.role === 'STUDENT' ? 'student' : 'recruiter';

  return (
    <div className="flex min-h-screen bg-white text-ink">
      <div className="flex flex-[1_1_560px] flex-col px-5 py-10 sm:px-16">
        <BrandMark />

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="flex w-full max-w-100 flex-col gap-7">
            <div className="segmented border border-line" role="tablist" aria-label="Account">
              <button type="button" role="tab" aria-selected={isLogin} onClick={() => switchMode('login')}>
                Sign in
              </button>
              <button type="button" role="tab" aria-selected={!isLogin} onClick={() => switchMode('signup')}>
                Create account
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <h1 className="text-[32px] font-semibold tracking-[-0.03em]">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
              <p className="text-sm text-muted">
                {isLogin ? 'Sign in with your university or company email.' : 'Choose how you’ll use NexStep.'}
              </p>
            </div>

            {sessionExpired && isLogin && !submitError && (
              <Alert variant="info">Your session has ended. Sign in again to continue.</Alert>
            )}

            <form noValidate onSubmit={handleSubmit} aria-label={isLogin ? 'Sign in' : 'Create account'} className="flex flex-col gap-4.5">
              {!isLogin && (
                <fieldset>
                  <legend className="field-label">I am a</legend>
                  <div className="flex gap-2.5">
                    {ROLE_OPTIONS.map((option) => (
                      <label key={option.value} className="choice flex-col gap-1">
                        <input
                          type="radio"
                          name="role"
                          value={option.value}
                          checked={form.role === option.value}
                          onChange={update('role')}
                          className="sr-only"
                        />
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span className="text-xs text-muted">{option.note}</span>
                      </label>
                    ))}
                  </div>
                  <p className="field-hint">Placement Officer accounts are provisioned by the university.</p>
                </fieldset>
              )}

              {!isLogin && (
                <Field id="auth-name" label="Full name" error={errors.name}>
                  <input {...bind('name', { autoComplete: 'name', placeholder: 'Ananya Iyer' })} />
                </Field>
              )}

              <Field id="auth-email" label="Email" error={errors.email}>
                <input {...bind('email', { type: 'email', autoComplete: 'email', placeholder: 'you@university.edu' })} />
              </Field>

              <Field id="auth-password" label="Password" error={errors.password}>
                <input
                  {...bind('password', {
                    type: 'password',
                    autoComplete: isLogin ? 'current-password' : 'new-password',
                    placeholder: isLogin ? '••••••••' : 'At least 4 characters',
                  })}
                />
              </Field>

              <div aria-live="polite">{submitError && <Alert variant="error">{submitError}</Alert>}</div>

              <button type="submit" className="btn w-full" disabled={submitting} aria-busy={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {isLogin ? 'Sign in' : `Create ${roleWord} account`}
              </button>

              <p className="text-[13px] leading-normal text-muted">
                {isLogin
                  ? 'You’ll land on the dashboard for your role — Student, Recruiter or Placement Officer.'
                  : form.role === 'STUDENT'
                    ? 'Next, you’ll complete your academic profile so we can check your eligibility for drives.'
                    : 'Next, you’ll set up your company profile before posting drives.'}
              </p>
            </form>
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted">
          <span>© 2026 NexStep · University Placement Cell</span>
          <span className="font-mono">v1.0</span>
        </div>
      </div>

      <aside className="hidden flex-[1_1_560px] flex-col justify-between border-l border-line bg-subtle p-16 lg:flex">
        <span className="eyebrow">Placement season 2026–27</span>
        <div className="flex flex-col gap-8">
          <p className="max-w-130 text-[44px] font-semibold leading-[1.08] tracking-[-0.035em]">
            Every drive, every application, every <span className="highlight">next step</span> — in one place.
          </p>
          <div className="grid grid-cols-3 border-t border-ink">
            {[
              ['Students', 'Check eligibility before you apply.'],
              ['Recruiters', 'Shortlist and schedule in one table.'],
              ['Placement cell', 'See outcomes across branches.'],
            ].map(([title, body], index) => (
              <div key={title} className={`pt-4 ${index ? 'border-l border-line pl-4' : ''} ${index < 2 ? 'pr-4' : ''}`}>
                <p className="text-[13px] font-semibold">{title}</p>
                <p className="mt-1 text-[13px] leading-normal text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
