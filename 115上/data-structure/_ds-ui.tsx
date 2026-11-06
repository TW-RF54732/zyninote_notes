import type { CSSProperties, ReactNode } from "react";
import { Chip, Slider, formula, muted, panel, row, tint, useSvgId } from "../_components/prob-ui.tsx";

/** Shared look for the data-structure widgets: monochrome, app tokens only. */
export { Chip, Slider, formula, muted, panel, row, tint, useSvgId };

export const caption: CSSProperties = { margin: "10px 0 0", lineHeight: 1.6 };

/** Prev / next / reset controls for step-by-step demos. */
export function StepBar({ step, total, setStep, label }: {
  step: number;
  total: number;
  setStep: (s: number) => void;
  label?: ReactNode;
}) {
  return (
    <div style={{ ...row, marginTop: "12px" }}>
      <Chip onClick={() => setStep(0)}>⟲ 重來</Chip>
      <Chip onClick={() => setStep(Math.max(0, step - 1))}>← 上一步</Chip>
      <Chip active onClick={() => setStep(Math.min(total - 1, step + 1))}>下一步 →</Chip>
      <span style={muted}>
        {label ?? `第 ${step + 1} / ${total} 步`}
      </span>
    </div>
  );
}

/** One memory cell / array slot. */
export function Cell({ children, on, dim, sub, width = 44 }: {
  children?: ReactNode;
  on?: boolean;
  dim?: boolean;
  sub?: ReactNode;
  width?: number;
}) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <div
        style={{
          minWidth: `${width}px`,
          height: "36px",
          padding: "0 6px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--mono)",
          fontSize: "var(--fs-sm)",
          border: `1px solid ${on ? "var(--text)" : "var(--line-strong)"}`,
          borderRadius: "var(--radius-sm)",
          background: on ? tint(22) : "var(--surface)",
          color: dim ? "var(--faint)" : "var(--text)",
          fontWeight: on ? 700 : 400,
        }}
      >
        {children}
      </div>
      {sub !== undefined && <span style={{ ...muted, fontSize: "12px", fontFamily: "var(--mono)" }}>{sub}</span>}
    </div>
  );
}

export const cells: CSSProperties = { display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "flex-start" };

/** Binary tree given as nested nodes. */
export type TNode = { key: string; label?: ReactNode; left?: TNode | null; right?: TNode | null; note?: string };

type Placed = { node: TNode; x: number; y: number; parent?: Placed; side?: "L" | "R" };

/** Lay out by inorder position (x) and depth (y), so the picture always matches the inorder sequence. */
function place(root: TNode | null | undefined): Placed[] {
  const out: Placed[] = [];
  let i = 0;
  const walk = (n: TNode | null | undefined, d: number, parent?: Placed, side?: "L" | "R") => {
    if (!n) return;
    const me: Placed = { node: n, x: 0, y: d, parent, side };
    walk(n.left, d + 1, me, "L");
    me.x = i++;
    out.push(me);
    walk(n.right, d + 1, me, "R");
  };
  walk(root, 0);
  return out;
}

/** SVG binary tree. `hi` = strongly highlighted keys, `soft` = lightly marked keys, `ghost` = drawn faint. */
export function BinTree({ root, hi = [], soft = [], ghost = [], labelEdges = false, r = 17, ariaLabel = "二元樹" }: {
  root: TNode | null | undefined;
  hi?: string[];
  soft?: string[];
  ghost?: string[];
  labelEdges?: boolean;
  r?: number;
  ariaLabel?: string;
}) {
  const nodes = place(root);
  if (nodes.length === 0) return <div style={{ ...muted, padding: "12px 0" }}>（空樹）</div>;
  const dx = Math.max(38, r * 2 + 8);
  const dy = 58;
  const cols = nodes.length;
  const depth = Math.max(...nodes.map((n) => n.y)) + 1;
  const W = cols * dx + 16;
  const H = depth * dy + 4;
  const X = (p: Placed) => 8 + dx / 2 + p.x * dx;
  const Y = (p: Placed) => r + 6 + p.y * dy;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}
      style={{ width: "100%", maxWidth: `${W * 1.25}px`, display: "block", margin: "8px auto", color: "var(--text)" }}>
      {nodes.filter((p) => p.parent).map((p) => (
        <g key={"e" + p.node.key}>
          <line x1={X(p.parent!)} y1={Y(p.parent!)} x2={X(p)} y2={Y(p)} stroke="currentColor"
            strokeOpacity={ghost.includes(p.node.key) ? 0.2 : 0.5} strokeDasharray={ghost.includes(p.node.key) ? "4 3" : undefined} />
          {labelEdges && (
            <text x={(X(p.parent!) + X(p)) / 2 + (p.side === "L" ? -9 : 5)} y={(Y(p.parent!) + Y(p)) / 2 - 2}
              fontSize="12" fill="currentColor" fillOpacity={0.75}>{p.side === "L" ? "0" : "1"}</text>
          )}
        </g>
      ))}
      {nodes.map((p) => {
        const isHi = hi.includes(p.node.key);
        const isSoft = soft.includes(p.node.key);
        const isGhost = ghost.includes(p.node.key);
        return (
          <g key={p.node.key} opacity={isGhost ? 0.35 : 1}>
            <circle cx={X(p)} cy={Y(p)} r={r}
              fill={isHi ? "currentColor" : isSoft ? tint(25) : "var(--surface)"}
              stroke="currentColor" strokeWidth={isHi || isSoft ? 2 : 1} strokeOpacity={isHi || isSoft ? 1 : 0.6}
              strokeDasharray={isGhost ? "4 3" : undefined} />
            <text x={X(p)} y={Y(p) + 4.5} textAnchor="middle" fontSize="13" fontFamily="var(--mono)"
              fill={isHi ? "var(--background)" : "currentColor"} fontWeight={isHi ? 700 : 400}>
              {p.node.label ?? p.node.key}
            </text>
            {p.node.note && (
              <text x={X(p) + r + 2} y={Y(p) - r + 4} fontSize="11" fill="currentColor" fillOpacity={0.8}>{p.node.note}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Build a tree from compact spec: "A(B,C(D,))" — empty slot means no child. */
export function parseTree(spec: string): TNode | null {
  let i = 0;
  const node = (): TNode | null => {
    let name = "";
    while (i < spec.length && !"(),".includes(spec[i])) name += spec[i++];
    name = name.trim();
    if (!name) return null;
    const n: TNode = { key: name };
    if (spec[i] === "(") {
      i++;
      n.left = node();
      if (spec[i] === ",") i++;
      n.right = node();
      if (spec[i] === ")") i++;
    }
    return n;
  };
  return node();
}
