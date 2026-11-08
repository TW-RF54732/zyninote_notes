import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { BinTree, Chip, caption, muted, panel, parseTree, row, type TNode } from "./ds-ui.tsx";

type Case = { label: string; before: string; after: string; added: string; pivot: string; newRoot: string; explain: string; result: string };

const CASES: Record<string, Case> = {
  LL: {
    label: "LL",
    before: "66(36(22(16,),45),75)", after: "36(22(16,),66(45,75))", added: "16", pivot: "66", newRoot: "36",
    explain: "16 加在 66 的左子（36）的左邊 → LL 型。66 太「左重」，把它往右下轉：左子 36 升上來當新根，66 變成 36 的右子。",
    result: "36 原本的右子樹 45 沒地方放了（36 的右邊被 66 佔走），改掛到 66 的左邊。45 比 36 大、比 66 小，放這裡剛好。",
  },
  RR: {
    label: "RR",
    before: "36(24,60(55,88(,92)))", after: "60(36(24,55),88(,92))", added: "92", pivot: "36", newRoot: "60",
    explain: "92 加在 36 的右子（60）的右邊 → RR 型。和 LL 左右相反：右子 60 升上來當新根，36 往左下轉成 60 的左子。",
    result: "60 原本的左子樹 55 改掛到 36 的右邊。55 比 36 大、比 60 小，放這裡剛好。",
  },
  LR: {
    label: "LR（簡單）",
    before: "60(36(,55),)", after: "55(36,60)", added: "55", pivot: "60", newRoot: "55",
    explain: "55 加在 60 的左子（36）的右邊 → LR 型。三個數 36 < 55 < 60，中間值 55 升上來當新根，小的 36 當左子、大的 60 當右子。",
    result: "記法：LR、RL 都是「三個節點中排中間的那個」升上來當根。",
  },
  RL: {
    label: "RL（簡單）",
    before: "36(,60(55,))", after: "55(36,60)", added: "55", pivot: "36", newRoot: "55",
    explain: "55 加在 36 的右子（60）的左邊 → RL 型。一樣是中間值 55 升上來當新根，36 當左子、60 當右子。",
    result: "和 LR 的結果一樣：中間值當根，左右排好。",
  },
  LRg: {
    label: "LR（一般）",
    before: "88(60(46(22,55),68(62(,64),78)),95(93,98))", after: "68(60(46(22,55),62(,64)),88(78,95(93,98)))", added: "64", pivot: "88", newRoot: "68",
    explain: "64 加在 88 的左子（60）的右子樹裡 → LR 型。主角是 88、60 和 60 的右子 68，中間值 68 升上來當新根，60 當左子、88 當右子。",
    result: "68 原本的兩個子樹要重新安置：左子樹 62（含 64）比 60 大 → 掛到 60 的右邊；右子樹 78 比 88 小 → 掛到 88 的左邊。",
  },
};

function height(n: TNode | null | undefined): number { return n ? 1 + Math.max(height(n.left), height(n.right)) : 0; }
function annotate(n: TNode | null | undefined) {
  if (!n) return;
  n.note = `${height(n.left) - height(n.right)}`;
  annotate(n.left);
  annotate(n.right);
}

/** Before/after views of the four AVL rebalancing cases, with balance factors shown on every node. */
export default function AvlRotate() {
  const [k, setK] = useState<keyof typeof CASES>("LL");
  const [after, setAfter] = useState(false);
  const c = CASES[k];
  const tree = useMemo(() => { const t = parseTree(after ? c.after : c.before); annotate(t); return t; }, [c, after]);

  return (
    <Interactive description="AVL 樹四種旋轉的前後對照，每個節點右上角標平衡因子 BF = 左子樹高 − 右子樹高。LL：66(36(22(16),45),75) 插入 16 後 66 的 BF = 2，右旋，36 變新根，36 原本的右子樹 45 改掛到 66 的左邊，結果 36(22(16),66(45,75))。RR：36(24,60(55,88(92))) 插入 92 後 36 的 BF = −2，左旋，60 變新根，55 改掛到 36 的右邊。LR 簡單：60 左子 36，插入 55，中間值 55 變新根，36 左、60 右。RL 簡單：36 右子 60，插入 55，同樣 55 變新根。LR 一般：88(60(46(22,55),68(62,78)),95(93,98)) 插入 64（在 62 的右邊），88 的 BF = 2，68 變新根，68 的左子樹 62 改掛到 60 的右邊，右子樹 78 改掛到 88 的左邊。">
      <div style={panel}>
        <div style={row}>
          {Object.entries(CASES).map(([key, v]) => (
            <Chip key={key} active={key === k} onClick={() => { setK(key as keyof typeof CASES); setAfter(false); }}>{v.label}</Chip>
          ))}
        </div>
        <div style={{ ...row, marginTop: "8px" }}>
          <Chip active={!after} onClick={() => setAfter(false)}>① 插入 {c.added} 後（失衡）</Chip>
          <Chip active={after} onClick={() => setAfter(true)}>② 旋轉後</Chip>
        </div>
        <BinTree root={tree} hi={after ? [c.newRoot] : [c.pivot]} soft={[c.added]} r={18} ariaLabel="AVL 樹" />
        <div style={muted}>節點右上角的數字 = 平衡因子 BF（左高 − 右高）。實心 = {after ? "新的樹根" : "失衡節點（|BF| = 2）"}，淺色 = 新加入的 {c.added}。</div>
        <p style={caption}>{after ? c.result : c.explain}</p>
      </div>
    </Interactive>
  );
}
