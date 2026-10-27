import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";

type Dataset = {
  label: string;
  xs: number[];
  /** Either probabilities, or raw frequencies that are first turned into relative frequencies. */
  weights: number[];
  frequencies?: boolean;
  unit: string;
};
type Props = { datasets: Dataset[] };

const cell: CSSProperties = { padding: "4px 8px", borderBottom: "1px solid var(--line)", textAlign: "right", whiteSpace: "nowrap" };

/** E(X) = Σ x·P(x) and Var(X) = Σ (x − μ)²·P(x), one column at a time. */
export default function ExpectationTable({ datasets }: Props) {
  const [k, setK] = useState(0);
  const [showVar, setShowVar] = useState(false);
  const d = datasets[k];
  const total = d.weights.reduce((s, w) => s + w, 0);
  const ps = d.frequencies ? d.weights.map((w) => w / total) : d.weights;
  const xp = d.xs.map((x, i) => x * ps[i]);
  const mu = xp.reduce((s, v) => s + v, 0);
  const dev2p = d.xs.map((x, i) => (x - mu) ** 2 * ps[i]);
  const v = dev2p.reduce((s, x) => s + x, 0);

  const describe = (ds: Dataset) => {
    const t = ds.weights.reduce((s, w) => s + w, 0);
    const p = ds.frequencies ? ds.weights.map((w) => w / t) : ds.weights;
    const m = ds.xs.reduce((s, x, i) => s + x * p[i], 0);
    const vv = ds.xs.reduce((s, x, i) => s + (x - m) ** 2 * p[i], 0);
    return `${ds.label}：x = ${ds.xs.join(", ")}，P(x) = ${p.map((x) => fmt(x, 4)).join(", ")}${ds.frequencies ? `（由次數 ${ds.weights.join(", ")} ÷ ${t}）` : ""}；E(X) = ${fmt(m, 4)}，Var(X) = ${fmt(vv, 4)}，σ = ${fmt(Math.sqrt(vv), 4)}`;
  };

  return (
    <Interactive
      description={`離散隨機變數的期望值與標準差：期望值 E(X)=Σx·P(x)，是長期重複試驗下的平均（母體平均數 μ）；變異數 Var(X)=Σ(x−μ)²·P(x)，標準差 σ=√Var(X)，衡量結果的不確定性（風險）。${datasets.map(describe).join("。")}。`}
    >
      <div style={panel}>
        <div style={row}>
          {datasets.map((x, i) => (
            <Chip key={x.label} active={i === k} onClick={() => setK(i)}>
              {x.label}
            </Chip>
          ))}
          <span style={{ width: "8px" }} />
          <Chip active={showVar} onClick={() => setShowVar(!showVar)}>
            加上變異數欄
          </Chip>
        </div>
        <div style={{ overflowX: "auto", marginTop: "12px" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "var(--fs-sm)", fontVariantNumeric: "tabular-nums", margin: 0 }}>
            <thead>
              <tr>
                {["x", ...(d.frequencies ? ["次數"] : []), "P(x)", "x·P(x)", ...(showVar ? [`(x − ${fmt(mu, 4)})²·P(x)`] : [])].map((h) => (
                  <th key={h} style={{ ...cell, color: "var(--muted)", fontWeight: "normal" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.xs.map((x, i) => (
                <tr key={x}>
                  <td style={cell}>{x}</td>
                  {d.frequencies && <td style={cell}>{d.weights[i]}</td>}
                  <td style={cell}>{d.frequencies ? `${d.weights[i]}/${total} = ${fmt(ps[i])}` : fmt(ps[i])}</td>
                  <td style={cell}>{fmt(xp[i])}</td>
                  {showVar && <td style={cell}>{fmt(dev2p[i])}</td>}
                </tr>
              ))}
              <tr>
                <td style={{ ...cell, color: "var(--muted)" }}>Σ</td>
                {d.frequencies && <td style={{ ...cell, color: "var(--muted)" }}>{total}</td>}
                <td style={{ ...cell, color: "var(--muted)" }}>1</td>
                <td style={{ ...cell, color: "var(--muted)" }}>E(X) = {fmt(mu)}</td>
                {showVar && <td style={{ ...cell, color: "var(--muted)" }}>Var = {fmt(v)}</td>}
              </tr>
            </tbody>
          </table>
        </div>
        <div style={formula}>
          {`E(X) = Σ x·P(x) = ${d.xs.map((x, i) => `${x}(${fmt(ps[i])})`).join(" + ")} = ${fmt(mu)} ${d.unit}`}
          {showVar ? `\nVar(X) = Σ (x − μ)²·P(x) = ${fmt(v)}，σ = √${fmt(v)} = ${fmt(Math.sqrt(v), 3)} ${d.unit}` : ""}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>每個可能值乘上自己的機率（權重）再相加，就是機率加權的平均。</p>
      </div>
    </Interactive>
  );
}
