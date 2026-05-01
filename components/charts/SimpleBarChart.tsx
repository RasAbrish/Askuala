interface Point {
  label: string;
  value: number;
}

export function SimpleBarChart({
  title,
  points,
  color = "#0F7B40",
}: {
  title: string;
  points: Point[];
  color?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));

  return (
    <section className="card">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="mt-3 flex h-44 items-end gap-2">
        {points.map((p) => {
          const h = Math.max(8, (p.value / max) * 160);
          return (
            <div key={p.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="text-xs text-ink/60">{Math.round(p.value)}</div>
              <div className="w-full rounded-t-md" style={{ height: `${h}px`, backgroundColor: color }} />
              <div className="line-clamp-1 w-full text-center text-[11px] text-ink/60">{p.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
