import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";

const CASES = [
  { label: "數學成績（近似常態）", mu: 70, sigma: 10, unit: "分" },
  { label: "員工工時（分配未知）", mu: 40, sigma: 5, unit: "小時" },
];

const EMPIRICAL: Record<number, number> = { 1: 0.68, 2: 0.95, 3: 0.997 };

/** μ ± kσ: what the empirical rule promises (bell-shaped only) vs Chebyshev (any shape). */
export default function SpreadRules() {
  const [k, setK] = useState(2);
  const [c, setC] = useState(0);
  const { mu, sigma, unit } = CASES[c];
  const cheb = k > 1 ? 1 - 1 / (k * k) : 0;
  const curve = Array.from({ length: 121 }, (_, i) => {
    const z = -4 + i / 15;
    return `${160 + z * 36},${110 - 90 * Math.exp((-z * z) / 2)}`;
  }).join(" ");
  const band = Array.from({ length: 61 }, (_, i) => {
    const z = -k + (2 * k * i) / 60;
    return `${160 + z * 36},${110 - 90 * Math.exp((-z * z) / 2)}`;
  });

  return (
    <Interactive description="平均數 ± k 個標準差的範圍內有多少資料。經驗法則（只適用近似常態、鐘形的分配）：±1σ 約 68%、±2σ 約 95%、±3σ 約 99.7%。柴比雪夫定理（任何分配都適用，比較保守）：至少 1−1/k² 的資料落在 ±kσ 內，k=2 至少 75%、k=3 至少 88.89%，k≤1 時沒有保證。例：數學成績近似常態，平均 70、標準差 10，50～90 分是 μ±2σ，約 95%；工時平均 40、標準差 5，分配未知，30～50 小時是 μ±2σ，用柴比雪夫至少 75%。">
      <div style={panel}>
        <div style={row}>
          {CASES.map((x, i) => (
            <Chip key={x.label} active={i === c} onClick={() => setC(i)}>
              {x.label}
            </Chip>
          ))}
        </div>
        <div style={{ ...row, marginTop: "8px" }}>
          <span style={muted}>k =</span>
          {[1, 1.5, 2, 2.5, 3].map((x) => (
            <Chip key={x} active={x === k} onClick={() => setK(x)}>
              {x}
            </Chip>
          ))}
        </div>
        <svg viewBox="0 0 320 130" role="img" aria-label={`μ ± ${k}σ 的範圍`} style={{ width: "100%", display: "block", margin: "12px 0", color: "var(--text)" }}>
          <polygon points={`${160 - k * 36},110 ${band.join(" ")} ${160 + k * 36},110`} fill="currentColor" fillOpacity={0.25} />
          <polyline points={curve} fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="10" x2="310" y1="110" y2="110" stroke="currentColor" strokeOpacity={0.4} />
          {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
            <text key={z} x={160 + z * 36} y="124" textAnchor="middle" fontSize="8" fill="currentColor" opacity={0.75}>
              {fmt(mu + z * sigma)}
            </text>
          ))}
        </svg>
        <div style={formula}>
          {[
            `範圍：μ ± ${k}σ = ${mu} ± ${fmt(k * sigma)} → ${fmt(mu - k * sigma)} 到 ${fmt(mu + k * sigma)} ${unit}`,
            `經驗法則（鐘形）：${EMPIRICAL[k] ? `約 ${fmt(EMPIRICAL[k] * 100)}%` : "只背 k = 1, 2, 3"}`,
            `柴比雪夫（任何分配）：${k > 1 ? `至少 1 − 1/${fmt(k * k)} = ${fmt(cheb * 100, 2)}%` : "k ≤ 1 時沒有保證"}`,
          ].join("\n")}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          {c === 0 ? "成績近似常態，可以用經驗法則。" : "工時分配未知（可能偏態），只能用柴比雪夫定理的保守下限。"}
        </p>
      </div>
    </Interactive>
  );
}
