import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { Bars } from "./chart-ui.tsx";
import { Chip, fmt, formula, muted, panel, row } from "./prob-ui.tsx";

type Props = {
  /** What the data measures, e.g. "72 個城市聯繫成功前所花的秒數". */
  title: string;
  data: number[];
  /** Lower bound of the first class. */
  start: number;
  /** Class widths the reader can switch between; the first is the worked example's. */
  widths: number[];
};

const cell: CSSProperties = { padding: "4px 10px", borderBottom: "1px solid var(--line)", textAlign: "right", whiteSpace: "nowrap" };

/** Grouped frequency table → histogram / ogive, rebuilt live for a chosen class width. */
export default function HistogramBuilder({ title, data, start, widths }: Props) {
  const [w, setW] = useState(widths[0]);
  const [ogive, setOgive] = useState(false);
  const n = data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const k = Math.max(1, Math.ceil((max + 1e-9 - start) / w));
  const classes = Array.from({ length: k }, (_, i) => start + i * w);
  const freq = classes.map((lo) => data.filter((x) => x >= lo && x < lo + w).length);
  let acc = 0;
  const cum = freq.map((f) => (acc += f) / n);
  const kRule = Math.ceil(Math.log2(n));
  const top = freq.indexOf(Math.max(...freq));

  const describe = (width: number) => {
    const kk = Math.ceil((max + 1e-9 - start) / width);
    const fs = Array.from({ length: kk }, (_, i) => data.filter((x) => x >= start + i * width && x < start + (i + 1) * width).length);
    return fs.map((f, i) => `${start + i * width}–<${start + (i + 1) * width}：${f}`).join("、");
  };

  return (
    <Interactive
      description={`群組頻率分配與直方圖：${title}，共 n=${n} 筆，最小值 ${min}、最大值 ${max}，全距 ${max - min}。2^k ≥ n 規則得 k=${kRule} 組（2^${kRule}=${2 ** kRule} ≥ ${n}），組距 W=(最大值−最小值)/k=${fmt((max - min) / kRule)}，取方便的數字 ${widths[0]}。以起點 ${start}、組距 ${widths[0]} 分組的頻率：${describe(widths[0])}。相對頻率 = 組頻率 / n，累加相對頻率逐組相加到 1；累積頻率曲線（肩形圖 ogive）把累加相對頻率畫在各組上組界。`}
    >
      <div style={panel}>
        <div style={row}>
          <span style={muted}>組距</span>
          {widths.map((x) => (
            <Chip key={x} active={x === w} onClick={() => setW(x)}>
              {x}
            </Chip>
          ))}
          <span style={{ width: "8px" }} />
          <Chip active={!ogive} onClick={() => setOgive(false)}>
            直方圖
          </Chip>
          <Chip active={ogive} onClick={() => setOgive(true)}>
            加上肩形圖
          </Chip>
        </div>
        <Bars
          values={freq}
          labels={classes.map(String)}
          touching
          showValues
          format={(v) => String(v)}
          line={ogive ? cum : undefined}
          highlight={freq.map((_, i) => i === top)}
          ariaLabel={`組距 ${w} 的直方圖`}
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "var(--fs-sm)", fontVariantNumeric: "tabular-nums", margin: 0 }}>
            <thead>
              <tr>
                {["組別", "頻率", "相對頻率", "累加相對頻率"].map((h) => (
                  <th key={h} style={{ ...cell, color: "var(--muted)", fontWeight: "normal" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((lo, i) => (
                <tr key={lo}>
                  <td style={{ ...cell, textAlign: "left" }}>
                    {lo} – &lt; {lo + w}
                  </td>
                  <td style={cell}>{freq[i]}</td>
                  <td style={cell}>
                    {freq[i]}/{n} = {fmt(freq[i] / n)}
                  </td>
                  <td style={cell}>{fmt(cum[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={formula}>
          {`n = ${n}，2^k ≥ n → k = ${kRule}；W = (${max} − ${min}) / ${kRule} = ${fmt((max - min) / kRule)}\n組距 ${w} → ${k} 組，最多的一組是 ${classes[top]}–<${classes[top] + w}（${freq[top]} 筆）`}
        </div>
        <p style={{ ...muted, margin: "8px 0 0" }}>
          組距太小，長條參差、看不出形狀；組距太大，細節被抹平。四項準則：互斥、涵蓋全部數據、等寬、避免空組。
        </p>
      </div>
    </Interactive>
  );
}
