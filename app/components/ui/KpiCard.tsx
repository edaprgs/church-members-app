// app/components/ui/KpiCard.tsx
// ─── Reusable KPI stat card used on Dashboard, Analytics, and Reports ─────────

type KpiCardProps = {
  label: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
  sub?: string;
};

export default function KpiCard({ label, value, icon: Icon, colorClass, sub }: KpiCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon size={15} strokeWidth={2.2} />
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}