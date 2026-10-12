import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Search,
  Filter,
} from 'lucide-react';
import { useStudent } from '../context/StudentContext.jsx';
import { fetchDrives } from '../api/driveApi.js';
import { MOCK_DRIVES } from '../data/mockDrives.js';
import { checkStudentEligibility } from '../utils/eligibilityEngine.js';
import { DriveCard } from '../components/drives/DriveCard.jsx';
import { DriveFilters } from '../components/drives/DriveFilters.jsx';
import { DriveDetailModal } from '../components/drives/DriveDetailModal.jsx';
import { ApplicationModal } from '../components/drives/ApplicationModal.jsx';
import { StudentProfileBar } from '../components/student/StudentProfileBar.jsx';
import { ProfileSimulatorModal } from '../components/student/ProfileSimulatorModal.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Button } from '../components/ui/Button.jsx';

export const DrivesBrowserPage = () => {
  const { student, appliedDriveIds } = useStudent();

  // State for drives from API / Mock
  const [drives, setDrives] = useState(MOCK_DRIVES);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingLiveApi, setIsUsingLiveApi] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [minCtc, setMinCtc] = useState(0);
  const [eligibilityFilter, setEligibilityFilter] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'INELIGIBLE'
  const [employmentType, setEmploymentType] = useState('ALL');
  const [sortBy, setSortBy] = useState('deadline'); // 'deadline' | 'package-desc' | 'newest' | 'company-az'

  // Modal states
  const [selectedDriveForDetail, setSelectedDriveForDetail] = useState(null);
  const [selectedDriveForApply, setSelectedDriveForApply] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Load drives from backend API on mount
  const loadDrives = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetchDrives();
      if (res && res.drives && res.drives.length > 0) {
        setDrives(res.drives);
        setIsUsingLiveApi(true);
      } else {
        // Fallback to rich mock dataset
        setDrives(MOCK_DRIVES);
        setIsUsingLiveApi(false);
      }
    } catch (err) {
      // Backend not running yet or unauthorized -> use mock data seamlessly
      setDrives(MOCK_DRIVES);
      setIsUsingLiveApi(false);
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, []);

  // Compute live eligibility evaluation for all drives against current student
  const processedDrives = useMemo(() => {
    return drives.map((drive) => {
      const evaluation = checkStudentEligibility(student, drive);
      return {
        ...drive,
        // If student is simulated or drive didn't have isEligible, use the computed one
        liveIsEligible: drive.isEligible !== undefined && !student?.isSimulated
          ? drive.isEligible
          : evaluation.isEligible,
        liveReasons: drive.ineligibilityReasons || evaluation.reasons,
        evaluationBreakdown: evaluation.breakdown,
      };
    });
  }, [drives, student]);

  // Filter & Sort drives
  const filteredDrives = useMemo(() => {
    return processedDrives
      .filter((drive) => {
        // 1. Search Query (title, company, description, skills)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const titleMatch = drive.title?.toLowerCase().includes(q);
          const compMatch = drive.companyId?.name?.toLowerCase().includes(q);
          const descMatch = drive.description?.toLowerCase().includes(q);
          const skillMatch = drive.skillsRequired?.some((s) => s.toLowerCase().includes(q));
          if (!titleMatch && !compMatch && !descMatch && !skillMatch) return false;
        }

        // 2. Branch Filter
        if (selectedBranch !== 'ALL') {
          const allowed = drive.eligibility?.allowedBranches;
          if (Array.isArray(allowed) && allowed.length > 0) {
            const hasBranch = allowed.some(
              (b) => b.trim().toUpperCase() === selectedBranch.toUpperCase()
            );
            if (!hasBranch) return false;
          }
        }

        // 3. Minimum CTC Filter
        if (minCtc > 0) {
          if (Number(drive.packageLpa || 0) < minCtc) return false;
        }

        // 4. Eligibility Filter
        if (eligibilityFilter === 'ELIGIBLE' && !drive.liveIsEligible) {
          return false;
        }
        if (eligibilityFilter === 'INELIGIBLE' && drive.liveIsEligible) {
          return false;
        }

        // 5. Employment Type Filter
        if (employmentType !== 'ALL') {
          if (drive.employmentType !== employmentType) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') {
          const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return da - db;
        }
        if (sortBy === 'package-desc') {
          return Number(b.packageLpa || 0) - Number(a.packageLpa || 0);
        }
        if (sortBy === 'newest') {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        }
        if (sortBy === 'company-az') {
          return (a.companyId?.name || '').localeCompare(b.companyId?.name || '');
        }
        return 0;
      });
  }, [
    processedDrives,
    searchQuery,
    selectedBranch,
    minCtc,
    eligibilityFilter,
    employmentType,
    sortBy,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const total = processedDrives.length;
    const eligibleCount = processedDrives.filter((d) => d.liveIsEligible).length;
    const packages = processedDrives.map((d) => Number(d.packageLpa || 0)).filter((p) => p > 0);
    const avgCtc = packages.length > 0 ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1) : 0;
    const highestCtc = packages.length > 0 ? Math.max(...packages).toFixed(1) : 0;

    return {
      total,
      eligibleCount,
      ineligibleCount: total - eligibleCount,
      avgCtc,
      highestCtc,
    };
  }, [processedDrives]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBranch('ALL');
    setMinCtc(0);
    setEligibilityFilter('ALL');
    setEmploymentType('ALL');
    setSortBy('deadline');
  };

  return (
    <div className="space-y-7 pb-12">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Placement Drives Catalog
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Live Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Browse campus job drives with real-time academic eligibility evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isUsingLiveApi ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Backend Connected (Port 4000)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Catalog Preview Dataset</span>
            </span>
          )}

          <button
            onClick={loadDrives}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh drives"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Student Profile & Eligibility Simulator Bar */}
      <StudentProfileBar onOpenSimulator={() => setIsSimulatorOpen(true)} />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Drives"
          value={stats.total}
          subtitle="Currently open for campus registration"
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          title="Eligible for You"
          value={stats.eligibleCount}
          subtitle={`${Math.round((stats.eligibleCount / (stats.total || 1)) * 100)}% of total drives match qualifications`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average CTC"
          value={`₹${stats.avgCtc} LPA`}
          subtitle="Across active campus openings"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Highest CTC"
          value={`₹${stats.highestCtc} LPA`}
          subtitle="Dream company package"
          icon={Sparkles}
          color="indigo"
        />
      </div>

      {/* Filter and Discovery Engine */}
      <DriveFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        minCtc={minCtc}
        onCtcChange={setMinCtc}
        eligibilityFilter={eligibilityFilter}
        onEligibilityFilterChange={setEligibilityFilter}
        employmentType={employmentType}
        onEmploymentTypeChange={setEmploymentType}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        totalCount={processedDrives.length}
        filteredCount={filteredDrives.length}
        onResetFilters={handleResetFilters}
      />

      {/* Drives Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-28 bg-slate-800 rounded" />
                    <div className="h-3 w-40 bg-slate-800/60 rounded" />
                  </div>
                </div>
                <div className="h-5 w-48 bg-slate-800 rounded mt-4" />
                <div className="h-3 w-full bg-slate-800/40 rounded" />
              </div>
              <div className="h-10 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredDrives.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrives.map((drive) => (
            <DriveCard
              key={drive._id}
              drive={drive}
              student={student}
              isApplied={appliedDriveIds.has(drive._id)}
              onViewDetails={(d) => setSelectedDriveForDetail(d)}
              onApply={(d) => setSelectedDriveForApply(d)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No placement drives found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            No drives match your current filter and eligibility selections. Try loosening your criteria or resetting filters.
          </p>
          <div className="mt-5">
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset all filters
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <DriveDetailModal
        drive={selectedDriveForDetail}
        student={student}
        isOpen={Boolean(selectedDriveForDetail)}
        onClose={() => setSelectedDriveForDetail(null)}
        isApplied={selectedDriveForDetail ? appliedDriveIds.has(selectedDriveForDetail._id) : false}
        onApply={(d) => setSelectedDriveForApply(d)}
      />

      <ApplicationModal
        drive={selectedDriveForApply}
        isOpen={Boolean(selectedDriveForApply)}
        onClose={() => setSelectedDriveForApply(null)}
      />

      <ProfileSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
};
