import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { Cell, Chip, StepBar, caption, cells, formula, muted, panel, row } from "./ds-ui.tsx";

type Step = { token: string; stack: string[]; out: string; why: string };

const PRI: Record<string, number> = { "^": 3, "*": 2, "/": 2, "+": 1, "-": 1, "(": 0 };
const isOp = (c: string) => "+-*/^".includes(c);

function toPostfix(expr: string): Step[] {
  const steps: Step[] = [];
  const st: string[] = [];
  let out = "";
  for (const x of expr) {
    if (x === "(") {
      st.push(x);
      steps.push({ token: x, stack: [...st], out, why: "左括號：直接 push，等之後的右括號來配對。" });
    } else if (x === ")") {
      const popped: string[] = [];
      while (st.length && st[st.length - 1] !== "(") {
        const p = st.pop()!;
        out += p;
        popped.push(p);
      }
      st.pop();
      steps.push({ token: x, stack: [...st], out, why: `右括號：一路 pop 到左括號為止${popped.length ? `（輸出 ${popped.join(" ")}）` : ""}，括號本身丟掉不輸出。` });
    } else if (isOp(x)) {
      const popped: string[] = [];
      while (st.length && PRI[st[st.length - 1]] >= PRI[x]) {
        const p = st.pop()!;
        out += p;
        popped.push(p);
      }
      st.push(x);
      const topBefore = popped.length ? popped[popped.length - 1] : null;
      steps.push({
        token: x, stack: [...st], out,
        why: popped.length
          ? `運算子 ${x}：堆疊頂端 ${popped.join("、")} 的優先順序 ≥ ${x}，代表它們該先算，pop 出來輸出；再把 ${x} push。`
          : `運算子 ${x}：${topBefore ?? (st.length > 1 ? `頂端 ${st[st.length - 2]} 的優先順序比 ${x} 低` : "堆疊是空的")}，不用 pop，直接 push ${x}。`,
      });
    } else {
      out += x;
      steps.push({ token: x, stack: [...st], out, why: `運算元 ${x}：直接輸出。運算元的順序在三種表示法中都不變。` });
    }
  }
  const rest = [...st].reverse();
  while (st.length) out += st.pop();
  steps.push({ token: "結束", stack: [], out, why: rest.length ? `讀完了，把堆疊剩下的 ${rest.join(" ")} 由上往下全部 pop 輸出。` : "讀完了，堆疊已空。" });
  return steps;
}

const VALS: Record<string, number> = { a: 1, b: 4, c: 3, d: 1, e: 2, f: 5 };

function evalPostfix(expr: string, vals: Record<string, number> = VALS): Step[] {
  const steps: Step[] = [];
  const st: number[] = [];
  for (const x of expr) {
    if (isOp(x)) {
      const right = st.pop()!;
      const left = st.pop()!;
      const v = x === "+" ? left + right : x === "-" ? left - right : x === "*" ? left * right : x === "/" ? left / right : left ** right;
      st.push(v);
      steps.push({ token: x, stack: st.map(String), out: "", why: `運算子 ${x}：pop 兩次，先出來的 ${right} 是「右」運算元、後出來的 ${left} 是「左」，算 ${left} ${x} ${right} = ${v}，結果 push 回去。` });
    } else {
      st.push(vals[x]);
      steps.push({ token: x, stack: st.map(String), out: "", why: `運算元 ${x} = ${vals[x]}：push。` });
    }
  }
  steps.push({ token: "結束", stack: st.map(String), out: "", why: `讀完了，堆疊裡剩下的 ${st[0]} 就是答案。` });
  return steps;
}

const INFIX = ["a+b/(c-d)*e-f", "a+b*c-d", "(a+b)*(c-d)", "a*(b+c)/d"];
const POSTFIX = ["abcd-/e*+", "abc*+d-", "ab+cd-*"];

/** One worked case: an expression, plus variable values when evaluating. */
export type ExprCase = { expr: string; vals?: Record<string, number> };

const showVals = (v: Record<string, number>) => Object.entries(v).map(([k, n]) => `${k}=${n}`).join("、");

/** Description built from the cases actually shown, so search / cheat cards see the exercise's own answers. */
function describe(mode: "infix" | "eval", list: ExprCase[]): string {
  if (mode === "infix") {
    return "中置式轉後置式的堆疊法逐步示範。由左到右讀：運算元直接輸出；左括號 push；右括號一直 pop 輸出到左括號為止（括號不輸出）；運算子先把堆疊頂端優先順序大於或等於自己的運算子 pop 輸出，再 push 自己；讀完把堆疊剩下的全部 pop。優先順序 ^ > * / > + − > (。"
      + list.map((c) => { const st = toPostfix(c.expr); return `${c.expr} 轉成 ${st[st.length - 1].out}`; }).join("；") + "。";
  }
  return "後置式求值的堆疊法逐步示範。由左到右讀：運算元 push；運算子 pop 兩次，先彈出的是右運算元、後彈出的是左運算元，計算後把結果 push；讀完時堆疊剩下的值就是答案。"
    + list.map((c) => {
      const st = evalPostfix(c.expr, c.vals ?? VALS);
      const ops = st.filter((x) => isOp(x.token)).map((x) => x.why.match(/算 (.+?)，/)?.[1]).filter(Boolean).join("、");
      return `${c.expr}（${showVals(c.vals ?? VALS)}）：${ops}，答案 ${st[st.length - 1].stack[0]}`;
    }).join("；") + "。";
}

/** Step through infix→postfix conversion, or postfix evaluation, with the stack drawn live.
 *  `cases` replaces the built-in presets (e.g. an exercise's own expressions and values). */
export default function ExprStack({ mode = "infix", cases }: { mode?: "infix" | "eval"; cases?: ExprCase[] }) {
  const list: ExprCase[] = cases ?? (mode === "infix" ? INFIX : POSTFIX).map((expr) => ({ expr }));
  const presets = list.map((c) => c.expr);
  const [expr, setExpr] = useState(presets[0]);
  const [step, setStep] = useState(0);
  const vals = list.find((c) => c.expr === expr)?.vals ?? VALS;
  const steps = useMemo(() => (mode === "infix" ? toPostfix(expr) : evalPostfix(expr, vals)), [expr, mode, vals]);
  const s = steps[Math.min(step, steps.length - 1)];
  const readIdx = s.token === "結束" ? expr.length : step;

  const desc = cases ? describe(mode, cases) : mode === "infix"
    ? "中置式轉後置式的堆疊法逐步示範。由左到右讀：運算元直接輸出；左括號 push；右括號一直 pop 輸出到左括號為止（括號不輸出）；運算子先把堆疊頂端優先順序大於或等於自己的運算子 pop 輸出，再 push 自己；讀完把堆疊剩下的全部 pop。優先順序 ^ > * / > + − > (。例：a+b/(c-d)*e-f 轉成 abcd-/e*+f-；a+b*c-d 轉成 abc*+d-；(a+b)*(c-d) 轉成 ab+cd-*；a*(b+c)/d 轉成 abc+*d/。"
    : "後置式求值的堆疊法逐步示範。由左到右讀：運算元 push；運算子 pop 兩次，先彈出的是右運算元、後彈出的是左運算元，計算後把結果 push；讀完時堆疊剩下的值就是答案。例：a=1、b=4、c=3、d=1、e=2，abcd-/e*+ 的過程為 3−1=2、4/2=2、2×2=4、1+4=5，答案 5。";

  return (
    <Interactive description={desc}>
      <div style={panel}>
        <div style={row}>
          {presets.map((p) => (
            <Chip key={p} active={p === expr} onClick={() => { setExpr(p); setStep(0); }}>
              <span style={{ fontFamily: "var(--mono)" }}>{p}</span>
            </Chip>
          ))}
        </div>
        {mode === "eval" && (
          <div style={{ ...muted, marginTop: "6px", fontFamily: "var(--mono)" }}>
            {Object.entries(vals).filter(([k]) => expr.includes(k)).map(([k, n]) => `${k}=${n}`).join("　")}
          </div>
        )}

        <div style={{ marginTop: "14px", fontFamily: "var(--mono)", fontSize: "20px", letterSpacing: "4px" }}>
          {[...expr].map((c, i) => (
            <span key={i} style={{
              padding: "2px 3px",
              borderBottom: i === readIdx ? "3px solid var(--text)" : "3px solid transparent",
              color: i < readIdx ? "var(--faint)" : i === readIdx ? "var(--text)" : "var(--text-body)",
              fontWeight: i === readIdx ? 700 : 400,
            }}>{c}</span>
          ))}
        </div>

        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", marginTop: "14px" }}>
          <div>
            <div style={muted}>堆疊（右邊是頂端）</div>
            <div style={{ ...cells, marginTop: "4px", minHeight: "38px" }}>
              {s.stack.length === 0 ? <span style={muted}>（空）</span> : s.stack.map((v, i) => (
                <Cell key={i} on={i === s.stack.length - 1} width={mode === "eval" ? 44 : 34}>{v}</Cell>
              ))}
            </div>
          </div>
          {mode === "infix" && (
            <div>
              <div style={muted}>輸出（後置式）</div>
              <div style={{ ...formula, fontSize: "18px", letterSpacing: "3px", minWidth: "120px" }}>{s.out || " "}</div>
            </div>
          )}
        </div>

        <p style={caption}><b>讀到 {s.token}</b>　{s.why}</p>
        <StepBar step={step} total={steps.length} setStep={setStep} />
      </div>
    </Interactive>
  );
}
