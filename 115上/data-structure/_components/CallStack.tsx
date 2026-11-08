import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { Chip, StepBar, caption, muted, panel, row, tint } from "./ds-ui.tsx";

type Fn = "fact" | "pow";
type Frame = { n: number; ret?: number };
type Snap = { frames: Frame[]; msg: string };

const NAME: Record<Fn, string> = { fact: "factorial", pow: "two_power_n" };

function build(fn: Fn, n: number): Snap[] {
  const snaps: Snap[] = [];
  const frames: Frame[] = [];
  const isBase = (k: number) => (fn === "fact" ? k <= 1 : k <= 1);
  const baseVal = (k: number) => (fn === "fact" ? 1 : k === 0 ? 1 : 2);
  const op = (k: number, sub: number) => (fn === "fact" ? k * sub : 2 * sub);
  const opText = (k: number) => (fn === "fact" ? `${k} ×` : "2 ×");

  for (let k = n; ; k--) {
    frames.push({ n: k });
    if (isBase(k)) {
      frames[frames.length - 1].ret = baseVal(k);
      snaps.push({ frames: frames.map((f) => ({ ...f })), msg: `${NAME[fn]}(${k}) 碰到終止條件，不再往下呼叫，直接回傳 ${baseVal(k)}。現在開始一層層往回算。` });
      break;
    }
    snaps.push({
      frames: frames.map((f) => ({ ...f })),
      msg: `呼叫 ${NAME[fn]}(${k})：要算 ${opText(k)} ${NAME[fn]}(${k - 1})，但 ${NAME[fn]}(${k - 1}) 還不知道，所以把「${opText(k)} ?」這件未完成的工作 push 進堆疊，先去呼叫 ${NAME[fn]}(${k - 1})。`,
    });
  }
  while (frames.length > 1) {
    const done = frames.pop()!;
    const top = frames[frames.length - 1];
    top.ret = op(top.n, done.ret!);
    snaps.push({
      frames: frames.map((f) => ({ ...f })),
      msg: `${NAME[fn]}(${done.n}) 回傳 ${done.ret}，pop 掉它；回到 ${NAME[fn]}(${top.n}) 把剛剛擱著的工作做完：${opText(top.n)} ${done.ret} = ${top.ret}。`,
    });
  }
  snaps.push({ frames: [], msg: `最外層的 ${NAME[fn]}(${n}) 也回傳了，堆疊清空，答案是 ${frames[0].ret}。` });
  return snaps;
}

/** Call-stack animation for recursive factorial / power of two. */
export default function CallStack() {
  const [fn, setFn] = useState<Fn>("fact");
  const [n, setN] = useState(4);
  const [step, setStep] = useState(0);
  const snaps = useMemo(() => build(fn, n), [fn, n]);
  const s = snaps[Math.min(step, snaps.length - 1)];
  const deepest = Math.max(...snaps.map((x) => x.frames.length));

  return (
    <Interactive description="遞迴呼叫的堆疊動畫。以 factorial(4) 為例：factorial(4) 要算 4 × factorial(3)，先把「4 × ?」push 進堆疊再呼叫 factorial(3)；同理 push「3 × ?」「2 × ?」，factorial(1) 碰到終止條件回傳 1。接著一層層 pop：2 × 1 = 2、3 × 2 = 6、4 × 6 = 24，堆疊清空，答案 24。two_power_n(4) 同理：2 × 2 × 2 × 2 = 16，n = 1 時回傳 2。遞迴越深，堆疊上同時存在的呼叫越多，佔用的記憶體越多。">
      <div style={panel}>
        <div style={row}>
          <Chip active={fn === "fact"} onClick={() => { setFn("fact"); setStep(0); }}>n!</Chip>
          <Chip active={fn === "pow"} onClick={() => { setFn("pow"); setStep(0); }}>2ⁿ</Chip>
          <span style={{ width: 8 }} />
          {[3, 4, 5].map((k) => (
            <Chip key={k} active={k === n} onClick={() => { setN(k); setStep(0); }}>n = {k}</Chip>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column-reverse", gap: "4px", marginTop: "14px", minHeight: `${deepest * 40}px`, justifyContent: "flex-start" }}>
          {s.frames.map((f, i) => {
            const isTop = i === s.frames.length - 1;
            return (
              <div key={i} style={{
                fontFamily: "var(--mono)", fontSize: "var(--fs-sm)", padding: "7px 12px",
                border: `1px solid ${isTop ? "var(--text)" : "var(--line-strong)"}`,
                borderRadius: "var(--radius-sm)", background: isTop ? tint(18) : "var(--surface)",
                marginLeft: `${i * 14}px`, maxWidth: "340px",
              }}>
                {NAME[fn]}({f.n}){"　"}
                {f.ret !== undefined ? <b>= {f.ret}</b> : <span style={muted}>= {fn === "fact" ? f.n : 2} × {NAME[fn]}({f.n - 1}) …等待中</span>}
                {isTop && <span style={{ ...muted, float: "right" }}>← 頂端</span>}
              </div>
            );
          })}
          {s.frames.length === 0 && <div style={muted}>（堆疊已空）</div>}
        </div>
        <div style={{ ...muted, marginTop: "4px" }}>堆疊由下往上長，最上面是正在執行的那一層。</div>
        <p style={caption}>{s.msg}</p>
        <StepBar step={step} total={snaps.length} setStep={setStep} />
      </div>
    </Interactive>
  );
}
