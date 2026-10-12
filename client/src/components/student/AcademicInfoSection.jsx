import FormField, { describedBy, inputClassName } from '../ui/FormField';
import ProfileSection from './ProfileSection';
import { BRANCHES, GRADUATION_YEAR_MAX, GRADUATION_YEAR_MIN } from '../../constants/studentProfile';

/** Roll number, branch, graduation year, CGPA and active backlogs. */
export default function AcademicInfoSection({ form, errors, onFieldChange, rollNumberRef }) {
  const bind = (field, { hint, mono } = {}) => ({
    id: field,
    name: field,
    value: form[field],
    onChange: (event) => onFieldChange(field, event.target.value),
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': describedBy(field, { error: errors[field], hint }),
    'aria-required': true,
    className: inputClassName(Boolean(errors[field]), { mono }),
  });

  return (
    <ProfileSection title="Academic record" description="Used to check eligibility for every drive. Keep it accurate.">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField id="rollNumber" label="Roll number" required error={errors.rollNumber}>
          <input
            {...bind('rollNumber', { mono: true })}
            ref={rollNumberRef}
            type="text"
            maxLength={30}
            placeholder="21CS1042"
            autoComplete="off"
          />
        </FormField>

        <FormField id="branch" label="Branch" required error={errors.branch}>
          <select {...bind('branch')}>
            <option value="" disabled>
              Select branch
            </option>
            {BRANCHES.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="graduationYear" label="Graduation year" required error={errors.graduationYear}>
          <input
            {...bind('graduationYear')}
            type="number"
            inputMode="numeric"
            min={GRADUATION_YEAR_MIN}
            max={GRADUATION_YEAR_MAX}
            step={1}
            placeholder="2027"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="cgpa" label="CGPA" required hint="0.00 – 10.00" error={errors.cgpa}>
            <input
              {...bind('cgpa', { hint: '0.00 – 10.00' })}
              type="number"
              inputMode="decimal"
              min={0}
              max={10}
              step={0.01}
              placeholder="8.42"
            />
          </FormField>

          <FormField id="activeBacklogs" label="Active backlogs" error={errors.activeBacklogs}>
            <input {...bind('activeBacklogs')} type="number" inputMode="numeric" min={0} step={1} placeholder="0" />
          </FormField>
        </div>
      </div>
    </ProfileSection>
  );
}
