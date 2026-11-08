import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { BinTree, Chip, caption, muted, panel, row, type TNode } from "./ds-ui.tsx";

function fibTree(n: number, path: string, count: Record<number, number>): TNode {
  count[n] = (count[n] ?? 0) + 1;
  const node: TNode = { key: path, label: `${n}` };
  if (n > 1) {
    node.left = fibTree(n - 1, path + "L", count);
    node.right = fibTree(n - 2, path + "R", count);
  }
  return node;
}

function keysOf(t: TNode | null | undefined, v: number, out: string[] = []): string[] {
  if (!t) return out;
  if (t.label === `${v}`) out.push(t.key);
  keysOf(t.left, v, out);
  keysOf(t.right, v, out);
  return out;
}

/** Call tree of naive recursive Fibonacci; highlights how often each F(k) is recomputed. */
export default function FibTree() {
  const [n, setN] = useState(5);
  const [mark, setMark] = useState(2);
  const { tree, count } = useMemo(() => {
    const count: Record<number, number> = {};
    return { tree: fibTree(n, "r", count), count };
  }, [n]);
  const total = Object.values(count).reduce((a, b) => a + b, 0);
  const m = Math.min(mark, n);

  return (
    <Interactive description="遞迴費氏數列 fib(n) = fib(n−1) + fib(n−2) 的呼叫樹，節點上的數字 k 代表一次 fib(k) 呼叫。因為一次呼叫會分成兩次，同一個值被重複計算：fib(4) 共呼叫 9 次，其中 fib(2) 算了 2 次；fib(5) 共 15 次，fib(2) 算了 3 次、fib(3) 算了 2 次；fib(6) 共 25 次，fib(2) 算了 5 次。呼叫次數隨 n 呈指數成長，所以遞迴版費氏數列很慢，改用迴圈由小算到大只要 n 步。">
      <div style={panel}>
        <div style={row}>
          <span style={muted}>算 fib(n)：</span>
          {[3, 4, 5, 6].map((k) => (
            <Chip key={k} active={k === n} onClick={() => setN(k)}>n = {k}</Chip>
          ))}
        </div>
        <div style={{ ...row, marginTop: "8px" }}>
          <span style={muted}>標出重複的：</span>
          {Array.from({ length: n }, (_, i) => i + 1).filter((k) => k >= 1 && k < n).map((k) => (
            <Chip key={k} active={k === m} onClick={() => setMark(k)}>fib({k})</Chip>
          ))}
        </div>
        <BinTree root={tree} soft={keysOf(tree, m)} r={14} ariaLabel={`fib(${n}) 的呼叫樹`} />
        <p style={caption}>
          算一次 fib({n}) 總共呼叫了 <b>{total}</b> 次函數，其中 fib({m}) 被重複算了 <b>{count[m]}</b> 次。
          每個節點都會再分成兩個，所以 n 每加 1，呼叫次數大約變成 1.6 倍。
        </p>
      </div>
    </Interactive>
  );
}
