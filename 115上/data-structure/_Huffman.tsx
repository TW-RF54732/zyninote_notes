import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { BinTree, Chip, StepBar, caption, formula, muted, panel, row, type TNode } from "./_ds-ui.tsx";

type H = { key: string; w: number; ch?: string; l?: H; r?: H };

const PRESETS: Record<string, [string, number][]> = {
  happy: [["h", 1], ["y", 1], ["a", 2], ["p", 4]],
  five: [["A", 15], ["B", 7], ["C", 6], ["D", 6], ["E", 5]],
};

function build(items: [string, number][]) {
  let list: H[] = items.map(([ch, w]) => ({ key: ch, w, ch })).sort((a, b) => a.w - b.w);
  const snaps: { forest: H[]; msg: string; merged?: string }[] = [{ forest: list, msg: "每個字元先各自是一棵只有一個節點的樹，節點上的數字是出現次數。" }];
  let id = 0;
  while (list.length > 1) {
    const [a, b, ...rest] = list;
    const n: H = { key: `n${++id}`, w: a.w + b.w, l: b, r: a };
    const pos = rest.findIndex((x) => x.w > n.w);
    list = pos < 0 ? [...rest, n] : [...rest.slice(0, pos), n, ...rest.slice(pos)];
    const name = (x: H) => (x.ch ? `${x.ch}(${x.w})` : `(${x.w})`);
    snaps.push({ forest: list, merged: n.key, msg: `取出次數最少的兩個 ${name(a)}、${name(b)}，合成一個新節點，次數 ${a.w} + ${b.w} = ${n.w}，放回去。` });
  }
  const codes: { ch: string; w: number; code: string }[] = [];
  const walk = (h: H, c: string) => { if (h.ch) codes.push({ ch: h.ch, w: h.w, code: c || "0" }); if (h.l) walk(h.l, c + "1"); if (h.r) walk(h.r, c + "0"); };
  walk(list[0], "");
  codes.sort((x, y) => y.w - x.w);
  return { snaps, codes, total: list[0].w };
}

const toT = (h: H): TNode => ({ key: h.key, label: h.ch ? `${h.ch}${h.w}` : `${h.w}`, left: h.l ? toT(h.l) : null, right: h.r ? toT(h.r) : null });

/** Step-by-step Huffman tree construction and the resulting codes. */
export default function Huffman() {
  const [p, setP] = useState("happy");
  const [step, setStep] = useState(0);
  const { snaps, codes, total } = useMemo(() => build(PRESETS[p]), [p]);
  const last = snaps.length - 1;
  const s = snaps[Math.min(step, last)];
  const done = step >= last;
  const avg = codes.reduce((acc, c) => acc + (c.w / total) * c.code.length, 0);

  return (
    <Interactive description="霍夫曼樹逐步建立：每個字元先是一個樹葉，存出現次數；每一步取出次數最少的兩棵樹合成新節點（次數相加）再放回，直到只剩一棵；左分支標 0、右分支標 1，從樹根走到樹葉的 0/1 就是編碼。例 happy：h1、y1、a2、p4，先合 h+y=2，再合 a+2=4，最後 p+4=8；p 編碼長 1、a 長 2、h 和 y 長 3，平均編碼長度 0.5×1 + 0.25×2 + 0.125×3×2 = 1.75 位元。次數高的字元離樹根近、編碼短。同次數時誰放左邊可以不同，所以霍夫曼樹不唯一，但平均長度相同。">
      <div style={panel}>
        <div style={row}>
          <Chip active={p === "happy"} onClick={() => { setP("happy"); setStep(0); }}>happy（h1 y1 a2 p4）</Chip>
          <Chip active={p === "five"} onClick={() => { setP("five"); setStep(0); }}>A15 B7 C6 D6 E5</Chip>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end", marginTop: "8px" }}>
          {s.forest.map((h) => (
            <div key={h.key} style={{ flex: h.l ? "1 1 160px" : "0 0 56px", minWidth: 0 }}>
              <BinTree root={toT(h)} hi={h.key === s.merged ? [h.key] : []} labelEdges={done} r={16} ariaLabel="霍夫曼樹" />
            </div>
          ))}
        </div>
        <p style={caption}>{s.msg}{done && "　只剩一棵樹，完成！左分支 = 0、右分支 = 1。"}</p>
        {done && (
          <div style={formula}>
            {codes.map((c) => `${c.ch}（${c.w} 次）= ${c.code}`).join("　")}
            {"\n"}平均編碼長度 = {avg.toFixed(2)} 位元
          </div>
        )}
        <div style={muted}>依課本規則：左分支標 1、右分支標 0；次數較少的放右邊。課本的圖在同次數時左右擺法可能不同，但每個字元的編碼長度和平均長度都一樣。</div>
        <StepBar step={step} total={snaps.length} setStep={setStep} />
      </div>
    </Interactive>
  );
}
