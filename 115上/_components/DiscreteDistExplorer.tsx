import { useState } from "react";
import { Interactive } from "zyninote";
import { Bars } from "./chart-ui.tsx";
import { Chip, fmt, formula, muted, panel, row, Slider } from "./prob-ui.tsx";
import { binomPmf, comb, factorial, hyperPmf, poissonPmf } from "./stats-math.ts";

type Mode = "eq" | "le" | "ge";
type Kind = "binomial" | "poisson" | "hypergeometric";
type Params = { n?: number; p?: number; lambda?: number; t?: number; N?: number; K?: number };
type Preset = { label: string; params: Params; x: number; mode: Mode };
type Props = { kind: Kind; presets: Preset[] };

const SYMBOL: Record<Mode, string> = { eq: "=", le: "≤", ge: "≥" };
const NAME: Record<Kind, string> = { binomial: "二項分配", poisson: "卜瓦松分配", hypergeometric: "超幾何分配" };

function support(kind: Kind, q: Params): number[] {
  if (kind === "binomial") return Array.from({ length: q.n! + 1 }, (_, i) => i);
  if (kind === "poisson") {
    const m = q.lambda! * q.t!;
    return Array.from({ length: Math.max(8, Math.ceil(m + 4 * Math.sqrt(m) + 2)) }, (_, i) => i);
  }
  const lo = Math.max(0, q.n! - (q.N! - q.K!));
  const hi = Math.min(q.n!, q.K!);
  return Array.from({ length: hi + 1 }, (_, i) => i).filter((i) => i >= lo);
}

function pmf(kind: Kind, q: Params, x: number): number {
  if (kind === "binomial") return binomPmf(q.n!, q.p!, x);
  if (kind === "poisson") return poissonPmf(q.lambda! * q.t!, x);
  return hyperPmf(q.N!, q.K!, q.n!, x);
}

function exact(kind: Kind, q: Params, x: number): string {
  if (kind === "binomial") {
    const { n, p } = q as Required<Params>;
    return `C(${n},${x}) × ${fmt(p)}^${x} × ${fmt(1 - p)}^${n - x} = ${comb(n, x)} × ${fmt(p ** x, 6)} × ${fmt((1 - p) ** (n - x), 6)} = ${fmt(binomPmf(n, p, x))}`;
  }
  if (kind === "poisson") {
    const m = q.lambda! * q.t!;
    return `${fmt(m)}^${x} × e^−${fmt(m)} / ${x}! = ${fmt(m ** x, 4)} × ${fmt(Math.exp(-m), 6)} / ${factorial(x)} = ${fmt(poissonPmf(m, x))}`;
  }
  const { N, K, n } = q as Required<Params>;
  return `C(${K},${x}) × C(${N - K},${n - x}) / C(${N},${n}) = ${comb(K, x)} × ${comb(N - K, n - x)} / ${comb(N, n)} = ${fmt(hyperPmf(N, K, n, x))}`;
}

function moments(kind: Kind, q: Params): { mean: number; sd?: number; text: string } {
  if (kind === "binomial") {
    const { n, p } = q as Required<Params>;
    return { mean: n * p, sd: Math.sqrt(n * p * (1 - p)), text: `μ = np = ${n} × ${fmt(p)} = ${fmt(n * p)}，σ = √(npq) = √${fmt(n * p * (1 - p))} = ${fmt(Math.sqrt(n * p * (1 - p)))}` };
  }
  if (kind === "poisson") {
    const m = q.lambda! * q.t!;
    return { mean: m, sd: Math.sqrt(m), text: `λt = ${fmt(q.lambda!)} × ${fmt(q.t!)} = ${fmt(m)}；E(X) = Var(X) = λt = ${fmt(m)}，σ = √λt = ${fmt(Math.sqrt(m))}` };
  }
  const { N, K, n } = q as Required<Params>;
  return { mean: (n * K) / N, text: `E(X) = n × K/N = ${n} × ${K}/${N} = ${fmt((n * K) / N)}` };
}

/** One explorer for the three discrete distributions: sliders, bars, and the worked formula. */
export default function DiscreteDistExplorer({ kind, presets }: Props) {
  const [preset, setPreset] = useState(0);
  const [q, setQ] = useState<Params>(presets[0].params);
  const [x, setX] = useState(presets[0].x);
  const [mode, setMode] = useState<Mode>(presets[0].mode);
  const [compare, setCompare] = useState(false);
  const xs = support(kind, q);
  const ps = xs.map((v) => pmf(kind, q, v));
  const xc = Math.min(Math.max(x, xs[0]), xs[xs.length - 1]);
  const inEvent = (v: number) => (mode === "eq" ? v === xc : mode === "le" ? v <= xc : v >= xc);
  const answer = ps.reduce((s, p, i) => s + (inEvent(xs[i]) ? p : 0), 0);
  const below = ps.reduce((s, p, i) => s + (xs[i] <= xc - 1 ? p : 0), 0);
  const mo = moments(kind, q);
  const choose = (i: number) => {
    setPreset(i);
    setQ(presets[i].params);
    setX(presets[i].x);
    setMode(presets[i].mode);
  };

  const steps: string[] = [];
  if (mode === "eq") steps.push(`P(X = ${xc}) = ${exact(kind, q, xc)}`);
  if (mode === "le") {
    const terms = xs.filter((v) => v <= xc);
    steps.push(
      terms.length <= 4
        ? `P(X ≤ ${xc}) = ${terms.map((v) => `P(${v})`).join(" + ")} = ${terms.map((v) => fmt(pmf(kind, q, v))).join(" + ")} = ${fmt(answer)}`
        : `P(X ≤ ${xc}) = P(0) + … + P(${xc}) = ${fmt(answer)}（累加機率，直接查表）`,
    );
  }
  if (mode === "ge") steps.push(`P(X ≥ ${xc}) = 1 − P(X ≤ ${xc - 1}) = 1 − ${fmt(below)} = ${fmt(answer)}（餘補法則）`);
  steps.push(mo.text);

  const binomCompare =
    kind === "hypergeometric" && compare ? xs.map((v) => binomPmf(q.n!, q.K! / q.N!, v)) : undefined;

  const describePreset = (pr: Preset) => {
    const s = support(kind, pr.params);
    const val = s.reduce((acc, v) => {
      const hit = pr.mode === "eq" ? v === pr.x : pr.mode === "le" ? v <= pr.x : v >= pr.x;
      return acc + (hit ? pmf(kind, pr.params, v) : 0);
    }, 0);
    return `${pr.label}：P(X ${SYMBOL[pr.mode]} ${pr.x}) = ${fmt(val)}`;
  };

  return (
    <Interactive
      description={`${NAME[kind]}互動示範。${
        kind === "binomial"
          ? "P(X=x)=C(n,x)·p^x·q^(n−x)，μ=np，σ=√(npq)。"
          : kind === "poisson"
            ? "P(X=x)=(λt)^x·e^(−λt)/x!，期望值與變異數都等於 λt。"
            : "P(X=x)=C(K,x)·C(N−K,n−x)/C(N,n)，不放回抽樣；E(X)=n·K/N。"
      }「恰好」直接代公式，「最多（≤）」累加或查累加表，「至少（≥）」用 1 − P(X ≤ x−1)。${presets.map(describePreset).join("；")}。`}
    >
      <div style={panel}>
        <div style={row}>
          {presets.map((p, i) => (
            <Chip key={p.label} active={i === preset} onClick={() => choose(i)}>
              {p.label}
            </Chip>
          ))}
        </div>
        <div style={{ display: "grid", gap: "4px", marginTop: "12px" }}>
          {kind === "binomial" && (
            <>
              <Slider label="n" value={q.n!} min={1} max={30} step={1} onChange={(v) => setQ({ ...q, n: v })} />
              <Slider label="p" value={q.p!} min={0.01} max={0.99} step={0.01} onChange={(v) => setQ({ ...q, p: v })} />
            </>
          )}
          {kind === "poisson" && (
            <>
              <Slider label="λ" value={q.lambda!} min={0.5} max={20} step={0.5} onChange={(v) => setQ({ ...q, lambda: v })} />
              <Slider label="t" value={q.t!} min={1} max={3} step={1} onChange={(v) => setQ({ ...q, t: v })} />
            </>
          )}
          {kind === "hypergeometric" && (
            <>
              <Slider label="N" value={q.N!} min={Math.max(q.K!, q.n!, 2)} max={100} step={1} onChange={(v) => setQ({ ...q, N: v })} />
              <Slider label="K" value={q.K!} min={1} max={q.N!} step={1} onChange={(v) => setQ({ ...q, K: v })} />
              <Slider label="n" value={q.n!} min={1} max={Math.min(q.N!, 30)} step={1} onChange={(v) => setQ({ ...q, n: v })} />
            </>
          )}
          <Slider label="x" value={xc} min={xs[0]} max={xs[xs.length - 1]} step={1} onChange={setX} />
        </div>
        <div style={{ ...row, marginTop: "8px" }}>
          {(["eq", "le", "ge"] as Mode[]).map((m) => (
            <Chip key={m} active={m === mode} onClick={() => setMode(m)}>
              {m === "eq" ? "恰好 =" : m === "le" ? "最多 ≤" : "至少 ≥"}
            </Chip>
          ))}
          {kind === "hypergeometric" && (
            <Chip active={compare} onClick={() => setCompare(!compare)}>
              對照二項（放回）
            </Chip>
          )}
        </div>
        <Bars
          values={ps}
          labels={xs.map(String)}
          highlight={xs.map(inEvent)}
          ariaLabel={`${NAME[kind]}機率分配`}
          marks={[{ at: mo.mean - xs[0] + 0.5, label: `μ=${fmt(mo.mean, 2)}` }]}
        />
        {binomCompare && (
          <>
            <p style={{ ...muted, margin: 0 }}>{`二項 B(n=${q.n}, p=K/N=${fmt(q.K! / q.N!)})（放回、每次獨立）：`}</p>
            <Bars values={binomCompare} labels={xs.map(String)} highlight={xs.map(inEvent)} ariaLabel="對照的二項分配" yMax={Math.max(...ps, ...binomCompare)} />
          </>
        )}
        <div style={formula}>{steps.join("\n")}</div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          深色長條 = 題目要的事件，加起來就是答案 {fmt(answer)}（{fmt(answer * 100, 2)}%）。
        </p>
      </div>
    </Interactive>
  );
}
