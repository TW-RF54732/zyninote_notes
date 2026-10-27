import { Interactive } from "zyninote";
import { fmt, formula, muted, panel } from "./prob-ui.tsx";

type Score = { label: string; x: number; mean: number; sd: number };
type Props = { scores: Score[] };

/** Raw scores from different scales placed on one z axis. */
export default function ZScoreCompare({ scores }: Props) {
  const zs = scores.map((s) => (s.x - s.mean) / s.sd);
  const X = (z: number) => 160 + Math.max(-3, Math.min(3, z)) * 48;

  return (
    <Interactive
      description={`標準化 z 值 z=(x−平均)/標準差，表示一筆資料離平均數幾個標準差，可以比較不同平均數與標準差的成績。${scores.map((s, i) => `${s.label}：x=${s.x}、平均 ${s.mean}、標準差 ${s.sd}，z=(${s.x}−${s.mean})/${s.sd}=${fmt(zs[i], 2)}`).join("；")}。z 為正代表高於平均，為負代表低於平均。`}
    >
      <div style={panel}>
        <svg viewBox="0 0 320 90" role="img" aria-label="z 分數軸" style={{ width: "100%", display: "block", color: "var(--text)" }}>
          <line x1="10" x2="310" y1="50" y2="50" stroke="currentColor" strokeOpacity={0.5} />
          {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
            <g key={z}>
              <line x1={X(z)} x2={X(z)} y1="46" y2="54" stroke="currentColor" />
              <text x={X(z)} y="68" textAnchor="middle" fontSize="9" fill="currentColor" opacity={0.7}>
                {z > 0 ? `+${z}` : z}
              </text>
            </g>
          ))}
          {scores.map((s, i) => (
            <g key={s.label}>
              <circle cx={X(zs[i])} cy="50" r="5" fill="currentColor" />
              <text x={X(zs[i])} y={i % 2 ? 84 : 30} textAnchor="middle" fontSize="9" fill="currentColor">
                {s.label} {fmt(zs[i], 2)}
              </text>
            </g>
          ))}
        </svg>
        <div style={formula}>{scores.map((s, i) => `${s.label}：z = (${s.x} − ${s.mean}) / ${s.sd} = ${fmt(zs[i], 2)}`).join("\n")}</div>
        <p style={{ ...muted, margin: "8px 0 0" }}>原始分數高不代表相對表現好；z 值把不同考試放到同一把尺上比較。</p>
      </div>
    </Interactive>
  );
}
