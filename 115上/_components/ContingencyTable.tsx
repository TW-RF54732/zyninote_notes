import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { Chip, fmt, formula, muted, panel, row, tint } from "./prob-ui.tsx";

type Props = {
  /** What the table counts, e.g. "700 個磁碟機依供應商與狀態分類". */
  title: string;
  rowTitle: string;
  colTitle: string;
  rows: string[];
  cols: string[];
  counts: number[][];
  initialRow?: number;
  initialCol?: number;
  /** Which result to emphasize: the union (Rule 4) or the conditional (Rule 6). */
  focus?: "union" | "given";
};

const cell: CSSProperties = { padding: "6px 10px", borderBottom: "1px solid var(--line)", textAlign: "right", whiteSpace: "nowrap" };
const headBtn: CSSProperties = { font: "inherit", cursor: "pointer", background: "none", border: "none", color: "inherit", padding: 0, textAlign: "inherit" };

/**
 * Contingency table: pick a row event and a column event to see marginal,
 * joint, union (Rule 4) and conditional (Rule 6) probabilities.
 */
export default function ContingencyTable({ title, rowTitle, colTitle, rows, cols, counts, initialRow = 0, initialCol = 0, focus = "given" }: Props) {
  const [r, setR] = useState(initialRow);
  const [c, setC] = useState(initialCol);
  const [asProb, setAsProb] = useState(false);
  const [view, setView] = useState(focus);

  const rowTotals = counts.map((cs) => cs.reduce((s, x) => s + x, 0));
  const colTotals = cols.map((_, j) => counts.reduce((s, cs) => s + cs[j], 0));
  const N = rowTotals.reduce((s, x) => s + x, 0);
  const show = (x: number) => (asProb ? fmt(x / N) : String(x));

  const R = rows[r];
  const C = cols[c];
  const joint = counts[r][c];
  const union = rowTotals[r] + colTotals[c] - joint;

  const bg = (i: number, j: number) => {
    if (view === "given") return j === c ? (i === r ? tint(32) : tint(12)) : undefined;
    if (i === r && j === c) return tint(32);
    return i === r || j === c ? tint(12) : undefined;
  };

  const results =
    view === "union"
      ? [
          `P(${R}) = ${rowTotals[r]}/${N} = ${fmt(rowTotals[r] / N)}`,
          `P(${C}) = ${colTotals[c]}/${N} = ${fmt(colTotals[c] / N)}`,
          `P(${R} 且 ${C}) = ${joint}/${N} = ${fmt(joint / N)}`,
          `P(${R} 或 ${C}) = ${rowTotals[r]}/${N} + ${colTotals[c]}/${N} − ${joint}/${N} = ${union}/${N} = ${fmt(union / N)}`,
        ]
      : [
          `P(${C}) = ${colTotals[c]}/${N} = ${fmt(colTotals[c] / N)}（邊際機率，分母）`,
          `P(${R} 且 ${C}) = ${joint}/${N} = ${fmt(joint / N)}（聯合機率，分子）`,
          `P(${R} | ${C}) = ${fmt(joint / N)} / ${fmt(colTotals[c] / N)} = ${joint}/${colTotals[c]} = ${fmt(joint / colTotals[c])}`,
        ];

  const cells = rows.map((rn, i) => cols.map((cn, j) => `${rn}、${cn}：${counts[i][j]}`).join("，")).join("；");
  const description =
    `列聯表：${title}。${rowTitle}有 ${rows.join("、")}；${colTitle}有 ${cols.join("、")}；總數 ${N}。各格次數：${cells}。` +
    `例：P(${R})=${rowTotals[r]}/${N}=${fmt(rowTotals[r] / N)}，P(${C})=${colTotals[c]}/${N}=${fmt(colTotals[c] / N)}，` +
    `P(${R} 且 ${C})=${joint}/${N}=${fmt(joint / N)}，P(${R} 或 ${C})=${union}/${N}=${fmt(union / N)}（Rule 4），` +
    `P(${R}|${C})=${joint}/${colTotals[c]}=${fmt(joint / colTotals[c])}（Rule 6，已知 ${C} 時分母只剩那一欄）。`;

  return (
    <Interactive description={description}>
      <div style={panel}>
        <div style={row}>
          <Chip active={view === "union"} onClick={() => setView("union")}>
            或（Rule 4）
          </Chip>
          <Chip active={view === "given"} onClick={() => setView("given")}>
            給定（Rule 6）
          </Chip>
          <span style={{ width: "8px" }} />
          <Chip active={!asProb} onClick={() => setAsProb(false)}>
            次數
          </Chip>
          <Chip active={asProb} onClick={() => setAsProb(true)}>
            機率
          </Chip>
        </div>
        <p style={{ ...muted, margin: "8px 0" }}>點列名選事件 A，點欄名選事件 B。</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "var(--fs-sm)", fontVariantNumeric: "tabular-nums", margin: 0 }}>
            <thead>
              <tr>
                <th style={{ ...cell, textAlign: "left", color: "var(--muted)", fontWeight: "normal" }}>
                  {rowTitle} ＼ {colTitle}
                </th>
                {cols.map((cn, j) => (
                  <th key={cn} style={{ ...cell, background: j === c ? tint(20) : undefined }}>
                    <button type="button" style={headBtn} onClick={() => setC(j)}>
                      {cn}
                    </button>
                  </th>
                ))}
                <th style={{ ...cell, color: "var(--muted)" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((rn, i) => (
                <tr key={rn}>
                  <th style={{ ...cell, textAlign: "left", background: view === "union" && i === r ? tint(20) : i === r ? tint(8) : undefined }}>
                    <button type="button" style={headBtn} onClick={() => setR(i)}>
                      {rn}
                    </button>
                  </th>
                  {cols.map((cn, j) => (
                    <td key={cn} style={{ ...cell, background: bg(i, j) }}>
                      {show(counts[i][j])}
                    </td>
                  ))}
                  <td style={{ ...cell, color: "var(--muted)" }}>{show(rowTotals[i])}</td>
                </tr>
              ))}
              <tr>
                <th style={{ ...cell, textAlign: "left", color: "var(--muted)" }}>Total</th>
                {colTotals.map((t, j) => (
                  <td key={j} style={{ ...cell, color: "var(--muted)", background: view === "given" && j === c ? tint(20) : undefined }}>
                    {show(t)}
                  </td>
                ))}
                <td style={{ ...cell, color: "var(--muted)" }}>{show(N)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={formula}>{results.join("\n")}</div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          {view === "union"
            ? `「${R}」那一列和「${C}」那一欄重疊的格子被算了兩次，所以要減一次。`
            : `已知「${C}」：樣本空間縮小成那一欄（共 ${colTotals[c]}），只問其中有多少是「${R}」。`}
        </p>
      </div>
    </Interactive>
  );
}
