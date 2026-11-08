import { useState } from "react";
import { Interactive } from "zyninote";
import { Cell, Chip, caption, cells, muted, panel, row } from "./ds-ui.tsx";

const N = 6;
const NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Push/pop on a stack vs add/delete on a queue, both backed by an array of 6 slots. */
export default function StackQueuePlay() {
  const [mode, setMode] = useState<"stack" | "queue">("stack");
  const [data, setData] = useState<string[]>([]);
  const [front, setFront] = useState(-1); // queue: one before first item
  const [next, setNext] = useState(0);
  const [msg, setMsg] = useState("按「放入」試試看。");
  const [out, setOut] = useState<string[]>([]);

  const reset = (m = mode) => {
    setMode(m);
    setData([]);
    setFront(-1);
    setNext(0);
    setOut([]);
    setMsg(m === "stack" ? "堆疊：只有頂端一個出入口。" : "佇列：從尾端 rear 進，從頭端 front 出。");
  };

  const top = data.length - 1; // stack top / queue rear
  const add = () => {
    if (top === N - 1) {
      setMsg(mode === "stack"
        ? `top = ${top} = n−1，堆疊已滿（overflow），放不進去。`
        : `rear = ${top} = n−1，判定已滿！${front >= 0 ? `可是前面 ${front + 1} 格明明是空的——這就是一般佇列的缺點。` : ""}`);
      return;
    }
    const x = NAMES[next % 26];
    setData([...data, x]);
    setNext(next + 1);
    setMsg(mode === "stack"
      ? `push ${x}：top 從 ${top} 變 ${top + 1}，${x} 放在 stack[${top + 1}]。`
      : `加入 ${x}：rear 從 ${top} 變 ${top + 1}，${x} 放在 queue[${top + 1}]。`);
  };
  const remove = () => {
    if (mode === "stack") {
      if (top < 0) return setMsg("top = −1，堆疊是空的，沒東西可以 pop。");
      const x = data[top];
      setData(data.slice(0, -1));
      setOut([...out, x]);
      setMsg(`pop：取出頂端的 ${x}，top 從 ${top} 變 ${top - 1}。最後放進去的最先出來（LIFO）。`);
    } else {
      if (front === top) return setMsg(`front = rear = ${front}，佇列是空的。`);
      const x = data[front + 1];
      setFront(front + 1);
      setOut([...out, x]);
      setMsg(`刪除：front 從 ${front} 變 ${front + 1}，取出 ${x}。最早排隊的最先出來（FIFO）。`);
    }
  };

  return (
    <Interactive description="堆疊與佇列操作模擬（陣列大小 6）。堆疊：push 時 top 加 1 再放入，pop 時取出 stack[top] 再把 top 減 1；top = −1 為空、top = n−1 為滿；依序 push A、B、C 再 pop 三次，取出順序是 C、B、A（後進先出）。佇列：加入時 rear 加 1 再放入，刪除時 front 加 1 再取出；front = rear 為空、rear = n−1 為滿；依序加入 A、B、C 再刪除三次，取出順序是 A、B、C（先進先出）。一般陣列佇列刪除後前面空出的格子不能再用，rear 到 n−1 就判定已滿，這是環狀佇列要解決的問題。">
      <div style={panel}>
        <div style={row}>
          <Chip active={mode === "stack"} onClick={() => reset("stack")}>堆疊 Stack</Chip>
          <Chip active={mode === "queue"} onClick={() => reset("queue")}>佇列 Queue</Chip>
          <span style={{ width: 8 }} />
          <Chip onClick={add}>{mode === "stack" ? "push 放入" : "加入（rear 端）"}</Chip>
          <Chip onClick={remove}>{mode === "stack" ? "pop 取出" : "刪除（front 端）"}</Chip>
          <Chip onClick={() => reset()}>清空</Chip>
        </div>

        <div style={{ ...cells, marginTop: "14px" }}>
          {Array.from({ length: N }, (_, i) => {
            const has = i <= top && (mode === "stack" || i > front);
            const tags: string[] = [];
            if (mode === "stack" && i === top) tags.push("top");
            if (mode === "queue" && i === front) tags.push("front");
            if (mode === "queue" && i === top) tags.push("rear");
            return (
              <Cell key={i} on={tags.length > 0 && has} dim={!has}
                sub={<>[{i}]{tags.length ? <><br />{tags.join(" ")}</> : null}</>}>
                {has ? data[i] : mode === "queue" && i <= front ? "×" : ""}
              </Cell>
            );
          })}
        </div>
        <div style={{ ...muted, marginTop: "6px", fontFamily: "var(--mono)" }}>
          {mode === "stack" ? `top = ${top}` : `front = ${front}　rear = ${top}`}
          {"　　"}取出順序：{out.length ? out.join(" → ") : "（還沒有）"}
        </div>
        <p style={caption}>{msg}</p>
      </div>
    </Interactive>
  );
}
