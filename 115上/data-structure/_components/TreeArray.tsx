import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { BinTree, Cell, Chip, caption, cells, formula, muted, panel, parseTree, row, type TNode } from "./ds-ui.tsx";

const PRESETS = {
  full: { label: "接近完滿的樹", spec: "A(B(D,E),C(F,))" },
  skew: { label: "歪斜樹", spec: "A(,B(,C(,D)))" },
} as const;

/** Number a binary tree level by level (root 1, children 2i / 2i+1) and show it stored in a 1-D array. */
export default function TreeArray() {
  const [p, setP] = useState<keyof typeof PRESETS>("full");
  const [sel, setSel] = useState("B");
  const { root, idx } = useMemo(() => {
    const r = parseTree(PRESETS[p].spec);
    const idx: Record<string, number> = {};
    const go = (n: TNode | null | undefined, i: number) => { if (!n) return; idx[n.key] = i; n.note = `${i}`; go(n.left, 2 * i); go(n.right, 2 * i + 1); };
    go(r, 1);
    return { root: r, idx };
  }, [p]);
  const size = Math.max(...Object.values(idx));
  const len = 2 ** Math.ceil(Math.log2(size + 1)) - 1;
  const byIdx: Record<number, string> = Object.fromEntries(Object.entries(idx).map(([k, v]) => [v, k]));
  const i = idx[sel] ?? 1;
  const related = [Math.floor(i / 2), 2 * i, 2 * i + 1].filter((x) => byIdx[x]).map((x) => byIdx[x]);
  const used = Object.keys(idx).length;

  return (
    <Interactive description="二元樹的一維陣列表示法：把樹當成完滿二元樹由上到下、由左到右編號，樹根是 1，節點 i 的左子在 2i、右子在 2i+1、父節點在 ⌊i/2⌋，直接用公式算位置。例：A(B(D,E),C(F)) 存成 [1]A [2]B [3]C [4]D [5]E [6]F [7]空，B 在 2，左子 D 在 4、右子 E 在 5、父節點 A 在 1。歪斜樹 A→B→C→D（都只有右子）深度 4，要用到第 1、3、7、15 格，陣列需要 15 格卻只存 4 個節點，非常浪費。">
      <div style={panel}>
        <div style={row}>
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((k) => (
            <Chip key={k} active={k === p} onClick={() => { setP(k); setSel(k === "full" ? "B" : "B"); }}>{PRESETS[k].label}</Chip>
          ))}
          <span style={muted}>點一個節點：</span>
          {Object.keys(idx).map((k) => <Chip key={k} active={k === sel} onClick={() => setSel(k)}>{k}</Chip>)}
        </div>
        <BinTree root={root} hi={[sel]} soft={related} ariaLabel="編號後的二元樹" />
        <div style={{ ...cells, marginTop: "6px" }}>
          {Array.from({ length: len }, (_, j) => j + 1).map((j) => (
            <Cell key={j} on={byIdx[j] === sel} dim={!byIdx[j]} sub={j} width={34}>
              {byIdx[j] ?? "·"}
            </Cell>
          ))}
        </div>
        <div style={formula}>
          {sel} 在第 {i} 格　→　父 ⌊{i}/2⌋ = {Math.floor(i / 2) || "無"}{byIdx[Math.floor(i / 2)] ? `（${byIdx[Math.floor(i / 2)]}）` : ""}
          　左子 2×{i} = {2 * i}{byIdx[2 * i] ? `（${byIdx[2 * i]}）` : "（空）"}
          　右子 2×{i}+1 = {2 * i + 1}{byIdx[2 * i + 1] ? `（${byIdx[2 * i + 1]}）` : "（空）"}
        </div>
        <p style={caption}>
          陣列共 {len} 格，只存了 {used} 個節點，空了 {len - used} 格。
          {p === "skew" ? "歪斜樹每往下一層，編號就翻倍，大部分格子都是空的。" : "樹越接近完滿，空格越少，這種存法越划算。"}
        </p>
      </div>
    </Interactive>
  );
}
