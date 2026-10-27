import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row, Slider, tint } from "./prob-ui.tsx";

type State = { a: number; b: number; i: number };

const PRESETS: { label: string; s: State }[] = [
  { label: "牛奶或麵包", s: { a: 0.4, b: 0.3, i: 0.1 } },
  { label: "流行或嘻哈", s: { a: 0.6, b: 0.25, i: 0.15 } },
  { label: "A 或黑色牌", s: { a: 4 / 52, b: 26 / 52, i: 2 / 52 } },
  { label: "紅心或黑桃", s: { a: 13 / 52, b: 13 / 52, i: 0 } },
  { label: "進球或犯規", s: { a: 0.4, b: 0.1, i: 0 } },
];

/** Keep P(A∩B) feasible: max(0, a+b−1) ≤ i ≤ min(a, b). */
function normalize({ a, b, i }: State): State {
  const lo = Math.max(0, a + b - 1);
  const hi = Math.min(a, b);
  return { a, b, i: Math.min(hi, Math.max(lo, i)) };
}

/** Bar model of the addition rule: A and B as segments of S, overlap counted once. */
export default function AdditionRule() {
  const [s, setS] = useState<State>(PRESETS[0].s);
  const { a, b, i } = s;
  const union = a + b - i;
  const exclusive = i < 1e-9;
  const W = 300;
  const x = (p: number) => 10 + p * W;

  return (
    <Interactive description="加法規則的長條模型：樣本空間 S 長度為 1，A 與 B 是其中的區段，重疊部分是 A∩B。P(A∪B)=P(A)+P(B)−P(A∩B)，交集被 A、B 各算一次所以要減一次（Rule 4）；交集為 0 時是互斥事件，直接相加（Rule 5）；兩者都不發生的機率是 1−P(A∪B)（餘集法則）。例：牛奶 0.4、麵包 0.3、兩者皆買 0.1，買任一產品 0.6；A 或黑色牌 4/52+26/52−2/52=28/52≈0.538；紅心或黑桃互斥 13/52+13/52=26/52；進球 0.4 或犯規 0.1 互斥得 0.5。">
      <div style={panel}>
        <div style={row}>
          {PRESETS.map((p) => (
            <Chip key={p.label} active={p.s.a === a && p.s.b === b && p.s.i === i} onClick={() => setS(p.s)}>
              {p.label}
            </Chip>
          ))}
        </div>
        <div style={{ display: "grid", gap: "4px", marginTop: "12px" }}>
          <Slider label="P(A)" value={a} onChange={(v) => setS(normalize({ ...s, a: v }))} />
          <Slider label="P(B)" value={b} onChange={(v) => setS(normalize({ ...s, b: v }))} />
          <Slider label="P(A∩B)" value={i} max={Math.min(a, b)} onChange={(v) => setS(normalize({ ...s, i: v }))} />
        </div>
        <svg viewBox="0 0 320 150" role="img" aria-label="A 與 B 在樣本空間中的區段" style={{ width: "100%", display: "block", margin: "12px 0", color: "var(--text)" }}>
          <text x="10" y="14" fill="currentColor" fontSize="12" opacity={0.7}>樣本空間 S = 1</text>
          <rect x={x(0)} y="20" width={W} height="22" fill="none" stroke="currentColor" strokeOpacity={0.5} />
          <rect x={x(0)} y="20" width={a * W} height="22" fill="currentColor" fillOpacity={0.35} />
          <text x={x(0) + 4} y="36" fill="currentColor" fontSize="12">A</text>
          <rect x={x(0)} y="50" width={W} height="22" fill="none" stroke="currentColor" strokeOpacity={0.5} />
          <rect x={x(a - i)} y="50" width={b * W} height="22" fill="currentColor" fillOpacity={0.35} />
          <text x={x(a - i) + 4} y="66" fill="currentColor" fontSize="12">B</text>
          <rect x={x(0)} y="90" width={W} height="22" fill="none" stroke="currentColor" strokeOpacity={0.5} />
          <rect x={x(0)} y="90" width={union * W} height="22" fill="currentColor" fillOpacity={0.35} />
          {!exclusive && <rect x={x(a - i)} y="90" width={i * W} height="22" fill="currentColor" fillOpacity={0.5} />}
          <text x={x(0) + 4} y="106" fill="currentColor" fontSize="12">A∪B</text>
          {!exclusive && (
            <>
              <line x1={x(a - i)} x2={x(a - i)} y1="18" y2="116" stroke="currentColor" strokeDasharray="3 3" />
              <line x1={x(a)} x2={x(a)} y1="18" y2="116" stroke="currentColor" strokeDasharray="3 3" />
              <text x={x(a - i / 2)} y="132" fill="currentColor" fontSize="12" textAnchor="middle">A∩B</text>
            </>
          )}
          <text x={x(1)} y="132" fill="currentColor" fontSize="12" textAnchor="end" opacity={0.7}>
            都不發生 {fmt(1 - union, 3)}
          </text>
        </svg>
        <p style={{ margin: 0, padding: "4px 8px", borderRadius: "var(--radius-sm)", background: tint(8) }}>
          {exclusive ? "沒有交集 → 互斥，用 Rule 5：直接相加。" : "有交集 → 非互斥，用 Rule 4：扣掉重複計算的交集。"}
        </p>
        <div style={formula}>
          {exclusive
            ? `P(A∪B) = P(A) + P(B) = ${fmt(a)} + ${fmt(b)} = ${fmt(union)}`
            : `P(A∪B) = P(A) + P(B) − P(A∩B) = ${fmt(a)} + ${fmt(b)} − ${fmt(i)} = ${fmt(union)}`}
          {`\nP(都不發生) = 1 − P(A∪B) = ${fmt(1 - union)}`}
        </div>
        {!exclusive && (
          <p style={{ ...muted, margin: "8px 0 0" }}>
            忘了扣交集會得到 {fmt(a + b)}，多算了 {fmt(i)}
            {a + b > 1 + 1e-9 ? "，甚至超過 1，違反 Rule 1。" : "。"}
          </p>
        )}
      </div>
    </Interactive>
  );
}
