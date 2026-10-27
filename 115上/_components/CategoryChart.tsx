import { useState } from "react";
import { Interactive } from "zyninote";
import { Bars } from "./chart-ui.tsx";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";

type Props = { title: string; items: { label: string; count: number }[] };

function slice(start: number, end: number, r = 70) {
  const pt = (t: number) => [100 + r * Math.sin(2 * Math.PI * t), 100 - r * Math.cos(2 * Math.PI * t)].map((v) => v.toFixed(2)).join(" ");
  return `M100 100 L${pt(start)} A${r} ${r} 0 ${end - start > 0.5 ? 1 : 0} 1 ${pt(end)} Z`;
}

/** The same categorical data as a bar chart (compare counts) and a pie chart (compare shares). */
export default function CategoryChart({ title, items }: Props) {
  const [kind, setKind] = useState<"bar" | "pie">("bar");
  const [pickedIndex, setPickedIndex] = useState(0);
  const total = items.reduce((s, x) => s + x.count, 0);
  const pct = (c: number) => `${fmt((c / total) * 100, 2)}%`;
  const picked = items[pickedIndex];
  let t = 0;

  return (
    <Interactive
      description={`類別資料的直條圖與圓餅圖：${title}，共 ${total}。${items.map((x) => `${x.label} ${x.count}（${pct(x.count)}）`).join("、")}。直條圖比較各類別的次數，長條之間留空隙；圓餅圖比較各類別占全部的比例，每塊餅 = 該類別次數 / 總數 × 360°。`}
    >
      <div style={panel}>
        <div style={row}>
          <Chip active={kind === "bar"} onClick={() => setKind("bar")}>
            直條圖
          </Chip>
          <Chip active={kind === "pie"} onClick={() => setKind("pie")}>
            圓餅圖
          </Chip>
        </div>
        {kind === "bar" ? (
          <Bars
            values={items.map((x) => x.count)}
            labels={items.map((x) => x.label)}
            highlight={items.map((_, i) => i === pickedIndex)}
            showValues
            format={(v) => String(v)}
            ariaLabel={`${title}直條圖`}
          />
        ) : (
          <svg viewBox="0 0 200 200" role="img" aria-label={`${title}圓餅圖`} style={{ width: "200px", display: "block", margin: "8px auto", color: "var(--text)" }}>
            {items.map((x, i) => {
              const d = slice(t, t + x.count / total);
              const mid = t + x.count / total / 2;
              t += x.count / total;
              return (
                <g key={x.label} onClick={() => setPickedIndex(i)} style={{ cursor: "pointer" }}>
                  <path d={d} fill="currentColor" fillOpacity={i === pickedIndex ? 0.85 : 0.12 + 0.08 * (i % 5)} stroke="var(--background)" />
                  <text x={100 + 84 * Math.sin(2 * Math.PI * mid)} y={103 + 84 * -Math.cos(2 * Math.PI * mid)} textAnchor="middle" fontSize="8" fill="currentColor">
                    {x.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
        <div style={row}>
          {items.map((x, i) => (
            <Chip key={x.label} active={i === pickedIndex} onClick={() => setPickedIndex(i)}>
              {x.label}
            </Chip>
          ))}
        </div>
        <div style={formula}>
          {kind === "bar"
            ? `${picked.label}：長條高度 = 次數 ${picked.count}`
            : `${picked.label}：${picked.count} / ${total} × 100% = ${pct(picked.count)}，角度 ${fmt((picked.count / total) * 360, 1)}°`}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          {kind === "bar" ? "直條圖適合「哪一類最多」；類別資料的長條之間留白，和直方圖不同。" : "圓餅圖適合「某類占全部多少」；類別太多時每塊太小，不如直條圖。"}
        </p>
      </div>
    </Interactive>
  );
}
