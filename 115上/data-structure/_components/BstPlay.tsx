import { useState } from "react";
import { Interactive } from "zyninote";
import { BinTree, Chip, caption, formula, muted, panel, row, type TNode } from "./ds-ui.tsx";

type B = { k: number; l: B | null; r: B | null } | null;

const SEQ = [31, 76, 11, 47, 20, 55, 33, 120];

function insert(t: B, k: number): B {
  if (!t) return { k, l: null, r: null };
  return k < t.k ? { ...t, l: insert(t.l, k) } : { ...t, r: insert(t.r, k) };
}
function path(t: B, k: number): number[] {
  const out: number[] = [];
  while (t) { out.push(t.k); t = k < t.k ? t.l : t.r; }
  return out;
}
function minOf(t: NonNullable<B>): number { return t.l ? minOf(t.l) : t.k; }
function remove(t: B, k: number): B {
  if (!t) return null;
  if (k < t.k) return { ...t, l: remove(t.l, k) };
  if (k > t.k) return { ...t, r: remove(t.r, k) };
  if (!t.l) return t.r;
  if (!t.r) return t.l;
  const s = minOf(t.r);
  return { k: s, l: t.l, r: remove(t.r, s) };
}
function find(t: B, k: number): B { while (t && t.k !== k) t = k < t.k ? t.l : t.r; return t; }
function inorder(t: B, out: number[] = []): number[] { if (t) { inorder(t.l, out); out.push(t.k); inorder(t.r, out); } return out; }
function toT(t: B): TNode | null { return t ? { key: String(t.k), left: toT(t.l), right: toT(t.r) } : null; }

/** Build a BST by inserting a fixed sequence, then delete any node and see which case applies. */
export default function BstPlay() {
  const [tree, setTree] = useState<B>(null);
  const [i, setI] = useState(0);
  const [hi, setHi] = useState<string[]>([]);
  const [soft, setSoft] = useState<string[]>([]);
  const [msg, setMsg] = useState("按「插入下一個」依序放入 31, 76, 11, 47, 20, 55, 33, 120。");

  const reset = () => { setTree(null); setI(0); setHi([]); setSoft([]); setMsg("按「插入下一個」依序放入 31, 76, 11, 47, 20, 55, 33, 120。"); };
  const all = () => { let t: B = null; for (const k of SEQ) t = insert(t, k); setTree(t); setI(SEQ.length); setHi([]); setSoft([]); setMsg("8 個鍵值都放好了。點下面的數字試試刪除。"); };

  const ins = () => {
    if (i >= SEQ.length) return;
    const k = SEQ[i];
    const p = path(tree, k);
    const steps = p.map((v) => `${k} ${k < v ? "<" : "≥"} ${v} 往${k < v ? "左" : "右"}`);
    setTree(insert(tree, k));
    setI(i + 1);
    setHi([String(k)]);
    setSoft(p.map(String));
    setMsg(p.length ? `插入 ${k}：從樹根開始比，${steps.join("，")}，走到空位放下。` : `插入 ${k}：樹是空的，${k} 直接當樹根。`);
  };

  const del = (k: number) => {
    const node = find(tree, k)!;
    let text: string;
    let marks: string[] = [];
    if (!node.l && !node.r) text = `${k} 是樹葉，直接刪掉。`;
    else if (!node.l || !node.r) {
      const child = (node.l ?? node.r)!.k;
      text = `${k} 只有一個子樹（以 ${child} 為根），讓 ${k} 的父節點直接改指向 ${child}。`;
      marks = [String(child)];
    } else {
      const s = minOf(node.r!);
      text = `${k} 有兩個子樹，不能直接拿掉。找右子樹中最小的（右子樹一路往左走到底）= ${s}，它比左邊都大、比右邊其他都小，放在 ${k} 的位置剛好維持規則。用 ${s} 取代 ${k}，再刪掉原本的 ${s}。`;
      marks = [String(s)];
    }
    setSoft(marks);
    setHi([]);
    setTree(remove(tree, k));
    setMsg(`刪除 ${k}：${text}`);
  };

  const keys = inorder(tree);

  return (
    <Interactive description="二元搜尋樹建立與刪除的互動示範。規則：每個節點左子樹的鍵值都比它小、右子樹都大於或等於它。依序插入 31, 76, 11, 47, 20, 55, 33, 120：每個新鍵值從樹根開始比，小往左、大往右，走到空位放下；結果樹根 31，左子 11（右子 20），右子 76（左子 47 有 33、55，右子 120）。中序追蹤得 11, 20, 31, 33, 47, 55, 76, 120，剛好由小到大。刪除分三種：樹葉直接刪；只有一個子樹時父節點改指向那個子樹（刪 11 → 31 的左鏈結改指 20）；有兩個子樹時用中序後繼（右子樹最小值）取代（刪 31 → 33 移到樹根；刪 76 → 120 移上來）。">
      <div style={panel}>
        <div style={row}>
          <Chip active onClick={ins}>插入下一個{i < SEQ.length ? `（${SEQ[i]}）` : ""}</Chip>
          <Chip onClick={all}>全部插入</Chip>
          <Chip onClick={reset}>重來</Chip>
        </div>
        <BinTree root={toT(tree)} hi={hi} soft={soft} ariaLabel="二元搜尋樹" />
        <div style={formula}>中序：{keys.length ? keys.join(", ") : "（空）"}</div>
        <p style={caption}>{msg}</p>
        {keys.length > 0 && (
          <div style={{ ...row, marginTop: "6px" }}>
            <span style={muted}>點一個刪除：</span>
            {keys.map((k) => <Chip key={k} onClick={() => del(k)}>{k}</Chip>)}
          </div>
        )}
      </div>
    </Interactive>
  );
}
