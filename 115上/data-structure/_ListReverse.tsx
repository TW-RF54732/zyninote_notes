import { useMemo, useState } from "react";
import { Interactive } from "zyninote";
import { StepBar, caption, formula, muted, panel } from "./_ds-ui.tsx";
import { ListDraw, type LPtr } from "./_ListDraw.tsx";

const VALS = ["33", "72", "48", "11"];
type St = { link: Record<string, string | null>; head: string | null; mid: string | null; last: string | null; code: string; msg: string; hi?: string };

function build(): St[] {
  const link: Record<string, string | null> = { "33": "72", "72": "48", "48": "11", "11": null };
  let head: string | null = "33";
  let mid: string | null = null;
  let last: string | null = null;
  const out: St[] = [];
  const snap = (code: string, msg: string, hi?: string) => out.push({ link: { ...link }, head, mid, last, code, msg, hi });
  snap("mid = NULL;  /* head 指向第一個節點 */", "三個指標：head 往前探路，mid 是正在處理的節點，last 是 mid 的前一個。一開始 mid、last 都還沒指任何東西。");
  let round = 0;
  while (head !== null) {
    round++;
    last = mid;
    snap("last = mid;", `第 ${round} 輪。last 跟上 mid 的位置${last ? `（${last}）` : "（NULL）"}。`);
    mid = head;
    snap("mid = head;", `mid 跟上 head（${mid}），這是本輪要反轉的節點。`);
    head = link[head];
    snap("head = head->link;", head ? `head 先往前走到 ${head}。要先走，因為下一行會改掉 ${mid} 的指標，不先記住就找不到後面了。` : `head 往前走到 NULL，代表 ${mid} 是最後一個節點。`);
    link[mid] = last;
    snap("mid->link = last;", last ? `把 ${mid} 的箭頭轉向，改指向前一個 ${last}。` : `${mid} 原本是第一個，反轉後變成最後一個，所以指向 NULL。`, mid);
  }
  snap("return mid;", `head 是 NULL，迴圈結束。mid（${mid}）就是反轉後的第一個節點：11 → 48 → 72 → 33 → NULL。`);
  return out;
}

/** Step through the three-pointer in-place reversal of a singly linked list. */
export default function ListReverse() {
  const states = useMemo(build, []);
  const [step, setStep] = useState(0);
  const s = states[Math.min(step, states.length - 1)];
  const ptrs: LPtr[] = [];
  if (s.head) ptrs.push({ name: "head", to: s.head });
  if (s.mid) ptrs.push({ name: "mid", to: s.mid, below: true });
  if (s.last) ptrs.push({ name: "last", to: s.last, below: true });

  const edges = VALS.map((v) => {
    const to = s.link[v];
    const back = to !== null && VALS.indexOf(to) < VALS.indexOf(v);
    return back
      ? { from: v, to, back: true, hi: v === s.hi }
      : { from: v, to, hi: v === s.hi };
  });

  return (
    <Interactive description="用三個指標原地反轉單向鏈結串列 33→72→48→11 的逐步示範。迴圈每一輪做四件事：last = mid（last 跟上）、mid = head（mid 跟上）、head = head->link（head 先往前走，否則改掉 mid 的指標後就找不到後面）、mid->link = last（把 mid 的箭頭改指向前一個）。第 1 輪 33 指向 NULL，第 2 輪 72 指向 33，第 3 輪 48 指向 72，第 4 輪 11 指向 48；head 變 NULL 時結束，回傳 mid，結果 11→48→72→33→NULL。">
      <div style={panel}>
        <ListDraw nodes={VALS.map((v, i) => ({ id: v, label: v, x: i, y: 0, hi: v === s.mid }))} edges={edges} ptrs={ptrs} width={400} height={115} />
        <div style={{ ...muted, fontFamily: "var(--mono)" }}>
          head = {s.head ?? "NULL"}　mid = {s.mid ?? "NULL"}　last = {s.last ?? "NULL"}
        </div>
        <div style={formula}>{s.code}</div>
        <p style={caption}>{s.msg}</p>
        <StepBar step={step} total={states.length} setStep={setStep} />
      </div>
    </Interactive>
  );
}
