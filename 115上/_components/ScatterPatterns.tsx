import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, muted, panel, row } from "./prob-ui.tsx";
import { rng } from "./stats-math.ts";

type Pattern = "positive" | "negative" | "curve" | "none";

const PATTERNS: { id: Pattern; label: string; x: string; y: string; f: (x: number) => number; note: string }[] = [
  { id: "positive", label: "正相關", x: "每週自習時數", y: "考試成績", f: (x) => 0.15 + 0.7 * x, note: "點由左下往右上：自習越久，成績通常越高。點不會全落在線上，因為成績還受理解力、睡眠等其他因素影響。" },
  { id: "negative", label: "負相關", x: "每週運動時數", y: "體脂率", f: (x) => 0.85 - 0.65 * x, note: "點由左上往右下：越常運動的人，體脂率普遍越低。" },
  { id: "curve", label: "曲線（非線性）", x: "廣告投入", y: "銷售增加", f: (x) => 0.1 + 0.8 * Math.sqrt(x), note: "有關係但不是直線：一開始增加很快，之後趨緩（邊際效果遞減）。" },
  { id: "none", label: "沒有相關", x: "身高", y: "考試成績", f: () => 0.5, note: "點隨機散開，看不出上升或下降的趨勢。" },
];

/** Scatter diagrams: what positive, negative, curved and no relationship look like. */
export default function ScatterPatterns() {
  const [id, setId] = useState<Pattern>("positive");
  const p = PATTERNS.find((x) => x.id === id)!;
  const rand = rng(id.length * 31 + 7);
  const spread = id === "none" ? 0.8 : 0.22;
  const pts = Array.from({ length: 30 }, () => {
    const x = rand();
    const y = Math.min(0.98, Math.max(0.02, p.f(x) + (rand() - 0.5) * spread));
    return [x, y];
  });

  return (
    <Interactive description="散佈圖判讀：把成對數據 (x, y) 逐點畫在平面上，x 軸放獨立（解釋）變數、y 軸放依（反應）變數，再看點的整體形狀。正相關：點由左下往右上（例：自習時數越長，考試成績越高）。負相關：點由左上往右下（例：運動時數越多，體脂率越低）。曲線關係：有關係但不是直線。沒有相關：點隨機散開。">
      <div style={panel}>
        <div style={row}>
          {PATTERNS.map((x) => (
            <Chip key={x.id} active={x.id === id} onClick={() => setId(x.id)}>
              {x.label}
            </Chip>
          ))}
        </div>
        <svg viewBox="0 0 240 180" role="img" aria-label={`${p.label}散佈圖`} style={{ width: "100%", maxWidth: "360px", display: "block", margin: "12px 0", color: "var(--text)" }}>
          <line x1="30" y1="160" x2="230" y2="160" stroke="currentColor" strokeOpacity={0.5} />
          <line x1="30" y1="10" x2="30" y2="160" stroke="currentColor" strokeOpacity={0.5} />
          <text x="230" y="176" textAnchor="end" fontSize="10" fill="currentColor" opacity={0.7}>
            X：{p.x}
          </text>
          <text x="34" y="14" fontSize="10" fill="currentColor" opacity={0.7}>
            Y：{p.y}
          </text>
          {pts.map(([x, y], i) => (
            <circle key={i} cx={30 + x * 195} cy={160 - y * 145} r="3" fill="currentColor" fillOpacity={0.7} />
          ))}
        </svg>
        <p style={{ ...muted, margin: 0 }}>{p.note}</p>
      </div>
    </Interactive>
  );
}
