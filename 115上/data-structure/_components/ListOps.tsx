import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, StepBar, caption, formula, panel, row } from "./ds-ui.tsx";
import { ListDraw, type LEdge, type LNode, type LPtr } from "./ListDraw.tsx";

type Frame = { nodes: LNode[]; edges: LEdge[]; ptrs: LPtr[]; code: string; msg: string };

const n = (id: string, x: number, y = 0, extra: Partial<LNode> = {}): LNode => ({ id, label: id, x, y, ...extra });
const e = (from: string, to: string | null, extra: Partial<LEdge> = {}): LEdge => ({ from, to, ...extra });

const SCENES: Record<string, { label: string; frames: Frame[] }> = {
  insert: {
    label: "插入（正確順序）",
    frames: [
      {
        nodes: [n("5", 0), n("31", 1), n("65", 3), n("78", 4), n("45", 2, 1, { hi: true })],
        edges: [e("5", "31"), e("31", "65"), e("65", "78"), e("78", null)],
        ptrs: [{ name: "front", to: "5" }, { name: "p", to: "31" }, { name: "new", to: "45", below: true }],
        code: "/* 要把 45 插在 p（31）後面 */",
        msg: "新節點 45 已經準備好，但還沒接進串列。要改兩個指標，順序很重要：先接後面，再接前面。",
      },
      {
        nodes: [n("5", 0), n("31", 1), n("65", 3), n("78", 4), n("45", 2, 1, { hi: true })],
        edges: [e("5", "31"), e("31", "65"), e("65", "78"), e("78", null), e("45", "65", { hi: true })],
        ptrs: [{ name: "front", to: "5" }, { name: "p", to: "31" }, { name: "new", to: "45", below: true }],
        code: "new->link = p->link;   /* 1. 先接後面 */",
        msg: "先讓 45 指向 p 原本的下一個（65）。這時 31→65 還在，所以後半段 65、78 不會弄丟。",
      },
      {
        nodes: [n("5", 0), n("31", 1), n("65", 3), n("78", 4), n("45", 2, 1, { hi: true })],
        edges: [e("5", "31"), e("31", "45", { hi: true }), e("45", "65"), e("65", "78"), e("78", null)],
        ptrs: [{ name: "front", to: "5" }, { name: "p", to: "31" }, { name: "new", to: "45", below: true }],
        code: "p->link = new;         /* 2. 再接前面 */",
        msg: "再把 31 改指向 45。完成：5 → 31 → 45 → 65 → 78。整個過程沒有搬動任何資料，只改了 2 個指標。",
      },
    ],
  },
  wrong: {
    label: "插入（順序弄反）",
    frames: [
      {
        nodes: [n("5", 0), n("31", 1), n("65", 3), n("78", 4), n("45", 2, 1, { hi: true })],
        edges: [e("5", "31"), e("31", "65"), e("65", "78"), e("78", null)],
        ptrs: [{ name: "front", to: "5" }, { name: "p", to: "31" }, { name: "new", to: "45", below: true }],
        code: "/* 如果先接前面會怎樣？ */",
        msg: "一樣要把 45 插在 31 後面，這次故意先改 p->link。",
      },
      {
        nodes: [n("5", 0), n("31", 1), n("65", 3, 0, { ghost: true }), n("78", 4, 0, { ghost: true }), n("45", 2, 1, { hi: true })],
        edges: [e("5", "31"), e("31", "45", { hi: true }), e("65", "78", { dashed: true }), e("78", null, { dashed: true })],
        ptrs: [{ name: "front", to: "5" }, { name: "p", to: "31" }, { name: "new", to: "45", below: true }],
        code: "p->link = new;         /* 先接前面 */",
        msg: "31 改指向 45 後，原本唯一指著 65 的指標被蓋掉了。現在沒有任何指標能找到 65 和 78，它們「遺失」了。",
      },
      {
        nodes: [n("5", 0), n("31", 1), n("65", 3, 0, { ghost: true }), n("78", 4, 0, { ghost: true }), n("45", 2, 1, { hi: true })],
        edges: [e("5", "31"), e("31", "45"), e("45", "45", { hi: true }), e("65", "78", { dashed: true }), e("78", null, { dashed: true })],
        ptrs: [{ name: "front", to: "5" }, { name: "p", to: "31" }, { name: "new", to: "45", below: true }],
        code: "new->link = p->link;   /* p->link 已經是 new 了！ */",
        msg: "這時 p->link 已經是 45 自己，所以 45 指向自己，串列變成無限迴圈，後半段也救不回來。這就是為什麼一定要「先接後面，再接前面」。",
      },
    ],
  },
  delete: {
    label: "刪除",
    frames: [
      {
        nodes: [n("31", 0), n("65", 1), n("78", 2), n("83", 3), n("98", 4)],
        edges: [e("31", "65"), e("65", "78"), e("78", "83"), e("83", "98"), e("98", null)],
        ptrs: [{ name: "p", to: "65" }],
        code: "/* 要刪掉 p（65）的下一個節點 78 */",
        msg: "刪除時要站在「被刪節點的前一個」p，因為要改的是 p 的指標。",
      },
      {
        nodes: [n("31", 0), n("65", 1), n("78", 2, 0, { hi: true }), n("83", 3), n("98", 4)],
        edges: [e("31", "65"), e("65", "78"), e("78", "83"), e("83", "98"), e("98", null)],
        ptrs: [{ name: "p", to: "65" }, { name: "q", to: "78", below: true }],
        code: "q = p->link;",
        msg: "先用 q 記住要刪的節點，等一下才能把它的空間還給系統。",
      },
      {
        nodes: [n("31", 0), n("65", 1), n("78", 2, 1, { hi: true }), n("83", 3), n("98", 4)],
        edges: [e("31", "65"), e("65", "83", { hi: true }), e("78", "83", { dashed: true }), e("83", "98"), e("98", null)],
        ptrs: [{ name: "p", to: "65" }, { name: "q", to: "78", below: true }],
        code: "p->link = q->link;     /* 跳過 q */",
        msg: "讓 65 直接指向 78 的下一個（83）。從頭走訪時已經不會經過 78 了。",
      },
      {
        nodes: [n("31", 0), n("65", 1), n("83", 3), n("98", 4)],
        edges: [e("31", "65"), e("65", "83"), e("83", "98"), e("98", null)],
        ptrs: [{ name: "p", to: "65" }],
        code: "free(q);               /* 歸還空間 */",
        msg: "最後釋放 78 的記憶體。結果：31 → 65 → 83 → 98，只改了 1 個指標。",
      },
    ],
  },
  head: {
    label: "插在最前面",
    frames: [
      {
        nodes: [n("31", 1), n("65", 2), n("78", 3), n("5", 0, 1, { hi: true })],
        edges: [e("31", "65"), e("65", "78"), e("78", null)],
        ptrs: [{ name: "front", to: "31" }, { name: "new", to: "5", below: true }],
        code: "/* 要把 5 插在第一個節點之前 */",
        msg: "第一個節點前面沒有「前一個節點」，要改的是 front 指標本身。",
      },
      {
        nodes: [n("31", 1), n("65", 2), n("78", 3), n("5", 0, 1, { hi: true })],
        edges: [e("31", "65"), e("65", "78"), e("78", null), e("5", "31", { hi: true })],
        ptrs: [{ name: "front", to: "31" }, { name: "new", to: "5", below: true }],
        code: "new->link = front;     /* 先接後面 */",
        msg: "一樣先接後面：5 指向原本的第一個 31。",
      },
      {
        nodes: [n("31", 1), n("65", 2), n("78", 3), n("5", 0, 1, { hi: true })],
        edges: [e("31", "65"), e("65", "78"), e("78", null), e("5", "31")],
        ptrs: [{ name: "front", to: "5" }, { name: "new", to: "5", below: true }],
        code: "front = new;           /* 再接前面 */",
        msg: "再把 front 改指向 5。5 成為新的第一個節點。",
      },
    ],
  },
};

/** Pointer-by-pointer stepper for singly linked list insertion and deletion. */
export default function ListOps({ start = "insert" }: { start?: keyof typeof SCENES }) {
  const [scene, setScene] = useState<keyof typeof SCENES>(start);
  const [step, setStep] = useState(0);
  const frames = SCENES[scene].frames;
  const f = frames[Math.min(step, frames.length - 1)];

  return (
    <Interactive description="單向鏈結串列插入與刪除的指標變化逐步示範。插入：把 45 插在 p（31）之後，先執行 new->link = p->link 讓 45 指向 65，再執行 p->link = new 讓 31 指向 45，結果 5→31→45→65→78。若順序弄反，先做 p->link = new，原本指向 65 的唯一指標被覆蓋，65 和 78 遺失；接著 new->link = p->link 會讓 45 指向自己。所以要先接後面再接前面。刪除 p（65）的下一個節點 78：q = p->link 記住 78，p->link = q->link 讓 65 跳過 78 直接指向 83，再 free(q) 歸還空間。插在最前面：new->link = front，front = new。">
      <div style={panel}>
        <div style={row}>
          {Object.entries(SCENES).map(([k, v]) => (
            <Chip key={k} active={k === scene} onClick={() => { setScene(k as keyof typeof SCENES); setStep(0); }}>{v.label}</Chip>
          ))}
        </div>
        <ListDraw nodes={f.nodes} edges={f.edges} ptrs={f.ptrs} width={470} height={155} />
        <div style={formula}>{f.code}</div>
        <p style={caption}>{f.msg}</p>
        <StepBar step={step} total={frames.length} setStep={setStep} />
      </div>
    </Interactive>
  );
}
