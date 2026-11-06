import { useState } from "react";
import { Interactive } from "zyninote";
import { Chip, caption, formula, muted, panel, row, tint } from "./_ds-ui.tsx";

const NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Circular queue on an array of n slots drawn as a ring; shows why only n−1 slots are usable. */
export default function CircularQueue() {
  const [n, setN] = useState(4);
  const [q, setQ] = useState<(string | null)[]>(Array(4).fill(null));
  const [f, setF] = useState(3);
  const [r, setR] = useState(3);
  const [k, setK] = useState(0);
  const [msg, setMsg] = useState("初值 front = rear = n−1。按「加入」開始。");
  const [calc, setCalc] = useState("");

  const reset = (m = n) => {
    setN(m);
    setQ(Array(m).fill(null));
    setF(m - 1);
    setR(m - 1);
    setK(0);
    setMsg("初值 front = rear = n−1。按「加入」開始。");
    setCalc("");
  };

  const add = () => {
    const nr = (r + 1) % n;
    if (nr === f) {
      setCalc(`(rear + 1) % n = (${r} + 1) % ${n} = ${nr} = front`);
      setMsg(`已滿！雖然還有 1 格空著（q${f}），但 front 指的那格要永遠空著，不然放滿後 front = rear，會跟「空」分不出來。所以最多只能放 n−1 = ${n - 1} 個。`);
      return;
    }
    const x = NAMES[k % 26];
    const nq = q.slice();
    nq[nr] = x;
    setQ(nq);
    setR(nr);
    setK(k + 1);
    setCalc(`rear = (rear + 1) % n = (${r} + 1) % ${n} = ${nr}`);
    setMsg(r === n - 1 && nr === 0 ? `加入 ${x}：rear 從最後一格「繞回」q0，這就是環狀的意思。` : `加入 ${x} 到 q${nr}。`);
  };
  const del = () => {
    if (f === r) {
      setCalc(`front = rear = ${f}`);
      setMsg("佇列是空的，沒東西可刪。");
      return;
    }
    const nf = (f + 1) % n;
    const x = q[nf];
    const nq = q.slice();
    nq[nf] = null;
    setQ(nq);
    setF(nf);
    setCalc(`front = (front + 1) % n = (${f} + 1) % ${n} = ${nf}`);
    setMsg(`刪除，取出 q${nf} 的 ${x}。空出來的格子之後可以再用，不用搬資料。`);
  };

  const size = 220;
  const cx = size / 2;
  const R = 78;
  const count = (r - f + n) % n;

  return (
    <Interactive description="環狀佇列模擬：把陣列 queue[n] 頭尾相接成環。初值 front = rear = n−1。加入時 rear = (rear+1) % n，刪除時 front = (front+1) % n；front = rear 表示空，(rear+1) % n = front 表示滿。front 指向的格子永遠空著，所以 n 格最多只能放 n−1 個資料，否則放滿時 front = rear 會和空無法區分。例：n = 4，加入 A、B、C 後 front = 3、rear = 2，再加入 D 時 (2+1)%4 = 3 = front 判定已滿；刪除 A 後 front = 0，D 可以放進 q3，rear 從 q3 再加會繞回 q0。">
      <div style={panel}>
        <div style={row}>
          {[4, 6, 8].map((m) => (
            <Chip key={m} active={m === n} onClick={() => reset(m)}>n = {m}</Chip>
          ))}
          <span style={{ width: 8 }} />
          <Chip onClick={add}>加入</Chip>
          <Chip onClick={del}>刪除</Chip>
          <Chip onClick={() => reset()}>重來</Chip>
        </div>
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="環狀佇列" style={{ width: "100%", maxWidth: "280px", display: "block", margin: "8px auto", color: "var(--text)" }}>
          <circle cx={cx} cy={cx} r={R} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={30} />
          {q.map((v, i) => {
            const a = (i / n) * 2 * Math.PI - Math.PI / 2;
            const x = cx + R * Math.cos(a);
            const y = cx + R * Math.sin(a);
            const lx = cx + (R + 32) * Math.cos(a);
            const ly = cx + (R + 32) * Math.sin(a);
            const tags = [i === f ? "f" : "", i === r ? "r" : ""].filter(Boolean).join(",");
            return (
              <g key={i}>
                <rect x={x - 17} y={y - 15} width={34} height={30} rx={6}
                  fill={i === f ? tint(10) : v ? tint(28) : "var(--surface)"} stroke="currentColor"
                  strokeOpacity={0.7} strokeDasharray={i === f ? "4 3" : undefined} />
                <text x={x} y={y + 5} textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="currentColor" fontWeight={700}>{v ?? ""}</text>
                <text x={x} y={y - 19} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity={0.6}>q{i}</text>
                {tags && <text x={lx} y={ly + 4} textAnchor="middle" fontSize="12" fontFamily="var(--mono)" fill="currentColor">{tags}</text>}
              </g>
            );
          })}
          <text x={cx} y={cx - 4} textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity={0.7}>{count} / {n - 1} 個</text>
          <text x={cx} y={cx + 12} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity={0.5}>順時針前進</text>
        </svg>
        <div style={{ ...muted, fontFamily: "var(--mono)", textAlign: "center" }}>front = {f}　rear = {r}　（虛線格 = front，永遠留空）</div>
        {calc && <div style={formula}>{calc}</div>}
        <p style={caption}>{msg}</p>
      </div>
    </Interactive>
  );
}
