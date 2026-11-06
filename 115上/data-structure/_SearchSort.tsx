import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { Cell, Chip, StepBar, caption, cells, formula, muted, panel, row } from "./_ds-ui.tsx";

const D = [12, 25, 37, 48, 62, 75, 98, 120, 146];

type BS = { low: number; high: number; mid: number | null; msg: string; found?: number };

function binary(k: number): BS[] {
  const out: BS[] = [];
  let low = 0, high = D.length - 1, n = 0;
  out.push({ low, high, mid: null, msg: `資料已經由小到大排好。要找 ${k}，一開始範圍是整個陣列：low = 0、high = ${high}。` });
  while (low <= high) {
    n++;
    const mid = Math.floor((low + high) / 2);
    if (D[mid] === k) {
      out.push({ low, high, mid, found: mid, msg: `第 ${n} 次：mid = ⌊(${low}+${high})/2⌋ = ${mid}，d[${mid}] = ${D[mid]} 等於 ${k}，找到了！共比較 ${n} 次。` });
      return out;
    }
    if (D[mid] < k) {
      out.push({ low, high, mid, msg: `第 ${n} 次：mid = ⌊(${low}+${high})/2⌋ = ${mid}，d[${mid}] = ${D[mid]} < ${k}。答案只可能在右半邊，左半邊（含 mid）整個丟掉：low = ${mid + 1}。` });
      low = mid + 1;
    } else {
      out.push({ low, high, mid, msg: `第 ${n} 次：mid = ⌊(${low}+${high})/2⌋ = ${mid}，d[${mid}] = ${D[mid]} > ${k}。答案只可能在左半邊，右半邊（含 mid）整個丟掉：high = ${mid - 1}。` });
      high = mid - 1;
    }
  }
  out.push({ low, high, mid: null, msg: `low = ${low} > high = ${high}，範圍已經空了，${k} 不在陣列裡。共比較 ${n} 次。` });
  return out;
}

/** Binary search stepper with low / mid / high markers. */
export function BinarySearch() {
  const [k, setK] = useState(120);
  const [step, setStep] = useState(0);
  const steps = useMemo(() => binary(k), [k]);
  const s = steps[Math.min(step, steps.length - 1)];

  return (
    <Interactive description="二元搜尋逐步示範，資料 d = [12, 25, 37, 48, 62, 75, 98, 120, 146] 已排序。每次取 mid = ⌊(low+high)/2⌋ 和鍵值比：相等就找到；d[mid] 較小就 low = mid+1（丟掉左半）；d[mid] 較大就 high = mid−1（丟掉右半）；low > high 表示找不到。找 120：mid=4（62 < 120，low=5）→ mid=6（98 < 120，low=7）→ mid=7（120）找到，比 3 次。找 37：mid=4（62 > 37，high=3）→ mid=1（25 < 37，low=2）→ mid=2 找到。找 50：比 4 次後 low > high，找不到。9 筆最多比 ⌊log₂9⌋+1 = 4 次。">
      <div style={panel}>
        <div style={row}>
          <span style={muted}>要找：</span>
          {[120, 37, 62, 50].map((v) => (
            <Chip key={v} active={v === k} onClick={() => { setK(v); setStep(0); }}>{v}{v === 50 ? "（不存在）" : ""}</Chip>
          ))}
        </div>
        <div style={{ ...cells, marginTop: "14px" }}>
          {D.map((v, i) => {
            const inRange = i >= s.low && i <= s.high;
            const tags = [i === s.low ? "low" : "", i === s.mid ? "mid" : "", i === s.high ? "high" : ""].filter(Boolean);
            return (
              <Cell key={i} on={i === s.mid} dim={!inRange} sub={<>[{i}]{tags.length ? <><br />{tags.join(" ")}</> : <><br />&nbsp;</>}</>}>{v}</Cell>
            );
          })}
        </div>
        <div style={{ ...muted, marginTop: "4px" }}>灰字 = 已經排除的範圍</div>
        <p style={caption}>{s.msg}</p>
        <StepBar step={step} total={steps.length} setStep={setStep} />
      </div>
    </Interactive>
  );
}

type BB = { arr: number[]; a: number | null; swap: boolean; sorted: number; msg: string };

function bubble(src: number[]): BB[] {
  const d = src.slice();
  const n = d.length;
  const out: BB[] = [{ arr: d.slice(), a: null, swap: false, sorted: n, msg: "由左到右比較相鄰兩個，左邊比較大就交換。每一回合會把目前最大的推到最右邊。" }];
  for (let i = n - 1; i > 0; i--) {
    for (let j = 0; j < i; j++) {
      const sw = d[j] > d[j + 1];
      const before = `${d[j]}、${d[j + 1]}`;
      if (sw) [d[j], d[j + 1]] = [d[j + 1], d[j]];
      out.push({ arr: d.slice(), a: j, swap: sw, sorted: i + 1, msg: `第 ${n - i} 回合：比 ${before}，${sw ? "左邊較大 → 交換" : "順序對了 → 不換"}。` });
    }
    out.push({ arr: d.slice(), a: null, swap: false, sorted: i, msg: `第 ${n - i} 回合結束，${d[i]} 已經到它最後的位置，下一回合不用再比它。` });
  }
  out.push({ arr: d.slice(), a: null, swap: false, sorted: 0, msg: `排好了：${d.join(", ")}。${n} 筆共比較了 ${(n * (n - 1)) / 2} 次。` });
  return out;
}

/** Bubble sort stepper: compare neighbours, swap, and watch the largest value bubble to the end. */
export function BubbleSort() {
  const [src, setSrc] = useState([8, 3, 5, 1]);
  const [step, setStep] = useState(0);
  const steps = useMemo(() => bubble(src), [src]);
  const s = steps[Math.min(step, steps.length - 1)];

  return (
    <Interactive description="氣泡排序逐步示範：由左到右比較相鄰兩個，左邊較大就交換，每一回合把目前最大的值推到最右邊，下一回合少比一個。排序 8, 3, 5, 1：第 1 回合 (8,3) 換、(8,5) 換、(8,1) 換，得 3, 5, 1, 8；第 2 回合 (3,5) 不換、(5,1) 換，得 3, 1, 5, 8；第 3 回合 (3,1) 換，得 1, 3, 5, 8。n 筆資料共 n−1 回合，比較 n(n−1)/2 次：4 筆 6 次、6 筆 15 次，時間 O(n²)。">
      <div style={panel}>
        <div style={row}>
          <Chip active={src.length === 4} onClick={() => { setSrc([8, 3, 5, 1]); setStep(0); }}>8, 3, 5, 1</Chip>
          <Chip active={src.length === 6} onClick={() => { setSrc([5, 9, 2, 7, 1, 6]); setStep(0); }}>5, 9, 2, 7, 1, 6</Chip>
        </div>
        <div style={{ ...cells, marginTop: "14px" }}>
          {s.arr.map((v, i) => (
            <Cell key={i} on={s.a !== null && (i === s.a || i === s.a + 1)} sub={i >= s.sorted ? "✓" : " "}>
              {v}
            </Cell>
          ))}
        </div>
        <div style={{ ...muted, marginTop: "4px" }}>框起來 = 正在比較的兩個；✓ = 已經排到最後位置</div>
        <p style={caption}>{s.swap ? <b>交換！</b> : null}{s.msg}</p>
        <StepBar step={step} total={steps.length} setStep={setStep} />
      </div>
    </Interactive>
  );
}

/** Lower-triangular matrix packed row by row into a 1-D array. */
export function TriangularPack() {
  const n = 5;
  const [sel, setSel] = useState<[number, number]>([3, 1]);
  const [i, j] = sel;
  const pos = (i * (i + 1)) / 2 + j;
  const flat: [number, number][] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c <= r; c++) flat.push([r, c]);

  return (
    <Interactive description="下三角矩陣（對角線以上全是 0）壓縮成一維陣列：只存對角線和以下的元素，一列一列存。5×5 共存 1+2+3+4+5 = 15 個，公式 n(n+1)/2。第 i 列（從 0 數）前面有第 0 到第 i−1 列，各有 1, 2, …, i 個元素，共 i(i+1)/2 個，所以 X[i][j] 存在一維陣列的第 i(i+1)/2 + j 格。例：X[3][1] 前面有 1+2+3 = 6 個，再加 1，存在第 7 格（從 0 數）；位址 = α + 7z。">
      <div style={panel}>
        <div style={muted}>點下三角裡的一格（灰色的 0 不用存）</div>
        <div style={{ display: "inline-grid", gridTemplateColumns: `repeat(${n}, 44px)`, gap: "4px", marginTop: "6px", fontFamily: "var(--mono)", fontSize: "var(--fs-sm)" }}>
          {Array.from({ length: n * n }, (_, k) => {
            const r = Math.floor(k / n), c = k % n;
            const zero = c > r;
            const on = r === i && c === j;
            const before = !zero && (r < i || (r === i && c < j));
            return (
              <button key={k} type="button" disabled={zero} onClick={() => setSel([r, c])}
                style={{
                  font: "inherit", height: "34px", cursor: zero ? "default" : "pointer",
                  border: `1px ${zero ? "dashed" : "solid"} ${on ? "var(--text)" : "var(--line-strong)"}`, borderRadius: "var(--radius-sm)",
                  background: on ? "var(--text)" : before ? "color-mix(in srgb, var(--text) 14%, transparent)" : "var(--surface)",
                  color: on ? "var(--background)" : zero ? "var(--faint)" : "var(--text)",
                }}>
                {zero ? "0" : `${r}${c}`}
              </button>
            );
          })}
        </div>
        <div style={{ ...cells, marginTop: "12px" }}>
          {flat.map(([r, c], k) => (
            <Cell key={k} on={r === i && c === j} dim={k > pos} sub={k} width={34}>{`${r}${c}`}</Cell>
          ))}
        </div>
        <div style={formula}>
          {`第 ${i} 列前面有 ${i} 整列：${i === 0 ? "0" : Array.from({ length: i }, (_, t) => t + 1).join(" + ")} = ${(i * (i + 1)) / 2} 個\n再加上同一列左邊的 ${j} 個 → X[${i}][${j}] 在第 ${(i * (i + 1)) / 2} + ${j} = ${pos} 格\n公式：i(i+1)/2 + j = ${i}×${i + 1}/2 + ${j} = ${pos}`}
        </div>
        <p style={caption}>{n}×{n} 的下三角矩陣只要存 1+2+3+4+5 = {n * (n + 1) / 2} 格，不用 {n * n} 格。</p>
      </div>
    </Interactive>
  );
}

export default BinarySearch;
