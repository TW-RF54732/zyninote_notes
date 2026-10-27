import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";

type Props = {
  /** Event E2, the condition, e.g. "點擊廣告". */
  condition: string;
  /** Event E1 ∩ E2, e.g. "點擊且購買". */
  joint: string;
  pCondition: number;
  pJoint: number;
  /** What P(E1 | E2) is called in this context, e.g. "轉換率". */
  name?: string;
};

/** Funnel showing how conditioning on E2 shrinks the sample space and rescales E1 ∩ E2. */
export default function Funnel({ condition, joint, pCondition, pJoint, name }: Props) {
  const [given, setGiven] = useState(false);
  const ratio = pJoint / pCondition;
  const bars = given
    ? [
        { label: `已知${condition}（新的樣本空間）`, p: 1, value: `${fmt(pCondition * 100)}% → 視為 100%` },
        { label: joint, p: ratio, value: `${fmt(ratio * 100)}%` },
      ]
    : [
        { label: "全體", p: 1, value: "100%" },
        { label: condition, p: pCondition, value: `${fmt(pCondition * 100)}%` },
        { label: joint, p: pJoint, value: `${fmt(pJoint * 100)}%` },
      ];

  return (
    <Interactive
      description={`條件機率漏斗：全體中 ${fmt(pCondition * 100)}% ${condition}（E2），${fmt(pJoint * 100)}% ${joint}（E1 且 E2）。已知 E2 發生時，樣本空間縮小為 E2，P(E1|E2)=P(E1且E2)/P(E2)=${fmt(pJoint)}/${fmt(pCondition)}=${fmt(ratio)}${name ? `，這個比例稱為${name}` : ""}。`}
    >
      <div style={panel}>
        <div style={row}>
          <Chip active={!given} onClick={() => setGiven(false)}>
            以全體為分母
          </Chip>
          <Chip active={given} onClick={() => setGiven(true)}>
            已知 {condition}
          </Chip>
        </div>
        <div style={{ display: "grid", gap: "8px", margin: "16px 0 4px" }}>
          {bars.map((b) => (
            <div key={b.label} style={{ display: "grid", gap: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
                <span>{b.label}</span>
                <span style={{ fontFamily: "var(--mono)" }}>{b.value}</span>
              </div>
              <div style={{ height: "14px", background: "var(--surface)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                <div style={{ width: `${b.p * 100}%`, height: "100%", background: "var(--text)", opacity: 0.55, transition: "width .3s" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={formula}>
          P(E1 | E2) = P(E1 且 E2) / P(E2) = {fmt(pJoint)} / {fmt(pCondition)} = {fmt(ratio)}
          {name ? `（${name}）` : ""}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          {given ? "只看已經發生條件的那一群人，分母變小，比例就變大了。" : `${joint}只佔全體的 ${fmt(pJoint * 100)}%，這是聯合機率，不是答案。`}
        </p>
      </div>
    </Interactive>
  );
}
