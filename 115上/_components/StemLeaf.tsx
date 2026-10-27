import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, formula, muted, panel, row, tint } from "./prob-ui.tsx";

type Props = { title: string; data: number[] };

/** Stem = everything but the last digit, leaf = the last digit. */
function split(x: number) {
  return { stem: Math.floor(x / 10), leaf: x % 10 };
}

/** Stem-and-leaf plot: shape of the distribution while keeping every raw value. */
export default function StemLeaf({ title, data }: Props) {
  const [sortedLeaves, setSortedLeaves] = useState(true);
  const stems = data.map((x) => split(x).stem);
  const lo = Math.min(...stems);
  const hi = Math.max(...stems);
  const rows = Array.from({ length: hi - lo + 1 }, (_, i) => {
    const stem = lo + i;
    const leaves = data.filter((x) => split(x).stem === stem).map((x) => split(x).leaf);
    return { stem, leaves: sortedLeaves ? [...leaves].sort((a, b) => a - b) : leaves };
  });
  const most = Math.max(...rows.map((r) => r.leaves.length));
  const [pickedStem, setPickedStem] = useState(rows.find((r) => r.leaves.length === most)!.stem);
  const picked = rows.find((r) => r.stem === pickedStem) ?? rows[0];

  return (
    <Interactive
      description={`莖葉圖：${title}。莖 = 十位以上的數字，葉 = 個位數，同一個莖的葉排在同一列，列的長度就像橫放的直方圖，同時保留每一筆原始數值。${rows.map((r) => `${r.stem} | ${[...r.leaves].sort((a, b) => a - b).join(" ")}`).join("；")}。`}
    >
      <div style={panel}>
        <div style={row}>
          <Chip active={sortedLeaves} onClick={() => setSortedLeaves(true)}>
            葉已排序
          </Chip>
          <Chip active={!sortedLeaves} onClick={() => setSortedLeaves(false)}>
            依原始順序
          </Chip>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-sm)", margin: "12px 0", overflowX: "auto" }}>
          {rows.map((r) => (
            <div key={r.stem} style={{ display: "flex", gap: "8px", background: r.stem === pickedStem ? tint(12) : undefined, borderRadius: "var(--radius-sm)" }}>
              <button
                type="button"
                onClick={() => setPickedStem(r.stem)}
                style={{ font: "inherit", cursor: "pointer", background: "none", border: "none", color: "inherit", minWidth: "3ch", textAlign: "right", padding: "0 4px" }}
              >
                {r.stem}
              </button>
              <span style={{ borderLeft: "1px solid var(--line-strong)", paddingLeft: "8px", whiteSpace: "pre" }}>{r.leaves.join(" ")}</span>
            </div>
          ))}
        </div>
        <p style={{ ...muted, margin: 0 }}>點左邊的莖，看這一列代表哪些原始數值。</p>
        <div style={formula}>
          {`莖 ${picked.stem}：${picked.leaves.length} 筆 → ${[...picked.leaves].sort((a, b) => a - b).map((l) => picked.stem * 10 + l).join(", ") || "（空）"}`}
        </div>
      </div>
    </Interactive>
  );
}
