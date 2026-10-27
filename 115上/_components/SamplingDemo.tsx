import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, formula, muted, panel, row } from "./prob-ui.tsx";
import { pick, rng } from "./stats-math.ts";

type Method = "simple" | "systematic" | "stratified" | "cluster";

const N = 20;
const n = 5;
const COLS = 5;
/** 12 A (filled) and 8 B (outlined), mixed so every cluster (row) holds both kinds. */
const KIND = "AABABAABAB" + "ABAABBAABA";

const METHODS: { id: Method; label: string; how: string }[] = [
  { id: "simple", label: "簡單隨機", how: "20 個單位每個被抽中的機會相同，直接隨機抽 5 個。" },
  { id: "systematic", label: "系統", how: "k = N / n = 20 / 5 = 4。從 1～4 隨機選起點 a，之後每隔 4 個抽一個：a, a+4, a+8, …" },
  { id: "stratified", label: "分層", how: "先依特徵分成 A 層（12 個）與 B 層（8 個），比例 3 : 2，所以 A 層抽 5×0.6 = 3 個、B 層抽 5×0.4 = 2 個，各層內用簡單隨機抽樣。" },
  { id: "cluster", label: "群集", how: "每一列是一個群集（4 群，每群 5 個，群內 A、B 混雜像一個小母體）。隨機抽 1 個群集，整群納入樣本。" },
];

function draw(method: Method, seed: number): number[] {
  const rand = rng(seed * 7919 + method.length);
  if (method === "simple") return pick(N, n, rand);
  if (method === "systematic") {
    const a = 1 + Math.floor(rand() * 4);
    return Array.from({ length: n }, (_, j) => a - 1 + j * 4);
  }
  if (method === "stratified") {
    const A = [...KIND].flatMap((k, i) => (k === "A" ? [i] : []));
    const B = [...KIND].flatMap((k, i) => (k === "B" ? [i] : []));
    return [...pick(A.length, 3, rand).map((i) => A[i]), ...pick(B.length, 2, rand).map((i) => B[i])];
  }
  const c = Math.floor(rand() * 4);
  return Array.from({ length: COLS }, (_, j) => c * COLS + j);
}

/** Four probability sampling methods on the same 20-unit population. */
export default function SamplingDemo() {
  const [method, setMethod] = useState<Method>("simple");
  const [seed, setSeed] = useState(1);
  const chosen = new Set(draw(method, seed));
  const info = METHODS.find((m) => m.id === method)!;
  const picked = [...chosen].sort((a, b) => a - b);
  const countA = picked.filter((i) => KIND[i] === "A").length;

  return (
    <Interactive description="四種統計（機率）抽樣示範：母體 N=20（A 類 12 個、B 類 8 個，比例 3:2），抽 n=5。簡單隨機抽樣：每個單位機會相同，直接隨機抽 5 個。系統抽樣：抽樣距離 k=N/n=4，從 1～4 隨機選起點 a，之後每隔 4 個抽一個（a, a+4, a+8…）。分層抽樣：依特徵分成 A、B 兩層，按比例 A 層抽 3 個、B 層抽 2 個，層內簡單隨機，保證每層都有代表。群集抽樣：母體分成 4 個群集（群內異質、群間相似），隨機抽 1 群整群調查。">
      <div style={panel}>
        <div style={row}>
          {METHODS.map((m) => (
            <Chip key={m.id} active={m.id === method} onClick={() => setMethod(m.id)}>
              {m.label}
            </Chip>
          ))}
          <span style={{ width: "8px" }} />
          <Chip onClick={() => setSeed((s) => s + 1)}>重抽</Chip>
        </div>
        <svg viewBox="0 0 300 200" role="img" aria-label="母體 20 個單位與被抽中的樣本" style={{ width: "100%", maxWidth: "420px", display: "block", margin: "12px 0", color: "var(--text)" }}>
          {[...KIND].map((k, i) => {
            const cx = 40 + (i % COLS) * 52;
            const cy = 30 + Math.floor(i / COLS) * 46;
            const on = chosen.has(i);
            return (
              <g key={i}>
                {method === "cluster" && i % COLS === 0 && (
                  <rect x="14" y={cy - 20} width="264" height="40" rx="8" fill="none" stroke="currentColor" strokeOpacity={0.25} strokeDasharray="4 3" />
                )}
                {on && <circle cx={cx} cy={cy} r="17" fill="none" stroke="currentColor" strokeWidth="2.5" />}
                <circle cx={cx} cy={cy} r="11" fill={k === "A" ? "currentColor" : "none"} fillOpacity={on ? 0.85 : 0.35} stroke="currentColor" strokeOpacity={on ? 1 : 0.5} />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill={k === "A" ? "var(--background)" : "currentColor"}>
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
        <p style={{ ...muted, margin: 0 }}>實心 = A 類（12 個），空心 = B 類（8 個）。外圈 = 被抽中。</p>
        <div style={formula}>
          {`${info.how}\n樣本編號：${picked.map((i) => i + 1).join(", ")}（A 類 ${countA} 個、B 類 ${n - countA} 個）`}
        </div>
      </div>
    </Interactive>
  );
}
