/**
 * StatCard Component
 *
 * Display card for a single statistic metric.
 *
 * Features:
 * - Large emoji icon
 * - Prominent value display
 * - Descriptive label
 * - Unique gradient background per metric
 *
 * Props:
 * - icon: Emoji icon
 * - value: Numeric or string value
 * - label: Description label
 * - gradient: Tailwind gradient classes
 */

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  gradient: string;
}

export default function StatCard({ icon, value, label, gradient }: StatCardProps) {
  return (
    <div className={`rounded-2xl p-6 shadow-lg ${gradient}`}>
      {/* Icon */}
      <div className="mb-3 text-5xl md:text-6xl">{icon}</div>

      {/* Value */}
      <div className="mb-2 text-4xl font-bold text-white md:text-5xl">{value}</div>

      {/* Label */}
      <div className="text-lg font-semibold text-white/90 md:text-xl">{label}</div>
    </div>
  );
}
