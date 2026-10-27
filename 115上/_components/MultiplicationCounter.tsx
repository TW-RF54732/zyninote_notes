import { useState } from "react";
import { Interactive } from "zyninote";
import { formula, muted, panel, row } from "./prob-ui.tsx";

const ITEMS = ["T-shirt", "牛仔褲", "襪子", "帽子"];

/** Multiplication principle: the number of combinations is the product of each step's choices. */
export default function MultiplicationCounter() {
  const [counts, setCounts] = useState([9, 6, 2, 5]);
  const total = counts.reduce((p, c) => p * c, 1);
  const set = (k: number, v: number) => setCounts((cs) => cs.map((c, j) => (j === k ? Math.max(1, Math.min(20, v || 1)) : c)));

  return (
    <Interactive description="多步驟乘法原理：總結果數等於各步驟可能結果數的乘積。服裝搭配例：9 件 T-shirt × 6 件牛仔褲 × 2 雙襪子 × 5 頂帽子 = 540 種搭配，畫樹狀圖會有 540 個末端，所以直接相乘。">
      <div style={panel}>
        <div style={{ ...row, gap: "12px" }}>
          {ITEMS.map((name, k) => (
            <label key={name} style={{ display: "grid", gap: "4px", fontSize: "var(--fs-sm)" }}>
              <span style={{ color: "var(--muted)" }}>{name}</span>
              <input
                type="number"
                min={1}
                max={20}
                value={counts[k]}
                onChange={(e) => set(k, Number(e.target.value))}
                style={{ width: "72px", font: "inherit", padding: "4px 8px", color: "var(--text)", background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
              />
            </label>
          ))}
        </div>
        <div style={formula}>
          搭配方式 = {counts.join(" × ")} = {total}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>改改看任一項的件數：總數會按比例放大，這就是樹狀圖畫不下時改用乘法的原因。</p>
      </div>
    </Interactive>
  );
}
