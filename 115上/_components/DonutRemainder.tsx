import { useState } from "react";
import { Interactive } from "zyninote";
import { fmt, formula, muted, panel } from "./prob-ui.tsx";

type Props = { title: string; parts: { label: string; p: number }[]; restLabel: string };

function arc(start: number, end: number, r = 70, inner = 42) {
  const pt = (t: number, rad: number) => [100 + rad * Math.sin(2 * Math.PI * t), 100 - rad * Math.cos(2 * Math.PI * t)].map((v) => v.toFixed(2)).join(" ");
  const large = end - start > 0.5 ? 1 : 0;
  return `M${pt(start, r)} A${r} ${r} 0 ${large} 1 ${pt(end, r)} L${pt(end, inner)} A${inner} ${inner} 0 ${large} 0 ${pt(start, inner)} Z`;
}

/** Rule 2 donut: known outcome probabilities plus the remainder forced by Σ P = 1. */
export default function DonutRemainder({ title, parts, restLabel }: Props) {
  const [showRest, setShowRest] = useState(false);
  const known = parts.reduce((s, x) => s + x.p, 0);
  const rest = 1 - known;
  const slices = [...parts.map((x, k) => ({ ...x, rest: false, k })), { label: restLabel, p: rest, rest: true, k: parts.length }];
  let t = 0;

  return (
    <Interactive
      description={`Rule 2 樣本空間總和為 1：${title}，${parts.map((x) => `${x.label} ${fmt(x.p * 100)}%`).join("、")}，合計 ${fmt(known * 100)}%，所以${restLabel}必為 1 − ${fmt(known)} = ${fmt(rest)}（${fmt(rest * 100)}%）。`}
    >
      <div style={{ ...panel, display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
        <svg viewBox="0 0 200 200" role="img" aria-label={title} style={{ width: "180px", color: "var(--text)" }}>
          {slices.map((s) => {
            const d = arc(t, t + s.p - 0.004);
            t += s.p;
            if (s.rest)
              return (
                <path key={s.label} d={d} fill={showRest ? "currentColor" : "none"} fillOpacity={0.8} stroke="currentColor" strokeDasharray={showRest ? undefined : "4 3"} />
              );
            return <path key={s.label} d={d} fill="currentColor" fillOpacity={0.15 + 0.12 * s.k} />;
          })}
          <text x="100" y="98" textAnchor="middle" fill="currentColor" fontSize="14">Σ = 1</text>
          <text x="100" y="116" textAnchor="middle" fill="currentColor" fontSize="11" opacity={0.7}>{title}</text>
        </svg>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {parts.map((x) => (
              <li key={x.label}>
                {x.label} {fmt(x.p * 100)}%
              </li>
            ))}
            <li>
              {restLabel}{" "}
              {showRest ? (
                <strong>{fmt(rest * 100)}%</strong>
              ) : (
                <button type="button" onClick={() => setShowRest(true)} style={{ font: "inherit", cursor: "pointer", background: "none", border: "1px dashed var(--line-hover)", borderRadius: "var(--radius-sm)", color: "var(--text)", padding: "0 8px" }}>
                  ？點我算
                </button>
              )}
            </li>
          </ul>
          {showRest && <div style={formula}>{`${restLabel} = 1 − (${parts.map((x) => fmt(x.p)).join(" + ")}) = 1 − ${fmt(known)} = ${fmt(rest)}`}</div>}
          {!showRest && <p style={{ ...muted, margin: "8px 0 0" }}>所有出象的機率加起來必為 1，缺的那一塊可以直接補出來。</p>}
        </div>
      </div>
    </Interactive>
  );
}
