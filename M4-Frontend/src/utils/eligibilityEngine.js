/**
 * Core Eligibility Evaluation Engine for Member 4
 * Evaluates whether a student satisfies the criteria for a given placement drive.
 * Matches the backend logic in Backend/src/helper.js (withEligibility & getEligibilityIssues).
 */

export const checkStudentEligibility = (student, drive) => {
  if (!student) {
    return {
      isEligible: false,
      reasons: ['Complete your student profile to evaluate eligibility'],
      breakdown: {
        cgpa: { satisfied: false, current: 0, required: 6.0, reason: 'Profile incomplete' },
        backlogs: { satisfied: false, current: 0, allowed: 0, reason: 'Profile incomplete' },
        branch: { satisfied: false, current: 'N/A', allowed: [], reason: 'Profile incomplete' },
      },
    };
  }

  const eligibility = drive.eligibility || {};
  const minCgpa = eligibility.minCgpa !== undefined ? Number(eligibility.minCgpa) : 6.0;
  const maxBacklogs = eligibility.maxBacklogs !== undefined ? Number(eligibility.maxBacklogs) : 0;
  const allowedBranches = Array.isArray(eligibility.allowedBranches) ? eligibility.allowedBranches : [];

  const studentCgpa = Number(student.cgpa || 0);
  const studentBacklogs = Number(student.activeBacklogs || 0);
  const studentBranch = String(student.branch || '').trim().toUpperCase();

  const reasons = [];

  // Check 1: CGPA
  const cgpaSatisfied = studentCgpa >= minCgpa;
  let cgpaReason = '';
  if (!cgpaSatisfied) {
    cgpaReason = `Requires CGPA >= ${minCgpa.toFixed(1)}; your CGPA is ${studentCgpa.toFixed(1)}`;
    reasons.push(cgpaReason);
  }

  // Check 2: Backlogs
  const backlogsSatisfied = studentBacklogs <= maxBacklogs;
  let backlogsReason = '';
  if (!backlogsSatisfied) {
    backlogsReason = `Allows at most ${maxBacklogs} active backlog${maxBacklogs === 1 ? '' : 's'}; you have ${studentBacklogs}`;
    reasons.push(backlogsReason);
  }

  // Check 3: Branches
  const normalizedAllowedBranches = allowedBranches.map((b) => String(b).trim().toUpperCase());
  const branchSatisfied =
    normalizedAllowedBranches.length === 0 || normalizedAllowedBranches.includes(studentBranch);
  let branchReason = '';
  if (!branchSatisfied) {
    branchReason = `Open to ${allowedBranches.join(', ')} only (Your branch: ${studentBranch || 'Not set'})`;
    reasons.push(branchReason);
  }

  // Check 4: Deadline check
  const isDeadlinePassed = drive.deadline ? new Date(drive.deadline) <= new Date() : false;
  if (isDeadlinePassed) {
    reasons.push('Application deadline has passed');
  }

  const isEligible = cgpaSatisfied && backlogsSatisfied && branchSatisfied && !isDeadlinePassed;

  return {
    isEligible,
    reasons,
    breakdown: {
      cgpa: {
        satisfied: cgpaSatisfied,
        current: studentCgpa,
        required: minCgpa,
        reason: cgpaReason,
      },
      backlogs: {
        satisfied: backlogsSatisfied,
        current: studentBacklogs,
        allowed: maxBacklogs,
        reason: backlogsReason,
      },
      branch: {
        satisfied: branchSatisfied,
        current: studentBranch,
        allowed: allowedBranches,
        reason: branchReason,
      },
      deadline: {
        isPassed: isDeadlinePassed,
        deadline: drive.deadline,
      },
    },
  };
};
