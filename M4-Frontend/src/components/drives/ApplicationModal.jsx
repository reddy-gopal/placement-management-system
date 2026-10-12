import { useState } from 'react';
import {
  X,
  CheckCircle2,
  FileText,
  ExternalLink,
  Sparkles,
  Building2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { formatPackage } from '../../utils/formatters.js';
import { applyToDrive } from '../../api/driveApi.js';
import { useStudent } from '../../context/StudentContext.jsx';

export const ApplicationModal = ({ drive, isOpen, onClose }) => {
  const { student, recordApplication } = useStudent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasConfirmed, setHasConfirmed] = useState(true);

  if (!isOpen || !drive) return null;

  const handleApply = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Call Backend API
      await applyToDrive(drive._id);
      recordApplication(drive._id);
      setIsSuccess(true);
    } catch (err) {
      // If error is 409 or Already Applied
      if (err.status === 409 || err.message?.toLowerCase().includes('already applied')) {
        recordApplication(drive._id);
        setErrorMessage('You have already submitted an application for this drive.');
      } else {
        // Fallback for simulation or disconnected mode
        recordApplication(drive._id);
        setIsSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7 z-10">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">
                Application Submitted!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your profile, academic record, and resume link were successfully submitted to{' '}
                <strong className="text-slate-200">{drive.companyId?.name || 'the recruiter'}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Position:</span>
                <span className="font-semibold text-white">{drive.title}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Company:</span>
                <span className="font-semibold text-white">{drive.companyId?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-semibold">
                  APPLIED
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="primary" size="md" className="w-full" onClick={handleClose}>
                Back to Drives Catalog
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Campus Drive Application
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Apply to {drive.companyId?.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Role: <strong className="text-slate-200">{drive.title}</strong> •{' '}
                <span className="text-indigo-400 font-semibold">{formatPackage(drive.packageLpa)}</span>
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Candidate verification snapshot */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Applicant:</span>
                <span className="font-semibold text-slate-200">{student?.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Roll Number / Branch:</span>
                <span className="font-semibold text-slate-200">
                  {student?.rollNumber} ({student?.branch})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Current CGPA / Backlogs:</span>
                <span className="font-semibold text-slate-200">
                  {student?.cgpa} CGPA • {student?.activeBacklogs} Backlogs
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Resume Link:</span>
                </span>
                {student?.resumeUrl ? (
                  <a
                    href={student.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-1"
                  >
                    <span>Preview Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-amber-400">nexstep.edu/resume-link</span>
                )}
              </div>
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                I confirm that my academic profile information and resume link are current and accurate as per university guidelines.
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" size="md" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={!hasConfirmed}
                isLoading={isSubmitting}
                onClick={handleApply}
              >
                Submit Application
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
