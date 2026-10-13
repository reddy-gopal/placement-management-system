import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
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

function validate(mode, form, verificationCode) {
  const errors = {};
  if (mode === 'verify') {
    if (!verificationCode || !verificationCode.trim()) {
      errors.code = 'Enter the 6-digit verification code.';
    } else if (verificationCode.trim().length !== 6) {
      errors.code = 'Verification code must be 6 digits.';
    }
    return errors;
  }
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

/** "Sign in" / "Create account" / "Verify email" screen. */
export default function AuthPage({ mode: initialMode = 'login' }) {
  const { user, login, signup, verifyEmail, resendCode, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [verificationCode, setVerificationCode] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  if (user && !submitting) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;

  const isLogin = mode === 'login';
  const isVerify = mode === 'verify';
  const from = location.state?.from?.pathname;

  const switchMode = (next) => {
    setMode(next);
    setErrors({});
    setSubmitError('');
    setSubmitSuccess('');
    navigate(next === 'login' ? '/login' : next === 'signup' ? '/signup' : '/verify', {
      replace: true,
      state: location.state,
    });
  };

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
    setSubmitError('');
  };

  const handleResend = async () => {
    const emailToUse = targetEmail || form.email.trim();
    if (!emailToUse) {
      setSubmitError('Email address is missing. Please restart registration.');
      return;
    }
    setResending(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await resendCode(emailToUse);
      setSubmitSuccess('A new 6-digit verification code has been sent to your email.');
    } catch (err) {
      setSubmitError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validate(mode, form, verificationCode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstField = Object.keys(nextErrors)[0];
      document.getElementById(`auth-${firstField}`)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      if (mode === 'verify') {
        const emailToVerify = targetEmail || form.email.trim();
        const signedIn = await verifyEmail({ email: emailToVerify, code: verificationCode.trim() });
        const home = ROLE_HOME[signedIn.role] ?? '/';
        const target = FIRST_STEP[signedIn.role] ?? home;
        navigate(target, { replace: true });
        return;
      }

      if (isLogin) {
        const signedIn = await login({ email: form.email.trim(), password: form.password });
        const home = ROLE_HOME[signedIn.role] ?? '/';
        const target = from?.startsWith(home) ? from : home;
        navigate(target, { replace: true });
      } else {
        // Signup
        const result = await signup({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });

        if (result?.needsVerification) {
          setTargetEmail(form.email.trim());
          setMode('verify');
          setSubmitSuccess(result.message || 'Verification code sent to your email. Please verify to continue.');
          setSubmitting(false);
          return;
        }

        // If returned already signed in (fallback)
        const home = ROLE_HOME[result.role] ?? '/';
        navigate(FIRST_STEP[result.role] ?? home, { replace: true });
      }
    } catch (err) {
      if (err.needsVerification) {
        // User attempted login with unverified email
        setTargetEmail(err.email || form.email.trim());
        setMode('verify');
        setSubmitSuccess(err.message);
      } else {
        setSubmitError(err.message);
      }
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
  const displayEmail = targetEmail || form.email.trim() || 'your email';

  return (
    <div className="flex min-h-screen bg-white text-ink">
      <div className="flex flex-[1_1_560px] flex-col px-5 py-10 sm:px-16">
        <BrandMark />

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="flex w-full max-w-100 flex-col gap-7">
            {!isVerify ? (
              <div className="segmented border border-line" role="tablist" aria-label="Account">
                <button type="button" role="tab" aria-selected={isLogin} onClick={() => switchMode('login')}>
                  Sign in
                </button>
                <button type="button" role="tab" aria-selected={!isLogin} onClick={() => switchMode('signup')}>
                  Create account
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink w-fit transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign in
              </button>
            )}

            <div className="flex flex-col gap-1.5">
              <h1 className="text-[32px] font-semibold tracking-[-0.03em]">
                {isVerify ? 'Verify your email' : isLogin ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-muted">
                {isVerify
                  ? `Enter the 6-digit verification code sent to ${displayEmail}.`
                  : isLogin
                  ? 'Sign in with your university or company email.'
                  : 'Choose how you’ll use NexStep.'}
              </p>
            </div>

            {sessionExpired && isLogin && !submitError && (
              <Alert variant="info">Your session has ended. Sign in again to continue.</Alert>
            )}

            {submitSuccess && <Alert variant="info">{submitSuccess}</Alert>}

            {isVerify ? (
              <form noValidate onSubmit={handleSubmit} aria-label="Verify email" className="flex flex-col gap-4.5">
                <div className="rounded-lg border border-line bg-subtle p-3.5 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted shrink-0 mt-0.5" />
                  <div className="text-xs text-muted leading-relaxed">
                    Check your inbox (or spam) for the code. Using Resend in development? Check your backend terminal for the code log if using the free test sandbox.
                  </div>
                </div>

                <Field id="auth-code" label="Verification Code" error={errors.code}>
                  <input
                    id="auth-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (errors.code) setErrors(({ code: _c, ...rest }) => rest);
                      setSubmitError('');
                    }}
                    placeholder="123456"
                    className={`${inputClassName(Boolean(errors.code))} text-center tracking-[0.3em] font-mono text-xl py-3`}
                  />
                </Field>

                <div aria-live="polite">{submitError && <Alert variant="error">{submitError}</Alert>}</div>

                <button type="submit" className="btn w-full" disabled={submitting} aria-busy={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                  Verify & Continue
                </button>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted">Didn't receive the email?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                    Resend code
                  </button>
                </div>
              </form>
            ) : (
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
                    : 'We’ll email you a 6-digit verification code via Resend to activate your account.'}
                </p>
              </form>
            )}
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
