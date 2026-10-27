import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, formula, muted, panel, row, useSvgId } from "./prob-ui.tsx";

const MODES = {
  comp: { label: "餘集 Aᶜ", text: "發生事件 A 以外的所有可能性。", rule: "P(Aᶜ) = 1 − P(A)" },
  inter: { label: "交集 A∩B", text: "事件 A 與事件 B 同時發生的部分。", rule: "P(A∩B)：聯合機率" },
  union: { label: "聯集 A∪B", text: "發生 A 或發生 B，或兩者皆發生；重疊部分只算一次。", rule: "P(A∪B) = P(A) + P(B) − P(A∩B)" },
  excl: { label: "互斥", text: "A 與 B 不可能同時發生，沒有交集。", rule: "P(A∩B) = 0，所以 P(A∪B) = P(A) + P(B)" },
} as const;

type Mode = keyof typeof MODES;

/** Venn diagram that highlights complement, intersection, union and mutually exclusive events. */
export default function SetOpsVenn() {
  const [mode, setMode] = useState<Mode>("inter");
  const maskId = useSvgId("venn-mask");
  const clipId = useSvgId("venn-clip");
  const apart = mode === "excl";
  const a = apart ? { cx: 105, r: 52 } : { cx: 135, r: 62 };
  const b = apart ? { cx: 215, r: 52 } : { cx: 185, r: 62 };
  const fill = 0.4;

  return (
    <Interactive description="事件運算的文氏圖（大方框是樣本空間 S）：餘集 Aᶜ 是 A 以外的所有可能性，P(Aᶜ)=1−P(A)；交集 A∩B 是 A 與 B 同時發生的部分（聯合機率）；聯集 A∪B 是發生 A 或 B 或兩者皆發生，重疊只算一次，P(A∪B)=P(A)+P(B)−P(A∩B)；互斥事件沒有交集，P(A∩B)=0，P(A∪B)=P(A)+P(B)。">
      <div style={panel}>
        <div style={row}>
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <Chip key={m} active={m === mode} onClick={() => setMode(m)}>
              {MODES[m].label}
            </Chip>
          ))}
        </div>
        <svg viewBox="0 0 320 200" role="img" aria-label={MODES[mode].label} style={{ width: "100%", maxWidth: "420px", display: "block", margin: "12px auto", color: "var(--text)" }}>
          <defs>
            <mask id={maskId}>
              <rect x="0" y="0" width="320" height="200" fill="white" />
              <circle cx={a.cx} cy="100" r={a.r} fill="black" />
            </mask>
            <clipPath id={clipId}>
              <circle cx={a.cx} cy="100" r={a.r} />
            </clipPath>
          </defs>
          {mode === "comp" && <rect x="10" y="10" width="300" height="180" fill="currentColor" fillOpacity={fill} mask={`url(#${maskId})`} />}
          {mode === "inter" && <circle cx={b.cx} cy="100" r={b.r} fill="currentColor" fillOpacity={fill} clipPath={`url(#${clipId})`} />}
          {(mode === "union" || mode === "excl") && (
            <g opacity={fill}>
              <circle cx={a.cx} cy="100" r={a.r} fill="currentColor" />
              <circle cx={b.cx} cy="100" r={b.r} fill="currentColor" />
            </g>
          )}
          <rect x="10" y="10" width="300" height="180" fill="none" stroke="currentColor" strokeOpacity={0.6} />
          <circle cx={a.cx} cy="100" r={a.r} fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx={b.cx} cy="100" r={b.r} fill="none" stroke="currentColor" strokeWidth="1.5" />
          <text x="22" y="32" fill="currentColor" fontSize="16">S</text>
          <text x={a.cx - (apart ? 6 : 34)} y="106" fill="currentColor" fontSize="18">A</text>
          <text x={b.cx + (apart ? -6 : 22)} y="106" fill="currentColor" fontSize="18">B</text>
        </svg>
        <p style={{ margin: 0 }}>{MODES[mode].text}</p>
        <div style={formula}>{MODES[mode].rule}</div>
        <p style={{ ...muted, margin: "8px 0 0" }}>深色區域就是該事件。</p>
      </div>
    </Interactive>
  );
}
