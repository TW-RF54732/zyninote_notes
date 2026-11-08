import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { StepBar, caption, formula, muted, panel, tint, useSvgId } from "./ds-ui.tsx";

/** 4×4 sparse matrix, nonzeros in row-major order: [row, col, value]. */
const N = 4;
const ELEMS: [number, number, number][] = [
  [0, 0, 3],
  [0, 3, 7],
  [1, 1, 5],
  [2, 0, 2],
  [3, 3, 4],
];
const eid = (i: number, j: number) => `e${i}${j}`;
const VAL: Record<string, number> = Object.fromEntries(ELEMS.map(([i, j, v]) => [eid(i, j), v]));

type St = {
  elems: string[];
  heads: boolean;
  right: Record<string, string>;
  down: Record<string, string>;
  hi: string[]; // "r:<from>" or "d:<from>"
  node?: string;
  cell?: [number, number];
  code: string;
  msg: string;
};

const name = (id: string) => {
  if (id === "H") return "H";
  if (id[0] === "R") return `R${id.slice(1)}（第 ${id.slice(1)} 列開頭）`;
  if (id[0] === "C") return `C${id.slice(1)}（第 ${id.slice(1)} 行開頭）`;
  return `(${id[1]},${id[2]})=${VAL[id]}`;
};
const short = (id: string) => (id[0] === "e" ? `(${id[1]},${id[2]})` : id);

function build(): St[] {
  const out: St[] = [];
  const elems: string[] = [];
  const right: Record<string, string> = {};
  const down: Record<string, string> = {};
  let heads = false;
  const snap = (s: Partial<St> & { code: string; msg: string }) =>
    out.push({ elems: [...elems], heads, right: { ...right }, down: { ...down }, hi: [], ...s });

  snap({
    code: "/* 4×4 矩陣，16 格只有 5 格不是 0 */",
    msg: "目標：只為這 5 個非零元素建節點。每個節點同時串在兩個圈上：同一列的圈（用 right 往右走）和同一行的圈（用 down 往下走）。",
  });

  snap({
    node: "H",
    code: "H: row = 4, col = 4   /* 總開頭節點 */",
    msg: "先建總開頭節點 H，它的 row、col 欄位不是座標，而是「這個矩陣有 4 列、4 行」。拿到 H 就能找到整個矩陣。",
  });

  heads = true;
  for (let k = 0; k < N; k++) {
    right[`R${k}`] = `R${k}`;
    down[`C${k}`] = `C${k}`;
  }
  snap({
    hi: [...Array(N).keys()].flatMap((k) => [`r:R${k}`, `d:C${k}`]),
    code: "for k: R[k]->right = R[k];  C[k]->down = C[k];",
    msg: "每一列建一個列開頭 R0~R3，每一行建一個行開頭 C0~C3。現在還沒有任何元素，所以每個圈都是空的：R 的 right 指回自己、C 的 down 指回自己（小圓圈）。",
  });

  for (const [i, j, v] of ELEMS) {
    const id = eid(i, j);
    const R = `R${i}`;
    const C = `C${j}`;
    elems.push(id);

    // hook into row i: walk from R until the next one is R (the row's tail)
    let p = R;
    while (right[p] !== R) p = right[p];
    right[id] = R;
    right[p] = id;
    const rowWasEmpty = p === R;
    snap({
      node: id,
      cell: [i, j],
      hi: [`r:${p}`, `r:${id}`],
      code: `p = new node(${i}, ${j}, ${v});\n${short(p)}->right = p;   p->right = ${R};`,
      msg: rowWasEmpty
        ? `建節點 row=${i}, col=${j}, data=${v}，先串進第 ${i} 列的圈。第 ${i} 列原本是空的，所以 ${R} 改指向它，它的 right 再指回 ${R}，圈就是 ${R} → (${i},${j}) → ${R}。`
        : `建節點 row=${i}, col=${j}, data=${v}，先串進第 ${i} 列的圈。這一列已經有 ${short(p)}，新節點在它右邊：${short(p)} 的 right 改指新節點，新節點的 right 指回 ${R}（它是這列最後一個）。`,
    });

    let q = C;
    while (down[q] !== C) q = down[q];
    down[id] = C;
    down[q] = id;
    const colWasEmpty = q === C;
    snap({
      node: id,
      cell: [i, j],
      hi: [`d:${q}`, `d:${id}`],
      code: `${short(q)}->down = p;   p->down = ${C};`,
      msg: colWasEmpty
        ? `同一個節點再串進第 ${j} 行的圈。第 ${j} 行原本是空的，所以 ${C} 往下指向它，它的 down 繞回 ${C}。一個節點兩個圈都掛好了。`
        : `同一個節點再串進第 ${j} 行的圈。這一行上面已經有 ${short(q)}，所以 ${short(q)} 的 down 改指新節點，新節點的 down 繞回 ${C}（它是這行最下面一個）。`,
    });
  }

  snap({
    node: "e03",
    code: "/* 建好了：每個節點都在一個列圈 + 一個行圈上 */",
    msg: "看 (0,3)=7 這個節點：right 繞回 R0（它是第 0 列最後一個），down 指到 (3,3)=4（第 3 行的下一個）。一個節點同時告訴你「同列下一個」和「同行下一個」。",
  });

  snap({
    hi: ["r:R0", "r:e00", "r:e03"],
    cell: [0, 0],
    code: "for (p = R0->right; p != R0; p = p->right) print(p);",
    msg: "走訪第 0 列：從 R0 出發一直往 right 走，經過 (0,0)=3、(0,3)=7，又回到 R0 就停。停的條件是「回到開頭」，不是碰到 NULL，因為環狀串列沒有 NULL。",
  });

  snap({
    hi: ["d:C0", "d:e00", "d:e20"],
    cell: [2, 0],
    code: "for (p = C0->down; p != C0; p = p->down) print(p);",
    msg: "走訪第 0 行：從 C0 一直往 down 走，經過 (0,0)=3、(2,0)=2，回到 C0 停。(1,0)、(3,0) 是 0，根本沒有節點，直接跳過。",
  });

  snap({
    hi: ["d:C2"],
    code: "C2->down == C2   /* 第 2 行沒有非零元素 */",
    msg: "第 2 行整行都是 0：C2 的 down 還是指回自己。判斷某列／某行是不是全 0，只要看開頭節點有沒有指回自己。",
  });

  return out;
}

/* ---------- drawing ---------- */

const W = 58, H = 38; // element node
const HW = 44; // head node width
const cx = (L: number) => 46 + L * 96;
const cy = (R: number) => 32 + R * 78;

function pos(id: string): { x: number; y: number; w: number } {
  if (id === "H") return { x: cx(0), y: cy(0), w: HW };
  if (id[0] === "R") return { x: cx(0), y: cy(+id.slice(1) + 1), w: HW };
  if (id[0] === "C") return { x: cx(+id.slice(1) + 1), y: cy(0), w: HW };
  return { x: cx(+id[2] + 1), y: cy(+id[1] + 1), w: W };
}

function rightPath(from: string, to: string): string {
  const a = pos(from), b = pos(to);
  if (from === to) {
    const x = a.x + a.w / 2;
    return `M${x},${a.y - 7} C${x + 26},${a.y - 20} ${x + 26},${a.y + 20} ${x + 1},${a.y + 8}`;
  }
  if (b.x > a.x) return `M${a.x + a.w / 2},${a.y} L${b.x - b.w / 2 - 2},${b.y}`;
  // wrap back to the row head: out right, under the row, up into the head's bottom
  const x0 = a.x + a.w / 2, lane = a.y + H / 2 + 13;
  return `M${x0},${a.y} L${x0 + 10},${a.y} Q${x0 + 16},${a.y} ${x0 + 16},${a.y + 6} L${x0 + 16},${lane - 6} Q${x0 + 16},${lane} ${x0 + 10},${lane} L${b.x + 6},${lane} Q${b.x},${lane} ${b.x},${lane - 6} L${b.x},${b.y + H / 2 + 2}`;
}

function downPath(from: string, to: string): string {
  const a = pos(from), b = pos(to);
  if (from === to) {
    const y = a.y + H / 2;
    return `M${a.x - 7},${y} C${a.x - 20},${y + 26} ${a.x + 20},${y + 26} ${a.x + 8},${y + 1}`;
  }
  if (b.y > a.y) return `M${a.x},${a.y + H / 2} L${b.x},${b.y - H / 2 - 2}`;
  // wrap back to the column head: out left, up the left lane, into the head's left side
  const y0 = a.y + 10, lane = a.x - a.w / 2 - 14;
  return `M${a.x - a.w / 2},${y0} L${lane + 6},${y0} Q${lane},${y0} ${lane},${y0 - 6} L${lane},${b.y + 6} Q${lane},${b.y} ${lane + 6},${b.y} L${b.x - b.w / 2 - 2},${b.y}`;
}

function Graph({ s }: { s: St }) {
  const arrow = useSvgId("sp-arrow");
  const ids = s.heads ? ["H", ...[...Array(N).keys()].flatMap((k) => [`R${k}`, `C${k}`]), ...s.elems] : s.node === "H" ? ["H"] : [];
  const edges: { key: string; d: string; dashed: boolean }[] = [];
  for (const [f, t] of Object.entries(s.right)) edges.push({ key: `r:${f}`, d: rightPath(f, t), dashed: false });
  for (const [f, t] of Object.entries(s.down)) edges.push({ key: `d:${f}`, d: downPath(f, t), dashed: true });
  const width = cx(N) + 64, height = cy(N) + 50;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="稀疏矩陣的環狀串列" style={{ width: "100%", maxWidth: `${width}px`, display: "block", color: "var(--text)" }}>
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>
      {edges.map((e) => {
        const on = s.hi.includes(e.key);
        return (
          <path key={e.key} d={e.d} fill="none" stroke="currentColor" strokeWidth={on ? 2.4 : 1.1} strokeDasharray={e.dashed ? "5 3" : undefined} opacity={on ? 1 : s.hi.length ? 0.28 : 0.6} markerEnd={`url(#${arrow})`} />
        );
      })}
      {ids.map((id) => {
        const p = pos(id);
        const on = s.node === id;
        const isElem = id[0] === "e";
        return (
          <g key={id}>
            <rect x={p.x - p.w / 2} y={p.y - H / 2} width={p.w} height={H} rx={isElem ? 6 : 3} fill={on ? tint(22) : isElem ? "var(--surface)" : tint(6)} stroke="currentColor" strokeWidth={on ? 2 : 1} />
            {isElem ? (
              <>
                <text x={p.x} y={p.y - 5} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.7} fontFamily="var(--mono)">({id[1]},{id[2]})</text>
                <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize="15" fontWeight={700} fill="currentColor" fontFamily="var(--mono)">{VAL[id]}</text>
              </>
            ) : id === "H" ? (
              <>
                <text x={p.x} y={p.y - 4} textAnchor="middle" fontSize="12" fontWeight={700} fill="currentColor">H</text>
                <text x={p.x} y={p.y + 11} textAnchor="middle" fontSize="10" fill="currentColor" fontFamily="var(--mono)">4×4</text>
              </>
            ) : (
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="12" fontWeight={700} fill="currentColor">{id}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Matrix({ s }: { s: St }) {
  const val = (i: number, j: number) => VAL[eid(i, j)] ?? 0;
  return (
    <table style={{ borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "var(--fs-sm)" }}>
      <thead>
        <tr>
          <th />
          {[...Array(N).keys()].map((j) => <th key={j} style={{ ...muted, fontWeight: 400, padding: "0 8px" }}>{j}</th>)}
        </tr>
      </thead>
      <tbody>
        {[...Array(N).keys()].map((i) => (
          <tr key={i}>
            <th style={{ ...muted, fontWeight: 400, paddingRight: "6px" }}>{i}</th>
            {[...Array(N).keys()].map((j) => {
              const v = val(i, j);
              const on = s.cell?.[0] === i && s.cell?.[1] === j;
              const built = s.elems.includes(eid(i, j));
              return (
                <td key={j} style={{ textAlign: "center", width: "30px", height: "28px", border: "1px solid var(--line-strong)", background: on ? tint(22) : built ? tint(8) : undefined, color: v ? "var(--text)" : "var(--faint)", fontWeight: v ? 700 : 400 }}>{v}</td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Fields({ s }: { s: St }) {
  const id = s.node;
  if (!id || id[0] !== "e") return null;
  const cell = { border: "1px solid var(--line-strong)", padding: "4px 8px", textAlign: "center" as const };
  return (
    <div>
      <div style={{ ...muted, marginBottom: "4px" }}>目前節點的五個欄位</div>
      <table style={{ borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "var(--fs-sm)" }}>
        <tbody>
          <tr><td style={cell}>row</td><td style={cell}>{id[1]}</td><td style={{ ...muted, paddingLeft: "8px" }}>第幾列</td></tr>
          <tr><td style={cell}>col</td><td style={cell}>{id[2]}</td><td style={{ ...muted, paddingLeft: "8px" }}>第幾行</td></tr>
          <tr><td style={cell}>data</td><td style={cell}>{VAL[id]}</td><td style={{ ...muted, paddingLeft: "8px" }}>值</td></tr>
          <tr><td style={cell}>right →</td><td style={cell}>{s.right[id] ? name(s.right[id]) : "—"}</td><td style={{ ...muted, paddingLeft: "8px" }}>同列下一個</td></tr>
          <tr><td style={cell}>down ↓</td><td style={cell}>{s.down[id] ? name(s.down[id]) : "—"}</td><td style={{ ...muted, paddingLeft: "8px" }}>同行下一個</td></tr>
        </tbody>
      </table>
    </div>
  );
}

/** Step-by-step construction of the circular-list (orthogonal list) representation of a 4×4 sparse matrix. */
export default function SparseCircular() {
  const states = useMemo(build, []);
  const [step, setStep] = useState(0);
  const s = states[Math.min(step, states.length - 1)];
  return (
    <Interactive description="逐步建立 4×4 稀疏矩陣的環狀串列表示。非零元素 (0,0)=3、(0,3)=7、(1,1)=5、(2,0)=2、(3,3)=4。先建總開頭節點 H（存 4 列 4 行），再建列開頭 R0~R3（right 指回自己）與行開頭 C0~C3（down 指回自己）。接著依列優先順序插入每個非零節點：先串進該列的圈（前一個節點或 R 的 right 指向它，它的 right 指回 R），再串進該行的圈（上一個節點或 C 的 down 指向它，它的 down 指回 C）。最後示範走訪第 0 列 R0→3→7→R0、第 0 行 C0→3→2→C0，以及空的第 2 行 C2 指回自己。實線是 right，虛線是 down。">
      <div style={panel}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Matrix s={s} />
            <Fields s={s} />
          </div>
          <div style={{ flex: "1 1 340px", minWidth: 0 }}>
            <Graph s={s} />
            <div style={{ ...muted, textAlign: "center" }}>實線 → right（同列下一個）　虛線 ⇢ down（同行下一個）</div>
          </div>
        </div>
        <div style={{ ...formula, whiteSpace: "pre-wrap" }}>{s.code}</div>
        <p style={caption}>{s.msg}</p>
        <StepBar step={step} total={states.length} setStep={setStep} />
      </div>
    </Interactive>
  );
}
