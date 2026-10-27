import { fmt } from "./prob-ui.tsx";

type BarsProps = {
  values: number[];
  labels: string[];
  /** Bars drawn darker (e.g. the event being asked about). */
  highlight?: boolean[];
  /** Touching bars for histograms of continuous data, gaps for categories. */
  touching?: boolean;
  /** Optional line on a 0–1 right axis (cumulative share for Pareto charts and ogives). */
  line?: number[];
  /** Print each bar's value above it. */
  showValues?: boolean;
  format?: (v: number) => string;
  /** Vertical guide lines at fractional bar positions, e.g. a mean. */
  marks?: { at: number; label: string }[];
  ariaLabel: string;
  yMax?: number;
};

/** Monochrome bar chart in app tokens; the shared drawing for every distribution widget. */
export function Bars({ values, labels, highlight, touching, line, showValues, format = (v) => fmt(v), marks = [], ariaLabel, yMax }: BarsProps) {
  const W = 320;
  const H = 150;
  const left = 8;
  const right = line ? 30 : 8;
  const top = 18;
  const bottom = 20;
  const n = values.length;
  const max = yMax ?? Math.max(...values, 1e-9);
  const slot = (W - left - right) / n;
  const gap = touching ? 0 : Math.min(6, slot * 0.25);
  const y = (v: number) => top + (1 - v / max) * (H - top - bottom);
  const yl = (v: number) => top + (1 - v) * (H - top - bottom);
  const every = Math.ceil(n / 16);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} style={{ width: "100%", display: "block", color: "var(--text)", margin: "8px 0" }}>
      <line x1={left} x2={W - right} y1={H - bottom} y2={H - bottom} stroke="currentColor" strokeOpacity={0.4} />
      {values.map((v, i) => {
        const x = left + i * slot + gap / 2;
        const on = highlight ? highlight[i] : true;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y(v)}
              width={slot - gap}
              height={Math.max(0, H - bottom - y(v))}
              fill="currentColor"
              fillOpacity={on ? 0.75 : 0.2}
              stroke={touching ? "var(--background)" : undefined}
              strokeWidth={touching ? 0.6 : undefined}
            />
            {showValues && v > 0 && (
              <text x={x + (slot - gap) / 2} y={y(v) - 3} textAnchor="middle" fontSize="8" fill="currentColor" opacity={0.8}>
                {format(v)}
              </text>
            )}
            {i % every === 0 && (
              <text x={x + (slot - gap) / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="currentColor" opacity={0.7}>
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
      {marks.map((m) => {
        const x = left + m.at * slot;
        return (
          <g key={m.label}>
            <line x1={x} x2={x} y1={top - 6} y2={H - bottom} stroke="currentColor" strokeDasharray="3 3" />
            <text x={x + 3} y={top - 8} fontSize="8" fill="currentColor">
              {m.label}
            </text>
          </g>
        );
      })}
      {line && (
        <>
          <line x1={W - right} x2={W - right} y1={top} y2={H - bottom} stroke="currentColor" strokeOpacity={0.4} />
          {[0, 0.5, 1].map((t) => (
            <text key={t} x={W - right + 3} y={yl(t) + 3} fontSize="8" fill="currentColor" opacity={0.7}>
              {Math.round(t * 100)}%
            </text>
          ))}
          <polyline
            points={line.map((v, i) => `${left + (i + 1) * slot},${yl(v)}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {line.map((v, i) => (
            <circle key={i} cx={left + (i + 1) * slot} cy={yl(v)} r="2.2" fill="currentColor" />
          ))}
        </>
      )}
    </svg>
  );
}
