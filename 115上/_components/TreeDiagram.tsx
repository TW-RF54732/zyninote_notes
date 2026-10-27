import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, formula, muted, panel, row } from "./prob-ui.tsx";

const KINDS = {
  coin: { label: "丟硬幣", step: "第 {n} 枚", options: ["H", "T"], legend: "H = 正面，T = 反面" },
  call: { label: "推銷電話", step: "第 {n} 位客人", options: ["B", "N"], legend: "B = 買，N = 不買" },
} as const;

type Kind = keyof typeof KINDS;

const ROW = 26;
const COL = 80;

/** Tree diagram of a 1–3 step experiment with two outcomes per step. */
export default function TreeDiagram() {
  const [kind, setKind] = useState<Kind>("coin");
  const [steps, setSteps] = useState(2);
  const { options, legend, step } = KINDS[kind];

  const leaves: string[][] = [[]];
  for (let s = 0; s < steps; s++) leaves.splice(0, leaves.length, ...leaves.flatMap((p) => options.map((o) => [...p, o])));

  // Node at depth d covering leaves [i, i + span): y is the middle of its leaves.
  const edges: { x1: number; y1: number; x2: number; y2: number; label: string }[] = [];
  const yOf = (start: number, span: number) => 14 + (start + (span - 1) / 2) * ROW;
  for (let d = 0; d < steps; d++) {
    const span = 2 ** (steps - d);
    for (let start = 0; start < leaves.length; start += span) {
      options.forEach((o, k) => {
        const childStart = start + (k * span) / 2;
        edges.push({ x1: 16 + d * COL, y1: yOf(start, span), x2: 16 + (d + 1) * COL, y2: yOf(childStart, span / 2), label: o });
      });
    }
  }
  const height = leaves.length * ROW + 8;
  const leafX = 16 + steps * COL + 12;

  return (
    <Interactive description="樹狀圖逐步列出多步驟試驗的所有樣本點：丟 1 枚硬幣 2 種、2 枚 2×2=4 種 (H,H)(H,T)(T,H)(T,T)、3 枚 2×2×2=8 種；推銷電話打給 3 位客人，每位買(B)或不買(N)，共 8 種結果 (B,B,B)…(N,N,N)。每多一步，樣本點數就乘上該步的結果數。">
      <div style={panel}>
        <div style={row}>
          {(Object.keys(KINDS) as Kind[]).map((k) => (
            <Chip key={k} active={k === kind} onClick={() => setKind(k)}>
              {KINDS[k].label}
            </Chip>
          ))}
          <span style={{ width: "8px" }} />
          {[1, 2, 3].map((n) => (
            <Chip key={n} active={n === steps} onClick={() => setSteps(n)}>
              {n} 步
            </Chip>
          ))}
        </div>
        <svg viewBox={`0 0 ${leafX + 110} ${height}`} role="img" aria-label="樹狀圖" style={{ width: "100%", maxWidth: `${(leafX + 110) * 1.3}px`, display: "block", margin: "12px 0", color: "var(--text)" }}>
          {edges.map((e, k) => (
            <g key={k}>
              <path d={`M${e.x1},${e.y1} L${e.x1 + 24},${e.y2} L${e.x2},${e.y2}`} fill="none" stroke="currentColor" strokeOpacity={0.55} />
              <text x={e.x1 + 30} y={e.y2 - 4} fill="currentColor" fontSize="12">{e.label}</text>
            </g>
          ))}
          <circle cx="16" cy={yOf(0, leaves.length)} r="4" fill="currentColor" />
          {leaves.map((l, k) => (
            <text key={k} x={leafX} y={yOf(k, 1) + 4} fill="currentColor" fontSize="12" fontFamily="var(--mono)">
              ({l.join(",")})
            </text>
          ))}
        </svg>
        <p style={{ ...muted, margin: 0 }}>
          {legend}。每一欄是一步：{Array.from({ length: steps }, (_, k) => step.replace("{n}", String(k + 1))).join("、")}。
        </p>
        <div style={formula}>
          樣本點數 = {Array(steps).fill(2).join(" × ")} = {leaves.length}
        </div>
      </div>
    </Interactive>
  );
}
