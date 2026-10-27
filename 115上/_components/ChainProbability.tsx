import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";

type Stage = { label: string; p: number; how: string };
type Case = { label: string; rule: 8 | 9; stages: Stage[]; note: string; replaced?: number };

const CASES: Case[] = [
  {
    label: "MATX 原料（不放回）",
    rule: 8,
    stages: [
      { label: "第 1 件是 MATX", p: 30 / 80, how: "30/80" },
      { label: "第 2 件也是 MATX", p: 29 / 79, how: "29/79" },
    ],
    replaced: (30 / 80) ** 2,
    note: "第一件拿走一個 MATX 後，剩 79 件中只有 29 件 MATX，第二次的機率跟著改變。",
  },
  {
    label: "零件良率（不放回）",
    rule: 8,
    stages: [
      { label: "第 1 個良品", p: 16 / 20, how: "16/20" },
      { label: "第 2 個良品", p: 15 / 19, how: "15/19" },
    ],
    replaced: 0.8 ** 2,
    note: "第一次的結果改變了第二次的樣本空間（總數與良品數各少 1）。",
  },
  {
    label: "銀行信貸連續審核",
    rule: 8,
    stages: [
      { label: "初步文件審核通過", p: 0.8, how: "0.8" },
      { label: "在此之中信用分數通過", p: 0.9, how: "0.9" },
    ],
    note: "必須先通過第一關才有機會面對第二關，0.9 是「已通過第一關」的條件機率。",
  },
  {
    label: "兩家門市都達標",
    rule: 9,
    stages: [
      { label: "A 門市達標", p: 0.7, how: "0.7" },
      { label: "B 門市達標", p: 0.6, how: "0.6" },
    ],
    note: "兩家表現互相獨立，B 的機率不因 A 而改變，直接相乘。",
  },
  {
    label: "雲端兩系統皆正常",
    rule: 9,
    stages: [
      { label: "核心運算系統正常", p: 0.99, how: "0.99" },
      { label: "數據備份系統正常", p: 0.98, how: "0.98" },
    ],
    note: "即使單一系統可靠度很高，兩者都要正常的聯合機率仍低於任一系統。",
  },
];

/** Joint probability as a chain: each stage keeps a fraction of what survived the previous one. */
export default function ChainProbability() {
  const [k, setK] = useState(0);
  const c = CASES[k];
  const levels = c.stages.reduce<number[]>((acc, s) => [...acc, acc[acc.length - 1] * s.p], [1]);
  const joint = levels[levels.length - 1];

  return (
    <Interactive
      description={`乘法規則求聯合機率 P(E1 且 E2)。Rule 8（一般乘法，相依）：P(E1∩E2)=P(E1)×P(E2|E1)，第二個機率是在第一個發生後的條件機率；Rule 9（獨立）：P(E1∩E2)=P(E1)×P(E2)。${CASES.map((x) => {
        const j = x.stages.reduce((s, st) => s * st.p, 1);
        return `${x.label}（Rule ${x.rule}）：${x.stages.map((s) => s.how).join("×")}=${fmt(j)}${x.replaced ? `，若放回則為 ${fmt(x.replaced)}` : ""}`;
      }).join("；")}。聯合機率一定不大於任何一個單獨的機率。`}
    >
      <div style={panel}>
        <div style={row}>
          {CASES.map((x, i) => (
            <Chip key={x.label} active={i === k} onClick={() => setK(i)}>
              {x.label}
            </Chip>
          ))}
        </div>
        <div style={{ display: "grid", gap: "8px", margin: "16px 0 4px" }}>
          {["全部", ...c.stages.map((s) => s.label)].map((label, i) => (
            <div key={label} style={{ display: "grid", gap: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
                <span>{label}</span>
                <span style={{ fontFamily: "var(--mono)" }}>
                  {i === 0 ? "1" : `× ${c.stages[i - 1].how} = ${fmt(levels[i])}`}
                </span>
              </div>
              <div style={{ height: "14px", background: "var(--surface)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                <div style={{ width: `${levels[i] * 100}%`, height: "100%", background: "var(--text)", opacity: 0.55, transition: "width .3s" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={formula}>
          {c.rule === 8
            ? `Rule 8：P(E1 且 E2) = P(E1) × P(E2|E1) = ${c.stages.map((s) => s.how).join(" × ")} = ${fmt(joint)}`
            : `Rule 9：P(E1 且 E2) = P(E1) × P(E2) = ${c.stages.map((s) => s.how).join(" × ")} = ${fmt(joint)}`}
          {c.replaced ? `\n若「放回」（獨立）：${fmt(c.stages[0].p)} × ${fmt(c.stages[0].p)} = ${fmt(c.replaced)}` : ""}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>{c.note}</p>
      </div>
    </Interactive>
  );
}
