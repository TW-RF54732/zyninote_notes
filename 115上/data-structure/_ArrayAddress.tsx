import { Fragment, useState } from "react";
import { Interactive } from "zyninote";
import { Cell, Chip, caption, cells, formula, muted, panel, row, tint } from "./_ds-ui.tsx";

const M = 3; // rows
const N = 4; // cols
const ALPHA = 100;

/** Click a cell of a 3×4 array and see where row-major and column-major put it in memory. */
export default function ArrayAddress() {
  const [sel, setSel] = useState<[number, number]>([1, 2]);
  const [z, setZ] = useState(4);
  const [i, j] = sel;
  const rm = i * N + j;
  const cm = j * M + i;

  const order = (kind: "rm" | "cm") =>
    Array.from({ length: M * N }, (_, k) => (kind === "rm" ? [Math.floor(k / N), k % N] : [k % M, Math.floor(k / M)]));

  return (
    <Interactive description="二維陣列 B[3][4]（3 列 4 行）攤平存進記憶體的兩種方式，起始位址 α = 100。以列為主（RM，C 語言）：一列存完再存下一列，B[i][j] 前面有 i 整列（每列 4 個）再加 j 個，位址 = α + (i×4 + j)×z。以行為主（CM，FORTRAN）：一行存完再存下一行，B[i][j] 前面有 j 整行（每行 3 個）再加 i 個，位址 = α + (j×3 + i)×z。例：z = 4 時，B[1][2] 在 RM 是第 1×4+2 = 6 個（從 0 數），位址 100 + 6×4 = 124；在 CM 是第 2×3+1 = 7 個，位址 100 + 7×4 = 128。">
      <div style={panel}>
        <div style={row}>
          <span style={muted}>每個元素佔 z =</span>
          {[1, 2, 4].map((v) => <Chip key={v} active={v === z} onClick={() => setZ(v)}>{v} bytes</Chip>)}
          <span style={muted}>起始位址 α = {ALPHA}</span>
        </div>

        <div style={{ marginTop: "12px" }}>
          <div style={muted}>點一格：B[{M}][{N}]（{M} 列 × {N} 行）</div>
          <div style={{ display: "inline-grid", gridTemplateColumns: `28px repeat(${N}, 52px)`, gap: "4px", marginTop: "6px", fontFamily: "var(--mono)", fontSize: "var(--fs-sm)" }}>
            <span />
            {Array.from({ length: N }, (_, c) => <span key={c} style={{ ...muted, textAlign: "center" }}>行 {c}</span>)}
            {Array.from({ length: M }, (_, r) => (
              <Fragment key={r}>
                <span style={{ ...muted, alignSelf: "center" }}>列{r}</span>
                {Array.from({ length: N }, (_, c) => {
                  const on = r === i && c === j;
                  const before = r < i; // full rows before (RM)
                  return (
                    <button key={`${r}-${c}`} type="button" onClick={() => setSel([r, c])}
                      style={{
                        font: "inherit", cursor: "pointer", height: "34px",
                        border: `1px solid ${on ? "var(--text)" : "var(--line-strong)"}`, borderRadius: "var(--radius-sm)",
                        background: on ? "var(--text)" : before || (r === i && c < j) ? tint(14) : "var(--surface)",
                        color: on ? "var(--background)" : "var(--text)", fontWeight: on ? 700 : 400,
                      }}>
                      {r}{c}
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <div style={{ ...muted, marginTop: "4px" }}>淺色 = 以列為主時排在 B[{i}][{j}] 前面的元素</div>
        </div>

        {(["rm", "cm"] as const).map((kind) => {
          const k = kind === "rm" ? rm : cm;
          return (
            <div key={kind} style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>
                {kind === "rm" ? "以列為主 RM（C 語言）：一列一列存" : "以行為主 CM（FORTRAN）：一行一行存"}
              </div>
              <div style={{ ...cells, marginTop: "4px" }}>
                {order(kind).map(([r, c], idx) => (
                  <Cell key={idx} on={r === i && c === j} dim={idx > k} sub={ALPHA + idx * z} width={38}>{`${r}${c}`}</Cell>
                ))}
              </div>
              <div style={formula}>
                {kind === "rm"
                  ? `前面有 ${i} 整列 × 每列 ${N} 個 + ${j} 個 = ${rm} 個\n位址 = α + (i×n + j)×z = ${ALPHA} + (${i}×${N} + ${j})×${z} = ${ALPHA + rm * z}`
                  : `前面有 ${j} 整行 × 每行 ${M} 個 + ${i} 個 = ${cm} 個\n位址 = α + (j×m + i)×z = ${ALPHA} + (${j}×${M} + ${i})×${z} = ${ALPHA + cm * z}`}
              </div>
            </div>
          );
        })}
        <p style={caption}>
          算位址的想法永遠一樣：<b>數出前面排了幾個元素，再乘上每個的大小</b>。差別只在「一列一列排」還是「一行一行排」。
        </p>
      </div>
    </Interactive>
  );
}
