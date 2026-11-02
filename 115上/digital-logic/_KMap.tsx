import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { muted, panel, row, tint } from "../_components/prob-ui.tsx";

type Props = {
  /** Variable names, MSB first, 2 to 4 of them, e.g. ["w", "x", "y", "z"]. */
  vars: string[];
  /** Minterms where f = 1. */
  ones?: number[];
  /** Don't-care minterms. */
  dc?: number[];
  /** Start in POS mode (group the 0-cells). */
  pos?: boolean;
};

type Cell = 0 | 1 | 2; // 2 = don't care
type Implicant = { value: number; mask: number }; // mask bit = 1 means the variable is eliminated

const GRAY: Record<number, number[]> = { 1: [0, 1], 2: [0, 1, 3, 2] };

function bits(n: number, k: number) {
  return n.toString(2).padStart(k, "0");
}

function covers(p: Implicant, m: number) {
  return (m & ~p.mask) === p.value;
}

function primes(ones: number[], dc: number[]): Implicant[] {
  let terms = new Map<string, Implicant>();
  for (const m of [...ones, ...dc]) terms.set(`${m}/0`, { value: m, mask: 0 });
  const result: Implicant[] = [];
  while (terms.size > 0) {
    const list = [...terms.values()];
    const used = new Set<string>();
    const next = new Map<string, Implicant>();
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.mask !== b.mask) continue;
        const d = a.value ^ b.value;
        if (d === 0 || (d & (d - 1)) !== 0) continue;
        const merged = { value: a.value & ~d, mask: a.mask | d };
        next.set(`${merged.value}/${merged.mask}`, merged);
        used.add(`${a.value}/${a.mask}`);
        used.add(`${b.value}/${b.mask}`);
      }
    }
    for (const t of list) if (!used.has(`${t.value}/${t.mask}`)) result.push(t);
    terms = next;
  }
  return result;
}

function literalCount(p: Implicant, n: number) {
  let c = 0;
  for (let i = 0; i < n; i++) if (!(p.mask & (1 << i))) c++;
  return c;
}

/** All minimum covers (fewest implicants, then fewest literals). Brute force; fine for at most 4 variables. */
function minimalCovers(pr: Implicant[], targets: number[], n: number): Implicant[][] {
  if (targets.length === 0) return [[]];
  let best: Implicant[][] = [];
  let bestCost = Infinity;
  const k = pr.length;
  for (let size = 1; size <= k && best.length === 0; size++) {
    const pick: number[] = [];
    const rec = (start: number) => {
      if (pick.length === size) {
        const chosen = pick.map((i) => pr[i]);
        if (targets.every((m) => chosen.some((p) => covers(p, m)))) {
          const cost = chosen.reduce((s, p) => s + literalCount(p, n), 0);
          if (cost < bestCost) { bestCost = cost; best = [chosen]; }
          else if (cost === bestCost) best.push(chosen);
        }
        return;
      }
      for (let i = start; i < k; i++) { pick.push(i); rec(i + 1); pick.pop(); }
    };
    rec(0);
  }
  return best;
}

function termText(p: Implicant, vars: string[], pos: boolean) {
  const n = vars.length;
  const lits: string[] = [];
  for (let i = 0; i < n; i++) {
    const bit = 1 << (n - 1 - i);
    if (p.mask & bit) continue;
    const isOne = (p.value & bit) !== 0;
    // SOP: 1 → x, 0 → x'.  POS (grouping 0-cells): 0 → x, 1 → x'.
    const prime = pos ? isOne : !isOne;
    lits.push(vars[i] + (prime ? "'" : ""));
  }
  if (lits.length === 0) return pos ? "0" : "1";
  return pos ? `(${lits.join(" + ")})` : lits.join("");
}

function solve(cells: Cell[], vars: string[], pos: boolean) {
  const n = vars.length;
  const want = pos ? 0 : 1;
  const targets = cells.flatMap((c, m) => (c === want ? [m] : []));
  const dcs = cells.flatMap((c, m) => (c === 2 ? [m] : []));
  if (targets.length === 0) return { pr: [], ess: [], covers: [[]] as Implicant[][], expr: [pos ? "1" : "0"] };
  if (targets.length + dcs.length === cells.length) return { pr: [{ value: 0, mask: (1 << n) - 1 }], ess: [], covers: [], expr: [pos ? "0" : "1"] };
  const pr = primes(targets, dcs).sort((a, b) => literalCount(a, n) - literalCount(b, n) || a.value - b.value);
  const ess = pr.filter((p) => targets.some((m) => covers(p, m) && pr.filter((q) => covers(q, m)).length === 1));
  const cv = minimalCovers(pr, targets, n);
  const expr = cv.map((c) => c.map((p) => termText(p, vars, pos)).join(pos ? "" : " + "));
  return { pr, ess, covers: cv, expr };
}

const cellBase: CSSProperties = {
  width: "44px",
  height: "40px",
  border: "1px solid var(--line-strong)",
  position: "relative",
  cursor: "pointer",
  font: "inherit",
  fontFamily: "var(--mono)",
  color: "inherit",
  padding: 0,
};

/** Karnaugh map (2–4 variables): click cells to cycle 0 → 1 → φ, see prime implicants and the minimal SOP or POS. */
export default function KMap({ vars, ones = [], dc = [], pos: initialPos = false }: Props) {
  const n = vars.length;
  const size = 1 << n;
  const init = (): Cell[] => Array.from({ length: size }, (_, m) => (ones.includes(m) ? 1 : dc.includes(m) ? 2 : 0));
  const [cells, setCells] = useState<Cell[]>(init);
  const [pos, setPos] = useState(initialPos);
  const [hover, setHover] = useState<Implicant | null>(null);

  const colBits = Math.ceil(n / 2);
  const rowBits = Math.floor(n / 2);
  const cols = GRAY[colBits];
  const rows = GRAY[rowBits];
  const colVars = vars.slice(0, colBits).join("");
  const rowVars = vars.slice(colBits).join("");

  const { pr, ess, expr } = solve(cells, vars, pos);
  const onesNow = cells.flatMap((c, m) => (c === 1 ? [m] : []));
  const zerosNow = cells.flatMap((c, m) => (c === 0 ? [m] : []));
  const dcNow = cells.flatMap((c, m) => (c === 2 ? [m] : []));
  const fn = `f(${vars.join(",")})`;
  const sigma = `Σ(${onesNow.join(",")})${dcNow.length ? ` + Σφ(${dcNow.join(",")})` : ""}`;
  const pi = `Π(${zerosNow.join(",")})${dcNow.length ? ` · Πφ(${dcNow.join(",")})` : ""}`;

  const initCells = init();
  const initSol = solve(initCells, vars, initialPos);
  const initOnes = initCells.flatMap((c, m) => (c === 1 ? [m] : []));
  const initZeros = initCells.flatMap((c, m) => (c === 0 ? [m] : []));

  const cycle = (m: number) => setCells(cells.map((c, i) => (i === m ? (((c + 1) % 3) as Cell) : c)));
  const label = (c: Cell) => (c === 2 ? "φ" : String(c));

  return (
    <Interactive
      description={`${n} 變數卡諾圖（欄 ${colVars}、列 ${rowVars}，依格雷碼順序 ${cols.map((c) => bits(c, colBits)).join("、")} 排列，相鄰格子只差一個變數）。預設函數 ${fn} = Σ(${initOnes.join(",")})${dc.length ? ` + Σφ(${dc.join(",")})` : ""} = Π(${initZeros.join(",")})${dc.length ? ` · Πφ(${dc.join(",")})` : ""}。${initialPos ? "圈 0-格子求最簡 POS" : "圈 1-格子求最簡 SOP"}：質隱項 ${initSol.pr.map((p) => termText(p, vars, initialPos)).join("、")}；必要質隱項 ${initSol.ess.map((p) => termText(p, vars, initialPos)).join("、") || "無"}；最簡式 f = ${initSol.expr.join("，或 f = ")}。`}
    >
      <div style={panel}>
        <div style={row}>
          {[false, true].map((p) => (
            <button
              key={String(p)}
              type="button"
              onClick={() => setPos(p)}
              style={{ font: "inherit", cursor: "pointer", padding: "2px 10px", borderRadius: "var(--radius-pill)", border: "1px solid var(--line-strong)", background: pos === p ? tint(16) : "transparent", color: "inherit" }}
            >
              {p ? "最簡 POS（圈 0）" : "最簡 SOP（圈 1）"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCells(init())}
            style={{ font: "inherit", cursor: "pointer", padding: "2px 10px", borderRadius: "var(--radius-pill)", border: "1px solid var(--line)", background: "transparent", color: "var(--muted)" }}
          >
            重設
          </button>
        </div>
        <p style={{ ...muted, margin: "8px 0" }}>點格子切換 0 → 1 → φ（不在意項）。滑過下方的質隱項，會標出它圈住的格子。</p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", margin: 0, fontSize: "var(--fs-sm)" }}>
            <thead>
              <tr>
                <th style={{ padding: "2px 6px", fontWeight: "normal", color: "var(--muted)", textAlign: "right", fontFamily: "var(--mono)" }}>
                  {rowVars} \ {colVars}
                </th>
                {cols.map((c) => (
                  <th key={c} style={{ padding: "2px 6px", fontWeight: "normal", fontFamily: "var(--mono)" }}>{bits(c, colBits)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r}>
                  <th style={{ padding: "2px 6px", fontWeight: "normal", fontFamily: "var(--mono)", textAlign: "right" }}>{bits(r, rowBits)}</th>
                  {cols.map((c) => {
                    const m = (c << rowBits) | r;
                    const lit = hover !== null && covers(hover, m);
                    const active = cells[m] === (pos ? 0 : 1);
                    return (
                      <td key={c} style={{ padding: 0 }}>
                        <button
                          type="button"
                          onClick={() => cycle(m)}
                          aria-label={`m${m} = ${label(cells[m])}`}
                          style={{ ...cellBase, background: lit ? tint(24) : active ? tint(8) : "transparent", fontWeight: active ? 600 : 400 }}
                        >
                          <span style={{ position: "absolute", top: "1px", right: "3px", fontSize: "10px", color: "var(--muted)" }}>{m}</span>
                          {label(cells[m])}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "12px", fontFamily: "var(--mono)", fontSize: "var(--fs-sm)", display: "grid", gap: "4px" }}>
          <div>{fn} = {sigma}</div>
          <div>{fn} = {pi}</div>
        </div>

        <div style={{ marginTop: "8px", fontSize: "var(--fs-sm)" }}>
          <span style={{ color: "var(--muted)" }}>質隱項（* 為必要質隱項）：</span>
          {pr.length === 0 && <span>無</span>}
          {pr.map((p) => (
            <span
              key={`${p.value}/${p.mask}`}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(p)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              style={{ display: "inline-block", margin: "2px 4px", padding: "0 6px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", fontFamily: "var(--mono)", cursor: "default" }}
            >
              {ess.includes(p) ? "*" : ""}
              {termText(p, vars, pos)}
            </span>
          ))}
        </div>
        <div style={{ marginTop: "8px", fontFamily: "var(--mono)" }}>
          {expr.map((e, i) => (
            <div key={i}>
              最簡 {pos ? "POS" : "SOP"}{expr.length > 1 ? ` (${i + 1})` : ""}：f = {e}
            </div>
          ))}
        </div>
      </div>
    </Interactive>
  );
}
