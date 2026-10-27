import { useState } from "react";
import { Interactive } from "zyninote";
import { Bars } from "./chart-ui.tsx";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";

type Props = { title: string; items: { label: string; count: number }[] };

/** Pareto chart: causes sorted by frequency, bars plus a cumulative-percentage line. */
export default function ParetoChart({ title, items }: Props) {
  const [sortedView, setSortedView] = useState(true);
  const [cut, setCut] = useState(0.8);
  const total = items.reduce((s, x) => s + x.count, 0);
  const view = sortedView ? [...items].sort((a, b) => b.count - a.count) : items;
  let acc = 0;
  const cum = view.map((x) => (acc += x.count) / total);
  const sortedAll = [...items].sort((a, b) => b.count - a.count);
  let acc2 = 0;
  const cumAll = sortedAll.map((x) => (acc2 += x.count) / total);
  const vital = cumAll.findIndex((c) => c >= cut - 1e-9) + 1;

  return (
    <Interactive
      description={`柏拉圖（Pareto chart）：${title}，共 ${total} 次。依次數由大到小排列：${sortedAll.map((x, i) => `${x.label} ${x.count}（${fmt((x.count / total) * 100, 1)}%，累積 ${fmt(cumAll[i] * 100, 1)}%）`).join("、")}。長條是各項次數（左軸），折線是累積百分比（右軸）。80/20 法則：少數幾項原因造成大部分問題，累積到約 80% 的前幾項就是應優先改善的「關鍵少數」。`}
    >
      <div style={panel}>
        <div style={row}>
          <Chip active={!sortedView} onClick={() => setSortedView(false)}>
            原始順序
          </Chip>
          <Chip active={sortedView} onClick={() => setSortedView(true)}>
            由大到小
          </Chip>
          <span style={{ width: "8px" }} />
          <span style={muted}>關鍵少數門檻</span>
          {[0.6, 0.8, 0.9].map((c) => (
            <Chip key={c} active={c === cut} onClick={() => setCut(c)}>
              {c * 100}%
            </Chip>
          ))}
        </div>
        <Bars
          values={view.map((x) => x.count)}
          labels={view.map((x) => x.label)}
          line={sortedView ? cum : undefined}
          highlight={view.map((x) => sortedAll.indexOf(x) < vital)}
          showValues
          format={(v) => String(v)}
          ariaLabel={`${title}柏拉圖`}
        />
        <div style={formula}>
          {view.map((x, i) => `${x.label}：${x.count}/${total} = ${fmt((x.count / total) * 100, 1)}%${sortedView ? `，累積 ${fmt(cum[i] * 100, 1)}%` : ""}`).join("\n")}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          {sortedView
            ? `前 ${vital} 項（${sortedAll.slice(0, vital).map((x) => x.label).join("、")}）累積到 ${fmt(cumAll[vital - 1] * 100, 1)}%，是優先改善目標。`
            : "沒排序時看不出誰是主因，累積百分比也沒有意義；柏拉圖一定先由大到小排。"}
        </p>
      </div>
    </Interactive>
  );
}
