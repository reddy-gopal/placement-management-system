import { useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Briefcase,
  ExternalLink,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  Check,
} from 'lucide-react';
import { formatPackage, formatDate, getInitials } from '../../utils/formatters.js';
import { checkStudentEligibility } from '../../utils/eligibilityEngine.js';
import { EligibilityCriteriaBreakdown } from './EligibilityCriteriaBreakdown.jsx';
import { DeadlineCountdown } from './DeadlineCountdown.jsx';
import { Button } from '../ui/Button.jsx';

export const DriveDetailModal = ({
  drive,
  student,
  isOpen,
  onClose,
  isApplied = false,
  onApply,
}) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !drive) return null;

  const computed = checkStudentEligibility(student, drive);
  const isEligible = drive.isEligible !== undefined && !student?.isSimulated
    ? drive.isEligible
    : computed.isEligible;
  const reasons = drive.ineligibilityReasons || computed.reasons;

  const company = drive.companyId || {};
  const companyName = company.name || 'Campus Recruiter';
  const logoUrl = company.logoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col">
        {/* Header Banner */}
        <div className="relative p-6 sm:p-7 border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="w-14 h-14 rounded-2xl bg-white p-2.5 flex items-center justify-center shrink-0 border border-slate-700 shadow-md">
                  <img
                    src={logoUrl}
                    alt={companyName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-lg">
                  {getInitials(companyName)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {companyName}
                  </h3>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 text-xs"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {company.industry || 'Technology'}
                </p>
              </div>
            </div>

            {/* CTC Pill */}
            <div className="sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
                Annual CTC (Gross)
              </span>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 font-extrabold text-base">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{formatPackage(drive.packageLpa)}</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {drive.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{drive.location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span className="capitalize">{drive.employmentType?.replace('_', ' ').toLowerCase() || 'Full time'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Deadline: {formatDate(drive.deadline)}</span>
              </span>
              <DeadlineCountdown deadline={drive.deadline} />
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* Eligibility Section (M4 Highlight) */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Eligibility Evaluation
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Evaluating against: <strong className="text-slate-200">{student?.name || 'Your Profile'}</strong>
              </span>
            </div>

            {/* Criteria Breakdown */}
            <EligibilityCriteriaBreakdown drive={drive} student={student} />

            {/* Ineligibility Warning Box */}
            {!isEligible && reasons.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Why you cannot apply for this drive:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  {reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
              Job Description
            </h4>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              {drive.description}
            </div>
          </div>

          {/* Skills Required */}
          {drive.skillsRequired && drive.skillsRequired.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
                Target Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {drive.skillsRequired.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Selection Process */}
          {drive.selectionProcess && drive.selectionProcess.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
                Hiring Pipeline
              </h4>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {drive.selectionProcess.map((round, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300"
                  >
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <span>{round}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-4">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-3">
            {isApplied ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm font-semibold">
                <Check className="w-4 h-4" />
                <span>Application Submitted</span>
              </span>
            ) : isEligible ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  onApply(drive);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
              >
                <span>Proceed to Apply</span>
              </Button>
            ) : (
              <div className="text-right">
                <span className="text-xs text-rose-400 font-medium block">
                  You do not meet the minimum eligibility
                </span>
                <Button
                  variant="secondary"
                  size="md"
                  disabled
                  className="opacity-50 cursor-not-allowed mt-1"
                >
                  Application Blocked
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
