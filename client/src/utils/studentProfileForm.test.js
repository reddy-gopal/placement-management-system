import {
  isHttpUrl,
  profileToForm,
  toEmbeddableResumeUrl,
  toProfilePayload,
  validateProfileForm,
} from './studentProfileForm';

const validForm = {
  rollNumber: '21CSE101',
  branch: 'CSE',
  graduationYear: '2027',
  cgpa: '8.4',
  activeBacklogs: '0',
  skills: ['Java'],
  resumeUrl: 'https://example.com/resume.pdf',
};

describe('validateProfileForm', () => {
  it('accepts a valid form', () => {
    expect(validateProfileForm(validForm)).toEqual({});
  });

  it('requires the academic fields but not skills or resume', () => {
    const errors = validateProfileForm({
      rollNumber: ' ',
      branch: '',
      graduationYear: '',
      cgpa: '',
      activeBacklogs: '',
      skills: [],
      resumeUrl: '',
    });
    expect(Object.keys(errors).sort()).toEqual(['activeBacklogs', 'branch', 'cgpa', 'graduationYear', 'rollNumber']);
  });

  it.each(['0', '7.5', '8.4', '10'])('accepts CGPA %s', (cgpa) => {
    expect(validateProfileForm({ ...validForm, cgpa }).cgpa).toBeUndefined();
  });

  it.each(['-1', '10.1', '11'])('rejects CGPA %s', (cgpa) => {
    expect(validateProfileForm({ ...validForm, cgpa }).cgpa).toBe('CGPA must be between 0 and 10.');
  });

  it.each(['-1', '-5'])('rejects backlogs %s', (activeBacklogs) => {
    expect(validateProfileForm({ ...validForm, activeBacklogs }).activeBacklogs).toBe(
      'Active backlogs cannot be negative.'
    );
  });

  it('rejects an invalid branch and year', () => {
    const errors = validateProfileForm({ ...validForm, branch: 'ARTS', graduationYear: '27' });
    expect(errors.branch).toBeDefined();
    expect(errors.graduationYear).toBeDefined();
  });

  it.each(['not a url', 'javascript:alert(1)', 'ftp://x.com/a.pdf'])('rejects resume URL %s', (resumeUrl) => {
    expect(validateProfileForm({ ...validForm, resumeUrl }).resumeUrl).toBeDefined();
  });
});

describe('form <-> payload mapping', () => {
  it('converts numeric strings and trims text', () => {
    expect(toProfilePayload({ ...validForm, rollNumber: ' 21CSE101 ', resumeUrl: ' https://a.com/r.pdf ' })).toEqual({
      rollNumber: '21CSE101',
      branch: 'CSE',
      graduationYear: 2027,
      cgpa: 8.4,
      activeBacklogs: 0,
      skills: ['Java'],
      resumeUrl: 'https://a.com/r.pdf',
    });
  });

  it('never includes userId or isPlaced in the payload', () => {
    const payload = toProfilePayload({ ...validForm, userId: 'x', isPlaced: true });
    expect(payload).not.toHaveProperty('userId');
    expect(payload).not.toHaveProperty('isPlaced');
  });

  it('maps a missing profile to an empty form', () => {
    expect(profileToForm(null)).toEqual({
      rollNumber: '',
      branch: '',
      graduationYear: '',
      cgpa: '',
      activeBacklogs: 0,
      skills: [],
      resumeUrl: '',
    });
  });
});

describe('resume URL helpers', () => {
  it('only treats http(s) as valid', () => {
    expect(isHttpUrl('https://example.com/r.pdf')).toBe(true);
    expect(isHttpUrl('data:application/pdf;base64,AA')).toBe(false);
  });

  it('converts Google Drive view links to embeddable preview links', () => {
    expect(toEmbeddableResumeUrl('https://drive.google.com/file/d/abc123/view?usp=sharing')).toBe(
      'https://drive.google.com/file/d/abc123/preview'
    );
    expect(toEmbeddableResumeUrl('https://example.com/r.pdf')).toBe('https://example.com/r.pdf');
  });
});
