interface Point {
  label: string;
  value: number;
}

export function SimpleLineChart({
  title,
  points,
  stroke = "#0F7B40",
}: {
  title: string;
  points: Point[];
  stroke?: string;
}) {
  const w = 640;
  const h = 200;
  const pad = 24;
  const max = Math.max(1, ...points.map((p) => p.value));
  const min = Math.min(0, ...points.map((p) => p.value));
  const span = Math.max(1, max - min);

  const coords = points.map((p, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1);
    const y = h - pad - ((p.value - min) / span) * (h - pad * 2);
    return { ...p, x, y };
  });

  const d = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");

  return (
    <section className="card">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="mt-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full">
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(15,23,42,0.2)" />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="rgba(15,23,42,0.2)" />
          <path d={d} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          {coords.map((c) => (
            <circle key={c.label} cx={c.x} cy={c.y} r="3.5" fill={stroke} />
          ))}
        </svg>
        <div className="mt-1 grid grid-cols-6 gap-1 text-[11px] text-ink/60 sm:grid-cols-8">
          {points.map((p) => (
            <div key={p.label} className="truncate">{p.label}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
