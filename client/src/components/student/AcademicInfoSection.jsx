import { CalendarDays, ClipboardList, GraduationCap, Hash, Layers, School } from 'lucide-react';
import FormField, { describedBy, inputClassName } from '../ui/FormField';
import SectionHeading from './SectionHeading';
import { BRANCHES, GRADUATION_YEAR_MAX, GRADUATION_YEAR_MIN } from '../../constants/studentProfile';

/** Roll number, branch, graduation year, CGPA and active backlogs. */
export default function AcademicInfoSection({ form, errors, onFieldChange, rollNumberRef }) {
  const bind = (field) => ({
    id: field,
    name: field,
    value: form[field],
    onChange: (event) => onFieldChange(field, event.target.value),
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': describedBy(field, { error: errors[field] }),
    'aria-required': true,
    className: inputClassName(Boolean(errors[field]), { withIcon: true }),
  });

  return (
    <fieldset>
      <SectionHeading
        as="legend"
        icon={School}
        title="Academic Information"
        description="These details decide which placement drives you are eligible for."
      />

      <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        <FormField id="rollNumber" label="Roll Number" required error={errors.rollNumber} icon={Hash}>
          <input
            {...bind('rollNumber')}
            ref={rollNumberRef}
            type="text"
            maxLength={30}
            placeholder="21CSE101"
            autoComplete="off"
          />
        </FormField>

        <FormField id="branch" label="Branch" required error={errors.branch} icon={Layers}>
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

        <FormField id="graduationYear" label="Graduation Year" required error={errors.graduationYear} icon={CalendarDays}>
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

        <FormField id="cgpa" label="CGPA" required error={errors.cgpa} icon={GraduationCap}>
          <input {...bind('cgpa')} type="number" inputMode="decimal" min={0} max={10} step={0.01} placeholder="8.4" />
        </FormField>

        <FormField id="activeBacklogs" label="Active Backlogs" required error={errors.activeBacklogs} icon={ClipboardList}>
          <input {...bind('activeBacklogs')} type="number" inputMode="numeric" min={0} step={1} placeholder="0" />
        </FormField>
      </div>
    </fieldset>
  );
}
