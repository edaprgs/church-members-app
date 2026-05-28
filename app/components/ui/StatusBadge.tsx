// app/components/ui/StatusBadge.tsx
// ─── Member status pill badge ─────────────────────────────────────────────────

type StatusBadgeProps = {
  status?: string;
};

const STATUS_STYLES: Record<string, string> = {
  Active:   "bg-green-50 text-green-700 border-green-200",
  Pending:  "bg-amber-50 text-amber-700 border-amber-200",
  Inactive: "bg-red-50 text-red-600 border-red-200",
  Deceased: "bg-gray-100 text-gray-500 border-gray-200",
};

/** Dot + bg config for the Members table variant */
export const statusConfig = (status: string) => {
  switch (status) {
    case "Active":   return { dot: "#16a34a", bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" };
    case "Pending":  return { dot: "#d97706", bg: "#fef9ec", text: "#b45309", border: "#fde68a" };
    case "Inactive": return { dot: "#dc2626", bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" };
    case "Deceased": return { dot: "#6b7280", bg: "#f9fafb", text: "#4b5563", border: "#e5e7eb" };
    default:         return { dot: "#9ca3af", bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" };
  }
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = STATUS_STYLES[status ?? ""] ?? "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {status ?? "—"}
    </span>
  );
}