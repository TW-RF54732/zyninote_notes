import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, muted, panel, row, Slider, tint } from "./prob-ui.tsx";

const PRESETS = [
  { label: "基金報酬率機率 1.2", p: 1.2 },
  { label: "推播點擊率 −0.02", p: -0.02 },
  { label: "點單成功率 0.85", p: 0.85 },
  { label: "失敗率 0.15", p: 0.15 },
];

const MIN = -0.3;
const MAX = 1.3;

/** Rule 1: every probability lies in [0, 1]. */
export default function ProbabilityScale() {
  const [p, setP] = useState(0.85);
  const ok = p >= 0 && p <= 1;
  const pos = (v: number) => `${((v - MIN) / (MAX - MIN)) * 100}%`;
  const verdict = !ok
    ? p < 0
      ? "不合理：機率不可為負。"
      : "不合理：機率不可超過 1。"
    : p === 0
      ? "不可能事件。"
      : p === 1
        ? "必然事件。"
        : `合理。它的餘集機率是 1 − ${fmt(p)} = ${fmt(1 - p)}。`;

  return (
    <Interactive description="Rule 1：對任何事件 0 ≤ P(E) ≤ 1，0 是不可能事件、1 是必然事件。基金報酬率機率 1.2 超出範圍、APP 推播點擊率 −0.02 為負，都不合理；點單成功率 0.85 與失敗率 0.15 合理，且兩者相加為 1。">
      <div style={panel}>
        <div style={row}>
          {PRESETS.map((x) => (
            <Chip key={x.label} active={x.p === p} onClick={() => setP(x.p)}>
              {x.label}
            </Chip>
          ))}
        </div>
        <div style={{ position: "relative", height: "44px", margin: "20px 8px 4px" }}>
          <div style={{ position: "absolute", left: pos(0), width: `calc(${pos(1)} - ${pos(0)})`, top: "14px", height: "8px", borderRadius: "var(--radius-pill)", background: tint(30) }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "17px", height: "2px", background: "var(--line)" }} />
          {[0, 1].map((v) => (
            <span key={v} style={{ position: "absolute", left: pos(v), top: "26px", transform: "translateX(-50%)", fontSize: "var(--fs-sm)", color: "var(--muted)", whiteSpace: "nowrap" }}>
              {v === 0 ? "0 不可能" : "1 必然"}
            </span>
          ))}
          <span style={{ position: "absolute", left: pos(Math.min(MAX, Math.max(MIN, p))), top: "6px", width: "4px", height: "24px", transform: "translateX(-50%)", background: "var(--text)", borderRadius: "2px", transition: "left .2s" }} />
        </div>
        <Slider label="P(E)" value={p} onChange={setP} min={MIN} max={MAX} />
        <p style={{ margin: "8px 0 0", padding: "4px 8px", borderRadius: "var(--radius-sm)", background: ok ? tint(8) : "var(--error-bg)", color: ok ? undefined : "var(--error)" }}>{verdict}</p>
        <p style={{ ...muted, margin: "8px 0 0" }}>拖曳滑桿：超出灰色區間的值都不是合法機率。</p>
      </div>
    </Interactive>
  );
}
