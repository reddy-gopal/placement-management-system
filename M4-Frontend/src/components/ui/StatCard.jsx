export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/10',
      text: 'text-indigo-400 dark:text-indigo-400',
      border: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/5',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
      text: 'text-emerald-400 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/5',
    },
    rose: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/10',
      text: 'text-rose-400 dark:text-rose-400',
      border: 'border-rose-500/20',
      glow: 'shadow-rose-500/5',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/10',
      text: 'text-amber-400 dark:text-amber-400',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/5',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/60 dark:bg-slate-900/80 border ${scheme.border} p-5 backdrop-blur-md shadow-lg ${scheme.glow} transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white dark:text-white">
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={`flex items-center justify-center w-11 h-11 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
          {trend && <span className={scheme.text}>{trend}</span>}
          <span>{subtitle}</span>
        </p>
      )}
    </div>
  );
};
