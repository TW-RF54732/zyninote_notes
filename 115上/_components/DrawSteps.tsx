import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row, tint } from "./prob-ui.tsx";
import { comb } from "./stats-math.ts";

type Category = { label: string; total: number; pick: number };
type Props = {
  title: string;
  /** Counting word, e.g. "人"、"輛"、"件". */
  unit: string;
  categories: Category[];
  /** Symbols for each category's population count and sample count; defaults to X_i / x_i. */
  symbols?: [string, string][];
};

/** Boxes: the population, each category in it, each category in the sample, and the sample. */
type Node = "all" | "sample" | `c${number}` | `s${number}`;
type Step = { from?: Node; parts: Node[]; title: string; say: string; calc: string };

const big = (x: number) => (x >= 1e12 ? x.toExponential(4).replace(/e\+?(\d+)/, "×10^$1") : x.toLocaleString("en-US"));

/**
 * (Multivariate) hypergeometric probability as counting steps: which numbers describe the population,
 * which describe the sample, and which population each C(·,·) chooses from.
 */
export default function DrawSteps({ title, unit, categories: cs, symbols }: Props) {
  const N = cs.reduce((s, c) => s + c.total, 0);
  const n = cs.reduce((s, c) => s + c.pick, 0);
  const sym = (i: number) => symbols?.[i] ?? [`X${i + 1}`, `x${i + 1}`];
  const ways = cs.map((c) => comb(c.total, c.pick));
  const num = ways.reduce((s, w) => s * w, 1);
  const den = comb(N, n);
  const p = num / den;
  const C = (a: number, b: number) => `C(${a},${b})`;
  const cats = cs.map((_, i) => `c${i}` as Node);
  const samples = cs.map((_, i) => `s${i}` as Node);

  const steps: Step[] = [
    {
      from: "all",
      parts: cats,
      title: "母體：全部有幾個、分成哪幾類",
      say: `母體 N = ${N} ${unit}，分成 ${cs.map((c, i) => `${c.label} ${sym(i)[0]} = ${c.total}`).join("、")}。這些是「抽之前」的數量。`,
      calc: `N = ${cs.map((c) => c.total).join(" + ")} = ${N}`,
    },
    {
      parts: [...samples, "sample"],
      title: "樣本：抽幾個、每類要幾個",
      say: `抽出 n = ${n} ${unit}，題目要的組合是 ${cs.map((c, i) => `${c.label} ${sym(i)[1]} = ${c.pick}`).join("、")}。這些是「抽出來的」數量，加起來要等於 n。`,
      calc: `n = ${cs.map((c) => c.pick).join(" + ")} = ${n}`,
    },
    {
      from: "all",
      parts: ["sample"],
      title: "分母：從全部中任選 n 個",
      say: `不管是哪一類，從母體 ${N} ${unit}中任選 ${n} ${unit}的所有抽法。每一種抽法機率相同。`,
      calc: `分母 = ${C(N, n)} = ${big(den)}`,
    },
    ...cs.map((c, i) => ({
      from: `c${i}` as Node,
      parts: [`s${i}` as Node],
      title: `母體換成「${c.label}」：從 ${c.total} 個中選 ${c.pick} 個`,
      say:
        c.pick === 0
          ? `樣本裡不要任何${c.label}：從 ${c.total} 個${c.label}中一個都不選，只有 1 種選法。`
          : `只看${c.label}這 ${c.total} ${unit}，從中挑出 ${c.pick} ${unit}有幾種選法。`,
      calc: `${C(c.total, c.pick)} = ${big(ways[i])}`,
    })),
    {
      parts: samples,
      title: "分子：各類的選法相乘",
      say: `每一類各自挑好，組合起來就是一種符合題目的抽法，所以選法相乘。`,
      calc: `分子 = ${cs.map((c) => C(c.total, c.pick)).join(" × ")} = ${ways.map(big).join(" × ")} = ${big(num)}`,
    },
    {
      parts: ["sample"],
      title: "機率 = 符合的抽法 ÷ 全部抽法",
      say: `古典機率：符合題目的抽法數除以全部抽法數。`,
      calc: `P = ${big(num)} ÷ ${big(den)} ≈ ${fmt(p, 4)}（${fmt(p * 100, 2)}%）`,
    },
  ];

  const [k, setK] = useState(0);
  const s = steps[k];
  const catStep = (i: number) => 3 + i;

  const box = (id: Node, top: string, value: string, extra?: CSSProperties) => {
    const isFrom = s.from === id;
    return (
      <div
        key={id}
        style={{
          border: isFrom ? "2px solid var(--text)" : "1px solid var(--line)",
          borderRadius: "var(--radius-sm)",
          background: s.parts.includes(id) ? tint(26) : "var(--surface)",
          padding: "4px",
          textAlign: "center",
          fontSize: "var(--fs-sm)",
          lineHeight: 1.3,
          transition: "background .3s",
          minWidth: 0,
          ...extra,
        }}
      >
        <div style={{ color: "var(--muted)", overflowWrap: "anywhere" }}>{top}</div>
        <div style={{ fontFamily: "var(--mono)", color: "var(--text)", overflowWrap: "anywhere" }}>{value}</div>
        {isFrom && <div style={{ color: "var(--text)" }}>▲ 母體</div>}
      </div>
    );
  };

  const k1 = cs.length;
  const span: CSSProperties = { gridColumn: `1 / ${k1 + 1}` };
  const tag: CSSProperties = { textAlign: "center", ...muted, fontFamily: "var(--mono)", overflowWrap: "anywhere" };

  return (
    <Interactive
      description={`超幾何機率逐步拆解：${title}。${steps
        .map((st, i) => `${i + 1}. ${st.title}：${st.say} ${st.calc}`)
        .join(" ")} 關鍵：大寫（N、各類總數）描述抽之前的母體，小寫（n、各類抽出數）描述樣本；每個 C(·,·) 都是「從某個母體中選幾個」。`}
    >
      <div style={panel}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${k1}, minmax(0, 1fr))`, gap: "4px" }}>
          <div style={{ ...span, ...muted }}>抽之前（母體）</div>
          {box("all", "全部 N", `${N} ${unit}`, span)}
          {cs.map((c, i) => box(`c${i}`, c.label, `${sym(i)[0]} = ${c.total}`))}
          {cs.map((c, i) => (
            <div key={`a${i}`} style={{ ...tag, opacity: k >= catStep(i) ? 1 : 0.4 }}>
              {k >= catStep(i) ? `↓ ${C(c.total, c.pick)} = ${big(ways[i])}` : `↓ 選 ${c.pick}`}
            </div>
          ))}
          {cs.map((c, i) => box(`s${i}`, c.label, `${sym(i)[1]} = ${c.pick}`))}
          {box("sample", "樣本 n", `${n} ${unit}`, span)}
          <div style={{ ...span, ...muted }}>抽出來的（樣本）</div>
        </div>

        <div style={{ ...formula, textAlign: "center" }}>
          {`${cs.map((c, i) => (k >= catStep(i) ? big(ways[i]) : C(c.total, c.pick))).join(" × ")}\n─────────────\n${k >= 2 ? big(den) : C(N, n)}`}
        </div>

        <p style={{ margin: "12px 0 0", color: "var(--text)" }}>{`${k + 1}／${steps.length}　${s.title}`}</p>
        <p style={{ margin: "4px 0 0" }}>{s.say}</p>
        <div style={formula}>{s.calc}</div>

        <div style={{ ...row, marginTop: "12px" }}>
          <Chip onClick={() => setK(Math.max(0, k - 1))}>上一步</Chip>
          <Chip onClick={() => setK(Math.min(steps.length - 1, k + 1))}>下一步</Chip>
          {steps.map((_, i) => (
            <Chip key={i} active={i === k} onClick={() => setK(i)}>
              {String(i + 1)}
            </Chip>
          ))}
        </div>
      </div>
    </Interactive>
  );
}
