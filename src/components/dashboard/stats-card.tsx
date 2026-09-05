import { cn, formatNumber } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatsCard({ label, value, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 md:p-5",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
    </div>
  );
}
