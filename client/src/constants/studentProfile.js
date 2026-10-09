// Keep in sync with server/models/StudentProfile.js
export const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

export const GRADUATION_YEAR_MIN = 2000;
export const GRADUATION_YEAR_MAX = 2100;
export const MAX_SKILLS = 30;
export const MAX_SKILL_LENGTH = 50;

export const EMPTY_PROFILE_FORM = Object.freeze({
  rollNumber: '',
  branch: '',
  graduationYear: '',
  cgpa: '',
  activeBacklogs: 0,
  skills: [],
  resumeUrl: '',
});

// Typical campus-drive criteria, used only for the informational eligibility snapshot.
// Individual drives set their own rules (see the drive's eligibility block).
export const TYPICAL_MIN_CGPA = 6;
export const TYPICAL_MAX_BACKLOGS = 0;
