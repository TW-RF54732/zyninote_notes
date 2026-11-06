import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { Chip, StepBar, caption, muted, panel, row, tint } from "./_ds-ui.tsx";

type Move = { disk: number; from: number; to: number; depth: number; phase: string };
const PEG = ["a", "b", "c"];

function moves(n: number, from: number, mid: number, to: number, depth: number, out: Move[]) {
  if (n === 0) return;
  moves(n - 1, from, to, mid, depth + 1, out);
  out.push({
    disk: n, from, to, depth,
    phase: n > 1 ? `上面 ${n - 1} 個已經先搬到 ${PEG[mid]} 柱讓路，現在把壓在最底下的 ${n} 號從 ${PEG[from]} 搬到 ${PEG[to]}；接著再把那 ${n - 1} 個從 ${PEG[mid]} 搬過來疊上。` : `最小的 1 號直接搬。`,
  });
  moves(n - 1, mid, from, to, depth + 1, out);
}

/** Tower of Hanoi stepper with pegs drawn; each move explains which sub-problem it belongs to. */
export default function Hanoi() {
  const [n, setN] = useState(3);
  const [step, setStep] = useState(0);
  const list = useMemo(() => {
    const out: Move[] = [];
    moves(n, 0, 1, 2, 0, out);
    return out;
  }, [n]);
  const total = list.length + 1;

  const pegs: number[][] = [Array.from({ length: n }, (_, i) => n - i), [], []];
  for (let i = 0; i < step; i++) {
    const m = list[i];
    pegs[m.to].push(pegs[m.from].pop()!);
  }
  const last = step > 0 ? list[step - 1] : null;

  const W = 360;
  const H = 40 + n * 18 + 20;
  const base = H - 14;
  const px = (p: number) => 60 + p * 120;

  return (
    <Interactive description="河內塔逐步示範：n 個圓盤從 a 柱搬到 c 柱，一次搬一個、大盤不能壓小盤。遞迴想法是：先把上面 n−1 個搬到 b 柱讓路，把最大的第 n 個搬到 c，再把 n−1 個從 b 搬到 c。搬動次數 T(n) = 2T(n−1) + 1 = 2^n − 1：n=1 要 1 步、n=2 要 3 步、n=3 要 7 步、n=4 要 15 步。n=3 的 7 步為：1 號 a→c、2 號 a→b、1 號 c→b、3 號 a→c、1 號 b→a、2 號 b→c、1 號 a→c。">
      <div style={panel}>
        <div style={row}>
          {[1, 2, 3, 4].map((k) => (
            <Chip key={k} active={k === n} onClick={() => { setN(k); setStep(0); }}>{k} 個圓盤</Chip>
          ))}
          <span style={muted}>共 2<sup>{n}</sup> − 1 = {2 ** n - 1} 步</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="河內塔" style={{ width: "100%", maxWidth: "460px", display: "block", margin: "10px auto", color: "var(--text)" }}>
          <line x1={10} y1={base} x2={W - 10} y2={base} stroke="currentColor" strokeOpacity={0.5} strokeWidth={2} />
          {pegs.map((stack, p) => (
            <g key={p}>
              <line x1={px(p)} y1={base} x2={px(p)} y2={base - n * 18 - 18} stroke="currentColor" strokeOpacity={0.35} strokeWidth={4} />
              <text x={px(p)} y={H - 1} textAnchor="middle" fontSize="12" fill="currentColor">{PEG[p]}</text>
              {stack.map((d, h) => {
                const w = 24 + d * 18;
                const moved = last && last.disk === d && last.to === p;
                return (
                  <g key={d}>
                    <rect x={px(p) - w / 2} y={base - (h + 1) * 18} width={w} height={16} rx={5}
                      fill={moved ? "currentColor" : tint(20 + d * 12)} stroke="currentColor" strokeOpacity={0.6} />
                    <text x={px(p)} y={base - (h + 1) * 18 + 12} textAnchor="middle" fontSize="11" fontFamily="var(--mono)"
                      fill={moved ? "var(--background)" : "currentColor"}>{d}</text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
        <p style={caption}>
          {last
            ? <><b>步驟 {step}：{last.disk} 號 {PEG[last.from]} → {PEG[last.to]}</b>　{last.phase}</>
            : <>起點：{n} 個圓盤都在 a 柱。目標是全部搬到 c 柱。</>}
          {step === total - 1 && "　完成！"}
        </p>
        <StepBar step={step} total={total} setStep={setStep} label={`已搬 ${step} / ${total - 1} 步`} />
      </div>
    </Interactive>
  );
}
