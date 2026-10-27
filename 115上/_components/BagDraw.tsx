import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";

function Balls({ red, blue }: { red: number; blue: number }) {
  return (
    <svg viewBox={`0 0 ${Math.max(red + blue, 1) * 22} 22`} style={{ height: "22px", maxWidth: "100%", color: "var(--text)" }} aria-label={`紅 ${red}、藍 ${blue}`}>
      {Array.from({ length: red + blue }, (_, k) => (
        <circle key={k} cx={11 + k * 22} cy="11" r="8" fill={k < red ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/** Drawing two balls without replacement: the second draw depends on the first. */
export default function BagDraw() {
  const [red, setRed] = useState(5);
  const [blue, setBlue] = useState(5);
  const [step, setStep] = useState(0);
  const n = red + blue;
  const p1 = red / n;
  const p2 = (red - 1) / (n - 1);
  const withReplacement = p1 * p1;

  const stepper = (label: string, v: number, set: (v: number) => void, min: number) => (
    <span style={{ ...row, fontSize: "var(--fs-sm)" }}>
      {label}
      <Chip onClick={() => { set(Math.max(min, v - 1)); setStep(0); }}>−</Chip>
      <span style={{ fontFamily: "var(--mono)", minWidth: "20px", textAlign: "center" }}>{v}</span>
      <Chip onClick={() => { set(Math.min(10, v + 1)); setStep(0); }}>＋</Chip>
    </span>
  );

  return (
    <Interactive description="不放回抽球（相依事件）：袋中紅 5、藍 5，第一抽紅的機率 5/10=0.5；抽走一顆紅球後剩紅 4、藍 5，第二抽紅的條件機率 P(紅2|紅1)=4/9；兩次皆紅 = 5/10 × 4/9 = 20/90 = 2/9 ≈ 0.222。若放回，第二抽不受影響（獨立），機率為 0.5 × 0.5 = 0.25。">
      <div style={panel}>
        <div style={{ ...row, gap: "16px" }}>
          {stepper("紅球", red, setRed, 2)}
          {stepper("藍球", blue, setBlue, 1)}
        </div>
        <div style={{ display: "grid", gap: "12px", margin: "16px 0 0" }}>
          <div>
            <div style={muted}>抽之前（實心 = 紅，空心 = 藍）</div>
            <Balls red={red} blue={blue} />
            <div style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-sm)" }}>P(紅₁) = {red}/{n} = {fmt(p1)}</div>
          </div>
          {step >= 1 && (
            <div>
              <div style={muted}>第一抽是紅，不放回：袋子少了一顆紅球</div>
              <Balls red={red - 1} blue={blue} />
              <div style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-sm)" }}>
                P(紅₂ | 紅₁) = {red - 1}/{n - 1} = {fmt(p2)}
              </div>
            </div>
          )}
        </div>
        <div style={{ ...row, marginTop: "12px" }}>
          <Chip active={step === 0} onClick={() => setStep(0)}>重來</Chip>
          <Chip active={step === 1} onClick={() => setStep(1)}>抽第一顆（紅）</Chip>
          <Chip active={step === 2} onClick={() => setStep(2)}>算兩次皆紅</Chip>
        </div>
        {step === 2 && (
          <div style={formula}>
            {`P(兩次皆紅) = P(紅₁) × P(紅₂ | 紅₁) = ${red}/${n} × ${red - 1}/${n - 1} = ${fmt(p1 * p2)}`}
            {`\n對照：放回（獨立）= ${red}/${n} × ${red}/${n} = ${fmt(withReplacement)}`}
          </div>
        )}
        <p style={{ ...muted, margin: "8px 0 0" }}>不放回時，第一抽的結果改變了樣本空間，所以第二抽要用條件機率。</p>
      </div>
    </Interactive>
  );
}
