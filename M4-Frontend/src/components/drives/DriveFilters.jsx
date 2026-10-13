import { Search, X, SlidersHorizontal, ArrowUpDown, Filter } from 'lucide-react';

export const BRANCH_OPTIONS = ['ALL', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
export const CTC_OPTIONS = [
  { label: 'Any CTC', value: 0 },
  { label: '₹6+ LPA', value: 6 },
  { label: '₹12+ LPA', value: 12 },
  { label: '₹20+ LPA', value: 20 },
];
export const ELIGIBILITY_OPTIONS = [
  { label: 'All Drives', value: 'ALL' },
  { label: 'Eligible Only', value: 'ELIGIBLE' },
  { label: 'Ineligible Only', value: 'INELIGIBLE' },
];

export const DriveFilters = ({
  searchQuery,
  onSearchChange,
  selectedBranch,
  onBranchChange,
  minCtc,
  onCtcChange,
  eligibilityFilter,
  onEligibilityFilterChange,
  employmentType,
  onEmploymentTypeChange,
  sortBy,
  onSortByChange,
  totalCount,
  filteredCount,
  onResetFilters,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedBranch !== 'ALL' ||
    minCtc > 0 ||
    eligibilityFilter !== 'ALL' ||
    employmentType !== 'ALL';

  return (
    <div className="space-y-4 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 md:p-5 backdrop-blur-md">
      {/* Search Bar + Sort Header */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by company name, job role, or skills (e.g. Google, SDE, React)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 py-2.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="deadline">Deadline: Soonest First</option>
            <option value="package-desc">CTC: Highest to Lowest</option>
            <option value="newest">Newest Drives First</option>
            <option value="company-az">Company: A to Z</option>
          </select>
        </div>
      </div>

      {/* Filter Pills Sections */}
      <div className="pt-2 border-t border-slate-800/80 space-y-3">
        {/* Row 1: Eligibility Pills + CTC Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Eligibility Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Status:</span>
            </span>
            {ELIGIBILITY_OPTIONS.map((opt) => {
              const active = eligibilityFilter === opt.value;
              let activeColor = 'bg-indigo-600 text-white border-indigo-500';
              if (opt.value === 'ELIGIBLE') {
                activeColor = 'bg-emerald-600 text-white border-emerald-500';
              } else if (opt.value === 'INELIGIBLE') {
                activeColor = 'bg-rose-600 text-white border-rose-500';
              }

              return (
                <button
                  key={opt.value}
                  onClick={() => onEligibilityFilterChange(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all cursor-pointer ${
                    active
                      ? activeColor
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* CTC Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-slate-400 mr-1">Package:</span>
            {CTC_OPTIONS.map((opt) => {
              const active = minCtc === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onCtcChange(opt.value)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl font-medium border transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Branch Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-slate-400 mr-1">Allowed Branch:</span>
          {BRANCH_OPTIONS.map((branch) => {
            const active = selectedBranch === branch;
            return (
              <button
                key={branch}
                onClick={() => onBranchChange(branch)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950/50 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {branch === 'ALL' ? 'All Branches' : branch}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Summary Footer */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{filteredCount}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalCount}</span> campus placement drives
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset all filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
