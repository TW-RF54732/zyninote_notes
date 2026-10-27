import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";
import { percentile, sorted } from "./stats-math.ts";

type Dataset = { label: string; data: number[] };
type Props = { datasets: Dataset[] };

function analyze(data: number[]) {
  const s = sorted(data);
  const q1 = percentile(s, 25);
  const q2 = percentile(s, 50);
  const q3 = percentile(s, 75);
  const iqr = q3.value - q1.value;
  const lower = q1.value - 1.5 * iqr;
  const upper = q3.value + 1.5 * iqr;
  const outliers = s.filter((x) => x < lower || x > upper);
  const inside = s.filter((x) => x >= lower && x <= upper);
  return { s, q1, q2, q3, iqr, lower, upper, outliers, lo: inside[0], hi: inside[inside.length - 1] };
}

const pos = (q: { i: number; integer: boolean }) =>
  q.integer ? `i=${fmt(q.i)} 是整數 → 第 ${q.i} 與 ${q.i + 1} 個的平均` : `i=${fmt(q.i)} → 進位到第 ${Math.ceil(q.i)} 個`;

/** Quartiles by the course's position rule, the 1.5 × IQR fences, and the resulting box plot. */
export default function BoxPlotBuilder({ datasets }: Props) {
  const [k, setK] = useState(0);
  const d = datasets[k];
  const a = analyze(d.data);
  const min = Math.min(a.s[0], a.lower);
  const max = Math.max(a.s[a.s.length - 1], a.upper);
  const X = (x: number) => 16 + ((x - min) / (max - min || 1)) * 288;

  const describe = (ds: Dataset) => {
    const b = analyze(ds.data);
    return `${ds.label}：${b.s.join(", ")}；Q1=${fmt(b.q1.value)}、Q2=${fmt(b.q2.value)}、Q3=${fmt(b.q3.value)}，IQR=${fmt(b.iqr)}，下界 ${fmt(b.lower)}、上界 ${fmt(b.upper)}，離群值 ${b.outliers.length ? b.outliers.join("、") : "無"}`;
  };

  return (
    <Interactive
      description={`盒鬚圖與 1.5×IQR 離群值法則。四分位數用位置指標 i=(p/100)·n：i 不是整數就進位取第 i 個，是整數就取第 i 與 i+1 個的平均。IQR=Q3−Q1，下界=Q1−1.5×IQR，上界=Q3+1.5×IQR，界外的點是離群值，在盒鬚圖上畫成獨立點。${datasets.map(describe).join("。")}。`}
    >
      <div style={panel}>
        <div style={row}>
          {datasets.map((x, i) => (
            <Chip key={x.label} active={i === k} onClick={() => setK(i)}>
              {x.label}
            </Chip>
          ))}
        </div>
        <svg viewBox="0 0 320 96" role="img" aria-label="盒鬚圖" style={{ width: "100%", display: "block", margin: "12px 0", color: "var(--text)" }}>
          <line x1="8" x2="312" y1="80" y2="80" stroke="currentColor" strokeOpacity={0.3} />
          {[a.lower, a.upper].map((f, i) => (
            <g key={i}>
              <line x1={X(f)} x2={X(f)} y1="10" y2="80" stroke="currentColor" strokeOpacity={0.5} strokeDasharray="3 3" />
              <text x={X(f)} y="92" textAnchor="middle" fontSize="8" fill="currentColor" opacity={0.7}>
                {i ? "上界" : "下界"} {fmt(f)}
              </text>
            </g>
          ))}
          <line x1={X(a.lo)} x2={X(a.q1.value)} y1="40" y2="40" stroke="currentColor" />
          <line x1={X(a.q3.value)} x2={X(a.hi)} y1="40" y2="40" stroke="currentColor" />
          <line x1={X(a.lo)} x2={X(a.lo)} y1="32" y2="48" stroke="currentColor" />
          <line x1={X(a.hi)} x2={X(a.hi)} y1="32" y2="48" stroke="currentColor" />
          <rect x={X(a.q1.value)} y="24" width={X(a.q3.value) - X(a.q1.value)} height="32" fill="currentColor" fillOpacity={0.18} stroke="currentColor" />
          <line x1={X(a.q2.value)} x2={X(a.q2.value)} y1="24" y2="56" stroke="currentColor" strokeWidth="2.5" />
          {[
            ["Q1", a.q1.value],
            ["Q2", a.q2.value],
            ["Q3", a.q3.value],
          ].map(([l, v]) => (
            <text key={l as string} x={X(v as number)} y="18" textAnchor="middle" fontSize="8" fill="currentColor">
              {l}
            </text>
          ))}
          {a.outliers.map((o) => (
            <g key={o}>
              <circle cx={X(o)} cy="40" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <text x={X(o)} y="66" textAnchor="middle" fontSize="8" fill="currentColor">
                {o}
              </text>
            </g>
          ))}
        </svg>
        <div style={formula}>
          {[
            `排序（n=${a.s.length}）：${a.s.join(", ")}`,
            `Q1：${pos(a.q1)} = ${fmt(a.q1.value)}`,
            `Q2：${pos(a.q2)} = ${fmt(a.q2.value)}`,
            `Q3：${pos(a.q3)} = ${fmt(a.q3.value)}`,
            `IQR = Q3 − Q1 = ${fmt(a.q3.value)} − ${fmt(a.q1.value)} = ${fmt(a.iqr)}`,
            `下界 = Q1 − 1.5×IQR = ${fmt(a.q1.value)} − ${fmt(1.5 * a.iqr)} = ${fmt(a.lower)}`,
            `上界 = Q3 + 1.5×IQR = ${fmt(a.q3.value)} + ${fmt(1.5 * a.iqr)} = ${fmt(a.upper)}`,
            `離群值：${a.outliers.length ? a.outliers.join("、") : "無（全部落在上下界之間）"}`,
          ].join("\n")}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          盒子 = 中間 50% 的資料（Q1 到 Q3），粗線 = 中位數，鬚 = 界內最遠的資料點（{a.lo} 與 {a.hi}），圓圈 = 離群值。
        </p>
      </div>
    </Interactive>
  );
}
