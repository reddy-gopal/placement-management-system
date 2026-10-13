import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  Sparkles,
  ExternalLink,
  Award,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useStudent } from '../context/StudentContext.jsx';
import { fetchDriveById } from '../api/driveApi.js';
import { MOCK_DRIVES } from '../data/mockDrives.js';
import { formatPackage, formatDate, getInitials } from '../utils/formatters.js';
import { checkStudentEligibility } from '../utils/eligibilityEngine.js';
import { EligibilityCriteriaBreakdown } from '../components/drives/EligibilityCriteriaBreakdown.jsx';
import { DeadlineCountdown } from '../components/drives/DeadlineCountdown.jsx';
import { ApplicationModal } from '../components/drives/ApplicationModal.jsx';
import { Button } from '../components/ui/Button.jsx';

export const DriveDetailPage = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const { student, appliedDriveIds } = useStudent();

  const [drive, setDrive] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    const loadDrive = async () => {
      setIsLoading(true);
      setError(null);

      // Try fetching from backend API
      try {
        const res = await fetchDriveById(driveId);
        if (res?.drive) {
          setDrive(res.drive);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // Backend failed -> search in mock dataset
      }

      // Fallback search in mock data
      const found = MOCK_DRIVES.find((d) => d._id === driveId);
      if (found) {
        setDrive(found);
      } else {
        setError('Drive not found or registration period has ended.');
      }
      setIsLoading(false);
    };

    loadDrive();
  }, [driveId]);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading drive details and verifying eligibility...</p>
      </div>
    );
  }

  if (error || !drive) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">{error || 'Drive Not Found'}</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/student/drives')}>
          Back to Drives Catalog
        </Button>
      </div>
    );
  }

  const computed = checkStudentEligibility(student, drive);
  const isEligible = drive.isEligible !== undefined && !student?.isSimulated
    ? drive.isEligible
    : computed.isEligible;
  const reasons = drive.ineligibilityReasons || computed.reasons;
  const isApplied = appliedDriveIds.has(drive._id);

  const company = drive.companyId || {};
  const companyName = company.name || 'Campus Recruiter';

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-16">
      {/* Back button */}
      <div>
        <Link
          to="/student/drives"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Drives</span>
        </Link>
      </div>

      {/* Main Drive Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="p-6 sm:p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {company.logoUrl ? (
                <div className="w-14 h-14 rounded-2xl bg-white p-2.5 flex items-center justify-center shrink-0 border border-slate-700 shadow-md">
                  <img
                    src={company.logoUrl}
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
                  <h3 className="text-lg font-bold text-white">{companyName}</h3>
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
                <p className="text-xs text-slate-400 mt-0.5">{company.industry || 'Technology'}</p>
              </div>
            </div>

            {/* Package */}
            <div className="sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
                Annual Package (CTC)
              </span>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 font-extrabold text-base">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{formatPackage(drive.packageLpa)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
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

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Eligibility Section */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Eligibility Evaluation
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Candidate: <strong className="text-slate-200">{student?.name || 'Your Profile'}</strong>
              </span>
            </div>

            <EligibilityCriteriaBreakdown drive={drive} student={student} />

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
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
              {drive.description}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
            <Button variant="outline" size="md" onClick={() => navigate('/student/drives')}>
              Back to Catalog
            </Button>

            {isApplied ? (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm font-semibold">
                <Check className="w-4 h-4" />
                <span>Application Submitted</span>
              </span>
            ) : isEligible ? (
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsApplyModalOpen(true)}
              >
                Apply for this Drive
              </Button>
            ) : (
              <Button variant="secondary" size="lg" disabled className="opacity-50 cursor-not-allowed">
                Ineligible to Apply
              </Button>
            )}
          </div>
        </div>
      </div>

      <ApplicationModal
        drive={drive}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
};
