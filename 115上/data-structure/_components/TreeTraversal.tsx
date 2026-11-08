import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { BinTree, Chip, StepBar, caption, formula, muted, panel, parseTree, row, type TNode } from "./ds-ui.tsx";

type Order = "pre" | "in" | "post";
const ORDER_NAME: Record<Order, string> = { pre: "前序 D→L→R", in: "中序 L→D→R", post: "後序 L→R→D" };

const TREES = {
  basic: { label: "一般樹", spec: "A(B,C(D(F,G(H,I(J,))),E))" },
  small: { label: "小樹", spec: "A(B(D,E),C(F,))" },
  expr: { label: "運算式樹", spec: "+(−(A,B),/(*(C,−2(D,E)),F))" },
} as const;

function walk(t: TNode | null | undefined, o: Order, out: TNode[]) {
  if (!t) return;
  if (o === "pre") out.push(t);
  walk(t.left, o, out);
  if (o === "in") out.push(t);
  walk(t.right, o, out);
  if (o === "post") out.push(t);
}

const shown = (n: TNode) => (n.key === "−2" ? "−" : n.key);

/** Animated preorder / inorder / postorder traversal of a binary tree. */
export default function TreeTraversal({ tree = "basic" }: { tree?: keyof typeof TREES }) {
  const [which, setWhich] = useState<keyof typeof TREES>(tree);
  const [order, setOrder] = useState<Order>("pre");
  const [step, setStep] = useState(0);
  const root = useMemo(() => {
    const r = parseTree(TREES[which].spec);
    const relabel = (n: TNode | null | undefined) => { if (!n) return; n.label = shown(n); relabel(n.left); relabel(n.right); };
    relabel(r);
    return r;
  }, [which]);
  const seq = useMemo(() => { const out: TNode[] = []; walk(root, order, out); return out; }, [root, order]);
  const cur = step > 0 ? seq[step - 1] : null;
  const visited = seq.slice(0, Math.max(0, step - 1)).map((n) => n.key);

  const why = (n: TNode) => {
    const hasL = !!n.left, hasR = !!n.right;
    if (order === "pre") return `一走到 ${shown(n)} 就先輸出它，然後才去${hasL ? "左子樹" : hasR ? "右子樹" : "回上一層"}。`;
    if (order === "in") return `${hasL ? `${shown(n)} 的左子樹已經全部輸出完` : `${shown(n)} 沒有左子樹`}，所以輸出 ${shown(n)}，接著${hasR ? "處理右子樹" : "回上一層"}。`;
    return `${hasL || hasR ? `${shown(n)} 的子樹都已經輸出完` : `${shown(n)} 是樹葉，沒有子樹`}，最後才輸出 ${shown(n)}。`;
  };

  return (
    <Interactive description="二元樹三種追蹤的逐步動畫，規則都是先左後右，差在何時輸出節點本身（D）：前序 D→L→R（一走到就輸出）、中序 L→D→R（左子樹做完才輸出）、後序 L→R→D（左右子樹都做完才輸出）。範例樹 A(B, C(D(F, G(H, I(J))), E))：前序 A B C D F G H I J E；中序 B A F D H G J I C E；後序 B F H J I G D E C A。運算式樹 ((A−B)+(C*(D−E)/F))：前序得前置式 + − A B / * C − D E F；中序得中置式 A − B + C * D − E / F；後序得後置式 A B − C D E − * F / +。">
      <div style={panel}>
        <div style={row}>
          {(Object.keys(TREES) as (keyof typeof TREES)[]).map((k) => (
            <Chip key={k} active={k === which} onClick={() => { setWhich(k); setStep(0); }}>{TREES[k].label}</Chip>
          ))}
        </div>
        <div style={{ ...row, marginTop: "8px" }}>
          {(["pre", "in", "post"] as Order[]).map((o) => (
            <Chip key={o} active={o === order} onClick={() => { setOrder(o); setStep(0); }}>{ORDER_NAME[o]}</Chip>
          ))}
        </div>
        <BinTree root={root} hi={cur ? [cur.key] : []} soft={visited} ariaLabel="追蹤用的二元樹" />
        <div style={{ ...formula, fontSize: "16px", letterSpacing: "2px" }}>
          {seq.map((n, i) => (
            <span key={n.key} style={{ color: i < step ? "var(--text)" : "var(--faint)", fontWeight: i === step - 1 ? 700 : 400, marginRight: "6px" }}>
              {i < step ? shown(n) : "_"}
            </span>
          ))}
        </div>
        <p style={caption}>{cur ? <><b>輸出 {shown(cur)}</b>　{why(cur)}</> : <>按「下一步」開始。實心 = 現在輸出的節點，淺色 = 已輸出。</>}</p>
        <div style={muted}>{step === seq.length && `完成：${seq.map(shown).join(" ")}`}</div>
        <StepBar step={step} total={seq.length + 1} setStep={setStep} label={`已輸出 ${step} / ${seq.length}`} />
      </div>
    </Interactive>
  );
}
