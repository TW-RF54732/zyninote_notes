import { Fragment, useState } from "react";
import { Interactive } from "zyninote";
import { Chip, Slider, caption, formula, muted, panel, row, tint } from "./_ds-ui.tsx";

const FUNCS: { name: string; f: (n: number) => number }[] = [
  { name: "log n", f: (n) => Math.log2(n) },
  { name: "n", f: (n) => n },
  { name: "n log n", f: (n) => n * Math.log2(n) },
  { name: "n²", f: (n) => n * n },
  { name: "n³", f: (n) => n ** 3 },
  { name: "2ⁿ", f: (n) => 2 ** n },
];

function human(steps: number): string {
  const s = steps / 1e6; // 1 step = 1 microsecond
  if (s < 1e-3) return `${(s * 1e6).toFixed(0)} 微秒`;
  if (s < 1) return `${(s * 1e3).toFixed(1)} 毫秒`;
  if (s < 60) return `${s.toFixed(1)} 秒`;
  if (s < 3600) return `${(s / 60).toFixed(1)} 分鐘`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} 小時`;
  if (s < 86400 * 365) return `${(s / 86400).toFixed(1)} 天`;
  const y = s / (86400 * 365);
  return y < 1e6 ? `${y.toFixed(0)} 年` : `${y.toExponential(1)} 年`;
}
const num = (v: number) => (v < 1e7 ? (Number.isInteger(v) ? v.toString() : v.toFixed(1)) : v.toExponential(2));

/** Compare growth rates: drag n and see how many steps (and how long at 1 µs/step) each complexity needs. */
export function GrowthRace() {
  const [n, setN] = useState(20);
  const vals = FUNCS.map((g) => g.f(n));
  const maxLog = Math.log10(Math.max(...FUNCS.map((g) => g.f(64)))) + 0.5;

  return (
    <Interactive description="時間複雜度成長速率比較：把 n 拉大，看各種 T(n) 要執行幾步，假設電腦每步 1 微秒。n = 10 時 log n ≈ 3.3、n = 10、n log n ≈ 33、n² = 100、n³ = 1000、2ⁿ = 1024，差不多；n = 20 時 2ⁿ ≈ 100 萬步約 1 秒；n = 40 時 2ⁿ ≈ 1.1 兆步約 12.7 天；n = 64 時 2ⁿ 約 58 萬年，而 n³ 只要約 0.26 秒。n 夠大時 log n < n < n log n < n² < n³ < 2ⁿ，指數成長很快就算不完。長條以對數刻度畫，每一格代表多 10 倍。">
      <div style={panel}>
        <Slider label={`n = ${n}`} value={n} onChange={(v) => setN(Math.round(v))} min={2} max={64} step={1} />
        <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "64px 1fr auto", gap: "6px 10px", alignItems: "center", fontSize: "var(--fs-sm)" }}>
          {FUNCS.map((g, k) => {
            const v = vals[k];
            const w = Math.max(1, (Math.log10(Math.max(v, 1)) / maxLog) * 100);
            return (
              <Fragment key={g.name}>
                <span style={{ fontFamily: "var(--mono)" }}>{g.name}</span>
                <div key={g.name + "b"} style={{ height: "16px", background: "var(--surface)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${w}%`, height: "100%", background: tint(30 + k * 10), borderRight: "2px solid var(--text)" }} />
                </div>
                <span key={g.name + "v"} style={{ fontFamily: "var(--mono)", textAlign: "right", whiteSpace: "nowrap" }}>
                  {num(v)} 步 · {human(v)}
                </span>
              </Fragment>
            );
          })}
        </div>
        <div style={{ ...muted, marginTop: "6px" }}>長條是對數刻度：每多一段代表多 10 倍。時間假設每步 1 微秒（百萬分之一秒）。log 以 2 為底。</div>
        <p style={caption}>
          {n <= 12 ? "n 很小時大家差不多，看不出差別。把 n 往右拉。" :
            n <= 30 ? "2ⁿ 開始失控了，其他幾種都還在一瞬間內。" :
            "2ⁿ 已經要算好幾天甚至好幾萬年，就算電腦快 1000 倍也沒用；n³ 卻還不到一秒。這就是為什麼要看「成長速率」而不是看電腦快不快。"}
        </p>
      </div>
    </Interactive>
  );
}

/** Toggle 4 bits and read the same pattern as unsigned, sign-magnitude, 1's and 2's complement. */
export function IntBits() {
  const [bits, setBits] = useState([1, 0, 1, 1]);
  const u = bits.reduce((a, b) => a * 2 + b, 0);
  const sign = bits[0];
  const mag = bits.slice(1).reduce((a, b) => a * 2 + b, 0);
  const sm = sign ? -mag : mag;
  const ones = sign ? -(15 - u) : u;
  const twos = sign ? u - 16 : u;
  const flip = bits.map((b) => 1 - b).join("");

  const rowsOut: [string, string, string][] = [
    ["無正負號", `${u}`, `8×${bits[0]} + 4×${bits[1]} + 2×${bits[2]} + 1×${bits[3]} = ${u}`],
    ["符號帶大小", `${sm === 0 && sign ? "−0" : sm}`, sign ? `最高位 1 → 負；後 3 位 ${bits.slice(1).join("")} = ${mag} → −${mag}` : `最高位 0 → 正；後 3 位 = ${mag}`],
    ["1 的補數", `${ones === 0 && sign ? "−0" : ones}`, sign ? `最高位 1 → 負；全部反轉得 ${flip} = ${15 - u} → −${15 - u}` : `最高位 0 → 正，直接讀 = ${u}`],
    ["2 的補數", `${twos}`, sign ? `最高位 1 → 負；反轉再 +1 得 ${((16 - u) & 15).toString(2).padStart(4, "0")} = ${16 - u} → −${16 - u}` : `最高位 0 → 正，直接讀 = ${u}`],
  ];

  return (
    <Interactive description="同一串 4 位元的四種解讀。最高位元在有號表示法中是符號：0 正、1 負。正數四種讀法都一樣。負數：符號帶大小把後 3 位當絕對值（1011 = −3）；1 的補數把全部位元反轉得到絕對值（1011 反轉 0100 = 4，所以是 −4）；2 的補數反轉再加 1（1011 → 0100 + 1 = 0101 = 5，所以是 −5）；無正負號直接讀成 11。0000 和 1000（符號帶大小）、0000 和 1111（1 的補數）都代表 0，有兩個零；2 的補數只有一個零，範圍 −8 到 7，比其他多一個負數。">
      <div style={panel}>
        <div style={row}>
          <span style={muted}>點位元切換 0 / 1：</span>
          {bits.map((b, k) => (
            <button key={k} type="button" onClick={() => setBits(bits.map((x, t) => (t === k ? 1 - x : x)))}
              style={{
                font: "inherit", fontFamily: "var(--mono)", fontSize: "22px", width: "44px", height: "48px", cursor: "pointer",
                borderRadius: "var(--radius-sm)", border: `1px solid ${k === 0 ? "var(--text)" : "var(--line-strong)"}`,
                background: b ? "var(--text)" : "var(--surface)", color: b ? "var(--background)" : "var(--text)",
              }}>{b}</button>
          ))}
          <span style={muted}>← 最左邊是符號位元</span>
        </div>
        <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "auto auto 1fr", gap: "6px 14px", fontSize: "var(--fs-sm)", alignItems: "baseline" }}>
          {rowsOut.map(([name, v, how]) => (
            <Fragment key={name}>
              <span>{name}</span>
              <b key={name + "v"} style={{ fontFamily: "var(--mono)", fontSize: "18px", textAlign: "right" }}>{v}</b>
              <span key={name + "h"} style={muted}>{how}</span>
            </Fragment>
          ))}
        </div>
        <p style={caption}>試試 <code>1000</code>、<code>1111</code>、<code>0000</code>：看哪幾種表示法會出現「−0」，以及 2 的補數為什麼能多表示一個 −8。</p>
      </div>
    </Interactive>
  );
}

const FLOATS = [-23.75, 5.5, 0.375, -59.5];

function toBin(x: number) {
  let ip = Math.floor(x);
  let fp = x - ip;
  const intBits = ip.toString(2);
  let frac = "";
  while (fp > 0 && frac.length < 12) { fp *= 2; frac += fp >= 1 ? "1" : "0"; if (fp >= 1) fp -= 1; }
  ip = 0;
  return { intBits, frac };
}

/** Break a real number into sign / exponent / mantissa (textbook bias 128). */
export function FloatSteps() {
  const [x, setX] = useState(-23.75);
  const a = Math.abs(x);
  const { intBits, frac } = toBin(a);
  const all = intBits + frac;
  const first = all.indexOf("1");
  const e = intBits === "0" ? -(first - intBits.length + 1) : intBits.length - 1;
  const mant = all.slice(first + 1).replace(/0+$/, "");
  const sci = `1.${mant || "0"} × 2^${e}`;
  const expBits = (e + 128).toString(2).padStart(8, "0");
  const m23 = (mant + "0".repeat(23)).slice(0, 23);

  return (
    <Interactive description="實數轉 32 位元短浮點的四步（照課本指數加 128）。以 −23.75 為例：先轉二進位 23.75 = 10111.11；再移動小數點寫成 1.011111 × 2^4；符號負 → 1；指數 4 + 128 = 132 = 10000100；假數只存小數點後面 0111110…（補滿 23 位），開頭的 1 省略。結果 1 10000100 01111100000000000000000。其他例：5.5 = 101.1 = 1.011 × 2^2，指數 130；0.375 = 0.011 = 1.1 × 2^−2，指數 126。">
      <div style={panel}>
        <div style={row}>
          {FLOATS.map((v) => <Chip key={v} active={v === x} onClick={() => setX(v)}>{v}</Chip>)}
        </div>
        <ol style={{ margin: "12px 0 0", paddingLeft: "22px", lineHeight: 1.9, fontSize: "var(--fs-sm)" }}>
          <li>轉二進位：{a} = <code>{intBits}{frac ? "." + frac : ""}</code>₂</li>
          <li>移小數點，讓最前面剛好是「1.」：<code>{sci}</code>（小數點往{e >= 0 ? "左" : "右"}移 {Math.abs(e)} 位，指數就是 {e}）</li>
          <li>符號：{x < 0 ? "負" : "正"} → <b>{x < 0 ? 1 : 0}</b></li>
          <li>指數：{e} + 128 = {e + 128} → <b>{expBits}</b>（加 128 是為了讓負指數也能用正數存）</li>
          <li>假數：只存「1.」後面的 <b>{mant || "0"}</b>，後面補 0 到 23 位（開頭的 1 每個數都有，省略不存）</li>
        </ol>
        <div style={{ ...formula, fontSize: "15px" }}>
          <span style={{ background: tint(30) }}>{x < 0 ? 1 : 0}</span>{" "}
          <span style={{ background: tint(18) }}>{expBits}</span>{" "}
          <span>{m23}</span>
          {"\n"}符號(1)  指數(8)    假數(23)
        </div>
      </div>
    </Interactive>
  );
}
