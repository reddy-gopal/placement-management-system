import { getCompletenessGuidance, getEligibilitySnapshot, getInitials, getProfileCompleteness } from './profileInsights';

const fullProfile = {
  rollNumber: '21CSE101',
  branch: 'CSE',
  graduationYear: 2027,
  cgpa: 8.4,
  activeBacklogs: 0,
  skills: ['Java'],
  resumeUrl: 'https://example.com/resume.pdf',
};

describe('getProfileCompleteness', () => {
  it('is 0% with every item open when there is no profile', () => {
    const result = getProfileCompleteness(null);
    expect(result).toMatchObject({ completed: 0, total: 7, percent: 0 });
    expect(result.items.every((item) => !item.done)).toBe(true);
  });

  it('is 100% for a complete profile (0 backlogs still counts as filled)', () => {
    expect(getProfileCompleteness(fullProfile)).toMatchObject({ completed: 7, percent: 100 });
  });

  it('counts missing skills and resume', () => {
    const result = getProfileCompleteness({ ...fullProfile, skills: [], resumeUrl: '' });
    expect(result).toMatchObject({ completed: 5, percent: 71 });
    expect(result.items.filter((item) => !item.done).map((item) => item.key)).toEqual(['skills', 'resumeUrl']);
  });
});

describe('getCompletenessGuidance', () => {
  it('nudges towards the last missing item', () => {
    const guidance = getCompletenessGuidance(getProfileCompleteness({ ...fullProfile, resumeUrl: '' }));
    expect(guidance).toBe('Add your resume to reach 100%.');
  });

  it('handles empty and complete profiles', () => {
    expect(getCompletenessGuidance(getProfileCompleteness(null))).toMatch(/Create your profile/);
    expect(getCompletenessGuidance(getProfileCompleteness(fullProfile))).toMatch(/complete/);
  });
});

describe('getInitials', () => {
  it('uses the letters in the roll number', () => {
    expect(getInitials('21cse101')).toBe('CS');
  });

  it('falls back to ST', () => {
    expect(getInitials('')).toBe('ST');
    expect(getInitials(undefined)).toBe('ST');
    expect(getInitials('2021101')).toBe('ST');
  });
});

describe('getEligibilitySnapshot', () => {
  it('compares against typical criteria', () => {
    expect(getEligibilitySnapshot(fullProfile)).toMatchObject({
      cgpa: { status: 'meets' },
      backlogs: { status: 'meets' },
      eligible: true,
    });
    expect(getEligibilitySnapshot({ ...fullProfile, cgpa: 5.5, activeBacklogs: 2 })).toMatchObject({
      cgpa: { status: 'below' },
      backlogs: { status: 'below' },
      eligible: false,
    });
  });

  it('is unknown without a profile', () => {
    expect(getEligibilitySnapshot(null)).toMatchObject({
      cgpa: { status: 'unknown', value: null },
      backlogs: { status: 'unknown' },
      eligible: false,
    });
  });
});
