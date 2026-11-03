import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { muted, panel, row, tint } from "../_components/prob-ui.tsx";

type Props = {
  /** Decimal number to start with, e.g. "121.34375". */
  initial?: string;
  /** Base to start with: 2, 8 or 16. */
  base?: number;
};

const DIGITS = "0123456789ABCDEF";
const MAX_FRAC = 10;

type Step = { left: string; right: string; digit: string };
type Result = {
  intSteps: Step[];
  fracSteps: Step[];
  intDigits: string;
  fracDigits: string;
  /** Index in fracDigits where a repeating cycle starts, or -1. */
  repeatFrom: number;
  /** True when the fraction neither ended nor repeated within MAX_FRAC digits. */
  truncated: boolean;
};

/** Parse a non-negative decimal string into numerator / denominator (exact). */
function parse(s: string): { num: bigint; den: bigint } | null {
  const m = /^\s*(\d*)(?:\.(\d*))?\s*$/.exec(s);
  if (!m || (!m[1] && !m[2])) return null;
  const frac = m[2] ?? "";
  const den = 10n ** BigInt(frac.length);
  const num = BigInt((m[1] || "0") + frac);
  return { num, den };
}

/** Show num / den as a decimal; den is always a power of ten here (it comes from the typed decimal). */
function fracText(num: bigint, den: bigint): string {
  const k = den.toString().length - 1;
  if (k === 0) return num.toString();
  const str = num.toString().padStart(k + 1, "0");
  const intPart = str.slice(0, str.length - k);
  const fracPart = str.slice(str.length - k).replace(/0+$/, "");
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

function convert(num: bigint, den: bigint, base: number): Result {
  const b = BigInt(base);
  let ip = num / den;
  let fn = num % den;

  const intSteps: Step[] = [];
  let intDigits = "";
  if (ip === 0n) intDigits = "0";
  while (ip > 0n) {
    const q = ip / b;
    const r = ip % b;
    intSteps.push({ left: `${ip} ÷ ${base} = ${q}`, right: `餘 ${r}`, digit: DIGITS[Number(r)] });
    intDigits = DIGITS[Number(r)] + intDigits;
    ip = q;
  }

  const fracSteps: Step[] = [];
  let fracDigits = "";
  const seen = new Map<string, number>();
  let repeatFrom = -1;
  while (fn !== 0n && fracDigits.length < MAX_FRAC) {
    const key = fn.toString();
    if (seen.has(key)) { repeatFrom = seen.get(key)!; break; }
    seen.set(key, fracDigits.length);
    const prod = fn * b;
    const d = prod / den;
    const rest = prod % den;
    fracSteps.push({ left: `${fracText(fn, den)} × ${base} = ${fracText(prod, den)}`, right: `整數 ${d}`, digit: DIGITS[Number(d)] });
    fracDigits += DIGITS[Number(d)];
    fn = rest;
  }
  const truncated = fn !== 0n && repeatFrom === -1;
  return { intSteps, fracSteps, intDigits, fracDigits, repeatFrom, truncated };
}

const cell: CSSProperties = { padding: "2px 8px", fontFamily: "var(--mono)", whiteSpace: "nowrap" };

/** Decimal → base 2/8/16 conversion: repeated division for the integer part, repeated multiplication for the fraction. */
export default function BaseConverter({ initial = "121.34375", base: initialBase = 2 }: Props) {
  const [text, setText] = useState(initial);
  const [base, setBase] = useState(initialBase);
  const parsed = parse(text);
  const r = parsed ? convert(parsed.num, parsed.den, base) : null;

  const fracShown = r
    ? r.repeatFrom >= 0
      ? `${r.fracDigits.slice(0, r.repeatFrom)}(${r.fracDigits.slice(r.repeatFrom)} 循環)`
      : r.fracDigits + (r.truncated ? "…" : "")
    : "";
  const answer = r ? `${r.intDigits}${r.fracDigits ? "." + fracShown : ""}` : "";

  const init = parse(initial)!;
  const ir = convert(init.num, init.den, initialBase);
  const initAnswer = `${ir.intDigits}${ir.fracDigits ? "." + ir.fracDigits : ""}`;

  return (
    <Interactive
      description={`十進制轉基底 b（b = 2、8、16）：整數部分連續除以 b，記下每次的餘數，最後一個餘數是最高位（MSD），所以由下往上讀；小數部分連續乘以 b，記下每次乘積的整數部分，第一個是小數點後第一位，所以由上往下讀，直到小數部分為 0、出現循環或位數足夠為止。預設例：${initial}₁₀ = ${initAnswer}₍${initialBase}₎。整數步驟：${ir.intSteps.map((s) => `${s.left} ${s.right}`).join("；")}。小數步驟：${ir.fracSteps.map((s) => `${s.left} ${s.right}`).join("；")}。`}
    >
      <div style={panel}>
        <div style={row}>
          <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            十進制數
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              inputMode="decimal"
              style={{ font: "inherit", fontFamily: "var(--mono)", width: "10em", padding: "2px 6px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)", background: "transparent", color: "inherit" }}
            />
          </label>
          {[2, 8, 16].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBase(b)}
              style={{ font: "inherit", cursor: "pointer", padding: "2px 10px", borderRadius: "var(--radius-pill)", border: "1px solid var(--line-strong)", background: base === b ? tint(16) : "transparent", color: "inherit" }}
            >
              {b} 進制
            </button>
          ))}
        </div>

        {!r && <p style={muted}>請輸入非負的十進制數，例如 167.45。</p>}
        {r && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "12px" }}>
              <div>
                <div style={muted}>整數部分：連續除以 {base}，餘數由下往上讀</div>
                <table style={{ borderCollapse: "collapse", margin: "4px 0 0", fontSize: "var(--fs-sm)" }}>
                  <tbody>
                    {r.intSteps.length === 0 && (
                      <tr><td style={cell}>整數部分為 0</td></tr>
                    )}
                    {r.intSteps.map((s, i) => (
                      <tr key={i}>
                        <td style={cell}>{s.left}</td>
                        <td style={cell}>{s.right}</td>
                        <td style={{ ...cell, color: "var(--muted)" }}>{i === 0 ? "← LSD" : i === r.intSteps.length - 1 ? "← MSD" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={muted}>小數部分：連續乘以 {base}，整數由上往下讀</div>
                <table style={{ borderCollapse: "collapse", margin: "4px 0 0", fontSize: "var(--fs-sm)" }}>
                  <tbody>
                    {r.fracSteps.length === 0 && (
                      <tr><td style={cell}>沒有小數部分</td></tr>
                    )}
                    {r.fracSteps.map((s, i) => (
                      <tr key={i} style={{ background: r.repeatFrom >= 0 && i >= r.repeatFrom ? tint(8) : undefined }}>
                        <td style={cell}>{s.left}</td>
                        <td style={cell}>{s.right}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p style={{ margin: "12px 0 0", fontFamily: "var(--mono)" }}>
              {text.trim()}₁₀ = {answer}
              <sub>{base}</sub>
            </p>
            {r.truncated && <p style={muted}>小數部分在 {MAX_FRAC} 位內沒有結束也沒有循環，只顯示前 {MAX_FRAC} 位。</p>}
          </>
        )}
      </div>
    </Interactive>
  );
}
