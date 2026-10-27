import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row, tint } from "./prob-ui.tsx";

type Hypothesis = { label: string; prior: number; likelihood: number };
type Props = {
  title: string;
  /** Imagined population, e.g. 250000. */
  base: number;
  /** The hypotheses A1..Ak (a partition) with P(Ai) and P(B|Ai). */
  hypotheses: Hypothesis[];
  /** Names for the evidence B and not B, e.g. "陽性" / "陰性". */
  pos: string;
  neg: string;
  /** Index of the hypothesis the question asks about. */
  target?: number;
  /** The question asks "which one is most likely": end by comparing every posterior. */
  compare?: boolean;
};

/** Boxes of the tree: the whole population, hypothesis i, its B / not-B leaves, and all of B. */
type Node = "all" | "pos" | `h${number}` | `p${number}` | `q${number}`;
type Step = { from: Node; parts: Node[]; title: string; say: string; calc: string; given?: string };

const n = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });
const pct = (x: number) => `${fmt(x * 100, 2)}%`;

/**
 * A Bayes problem as a sequence of "whose share of whom" steps on natural frequencies.
 * Every step names its population (the denominator, outlined) and the part being counted (filled),
 * so the reader sees the population switch from "everyone" to each hypothesis to "everyone showing B".
 */
export default function PopulationSteps({ title, base, hypotheses: hs, pos, neg, target = 0, compare = false }: Props) {
  const count: Record<Node, number> = { all: base, pos: 0 };
  const label: Record<Node, string> = { all: "全部", pos: `所有${pos}` };
  hs.forEach((h, i) => {
    count[`h${i}`] = base * h.prior;
    count[`p${i}`] = base * h.prior * h.likelihood;
    count[`q${i}`] = base * h.prior * (1 - h.likelihood);
    count.pos += count[`p${i}`];
    label[`h${i}`] = h.label;
    label[`p${i}`] = pos;
    label[`q${i}`] = neg;
  });
  const posParts = hs.map((_, i) => `p${i}` as Node);
  const t = hs[target];
  const post = (i: number) => count[`p${i}`] / count.pos;

  const steps: Step[] = [
    ...hs.map((h, i) => ({
      from: "all" as Node,
      parts: [`h${i}` as Node],
      title: `從全部切出「${h.label}」`,
      given: `${pct(h.prior)} 是 P(${h.label})，母體是「全部」`,
      say: `全部 ${n(base)} 個裡，「${h.label}」佔 ${pct(h.prior)}。`,
      calc: `${n(base)} × ${fmt(h.prior)} = ${n(count[`h${i}`])}`,
    })),
    ...hs.map((h, i) => ({
      from: `h${i}` as Node,
      parts: [`p${i}`, `q${i}`] as Node[],
      title: `母體換成「${h.label}」`,
      given: `${pct(h.likelihood)} 是 P(${pos}|${h.label})，母體只有「${h.label}」`,
      say: `只看這 ${n(count[`h${i}`])} 個「${h.label}」：其中 ${pct(h.likelihood)} 是${pos}。`,
      calc: `${n(count[`h${i}`])} × ${fmt(h.likelihood)} = ${n(count[`p${i}`])}（${pos}）\n${n(count[`h${i}`])} − ${n(count[`p${i}`])} = ${n(count[`q${i}`])}（${neg}）`,
    })),
    {
      from: "pos",
      parts: posParts,
      title: `把所有${pos}的集合起來`,
      say: `${pos}的散在 ${hs.length} 個分支裡：${hs.map((h, i) => `「${h.label}」${n(count[`p${i}`])}`).join("、")}。加起來就是新的母體，對應 P(${pos})。`,
      calc: `${hs.map((_, i) => n(count[`p${i}`])).join(" + ")} = ${n(count.pos)}`,
    },
    compare
      ? {
          from: "pos",
          parts: posParts,
          title: `母體換成「${pos}」，比較各組佔多少（題目問的）`,
          given: `要比的是 P(各組|${pos})，母體都是${pos}的那 ${n(count.pos)} 個`,
          say: `在 ${n(count.pos)} 個${pos}裡，各組各佔多少？佔最多的就是最可能的來源。`,
          calc: hs.map((h, i) => `${h.label}：${n(count[`p${i}`])} ÷ ${n(count.pos)} = ${fmt(post(i), 4)}（${pct(post(i))}）`).join("\n"),
        }
      : {
          from: "pos",
          parts: [`p${target}` as Node],
          title: `母體換成「${pos}」（題目問的）`,
          given: `要求的 P(${t.label}|${pos})，母體是${pos}的那些`,
          say: `在 ${n(count.pos)} 個${pos}裡，真的是「${t.label}」的有 ${n(count[`p${target}`])} 個。`,
          calc: `${n(count[`p${target}`])} ÷ ${n(count.pos)} = ${fmt(post(target), 4)} ≈ ${pct(post(target))}`,
        },
  ];

  const [k, setK] = useState(0);
  const s = steps[k];
  const visible = new Set<Node>(["all"]);
  steps.slice(0, k + 1).forEach((st) => st.parts.forEach((p) => visible.add(p)));
  if (k >= steps.length - 2) visible.add("pos");

  const shade = (id: Node) => {
    const i = s.parts.indexOf(id);
    if (i < 0) return "var(--surface)";
    if (id.startsWith("q")) return tint(12);
    if (s.parts.filter((p) => p.startsWith("p")).length < 2) return tint(30);
    // Several positive leaves at once: the asked-about one stands out, or alternate when comparing.
    return tint((compare ? i % 2 === 0 : id === `p${target}`) ? 40 : 20);
  };
  const box = (id: Node, extra?: CSSProperties) => {
    const isFrom = s.from === id;
    const shown = visible.has(id);
    return (
      <div
        key={id}
        style={{
          border: isFrom ? "2px solid var(--text)" : "1px solid var(--line)",
          borderRadius: "var(--radius-sm)",
          background: shade(id),
          padding: "4px",
          textAlign: "center",
          fontSize: "var(--fs-sm)",
          lineHeight: 1.3,
          opacity: shown || isFrom ? 1 : 0.35,
          transition: "background .3s, opacity .3s",
          minWidth: 0,
          ...extra,
        }}
      >
        <div style={{ color: "var(--muted)", overflowWrap: "anywhere" }}>{label[id]}</div>
        <div style={{ fontFamily: "var(--mono)", color: "var(--text)", overflowWrap: "anywhere" }}>{shown ? n(count[id]) : "?"}</div>
        {isFrom && <div style={{ color: "var(--text)" }}>▲ 母體</div>}
      </div>
    );
  };

  const cols = hs.length * 2;
  const line: CSSProperties = { height: "8px", borderLeft: "1px solid var(--line-strong)", margin: "0 auto", width: 0 };
  const fromCount = count[s.from];

  return (
    <Interactive
      description={`貝氏定理逐步拆解：${title}，以 ${n(base)} 為基準，每一步都標出「母體」（分母）是誰。${steps
        .map((st, i) => `${i + 1}. ${st.title}：${st.given ? st.given + "；" : ""}${st.say} ${st.calc.replace(/\n/g, "；")}`)
        .join(" ")} 關鍵：條件機率直線後面的事件就是母體；先驗的母體是全部，條件機率 P(${pos}|某組) 的母體是那一組，要求的事後機率的母體是所有${pos}。`}
    >
      <div style={panel}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "4px" }}>
          {box("all", { gridColumn: `1 / ${cols + 1}` })}
          {hs.map((_, i) => (
            <div key={`l${i}`} style={{ ...line, gridColumn: `span 2` }} />
          ))}
          {hs.map((_, i) => box(`h${i}`, { gridColumn: "span 2" }))}
          {Array.from({ length: cols }, (_, i) => (
            <div key={`m${i}`} style={line} />
          ))}
          {hs.flatMap((_, i) => [box(`p${i}`), box(`q${i}`)])}
          <div style={{ gridColumn: `1 / ${cols + 1}`, textAlign: "center", ...muted, padding: "2px 0" }}>
            {`${label.pos} = ${hs.map((h) => `「${h.label}」的${pos}`).join(" + ")}`}
          </div>
          {box("pos", { gridColumn: `1 / ${cols + 1}` })}
        </div>

        <div style={{ margin: "16px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", ...muted }}>
            <span>{`母體：${label[s.from]} ${n(fromCount)}`}</span>
            <span>{`佔 ${s.parts.map((p) => pct(count[p] / fromCount)).join(" + ")}`}</span>
          </div>
          <div style={{ display: "flex", height: "16px", border: "2px solid var(--text)", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--surface)", marginTop: "2px" }}>
            {s.parts.map((p) => (
              <div
                key={p}
                title={`${label[p]} ${n(count[p])}`}
                style={{ width: `${(count[p] / fromCount) * 100}%`, minWidth: "2px", background: shade(p), borderRight: "1px solid var(--surface-2)", transition: "width .3s" }}
              />
            ))}
          </div>
        </div>

        <p style={{ margin: "12px 0 0", color: "var(--text)" }}>{`${k + 1}／${steps.length}　${s.title}`}</p>
        {s.given && <p style={{ ...muted, margin: "4px 0 0" }}>{s.given}</p>}
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
