import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { fmt, formula, muted, panel, Slider, tint } from "./prob-ui.tsx";

type Hypothesis = { label: string; prior: number; likelihood: number };
type Props = {
  title: string;
  /** The evidence B that was observed, e.g. "檢驗陽性". */
  evidence: string;
  hypotheses: Hypothesis[];
  /** Imagined population for the natural-frequency counts, e.g. 1000. */
  base: number;
  /** Index of the hypothesis the question asks about. */
  target?: number;
};

const cell: CSSProperties = { padding: "4px 8px", borderBottom: "1px solid var(--line)", textAlign: "right", whiteSpace: "nowrap" };

function posterior(hs: Hypothesis[]) {
  const joint = hs.map((h) => h.prior * h.likelihood);
  const pB = joint.reduce((s, x) => s + x, 0);
  return { joint, pB, post: joint.map((j) => j / pB) };
}

/** Bayes' theorem as the course's table: prior × likelihood = joint, joint / P(B) = posterior. */
export default function BayesUpdate({ title, evidence, hypotheses, base, target = 0 }: Props) {
  const [hs, setHs] = useState(hypotheses);
  const two = hs.length === 2;
  const { joint, pB, post } = posterior(hs);
  const orig = posterior(hypotheses);
  const set = (i: number, patch: Partial<Hypothesis>) => setHs(hs.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  const setPrior = (v: number) => setHs([{ ...hs[0], prior: v }, { ...hs[1], prior: 1 - v }]);
  const bar = (values: number[], label: string) => (
    <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: "8px", alignItems: "center", fontSize: "var(--fs-sm)" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <div style={{ display: "flex", height: "16px", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--surface)" }}>
        {values.map((v, i) => (
          <div key={i} title={hs[i].label} style={{ width: `${v * 100}%`, background: i === target ? "var(--text)" : tint(28 + 14 * i), opacity: i === target ? 0.8 : 1, transition: "width .3s" }} />
        ))}
      </div>
    </div>
  );

  return (
    <Interactive
      description={`貝氏定理：${title}。觀察到「${evidence}」(B)。${hypotheses.map((h, i) => `${h.label}：先驗 P=${fmt(h.prior)}，條件 P(B|${h.label})=${fmt(h.likelihood)}，聯合 ${fmt(orig.joint[i], 5)}`).join("；")}。總機率 P(B)=各聯合機率相加=${fmt(orig.pB, 5)}。事後機率 = 聯合 / P(B)：${hypotheses.map((h, i) => `P(${h.label}|B)=${fmt(orig.post[i], 4)}`).join("、")}。以 ${base} 為基準換成人數：${hypotheses.map((h, i) => `${h.label} ${fmt(base * h.prior, 2)} 中有 ${fmt(base * orig.joint[i], 2)} 出現 ${evidence}`).join("，")}。`}
    >
      <div style={panel}>
        <div style={{ display: "grid", gap: "4px" }}>
          {two && <Slider label={`P(${hs[0].label})`} value={hs[0].prior} min={0.001} max={0.999} step={0.001} onChange={setPrior} />}
          {hs.map((h, i) => (
            <Slider key={h.label} label={`P(B|${h.label})`} value={h.likelihood} min={0} max={1} step={0.005} onChange={(v) => set(i, { likelihood: v })} />
          ))}
        </div>
        <div style={{ overflowX: "auto", marginTop: "12px" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "var(--fs-sm)", fontVariantNumeric: "tabular-nums", margin: 0 }}>
            <thead>
              <tr>
                {["事件", "先驗 P(A)", `條件 P(B|A)`, "聯合 P(A∩B)", "事後 P(A|B)", `每 ${base}`].map((h) => (
                  <th key={h} style={{ ...cell, color: "var(--muted)", fontWeight: "normal" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hs.map((h, i) => (
                <tr key={h.label} style={{ background: i === target ? tint(10) : undefined }}>
                  <td style={{ ...cell, textAlign: "left" }}>{h.label}</td>
                  <td style={cell}>{fmt(h.prior)}</td>
                  <td style={cell}>{fmt(h.likelihood)}</td>
                  <td style={cell}>
                    {fmt(h.prior)} × {fmt(h.likelihood)} = {fmt(joint[i], 5)}
                  </td>
                  <td style={cell}>{fmt(post[i], 4)}</td>
                  <td style={cell}>
                    {fmt(base * joint[i], 2)} / {fmt(base * h.prior, 2)}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ ...cell, textAlign: "left", color: "var(--muted)" }}>合計</td>
                <td style={{ ...cell, color: "var(--muted)" }}>1</td>
                <td style={cell} />
                <td style={{ ...cell, color: "var(--muted)" }}>P(B) = {fmt(pB, 5)}</td>
                <td style={{ ...cell, color: "var(--muted)" }}>1</td>
                <td style={{ ...cell, color: "var(--muted)" }}>{fmt(base * pB, 2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ display: "grid", gap: "6px", margin: "12px 0 4px" }}>
          {bar(hs.map((h) => h.prior), "先驗")}
          {bar(post, "事後")}
        </div>
        <div style={formula}>
          {`P(${hs[target].label}|${evidence}) = P(${hs[target].label}∩B) / P(B) = ${fmt(joint[target], 5)} / ${fmt(pB, 5)} = ${fmt(post[target], 4)}（${fmt(post[target] * 100, 2)}%）`}
          {`\n人數版：${evidence}的 ${fmt(base * pB, 2)} 個中，真的是「${hs[target].label}」的有 ${fmt(base * joint[target], 2)} 個`}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          {`先驗 ${fmt(hs[target].prior * 100, 2)}% → 看到「${evidence}」後修正為 ${fmt(post[target] * 100, 2)}%。`}
          {two && hs[0].prior < 0.05 ? "先驗很小時，另一組的少量誤判在人數上就壓過真正的案例。" : ""}
        </p>
      </div>
    </Interactive>
  );
}
