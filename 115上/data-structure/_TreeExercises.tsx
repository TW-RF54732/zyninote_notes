import { useMemo, useState, type ReactNode } from "react";
import { Interactive } from "zyninote";
import { BinTree, Cell, StepBar, caption, cells, formula, muted, panel, parseTree, tint, useSvgId, type TNode } from "./_ds-ui.tsx";

/** Shared frame for the step-through exercise widgets. */
function Stepper({ description, total, render }: {
  description: string;
  total: number;
  render: (step: number) => ReactNode;
}) {
  const [step, setStep] = useState(0);
  return (
    <Interactive description={description}>
      <div style={panel}>
        {render(Math.min(step, total - 1))}
        <StepBar step={step} total={total} setStep={setStep} />
      </div>
    </Interactive>
  );
}

const spec = (t: TNode | null | undefined): string =>
  !t ? "" : t.left || t.right ? `${t.label ?? t.key}(${spec(t.left)},${spec(t.right)})` : String(t.label ?? t.key);

/* ───────────────────────── 由追蹤結果重建二元樹 ───────────────────────── */

type Slot = { letters: string[]; key?: string; L?: Slot; R?: Slot };
type RebuildStep = { cur: string[]; root: string; left: string[]; right: string[]; tree: TNode | null; ghost: string[]; why: string };

function slotTree(s: Slot | undefined, ghost: string[]): TNode | null {
  if (!s || s.letters.length === 0) return null;
  if (!s.key) {
    const k = "?" + s.letters.join("");
    ghost.push(k);
    return { key: k, label: "?", note: s.letters.join("") };
  }
  return { key: s.key, left: slotTree(s.L, ghost), right: slotTree(s.R, ghost) };
}

function rebuild(inorder: string[], other: string[], kind: "pre" | "post"): RebuildStep[] {
  const top: Slot = { letters: [...inorder] };
  const steps: RebuildStep[] = [];
  const snap = () => { const ghost: string[] = []; const tree = slotTree(top, ghost); return { tree, ghost }; };
  const otherName = kind === "pre" ? "前序" : "後序";
  const go = (s: Slot) => {
    if (s.letters.length === 0) return;
    const inOther = other.filter((x) => s.letters.includes(x));
    const root = kind === "pre" ? inOther[0] : inOther[inOther.length - 1];
    const at = s.letters.indexOf(root);
    const left = s.letters.slice(0, at);
    const right = s.letters.slice(at + 1);
    s.key = root;
    s.L = { letters: left };
    s.R = { letters: right };
    const why = s.letters.length === 1
      ? `只剩 ${root} 一個節點，直接放上去。`
      : `這群節點在${otherName}中的順序是 ${inOther.join(" ")}，${kind === "pre" ? "第一個" : "最後一個"} ${root} 是根。`
        + `在中序找到 ${root}：左邊 ${left.join(" ") || "（沒有）"} 是左子樹，右邊 ${right.join(" ") || "（沒有）"} 是右子樹。`;
    steps.push({ cur: s.letters, root, left, right, ...snap(), why });
    go(s.L);
    go(s.R);
  };
  go(top);
  return steps;
}

function SeqRow({ name, seq, step }: { name: string; seq: string[]; step: RebuildStep | null }) {
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={muted}>{name}</div>
      <div style={{ ...cells, marginTop: "4px" }}>
        {seq.map((x) => {
          const inCur = !step || step.cur.includes(x);
          const sub = !step ? undefined : x === step.root ? "根" : step.left.includes(x) ? "左" : step.right.includes(x) ? "右" : "";
          return <Cell key={x} on={step?.root === x} dim={!inCur} sub={sub} width={32}>{x}</Cell>;
        })}
      </div>
    </div>
  );
}

/** Rebuild a binary tree from inorder plus preorder (or postorder), one subtree per step. */
export function RebuildTree({ inorder, other, kind }: { inorder: string; other: string; kind: "pre" | "post" }) {
  const ino = inorder.split(/\s+/);
  const oth = other.split(/\s+/);
  const steps = useMemo(() => rebuild(ino, oth, kind), [inorder, other, kind]);
  const otherName = kind === "pre" ? "前序" : "後序";
  const final = steps[steps.length - 1].tree;
  const description = `由${otherName}與中序重建二元樹。${otherName} ${oth.join(" ")}，中序 ${ino.join(" ")}。`
    + `方法：${otherName}${kind === "pre" ? "第一個" : "最後一個"}是樹根，在中序找到它，左邊全是左子樹、右邊全是右子樹，再對兩邊重複。過程：`
    + steps.filter((s) => s.cur.length > 1).map((s) => `{${s.cur.join(",")}} 的根是 ${s.root}，左 ${s.left.length ? `{${s.left.join(",")}}` : "（無）"} 右 ${s.right.length ? `{${s.right.join(",")}}` : "（無）"}`).join("；")
    + `。結果（括號內為左子,右子）：${spec(final)}。`;
  return (
    <Stepper description={description} total={steps.length + 1} render={(i) => {
      const s = i === 0 ? null : steps[i - 1];
      return (
        <>
          <SeqRow name={otherName} seq={oth} step={s} />
          <SeqRow name="中序" seq={ino} step={s} />
          {s
            ? <BinTree root={s.tree} hi={[s.root]} ghost={s.ghost} ariaLabel="重建中的二元樹" />
            : <div style={{ ...muted, padding: "16px 0" }}>（還沒開始，樹是空的）</div>}
          <p style={caption}>
            {s ? s.why : `${otherName}負責告訴我們「誰是根」，中序負責告訴我們「誰在左、誰在右」。按「下一步」開始。`}
            {s && s.ghost.length > 0 && <span style={muted}>　虛線「?」= 還沒處理的子樹，旁邊是它包含的節點。</span>}
          </p>
          {i === steps.length && <div style={formula}>完成。檢查：對這棵樹再做一次{otherName}和中序，要跟題目一樣。</div>}
        </>
      );
    }} />
  );
}

/* ───────────────────────── 二元搜尋樹：插入與刪除 ───────────────────────── */

type B = { k: number; l: B | null; r: B | null } | null;
type BstStep = { tree: B; hi: number[]; soft: number[]; why: string };

function bInsert(t: B, k: number): B {
  if (!t) return { k, l: null, r: null };
  return k < t.k ? { ...t, l: bInsert(t.l, k) } : { ...t, r: bInsert(t.r, k) };
}
/** Find by structure, not by key order: the textbook tree is not always a valid BST. */
function bLocate(t: B, k: number): B { if (!t) return null; if (t.k === k) return t; return bLocate(t.l, k) ?? bLocate(t.r, k); }
function bReplace(t: B, k: number, f: (n: NonNullable<B>) => B): B {
  if (!t) return null;
  if (t.k === k) return f(t);
  return { ...t, l: bReplace(t.l, k, f), r: bReplace(t.r, k, f) };
}
function bInorder(t: B, out: number[] = []): number[] { if (t) { bInorder(t.l, out); out.push(t.k); bInorder(t.r, out); } return out; }
function bToT(t: B): TNode | null { return t ? { key: String(t.k), left: bToT(t.l), right: bToT(t.r) } : null; }
function bFromSpec(s: string): B {
  const conv = (n: TNode | null | undefined): B => (n ? { k: Number(n.key), l: conv(n.left), r: conv(n.right) } : null);
  return conv(parseTree(s));
}

function bstSteps(start: B, insert: number[], remove: number[]): BstStep[] {
  let t = start;
  const steps: BstStep[] = [{ tree: t, hi: [], soft: [], why: t ? "原本的二元搜尋樹。" : "從空樹開始。規則：從樹根開始比，比較小往左、比較大往右，走到空位就放下。" }];
  for (const k of insert) {
    const path: string[] = [];
    const soft: number[] = [];
    let p = t;
    let side = "";
    let parent = 0;
    while (p) {
      const go = k < p.k ? "左" : "右";
      path.push(`${k} ${k < p.k ? "<" : "≥"} ${p.k} → ${go}`);
      soft.push(p.k);
      parent = p.k;
      side = go;
      p = k < p.k ? p.l : p.r;
    }
    t = bInsert(t, k);
    steps.push({
      tree: t, hi: [k], soft,
      why: path.length ? `插入 ${k}：${path.join("；")}，放在 ${parent} 的${side}子。` : `插入 ${k}：樹是空的，${k} 當樹根。`,
    });
  }
  for (const k of remove) {
    const n = bLocate(t, k)!;
    if (!n.l || !n.r) {
      const child = n.l ?? n.r;
      steps.push({
        tree: t, hi: [k], soft: child ? [child.k] : [],
        why: child ? `刪除 ${k}：它只有一個子樹（${child.k}），讓 ${k} 的父節點直接改指向 ${child.k}。` : `刪除 ${k}：它是樹葉，直接拿掉。`,
      });
      t = bReplace(t, k, (m) => m.l ?? m.r);
      steps.push({ tree: t, hi: child ? [child.k] : [], soft: [], why: child ? `${child.k} 整個子樹往上頂替 ${k} 的位置，完成。` : `${k} 已移除。` });
      continue;
    }
    const path: number[] = [n.r.k];
    let m = n.r;
    while (m.l) { m = m.l; path.push(m.k); }
    const succ = m.k;
    steps.push({ tree: t, hi: [k], soft: [], why: `刪除 ${k}：它有兩個子樹，不能直接拿掉，要找一個節點來頂替。` });
    steps.push({ tree: t, hi: [k], soft: path, why: `找右子樹裡最小的：先進右子樹 ${n.r.k}，再一路往左走到底 → ${path.join(" → ")}，得到 ${succ}。` });
    t = bReplace(t, k, (x) => ({ ...x, k: succ, r: bReplace(x.r, succ, (y) => y.r) }));
    steps.push({ tree: t, hi: [succ], soft: [], why: `用 ${succ} 取代 ${k}，再把原本位置的 ${succ} 刪掉（它最多只有右子樹，接回父節點即可）。` });
  }
  return steps;
}

/** Step through BST insertions (with the comparison path) and deletions (with the case that applies). */
export function BstTrace({ start, insert = [], remove = [] }: { start?: string; insert?: number[]; remove?: number[] }) {
  const steps = useMemo(() => bstSteps(start ? bFromSpec(start) : null, insert, remove), [start, insert.join(), remove.join()]);
  const last = steps[steps.length - 1].tree;
  const description = "二元搜尋樹逐步示範。" + steps.map((s) => s.why).join("") + `最後的樹（括號內為左子,右子）：${spec(bToT(last))}，中序 ${bInorder(last).join(", ")}。`;
  return (
    <Stepper description={description} total={steps.length} render={(i) => {
      const s = steps[i];
      return (
        <>
          <BinTree root={bToT(s.tree)} hi={s.hi.map(String)} soft={s.soft.map(String)} r={19} ariaLabel="二元搜尋樹" />
          <p style={caption}>{s.why}</p>
          <div style={formula}>中序：{bInorder(s.tree).join(", ") || "（空）"}</div>
          <div style={{ ...muted, marginTop: "4px" }}>深色 = 這一步的主角；淺色 = 比較過或走過的節點。</div>
        </>
      );
    }} />
  );
}

/* ───────────────────────── B 樹 ───────────────────────── */

type BN = { keys: string[]; kids?: BN[]; bad?: boolean; focus?: boolean };
type BFrame = { root: BN; hi: string[]; why: string };

const KW = 30; // width per key
const nodeW = (n: BN) => Math.max(1, n.keys.length) * KW;
const GAP = 14;
const LH = 64;

type BPlaced = { n: BN; x: number; y: number; kids: BPlaced[] };
function bLayout(n: BN, depth: number, left: number): { p: BPlaced; w: number } {
  const kids: BPlaced[] = [];
  let x = left;
  for (const c of n.kids ?? []) {
    const r = bLayout(c, depth + 1, x);
    kids.push(r.p);
    x += r.w + GAP;
  }
  const kidsW = kids.length ? x - GAP - left : 0;
  const w = Math.max(nodeW(n), kidsW);
  const cx = left + w / 2;
  if (kids.length && kidsW < w) { const shift = (w - kidsW) / 2; const mv = (q: BPlaced) => { q.x += shift; q.kids.forEach(mv); }; kids.forEach(mv); }
  return { p: { n, x: cx - nodeW(n) / 2, y: depth * LH + 6, kids }, w };
}

function BTreeSvg({ root, hi }: { root: BN; hi: string[] }) {
  const { p, w } = bLayout(root, 0, 8);
  let maxD = 0;
  const all: BPlaced[] = [];
  const walk = (q: BPlaced) => { all.push(q); maxD = Math.max(maxD, q.y); q.kids.forEach(walk); };
  walk(p);
  const W = w + 16;
  const H = maxD + 40;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="B 樹" style={{ width: "100%", maxWidth: `${W * 1.3}px`, display: "block", margin: "8px auto", color: "var(--text)" }}>
      {all.flatMap((q) => q.kids.map((c, i) => (
        <line key={`${q.x}-${q.y}-${i}`} x1={q.x + i * KW} y1={q.y + 28} x2={c.x + nodeW(c.n) / 2} y2={c.y}
          stroke="currentColor" strokeOpacity={0.5} />
      )))}
      {all.map((q) => (
        <g key={`${q.x}-${q.y}`}>
          <rect x={q.x} y={q.y} width={nodeW(q.n)} height={28} rx={4}
            fill={q.n.focus ? tint(14) : "var(--surface)"} stroke="currentColor"
            strokeWidth={q.n.bad || q.n.focus ? 2 : 1} strokeDasharray={q.n.bad ? "5 3" : undefined} strokeOpacity={q.n.bad || q.n.focus ? 1 : 0.6} />
          {q.n.keys.length === 0 && <text x={q.x + KW / 2} y={q.y + 18} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity={0.6}>空</text>}
          {q.n.keys.map((k, i) => (
            <g key={i}>
              {i > 0 && <line x1={q.x + i * KW} y1={q.y} x2={q.x + i * KW} y2={q.y + 28} stroke="currentColor" strokeOpacity={0.35} />}
              {hi.includes(k) && <rect x={q.x + i * KW + 2} y={q.y + 2} width={KW - 4} height={24} rx={3} fill="currentColor" />}
              <text x={q.x + i * KW + KW / 2} y={q.y + 18.5} textAnchor="middle" fontSize="12" fontFamily="var(--mono)"
                fill={hi.includes(k) ? "var(--background)" : "currentColor"} fontWeight={hi.includes(k) ? 700 : 400}>{k}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

const L = (keys: (number | string)[], kids?: BN[], extra: Partial<BN> = {}): BN => ({ keys: keys.map(String), kids, ...extra });

const INSERT_FRAMES: BFrame[] = [
  { root: L([48, 120], [L([24]), L([55, 92]), L([135, 210, 250], [L([125]), L([160, 188, 200]), L([240]), L([270])])]), hi: [],
    why: "4 階 B 樹：每個節點最多 3 個鍵值、4 個子節點。要插入 168。（[24]、[55, 92] 底下的樹葉與本題無關，省略。）" },
  { root: L([48, 120], [L([24]), L([55, 92]), L([135, 210, 250], [L([125]), L([160, 188, 200], undefined, { focus: true }), L([240]), L([270])], { focus: true })], { focus: true }), hi: ["120", "135", "210"],
    why: "找位置：168 > 120 → 走最右邊的 [135, 210, 250]；135 < 168 < 210 → 走第二個子節點，到樹葉 [160, 188, 200]。" },
  { root: L([48, 120], [L([24]), L([55, 92]), L([135, 210, 250], [L([125]), L([160, 168, 188, 200], undefined, { bad: true }), L([240]), L([270])])]), hi: ["168"],
    why: "放進樹葉：[160, 168, 188, 200] 有 4 個，超過上限 3（虛線框 = 違規）。" },
  { root: L([48, 120], [L([24]), L([55, 92]), L([135, 168, 210, 250], [L([125]), L([160]), L([188, 200]), L([240]), L([270])], { bad: true })]), hi: ["168"],
    why: "切開樹葉：中間偏左的 168 往上送，留下 [160] 和 [188, 200] 兩個樹葉。但父節點變成 [135, 168, 210, 250]，也 4 個了。" },
  { root: L([48, 120, 168], [L([24]), L([55, 92]), L([135], [L([125]), L([160])]), L([210, 250], [L([188, 200]), L([240]), L([270])])], { focus: true }), hi: ["168"],
    why: "再切開父節點：168 往上送給樹根，左邊 [135] 帶走 [125]、[160]，右邊 [210, 250] 帶走 [188, 200]、[240]、[270]。樹根 [48, 120, 168] 只有 3 個，沒超過，結束。" },
];

const DELETE_FRAMES: BFrame[] = [
  { root: L([55, 92], [L([52, 54]), L([56, 72]), L([96])]), hi: [],
    why: "樹根 [48, 120] 的中間子樹（只畫出這部分）。4 階 B 樹的非樹根節點至少要 ⌈4/2⌉ − 1 = 1 個鍵值。" },
  { root: L([55, 92], [L([54], undefined, { focus: true }), L([56, 72]), L([96])]), hi: [],
    why: "刪除 52：[52, 54] 剩 [54]，還有 1 個，夠 → 直接刪除。" },
  { root: L([55, 92], [L([], undefined, { bad: true }), L([56, 72]), L([96])]), hi: [],
    why: "刪除 54：節點變空，少於 1 個（虛線框 = 違規）。右兄弟 [56, 72] 有 2 個，借一個給我還剩 1 個 → 可以借。" },
  { root: L(["·", 92], [L([55], undefined, { focus: true }), L([56, 72]), L([96])]), hi: ["55"],
    why: "不能直接把 56 搬過來（父節點的 55 是分界，左邊要比 55 小）。所以先讓父節點的分界 55 下來，填進空節點。" },
  { root: L([56, 92], [L([55]), L([72]), L([96])]), hi: ["56"],
    why: "再讓右兄弟最小的 56 上去，當新的分界。檢查：55 < 56、56 < 72 < 92、96 > 92，左小右大仍成立。" },
];

function BTreeSteps({ frames, title }: { frames: BFrame[]; title: string }) {
  const description = `${title}，逐步示範：` + frames.map((f, i) => `(${i + 1}) ${f.why}`).join(" ");
  return (
    <Stepper description={description} total={frames.length} render={(i) => (
      <>
        <BTreeSvg root={frames[i].root} hi={frames[i].hi} />
        <p style={caption}>{frames[i].why}</p>
      </>
    )} />
  );
}

/** 4 階 B 樹插入 168 的逐步分裂。 */
export function BTreeInsertEx() { return <BTreeSteps frames={INSERT_FRAMES} title="4 階 B 樹插入 168" />; }
/** 4 階 B 樹刪除 52、54 的借位過程。 */
export function BTreeDeleteEx() { return <BTreeSteps frames={DELETE_FRAMES} title="4 階 B 樹刪除 52 再刪除 54" />; }

/* ───────────────────────── 引線二元樹 ───────────────────────── */

type TP = { key: string; x: number; y: number; l?: TP; r?: TP };
function tLayout(root: TNode): TP[] {
  const out: TP[] = [];
  let i = 0;
  const walk = (n: TNode | null | undefined, d: number): TP | undefined => {
    if (!n) return undefined;
    const me: TP = { key: n.key, x: 0, y: d };
    me.l = walk(n.left, d + 1);
    me.x = i++;
    out.push(me);
    me.r = walk(n.right, d + 1);
    return me;
  };
  walk(root, 0);
  return out;
}

/** Turn a binary tree into a threaded tree, one leaf at a time. */
export function ThreadedEx({ tree }: { tree: string }) {
  const arrow = useSvgId("thr");
  const nodes = useMemo(() => tLayout(parseTree(tree)!), [tree]);
  const order = nodes.map((n) => n.key);
  const needs = nodes.filter((n) => !n.l || !n.r);
  const threads = needs.map((n) => {
    const i = order.indexOf(n.key);
    return { node: n.key, left: n.l ? null : order[i - 1] ?? "head", right: n.r ? null : order[i + 1] ?? "head" };
  });
  const DX = 46, DY = 58, R = 16;
  const depth = Math.max(...nodes.map((n) => n.y)) + 1;
  const W = (nodes.length + 1) * DX + 16;
  const H = (depth + 1) * DY + 10;
  const pos = (k: string) => {
    if (k === "head") return { x: 8 + DX / 2, y: R + 8 };
    const n = nodes.find((m) => m.key === k)!;
    return { x: 8 + DX / 2 + (n.x + 1) * DX, y: R + 8 + (n.y + 1) * DY };
  };
  const root = nodes.find((n) => n.y === 0)!;
  const fmtT = (k: string | null) => (k === "head" ? "開頭節點" : k);
  const description = `把二元樹 ${tree}（括號內為左子,右子）轉成引線二元樹。先寫中序：${order.join(" ")}。空的左指標改指向中序的前一個，空的右指標改指向中序的下一個；沒有前一個或下一個的就指向開頭節點。`
    + threads.map((t) => `${t.node}：` + [t.left && `左引線 → ${fmtT(t.left)}`, t.right && `右引線 → ${fmtT(t.right)}`].filter(Boolean).join("、")).join("；")
    + `。開頭節點的左鏈結指向樹根 ${root.key}，右鏈結指向自己。`;

  const curve = (a: { x: number; y: number }, b: { x: number; y: number }, side: "L" | "R") => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = side === "L" ? 26 : -26;
    const cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend;
    // stop short of the target circle so the arrowhead is visible
    const ex = b.x - ((b.x - cx) / Math.hypot(b.x - cx, b.y - cy)) * (R + 2);
    const ey = b.y - ((b.y - cy) / Math.hypot(b.x - cx, b.y - cy)) * (R + 2);
    const sx = a.x + ((cx - a.x) / Math.hypot(cx - a.x, cy - a.y)) * R;
    const sy = a.y + ((cy - a.y) / Math.hypot(cx - a.x, cy - a.y)) * R;
    return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
  };

  return (
    <Stepper description={description} total={threads.length + 2} render={(step) => {
      const shown = step === threads.length + 1 ? threads.length : step;
      const cur = step >= 1 && step <= threads.length ? threads[step - 1] : null;
      return (
        <>
          <div style={muted}>中序：{order.map((k) => (
            <span key={k} style={{ fontFamily: "var(--mono)", padding: "0 4px", fontWeight: cur?.node === k ? 700 : 400,
              background: cur && (cur.node === k || cur.left === k || cur.right === k) ? tint(cur.node === k ? 30 : 14) : undefined }}>{k}</span>
          ))}</div>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="引線二元樹" style={{ width: "100%", maxWidth: `${W * 1.2}px`, display: "block", margin: "8px auto", color: "var(--text)" }}>
            <defs>
              <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {/* head → root */}
            <line x1={pos("head").x + R} y1={pos("head").y + 6} x2={pos(root.key).x - R} y2={pos(root.key).y - 4} stroke="currentColor" strokeOpacity={0.4} markerEnd={`url(#${arrow})`} />
            {nodes.flatMap((n) => [n.l, n.r].filter(Boolean).map((c) => (
              <line key={n.key + c!.key} x1={pos(n.key).x} y1={pos(n.key).y} x2={pos(c!.key).x} y2={pos(c!.key).y} stroke="currentColor" strokeOpacity={0.5} />
            )))}
            {threads.slice(0, shown).flatMap((t, i) => (["left", "right"] as const).filter((s) => t[s]).map((s) => {
              const active = i === step - 1;
              return (
                <path key={t.node + s} d={curve(pos(t.node), pos(t[s]!), s === "left" ? "L" : "R")} fill="none" stroke="currentColor"
                  strokeWidth={active ? 2 : 1.2} strokeOpacity={active ? 1 : 0.45} strokeDasharray="5 4" markerEnd={`url(#${arrow})`} />
              );
            }))}
            {[{ key: "head" }, ...nodes].map((n) => {
              const p = pos(n.key);
              const on = cur?.node === n.key;
              return (
                <g key={n.key}>
                  {n.key === "head"
                    ? <rect x={p.x - R - 4} y={p.y - 12} width={2 * R + 8} height={24} rx={4} fill="var(--surface)" stroke="currentColor" strokeOpacity={0.6} />
                    : <circle cx={p.x} cy={p.y} r={R} fill={on ? "currentColor" : "var(--surface)"} stroke="currentColor" strokeOpacity={on ? 1 : 0.6} />}
                  <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize={n.key === "head" ? 11 : 13} fontFamily="var(--mono)"
                    fill={on ? "var(--background)" : "currentColor"} fontWeight={on ? 700 : 400}>{n.key === "head" ? "開頭" : n.key}</text>
                </g>
              );
            })}
          </svg>
          <p style={caption}>
            {step === 0 && `先寫出中序 ${order.join(" ")}。有空指標的節點是 ${needs.map((n) => n.key).join("、")}，接下來一個一個補引線（虛線）。`}
            {cur && `${cur.node}：在中序裡前一個是 ${fmtT(order[order.indexOf(cur.node) - 1] ?? "head")}、下一個是 ${fmtT(order[order.indexOf(cur.node) + 1] ?? "head")}。`
              + [cur.left && `左指標空著 → 指向 ${fmtT(cur.left)}`, cur.right && `右指標空著 → 指向 ${fmtT(cur.right)}`].filter(Boolean).join("；") + "。"}
            {step === threads.length + 1 && `全部完成。開頭節點的左鏈結指向樹根 ${root.key}，右鏈結指向自己；第一個 ${order[0]} 和最後一個 ${order[order.length - 1]} 沒有鄰居的那一側都指回開頭節點。`}
          </p>
        </>
      );
    }} />
  );
}

/* ───────────────────────── 運算式樹 ───────────────────────── */

const n = (key: string, label: string, left?: TNode | null, right?: TNode | null): TNode => ({ key, label, left, right });
const hole = (key: string): TNode => ({ key, label: "?" });

const EX_A = n("A", "A"), EX_B = n("B", "B"), EX_C = n("C", "C"), EX_D = n("D", "D"), EX_E = n("E", "E"), EX_F = n("F", "F");
const EX_SUB = n("sub", "−", EX_B, EX_C);
const EX_MUL1 = n("mul1", "*", EX_A, EX_SUB);
const EX_DIV = n("div", "/", EX_MUL1, EX_D);
const EX_NEG = n("neg", "−", EX_E, null);
const EX_MUL2 = n("mul2", "*", EX_NEG, EX_F);

const EXPR_FRAMES: { root: TNode; hi: string[]; ghost: string[]; why: string }[] = [
  { root: n("plus", "+", hole("g1"), hole("g2")), hi: ["plus"], ghost: ["g1", "g2"],
    why: "完整括號是 (((A*(B-C))/D)+((-E)*F))。最外層、最後才算的是 +，當樹根。左 ? = (A*(B-C))/D，右 ? = (-E)*F。" },
  { root: n("plus", "+", n("div", "/", hole("g3"), EX_D), hole("g2")), hi: ["div"], ghost: ["g3", "g2"],
    why: "左半 (A*(B-C))/D：* 和 / 同級由左到右，最後算的是 /。它的左子 ? = A*(B-C)，右子 D。" },
  { root: n("plus", "+", n("div", "/", n("mul1", "*", EX_A, hole("g4")), EX_D), hole("g2")), hi: ["mul1"], ghost: ["g4", "g2"],
    why: "A*(B-C)：運算子 * 當節點，左子 A，右子 ? = B-C。" },
  { root: n("plus", "+", EX_DIV, hole("g2")), hi: ["sub"], ghost: ["g2"],
    why: "B-C：減號當節點，左子 B、右子 C。左半做完了。" },
  { root: n("plus", "+", EX_DIV, n("mul2", "*", hole("g5"), EX_F)), hi: ["mul2"], ghost: ["g5"],
    why: "右半 (-E)*F：最後算的是 *，左子 ? = -E，右子 F。" },
  { root: n("plus", "+", EX_DIV, EX_MUL2), hi: ["neg"], ghost: [],
    why: "-E 是負號，只有一個運算元，所以這個 − 只有一個子節點 E。完成：前序 + / * A − B C D * − E F，後序 A B C − * D / E − F * +。" },
];

/** Build the expression tree of A*(B-C)/D+-E*F from the outside in. */
export function ExprTreeEx() {
  const description = "把 A*(B-C)/D+-E*F（-E 為負號）轉成運算式樹，由外往內：" + EXPR_FRAMES.map((f) => f.why).join("");
  return (
    <Stepper description={description} total={EXPR_FRAMES.length} render={(i) => {
      const f = EXPR_FRAMES[i];
      return (
        <>
          <BinTree root={f.root} hi={f.hi} ghost={f.ghost} ariaLabel="運算式樹" />
          <p style={caption}>{f.why}</p>
          <div style={{ ...muted, marginTop: "4px" }}>虛線「?」= 還沒拆開的子運算式。</div>
        </>
      );
    }} />
  );
}

