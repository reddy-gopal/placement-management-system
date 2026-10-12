import { MapPin, Briefcase, Building2, ExternalLink, ArrowRight, Check, Sparkles } from 'lucide-react';
import { formatPackage, getInitials } from '../../utils/formatters.js';
import { checkStudentEligibility } from '../../utils/eligibilityEngine.js';
import { EligibilityBadge } from './EligibilityBadge.jsx';
import { DeadlineCountdown } from './DeadlineCountdown.jsx';
import { Button } from '../ui/Button.jsx';

export const DriveCard = ({
  drive,
  student,
  isApplied = false,
  onViewDetails,
  onApply,
}) => {
  // Compute real-time eligibility based on current student profile
  // If drive came with precomputed eligibility from backend, use it unless student is simulated
  const computed = checkStudentEligibility(student, drive);
  const isEligible = drive.isEligible !== undefined && !student?.isSimulated
    ? drive.isEligible
    : computed.isEligible;
  const reasons = drive.ineligibilityReasons || computed.reasons;

  const company = drive.companyId || {};
  const companyName = company.name || 'Campus Recruiter';
  const companyIndustry = company.industry || 'Technology & Engineering';
  const logoUrl = company.logoUrl;

  const allowedBranches = drive.eligibility?.allowedBranches || [];
  const minCgpa = drive.eligibility?.minCgpa ?? 6.0;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 p-5 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-200 hover:-translate-y-1">
      {/* Top Bar: Company info & Package pill */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 border border-slate-700 shadow-sm overflow-hidden">
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
                <span className="hidden font-bold text-slate-800 text-sm">
                  {getInitials(companyName)}
                </span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-bold flex items-center justify-center shrink-0 shadow-md">
                {getInitials(companyName)}
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                <span>{companyName}</span>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-slate-400 inline-flex"
                    onClick={(e) => e.stopPropagation()}
                    title="Visit company website"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {companyIndustry}
              </p>
            </div>
          </div>

          {/* Package Pill */}
          <div className="shrink-0 text-right">
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-sm tracking-tight shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatPackage(drive.packageLpa)}</span>
            </div>
          </div>
        </div>

        {/* Job Title */}
        <div className="mt-4">
          <h2
            onClick={() => onViewDetails(drive)}
            className="text-base font-bold text-white hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1"
          >
            {drive.title}
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {drive.description}
          </p>
        </div>

        {/* Location & Employment Type */}
        <div className="mt-3.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{drive.location}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            <span className="capitalize">{drive.employmentType?.replace('_', ' ').toLowerCase() || 'Full time'}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Min CGPA: <strong className="text-slate-300">{minCgpa}</strong>
          </span>
        </div>

        {/* Allowed Branches Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium mr-1">Branches:</span>
          {allowedBranches.length > 0 ? (
            allowedBranches.slice(0, 4).map((branch) => {
              const isStudentBranch =
                String(student?.branch || '').toUpperCase() === branch.toUpperCase();
              return (
                <span
                  key={branch}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                    isStudentBranch
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700/60'
                  }`}
                >
                  {branch}
                </span>
              );
            })
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
              All Branches
            </span>
          )}
          {allowedBranches.length > 4 && (
            <span className="text-[11px] text-slate-500">
              +{allowedBranches.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Bottom Section: Eligibility Badge, Deadline Countdown & Actions */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3.5">
          {/* Prominent Eligibility Badge */}
          <EligibilityBadge
            isEligible={isEligible}
            reasons={reasons}
            student={student}
            drive={drive}
            size="sm"
            onShowBreakdown={() => onViewDetails(drive)}
          />

          {/* Deadline Countdown */}
          <DeadlineCountdown deadline={drive.deadline} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onViewDetails(drive)}
          >
            <span>View Criteria</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>

          {isApplied ? (
            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shrink-0">
              <Check className="w-3.5 h-3.5" />
              <span>Applied</span>
            </span>
          ) : (
            <Button
              variant={isEligible ? 'primary' : 'secondary'}
              size="sm"
              disabled={!isEligible}
              className={`shrink-0 text-xs ${
                !isEligible ? 'opacity-50 cursor-not-allowed hover:bg-slate-800' : ''
              }`}
              onClick={() => onApply(drive)}
            >
              <span>{isEligible ? 'Apply Now' : 'Ineligible'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
