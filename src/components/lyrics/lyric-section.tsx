"use client";

interface LyricSectionProps {
  label: string | null;
  children: React.ReactNode;
}

export function LyricSection({ label, children }: LyricSectionProps) {
  return (
    <section className="space-y-1">
      {label ? (
        <h3 className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-purple-400/90">
          {label}
        </h3>
      ) : null}
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}
