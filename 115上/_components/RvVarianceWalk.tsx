import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row, tint } from "./prob-ui.tsx";

type Dataset = { label: string; xs: number[]; ps: number[]; unit: string };
type Props = { datasets: Dataset[] };

const cell: CSSProperties = { padding: "4px 8px", borderBottom: "1px solid var(--line)", textAlign: "right", whiteSpace: "nowrap" };

const STEPS = [
  { title: "看分配", text: "每個可能的結果 x，各有一個機率 P(x)。長條越高，越常發生。" },
  { title: "找平均 μ", text: "把每個 x 乘上它的機率再全部加起來，得到 μ。它是這個分配的「平衡點」：把長條想成砝碼，μ 就是蹺蹺板剛好不傾斜的位置。" },
  { title: "算離差 x − μ", text: "每個 x 離平衡點多遠？箭頭指向右是正、指向左是負。如果直接加起來，正負會互相抵消成 0，所以下一步要平方。" },
  { title: "平方", text: "把離差平方，等於以離差為邊長畫一個正方形，面積就是 (x − μ)²。離得越遠，面積暴增，所以離群的值對變異數影響很大。" },
  { title: "乘上機率", text: "每個正方形面積乘上它發生的機率 P(x)：常發生的值權重大，很少發生的權重小。" },
  { title: "加總得變異數", text: "把所有加權面積加起來就是變異數 σ²，開根號得標準差 σ，單位回到和 x 一樣。" },
];

/** Discrete-distribution variance, one visual step at a time: bars → μ → deviations → squares → weighted → sum. */
export default function RvVarianceWalk({ datasets }: Props) {
  const [k, setK] = useState(0);
  const [step, setStep] = useState(0);
  const d = datasets[k];
  const { xs, ps } = d;
  const xp = xs.map((x, i) => x * ps[i]);
  const mu = xp.reduce((s, v) => s + v, 0);
  const dev = xs.map((x) => x - mu);
  const sq = dev.map((v) => v * v);
  const w = sq.map((v, i) => v * ps[i]);
  const variance = w.reduce((s, v) => s + v, 0);
  const sigma = Math.sqrt(variance);

  const lo = Math.min(...xs, mu);
  const hi = Math.max(...xs, mu);
  const W = 600;
  const padX = 50;
  const unit = (W - 2 * padX) / Math.max(hi - lo, 1e-9);
  const sx = (x: number) => padX + (x - lo) * unit;
  const maxP = Math.max(...ps);
  const barH = 90;
  const maxSide = Math.max(...dev.map(Math.abs)) * unit;
  const sqScale = Math.min(1, 110 / Math.max(maxSide, 1e-9));
  const axisY = 20 + barH;
  const sqTop = axisY + 34;
  const H = step >= 3 ? sqTop + maxSide * sqScale + 24 : axisY + 60;

  const describe = (ds: Dataset) => {
    const m = ds.xs.reduce((s, x, i) => s + x * ds.ps[i], 0);
    const v = ds.xs.reduce((s, x, i) => s + (x - m) ** 2 * ds.ps[i], 0);
    return `${ds.label}：x=${ds.xs.join(", ")}，P(x)=${ds.ps.join(", ")}；μ=${fmt(m)}，各 (x−μ)²P(x)=${ds.xs.map((x, i) => fmt((x - m) ** 2 * ds.ps[i])).join(", ")}，σ²=${fmt(v)}，σ=${fmt(Math.sqrt(v), 3)} ${ds.unit}`;
  };

  const show = (col: number) => step >= col;
  const heads = ["x", "P(x)", "x·P(x)", "x − μ", "(x − μ)²", "(x − μ)²·P(x)"];
  // column c becomes visible at the step that introduces it
  const appears = [0, 0, 1, 2, 3, 4];

  return (
    <Interactive
      description={`離散隨機變數變異數的圖解逐步算法，共六步：1. 看分配（x 與 P(x) 的長條圖）；2. 求平均 μ=Σx·P(x)，即長條的平衡點；3. 每個 x 減 μ 得離差（有正有負，直接加會抵消）；4. 離差平方，等於以離差為邊長的正方形面積；5. 每個平方乘上機率 P(x) 加權；6. 加總得變異數 σ²=Σ(x−μ)²P(x)，開根號得標準差 σ。${datasets.map(describe).join("。")}。`}
    >
      <div style={panel}>
        <div style={row}>
          {datasets.map((x, i) => (
            <Chip key={x.label} active={i === k} onClick={() => { setK(i); setStep(0); }}>
              {x.label}
            </Chip>
          ))}
        </div>

        <div style={{ ...row, marginTop: "12px" }}>
          {STEPS.map((s, i) => (
            <Chip key={s.title} active={i === step} onClick={() => setStep(i)}>
              {i + 1}. {s.title}
            </Chip>
          ))}
        </div>
        <p style={{ margin: "10px 0 0", color: "var(--text)" }}>{STEPS[step].text}</p>

        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="變異數逐步圖解" style={{ width: "100%", height: "auto", marginTop: "8px", display: "block" }}>
          <line x1={padX - 20} x2={W - padX + 20} y1={axisY} y2={axisY} stroke="var(--line-strong)" />
          {xs.map((x, i) => {
            const h = (ps[i] / maxP) * barH;
            return (
              <g key={x}>
                <rect x={sx(x) - 14} y={axisY - h} width={28} height={h} fill={tint(step >= 4 ? 55 : 35)} />
                <text x={sx(x)} y={axisY - h - 5} textAnchor="middle" fontSize="13" fill="var(--text-body)">
                  {fmt(ps[i])}
                </text>
                <text x={sx(x)} y={axisY + 16} textAnchor="middle" fontSize="13" fill="var(--text)">
                  {fmt(x)}
                </text>
              </g>
            );
          })}

          {step >= 1 && (
            <g>
              <polygon points={`${sx(mu)},${axisY + 2} ${sx(mu) - 8},${axisY + 14} ${sx(mu) + 8},${axisY + 14}`} fill="var(--text)" />
              <text x={sx(mu)} y={axisY + 30} textAnchor="middle" fontSize="13" fill="var(--text)">
                μ = {fmt(mu)}
              </text>
            </g>
          )}

          {(step === 2) &&
            xs.map((x, i) =>
              Math.abs(dev[i]) < 1e-9 ? null : (
                <g key={x}>
                  <line x1={sx(mu)} x2={sx(x)} y1={axisY + 44} y2={axisY + 44} stroke="var(--text)" strokeWidth="2" markerEnd="url(#rvw-arrow)" />
                  <text x={(sx(mu) + sx(x)) / 2} y={axisY + 58} textAnchor="middle" fontSize="13" fill="var(--text)">
                    {fmt(x)} − {fmt(mu)} = {fmt(dev[i])}
                  </text>
                </g>
              ),
            )}

          {step >= 3 &&
            xs.map((x, i) => {
              const side = Math.abs(dev[i]) * unit * sqScale;
              if (side < 1e-6) return (
                <text key={x} x={sx(x)} y={sqTop + 14} textAnchor="middle" fontSize="13" fill="var(--muted)">
                  0
                </text>
              );
              return (
                <g key={x}>
                  <rect x={sx(x) - side / 2} y={sqTop} width={side} height={side} fill={tint(step >= 4 ? 10 + ps[i] * 60 : 22)} stroke="var(--text-body)" />
                  <text x={sx(x)} y={sqTop + side / 2 + 5} textAnchor="middle" fontSize="13" fill="var(--text)">
                    {fmt(sq[i])}
                  </text>
                </g>
              );
            })}

          <defs>
            <marker id="rvw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill="var(--text)" />
            </marker>
          </defs>
        </svg>
        {step >= 3 && sqScale < 1 && <p style={muted}>正方形已等比例縮小以便顯示,數字是真正的面積。</p>}

        <div style={{ overflowX: "auto", marginTop: "12px" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "var(--fs-sm)", fontVariantNumeric: "tabular-nums", margin: 0 }}>
            <thead>
              <tr>
                {heads.map((h, c) =>
                  show(appears[c]) ? (
                    <th key={h} style={{ ...cell, color: appears[c] === step ? "var(--text)" : "var(--muted)", fontWeight: appears[c] === step ? "bold" : "normal" }}>
                      {h}
                    </th>
                  ) : null,
                )}
              </tr>
            </thead>
            <tbody>
              {xs.map((x, i) => {
                const vals = [fmt(x), fmt(ps[i]), fmt(xp[i]), fmt(dev[i]), fmt(sq[i]), fmt(w[i])];
                return (
                  <tr key={x}>
                    {vals.map((v, c) =>
                      show(appears[c]) ? (
                        <td key={c} style={{ ...cell, background: appears[c] === step ? tint(8) : undefined }}>
                          {v}
                        </td>
                      ) : null,
                    )}
                  </tr>
                );
              })}
              <tr>
                {heads.map((h, c) =>
                  show(appears[c]) ? (
                    <td key={h} style={{ ...cell, color: "var(--text)", fontWeight: "bold" }}>
                      {c === 0 ? "合計" : c === 1 ? fmt(ps.reduce((s, v) => s + v, 0)) : c === 2 ? fmt(mu) : c === 5 && step >= 5 ? fmt(variance) : c === 5 ? "…" : ""}
                    </td>
                  ) : null,
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {step >= 1 && (
          <div style={formula}>
            {[
              `μ = ${xs.map((x, i) => `${fmt(x)}×${fmt(ps[i])}`).join(" + ")} = ${fmt(mu)}`,
              ...(step >= 5
                ? [
                    `σ² = ${w.map((v) => fmt(v)).join(" + ")} = ${fmt(variance)}`,
                    `σ = √${fmt(variance)} = ${fmt(sigma, 3)} ${d.unit}`,
                  ]
                : []),
            ].join("\n")}
          </div>
        )}

        <div style={{ ...row, marginTop: "12px" }}>
          <Chip onClick={() => setStep(Math.max(0, step - 1))}>上一步</Chip>
          <Chip onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}>下一步</Chip>
        </div>
      </div>
    </Interactive>
  );
}
