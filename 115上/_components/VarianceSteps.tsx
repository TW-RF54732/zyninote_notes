import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";
import { mean } from "./stats-math.ts";

type Dataset = { label: string; data: number[] };
type Props = { datasets: Dataset[]; unit: string };

const cell: CSSProperties = { padding: "4px 10px", borderBottom: "1px solid var(--line)", textAlign: "right", whiteSpace: "nowrap" };

/** Variance step by step: deviations, squares, sum, divide by n − 1 (sample) or N (population). */
export default function VarianceSteps({ datasets, unit }: Props) {
  const [k, setK] = useState(0);
  const [sample, setSample] = useState(true);
  const xs = datasets[k].data;
  const n = xs.length;
  const m = mean(xs);
  const dev = xs.map((x) => x - m);
  const sq = dev.map((d) => d * d);
  const ss = sq.reduce((s, x) => s + x, 0);
  const div = sample ? n - 1 : n;
  const v = ss / div;
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const sumX = xs.reduce((s, x) => s + x, 0);

  const describe = (ds: Dataset) => {
    const mm = mean(ds.data);
    const s2 = ds.data.reduce((s, x) => s + (x - mm) ** 2, 0);
    return `${ds.label}（${ds.data.join(", ")}）：平均 ${fmt(mm)}，離差平方和 ${fmt(s2)}，樣本變異數 s²=${fmt(s2)}/${ds.data.length - 1}=${fmt(s2 / (ds.data.length - 1))}，s=${fmt(Math.sqrt(s2 / (ds.data.length - 1)), 3)}`;
  };

  return (
    <Interactive
      description={`變異數與標準差的計算步驟：1. 求平均數；2. 每筆減平均數得離差（離差總和必為 0）；3. 離差平方後相加；4. 樣本除以 n−1（母體除以 N）得變異數；5. 開根號得標準差，單位回到原資料的單位。${datasets.map(describe).join("。")}。標準差越小，資料越集中、品質越穩定。`}
    >
      <div style={panel}>
        <div style={row}>
          {datasets.map((d, i) => (
            <Chip key={d.label} active={i === k} onClick={() => setK(i)}>
              {d.label}
            </Chip>
          ))}
          <span style={{ width: "8px" }} />
          <Chip active={sample} onClick={() => setSample(true)}>
            樣本（n − 1）
          </Chip>
          <Chip active={!sample} onClick={() => setSample(false)}>
            母體（N）
          </Chip>
        </div>
        <div style={{ overflowX: "auto", marginTop: "12px" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "var(--fs-sm)", fontVariantNumeric: "tabular-nums", margin: 0 }}>
            <thead>
              <tr>
                {["x", `x − ${fmt(m)}`, "(x − x̄)²"].map((h) => (
                  <th key={h} style={{ ...cell, color: "var(--muted)", fontWeight: "normal" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {xs.map((x, i) => (
                <tr key={i}>
                  <td style={cell}>{x}</td>
                  <td style={cell}>{fmt(dev[i])}</td>
                  <td style={cell}>{fmt(sq[i])}</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...cell, color: "var(--muted)" }}>Σ = {fmt(sumX)}</td>
                <td style={{ ...cell, color: "var(--muted)" }}>Σ = 0</td>
                <td style={{ ...cell, color: "var(--muted)" }}>Σ = {fmt(ss)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={formula}>
          {[
            `平均數 = ${fmt(sumX)} / ${n} = ${fmt(m)}`,
            `${sample ? "s²" : "σ²"} = ${fmt(ss)} / ${sample ? `(${n} − 1)` : n} = ${fmt(v)}`,
            `${sample ? "s" : "σ"} = √${fmt(v)} = ${fmt(Math.sqrt(v), 3)} ${unit}`,
            `快速公式驗算：(Σx² − (Σx)²/${n}) / ${div} = (${fmt(sumX2)} − ${fmt(sumX * sumX)}/${n}) / ${div} = ${fmt((sumX2 - (sumX * sumX) / n) / div)}`,
          ].join("\n")}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          {sample ? "樣本除以 n − 1，結果是母體變異數的不偏估計。" : "母體除以 N。同一組數字，除以 N 會比除以 n − 1 小一點。"}
        </p>
      </div>
    </Interactive>
  );
}
