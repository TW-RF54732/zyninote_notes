import { tint, useSvgId } from "./ds-ui.tsx";

export type LNode = { id: string; label: string; x: number; y: number; hi?: boolean; ghost?: boolean };
export type LEdge = { from: string; to: string | null; hi?: boolean; dashed?: boolean; back?: boolean };
export type LPtr = { name: string; to: string; below?: boolean };

const W = 54;
const H = 30;

/** Draws singly/doubly linked nodes as [data|link] boxes with arrows. Coordinates are in grid units. */
export function ListDraw({ nodes, edges, ptrs = [], width = 560, height = 150 }: {
  nodes: LNode[];
  edges: LEdge[];
  ptrs?: LPtr[];
  width?: number;
  height?: number;
}) {
  const id = useSvgId("ds-arrow");
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const px = (n: LNode) => 14 + n.x * 78;
  const py = (n: LNode) => 34 + n.y * 62;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="鏈結串列" style={{ width: "100%", maxWidth: `${width * 1.2}px`, display: "block", margin: "8px auto", color: "var(--text)" }}>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = pos[e.from];
        if (!a) return null;
        const sx = px(a) + W - 8;
        const sy = py(a) + H / 2 + (e.back ? 6 : 0);
        const op = e.hi ? 1 : 0.6;
        if (e.to === null) {
          const blocked = nodes.some((m) => m.y === a.y && m.x > a.x && m.x - a.x < 1.2);
          if (blocked) {
            return (
              <g key={i} opacity={op}>
                <line x1={sx} y1={sy} x2={sx} y2={sy + 26} stroke="currentColor" markerEnd={`url(#${id})`} strokeWidth={e.hi ? 2 : 1} />
                <text x={sx} y={sy + 37} textAnchor="middle" fontSize="9" fill="currentColor">NULL</text>
              </g>
            );
          }
          return (
            <g key={i} opacity={op}>
              <line x1={sx} y1={sy} x2={sx + 20} y2={sy} stroke="currentColor" markerEnd={`url(#${id})`} strokeWidth={e.hi ? 2 : 1} />
              <text x={sx + 24} y={sy + 4} fontSize="10" fill="currentColor">NULL</text>
            </g>
          );
        }
        const b = pos[e.to];
        if (!b) return null;
        let d: string;
        if (e.back) {
          // doubly: from left side of a to right side of b, drawn below the forward arrow
          const x1 = px(a) + 4, y1 = py(a) + H / 2 + 6;
          const x2 = px(b) + W - 2, y2 = py(b) + H / 2 + 6;
          d = `M${x1},${y1} L${x2},${y2}`;
        } else if (b.x <= a.x && b.y === a.y) {
          // loop back (circular) — route under the row
          const x2 = px(b) + W / 2, y2 = py(b) + H;
          const low = py(a) + H + 22;
          d = `M${sx},${sy} L${sx + 12},${sy} L${sx + 12},${low} L${x2},${low} L${x2},${y2 + 2}`;
        } else {
          const x2 = px(b) - 1;
          const y2 = py(b) + H / 2;
          const mx = (sx + x2) / 2;
          d = b.y === a.y ? `M${sx},${sy} L${x2},${y2}` : `M${sx},${sy} C${mx},${sy} ${mx},${y2} ${x2},${y2}`;
        }
        return (
          <path key={i} d={d} fill="none" stroke="currentColor" strokeOpacity={op} strokeWidth={e.hi ? 2.2 : 1.2}
            strokeDasharray={e.dashed ? "4 3" : undefined} markerEnd={`url(#${id})`} />
        );
      })}
      {nodes.map((n) => (
        <g key={n.id} opacity={n.ghost ? 0.35 : 1}>
          <rect x={px(n)} y={py(n)} width={W} height={H} rx={5} fill={n.hi ? tint(25) : "var(--surface)"} stroke="currentColor"
            strokeWidth={n.hi ? 2 : 1} strokeDasharray={n.ghost ? "4 3" : undefined} />
          <line x1={px(n) + W - 16} y1={py(n)} x2={px(n) + W - 16} y2={py(n) + H} stroke="currentColor" strokeOpacity={0.5} />
          <text x={px(n) + (W - 16) / 2} y={py(n) + H / 2 + 5} textAnchor="middle" fontSize="13" fontFamily="var(--mono)" fill="currentColor">{n.label}</text>
          <circle cx={px(n) + W - 8} cy={py(n) + H / 2} r={2.5} fill="currentColor" />
        </g>
      ))}
      {ptrs.map((p, i) => {
        const n = pos[p.to];
        if (!n) return null;
        const x = px(n) + (W - 16) / 2;
        const sameBefore = ptrs.slice(0, i).filter((q) => q.to === p.to && !!q.below === !!p.below).length;
        const y = p.below ? py(n) + H + 16 + sameBefore * 13 : py(n) - 8 - sameBefore * 13;
        return (
          <text key={p.name} x={x} y={y} textAnchor="middle" fontSize="12" fontFamily="var(--mono)" fill="currentColor" fontWeight={700}>
            {p.below ? `↑${p.name}` : `${p.name}↓`}
          </text>
        );
      })}
    </svg>
  );
}
