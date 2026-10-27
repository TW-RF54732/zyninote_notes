import { useState } from "react";
import { Interactive } from "zyninote";
import { fmt, formula, muted, panel, Slider } from "./prob-ui.tsx";
import { mean, percentile, sorted } from "./stats-math.ts";

type Props = {
  title: string;
  data: number[];
  /** Index (in data) of the value the slider moves. */
  moveIndex: number;
  maxValue: number;
  unit: string;
};

/** Drag one value out to an extreme: the mean follows it, the median stays put. */
export default function MeanMedianOutlier({ title, data, moveIndex, maxValue, unit }: Props) {
  const original = data[moveIndex];
  const [v, setV] = useState(original);
  const xs = data.map((x, i) => (i === moveIndex ? v : x));
  const m = mean(xs);
  const md = percentile(xs, 50).value;
  const lo = Math.min(...data) * 0.9;
  const hi = maxValue * 1.02;
  const X = (x: number) => 12 + ((x - lo) / (hi - lo)) * 296;
  const skew = m > md + 1e-9 ? "右偏（平均數 > 中位數）" : m < md - 1e-9 ? "左偏（平均數 < 中位數）" : "對稱（平均數 = 中位數）";
  const fmtK = (x: number) => fmt(x, 2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <Interactive
      description={`極端值對平均數與中位數的影響：${title}，原始資料 ${data.join(", ")}（${unit}），平均數 ${fmtK(mean(data))}、中位數 ${fmtK(percentile(data, 50).value)}。把 ${original} 改成 ${maxValue} 後，平均數變成 ${fmtK(mean(data.map((x, i) => (i === moveIndex ? maxValue : x))))}，中位數仍是 ${fmtK(percentile(data.map((x, i) => (i === moveIndex ? maxValue : x)), 50).value)}。平均數用到每一筆數值的大小，所以被極端值拉走；中位數只看排序後中間位置，所以不受影響。平均數大於中位數代表右偏。`}
    >
      <div style={panel}>
        <Slider label="最大那筆" value={v} min={Math.min(...data)} max={maxValue} step={1000} onChange={setV} />
        <svg viewBox="0 0 320 90" role="img" aria-label="資料點、平均數與中位數" style={{ width: "100%", display: "block", margin: "12px 0", color: "var(--text)" }}>
          <line x1="8" x2="312" y1="50" y2="50" stroke="currentColor" strokeOpacity={0.4} />
          {xs.map((x, i) => (
            <circle key={i} cx={X(x)} cy="50" r="5" fill="currentColor" fillOpacity={i === moveIndex ? 0.95 : 0.55} />
          ))}
          <line x1={X(md)} x2={X(md)} y1="58" y2="78" stroke="currentColor" strokeWidth="2" />
          <text x={X(md)} y="88" textAnchor="middle" fontSize="9" fill="currentColor">
            中位數
          </text>
          <line x1={X(m)} x2={X(m)} y1="20" y2="42" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
          <text x={X(m)} y="14" textAnchor="middle" fontSize="9" fill="currentColor">
            平均數
          </text>
        </svg>
        <div style={formula}>
          {`排序：${sorted(xs).map(fmtK).join(", ")}\n平均數 x̄ = Σx / n = ${fmtK(xs.reduce((s, x) => s + x, 0))} / ${xs.length} = ${fmtK(m)}\n中位數：i = n/2 = ${xs.length / 2}${xs.length % 2 ? ` → 進位到第 ${Math.ceil(xs.length / 2)} 個` : ` → 第 ${xs.length / 2} 與 ${xs.length / 2 + 1} 個的平均`} = ${fmtK(md)}`}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>{skew}。有極端值時，中位數比平均數更能代表「典型」的值。</p>
      </div>
    </Interactive>
  );
}
