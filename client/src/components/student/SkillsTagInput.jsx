import { useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import { InputIcon, describedBy, fieldErrorId, fieldHintId, inputClassName } from '../ui/FormField';
import { MAX_SKILL_LENGTH, MAX_SKILLS } from '../../constants/studentProfile';

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
  placeholder = 'Enter a skill and press Enter…',
  maxTags = MAX_SKILLS,
  maxLength = MAX_SKILL_LENGTH,
}) {
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const shownError = error || notice;
  const hint = `Press Enter to add. ${value.length}/${maxTags} skills.`;

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
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>

      {value.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2" aria-label={`${label} added`}>
          {value.map((skill) => (
            <li
              key={skill}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 py-1 pl-3 pr-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-400/25"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
                className="grid h-6 w-6 place-items-center rounded-md text-indigo-500 transition-colors hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none dark:text-indigo-300 dark:hover:bg-indigo-500/20 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <InputIcon icon={Sparkles} hasError={Boolean(shownError)} />
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
            className={inputClassName(Boolean(shownError), { withIcon: true })}
          />
        </div>
        <button
          type="button"
          onClick={addSkill}
          disabled={!draft.trim()}
          aria-label="Add skill"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {shownError ? (
        <p id={fieldErrorId(id)} role="alert" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {shownError}
        </p>
      ) : (
        <p id={fieldHintId(id)} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}
