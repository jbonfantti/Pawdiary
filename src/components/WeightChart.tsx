const LB_PER_KG = 2.20462;

type WeightPoint = { recordedAt: Date; weightKg: string };

/**
 * Minimal dependency-free SVG line chart of weight over time (shown in lbs).
 * Rendered server-side; only appears once there are 2+ weight records.
 */
export function WeightChart({ points }: { points: WeightPoint[] }) {
  if (points.length < 2) return null;

  const sorted = [...points].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
  );
  const lbs = sorted.map((p) => Number(p.weightKg) * LB_PER_KG);
  const times = sorted.map((p) => p.recordedAt.getTime());

  const w = 560;
  const h = 160;
  const pad = 24;

  const minLb = Math.min(...lbs);
  const maxLb = Math.max(...lbs);
  const lbRange = maxLb - minLb || 1;
  const tMin = times[0];
  const tRange = times[times.length - 1] - tMin || 1;

  const coords = sorted.map((_, i) => {
    const x = pad + ((times[i] - tMin) / tRange) * (w - pad * 2);
    const y = h - pad - ((lbs[i] - minLb) / lbRange) * (h - pad * 2);
    return { x, y };
  });
  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Weight over time"
      className="mt-3 w-full rounded-xl border border-zinc-100 bg-zinc-50"
    >
      <path d={path} fill="none" stroke="#18181b" strokeWidth="2" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#18181b" />
      ))}
      <text x={pad} y={14} fontSize="11" fill="#71717a">
        {maxLb.toFixed(1)} lbs
      </text>
      <text x={pad} y={h - 8} fontSize="11" fill="#71717a">
        {minLb.toFixed(1)} lbs
      </text>
    </svg>
  );
}
