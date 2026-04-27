function StatCard({ title, value, subtitle }) {
  return (
    <div className="glass rounded-2xl p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-300">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">{value}</h3>
      {subtitle ? <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">{subtitle}</p> : null}
    </div>
  );
}

export default StatCard;