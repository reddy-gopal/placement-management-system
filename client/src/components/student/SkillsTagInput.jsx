import { useState } from 'react';
import { X } from 'lucide-react';
import { describedBy, fieldErrorId, fieldHintId, inputClassName } from '../ui/FormField';
import { MAX_SKILL_LENGTH, MAX_SKILLS, RECOMMENDED_MIN_SKILLS } from '../../constants/studentProfile';

/**
 * Tag input for a list of strings. Enter (or the Add button) adds the typed
 * value; values are trimmed, empty ones ignored and duplicates (case-insensitive)
 * rejected. Backspace on an empty input removes the last tag.
 */
export default function SkillsTagInput({
  id = 'skills',
  label = 'Skills',
  value,
  onChange,
  error,
  placeholder = 'Add a skill, e.g. MongoDB',
  maxTags = MAX_SKILLS,
  maxLength = MAX_SKILL_LENGTH,
  recommendedMin = RECOMMENDED_MIN_SKILLS,
}) {
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const shownError = error || notice;
  const missing = Math.max(recommendedMin - value.length, 0);
  const hint = missing
    ? `${missing} more skill${missing === 1 ? '' : 's'} needed to reach the recommended minimum.`
    : `Press Enter to add. ${value.length}/${maxTags} skills.`;

  const addSkill = () => {
    const skill = draft.trim();
    if (!skill) return;
    if (value.some((existing) => existing.toLowerCase() === skill.toLowerCase())) {
      setNotice(`"${skill}" has already been added.`);
      return;
    }
    if (value.length >= maxTags) {
      setNotice(`You can add at most ${maxTags} skills.`);
      return;
    }
    onChange([...value, skill]);
    setDraft('');
    setNotice('');
  };

  const removeSkill = (skillToRemove) => {
    onChange(value.filter((skill) => skill !== skillToRemove));
    setNotice('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // don't submit the surrounding form
      addSkill();
    } else if (event.key === 'Backspace' && !draft && value.length) {
      removeSkill(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={`${label} added`}>
          {value.map((skill) => (
            <li key={skill} className="tag">
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
                className="grid h-5 w-5 place-items-center rounded text-muted hover:bg-subtle hover:text-ink"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <div className="flex max-w-105 gap-2">
          <input
            id={id}
            type="text"
            value={draft}
            maxLength={maxLength}
            placeholder={placeholder}
            autoComplete="off"
            onChange={(event) => {
              setDraft(event.target.value);
              if (notice) setNotice('');
            }}
            onKeyDown={handleKeyDown}
            aria-invalid={Boolean(shownError)}
            aria-describedby={describedBy(id, { error: shownError, hint })}
            className={inputClassName(Boolean(shownError))}
          />
          <button
            type="button"
            onClick={addSkill}
            disabled={!draft.trim()}
            aria-label="Add skill"
            className="btn btn-secondary shrink-0"
          >
            Add
          </button>
        </div>

        {shownError ? (
          <p id={fieldErrorId(id)} role="alert" className="field-hint font-medium text-danger">
            {shownError}
          </p>
        ) : (
          <p id={fieldHintId(id)} className={`field-hint ${missing ? 'text-warning' : ''}`}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
