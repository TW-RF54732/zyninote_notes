import { useState, type CSSProperties } from "react";
import { Interactive } from "zyninote";
import { Chip, muted, panel, row, tint } from "../_components/prob-ui.tsx";

type Fmt = "A" | "L" | "J";
/** Operand syntax of each instruction. */
type Syntax =
  | "mem"   // Ra, [Rb+Cx]          L
  | "memR"  // Ra, [Rb+Rc]          A
  | "ldi"   // Ra, Cx | Ra, Rb+Cx   L
  | "rr"    // Ra, Rb               A
  | "rrr"   // Ra, Rb, Rc           A
  | "rrc"   // Ra, Rb, Cx (12 bits) A
  | "r"     // Ra                   A
  | "j"     // Cx (24 bits)         J
  | "none"; // RET                  J

type Op = { name: string; op: number; fmt: Fmt; syntax: Syntax; desc: string };

const OPS: Op[] = [
  { name: "LD", op: 0x00, fmt: "L", syntax: "mem", desc: "載入 word：Ra ← [Rb+Cx]" },
  { name: "ST", op: 0x01, fmt: "L", syntax: "mem", desc: "儲存 word：Ra → [Rb+Cx]" },
  { name: "LDB", op: 0x02, fmt: "L", syntax: "mem", desc: "載入 byte：Ra ← (byte)[Rb+Cx]" },
  { name: "STB", op: 0x03, fmt: "L", syntax: "mem", desc: "儲存 byte：Ra → (byte)[Rb+Cx]" },
  { name: "LDR", op: 0x04, fmt: "A", syntax: "memR", desc: "載入 word（暫存器版）：Ra ← [Rb+Rc]" },
  { name: "STR", op: 0x05, fmt: "A", syntax: "memR", desc: "儲存 word（暫存器版）：Ra → [Rb+Rc]" },
  { name: "LBR", op: 0x06, fmt: "A", syntax: "memR", desc: "載入 byte（暫存器版）：Ra ← (byte)[Rb+Rc]" },
  { name: "SBR", op: 0x07, fmt: "A", syntax: "memR", desc: "儲存 byte（暫存器版）：Ra → (byte)[Rb+Rc]" },
  { name: "LDI", op: 0x08, fmt: "L", syntax: "ldi", desc: "立即載入：Ra ← Rb + Cx" },
  { name: "CMP", op: 0x10, fmt: "A", syntax: "rr", desc: "比較：計算 Ra − Rb，只設定 SW 旗標" },
  { name: "MOV", op: 0x12, fmt: "A", syntax: "rr", desc: "移動：Ra ← Rb" },
  { name: "ADD", op: 0x13, fmt: "A", syntax: "rrr", desc: "加法：Ra ← Rb + Rc" },
  { name: "SUB", op: 0x14, fmt: "A", syntax: "rrr", desc: "減法：Ra ← Rb − Rc" },
  { name: "MUL", op: 0x15, fmt: "A", syntax: "rrr", desc: "乘法：Ra ← Rb × Rc" },
  { name: "DIV", op: 0x16, fmt: "A", syntax: "rrr", desc: "除法：Ra ← Rb ÷ Rc" },
  { name: "AND", op: 0x18, fmt: "A", syntax: "rrr", desc: "位元 AND：Ra ← Rb and Rc" },
  { name: "OR", op: 0x19, fmt: "A", syntax: "rrr", desc: "位元 OR：Ra ← Rb or Rc" },
  { name: "XOR", op: 0x1a, fmt: "A", syntax: "rrr", desc: "位元 XOR：Ra ← Rb xor Rc" },
  { name: "ROL", op: 0x1c, fmt: "A", syntax: "rrc", desc: "向左旋轉：Ra ← Rb rol Cx" },
  { name: "ROR", op: 0x1d, fmt: "A", syntax: "rrc", desc: "向右旋轉：Ra ← Rb ror Cx" },
  { name: "SHL", op: 0x1e, fmt: "A", syntax: "rrc", desc: "向左移位：Ra ← Rb << Cx" },
  { name: "SHR", op: 0x1f, fmt: "A", syntax: "rrc", desc: "向右移位：Ra ← Rb >> Cx" },
  { name: "JEQ", op: 0x20, fmt: "J", syntax: "j", desc: "相等（Z=1）就跳：PC ← PC + Cx" },
  { name: "JNE", op: 0x21, fmt: "J", syntax: "j", desc: "不相等（Z=0）就跳：PC ← PC + Cx" },
  { name: "JLT", op: 0x22, fmt: "J", syntax: "j", desc: "小於（N=1）就跳：PC ← PC + Cx" },
  { name: "JGT", op: 0x23, fmt: "J", syntax: "j", desc: "大於（N=0 且 Z=0）就跳：PC ← PC + Cx" },
  { name: "JLE", op: 0x24, fmt: "J", syntax: "j", desc: "小於等於（N=1 或 Z=1）就跳：PC ← PC + Cx" },
  { name: "JGE", op: 0x25, fmt: "J", syntax: "j", desc: "大於等於（N=0）就跳：PC ← PC + Cx" },
  { name: "JMP", op: 0x26, fmt: "J", syntax: "j", desc: "無條件跳躍：PC ← PC + Cx" },
  { name: "SWI", op: 0x2a, fmt: "J", syntax: "j", desc: "軟體中斷：LR ← PC；PC ← Cx" },
  { name: "CALL", op: 0x2b, fmt: "J", syntax: "j", desc: "呼叫副程式：LR ← PC；PC ← PC + Cx" },
  { name: "RET", op: 0x2c, fmt: "J", syntax: "none", desc: "返回：PC ← LR" },
  { name: "PUSH", op: 0x30, fmt: "A", syntax: "r", desc: "推入 word：SP −= 4；[SP] ← Ra" },
  { name: "POP", op: 0x31, fmt: "A", syntax: "r", desc: "彈出 word：Ra ← [SP]；SP += 4" },
  { name: "PUSHB", op: 0x32, fmt: "A", syntax: "r", desc: "推入 byte：SP −= 1；[SP] ← (byte)Ra" },
  { name: "POPB", op: 0x33, fmt: "A", syntax: "r", desc: "彈出 byte：Ra ← (byte)[SP]；SP += 1" },
];

const BY_NAME = new Map(OPS.map((o) => [o.name, o]));
const BY_CODE = new Map(OPS.map((o) => [o.op, o]));
const ALIAS: Record<string, number> = { SW: 12, SP: 13, LR: 14, PC: 15 };
const CX_BITS: Record<Fmt, number> = { A: 12, L: 16, J: 24 };

type Fields = { op: number; ra: number; rb: number; rc: number; cx: number };
type Encoded = { def: Op; f: Fields; word: number; text: string };

const hex = (n: number, w: number) => (n >>> 0).toString(16).toUpperCase().padStart(w, "0").slice(-w);
const bin = (n: number, w: number) => (n >>> 0).toString(2).padStart(w, "0").slice(-w);
const regName = (r: number) => `R${r}`;

function parseReg(s: string): number | null {
  const t = s.trim().toUpperCase();
  if (t in ALIAS) return ALIAS[t];
  const m = /^R(\d{1,2})$/.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  return n <= 15 ? n : null;
}

function parseNum(s: string): number | null {
  const t = s.replace(/\s+/g, "");
  const m = /^([+-]?)(0x[0-9a-f]+|\d+)$/i.exec(t);
  if (!m) return null;
  const v = parseInt(m[2], m[2].toLowerCase().startsWith("0x") ? 16 : 10);
  return m[1] === "-" ? -v : v;
}

function checkCx(v: number, bits: number): string | null {
  const lo = -(2 ** (bits - 1));
  const hi = 2 ** (bits - 1) - 1;
  return v < lo || v > hi ? `Cx = ${v} 超出 ${bits} 位元 2 補數範圍（${lo} ～ ${hi}）` : null;
}

/** "[R2+4]" / "[R2]" / "[R2-8]" → base register + constant. */
function parseMem(s: string): { rb: number; cx: number } | null {
  const m = /^\[\s*([A-Za-z0-9]+)\s*(?:([+-])\s*([0-9a-fA-Fx]+))?\s*\]$/.exec(s.trim());
  if (!m) return null;
  const rb = parseReg(m[1]);
  if (rb === null) return null;
  if (!m[2]) return { rb, cx: 0 };
  const v = parseNum(m[3]);
  if (v === null) return null;
  return { rb, cx: m[2] === "-" ? -v : v };
}

function pack(f: Fields, fmt: Fmt): number {
  const op = f.op << 24;
  if (fmt === "J") return (op | (f.cx & 0xffffff)) >>> 0;
  if (fmt === "L") return (op | (f.ra << 20) | (f.rb << 16) | (f.cx & 0xffff)) >>> 0;
  return (op | (f.ra << 20) | (f.rb << 16) | (f.rc << 12) | (f.cx & 0xfff)) >>> 0;
}

function toText(def: Op, f: Fields): string {
  const { ra, rb, rc, cx } = f;
  switch (def.syntax) {
    case "mem": return `${def.name} ${regName(ra)}, [${regName(rb)}${cx < 0 ? "-" + -cx : "+" + cx}]`;
    case "memR": return `${def.name} ${regName(ra)}, [${regName(rb)}+${regName(rc)}]`;
    case "ldi": return rb === 0 ? `${def.name} ${regName(ra)}, ${cx}` : `${def.name} ${regName(ra)}, ${regName(rb)}${cx < 0 ? cx : "+" + cx}`;
    case "rr": return `${def.name} ${regName(ra)}, ${regName(rb)}`;
    case "rrr": return `${def.name} ${regName(ra)}, ${regName(rb)}, ${regName(rc)}`;
    case "rrc": return `${def.name} ${regName(ra)}, ${regName(rb)}, ${cx}`;
    case "r": return `${def.name} ${regName(ra)}`;
    case "j": return `${def.name} ${cx}`;
    case "none": return def.name;
  }
}

function encode(line: string): Encoded | string {
  const src = line.replace(/;.*$/, "").trim();
  if (!src) return "請輸入一行 CPU0 指令，例如 ADD R1, R2, R3。";
  const m = /^([A-Za-z]+)\s*(.*)$/.exec(src)!;
  const def = BY_NAME.get(m[1].toUpperCase());
  if (!def) return `找不到指令「${m[1]}」。可用：${OPS.map((o) => o.name).join("、")}。`;
  const rest = m[2].trim();
  // Split on commas that are not inside [...].
  const args = rest ? rest.split(/,(?![^[]*\])/).map((a) => a.trim()) : [];
  const f: Fields = { op: def.op, ra: 0, rb: 0, rc: 0, cx: 0 };
  const need = (n: number, form: string) => (args.length === n ? null : `${def.name} 的寫法是「${form}」。`);
  const reg = (s: string, label: string): number | string => {
    const r = parseReg(s);
    return r === null ? `「${s}」不是暫存器（R0～R15，或 SW、SP、LR、PC）；${label}` : r;
  };
  let err: string | null = null;

  switch (def.syntax) {
    case "mem": {
      if ((err = need(2, `${def.name} Ra, [Rb+Cx]`))) return err;
      const a = reg(args[0], "Ra 必須是暫存器。");
      if (typeof a === "string") return a;
      const mm = parseMem(args[1]);
      if (!mm) return `第二個參數要寫成 [Rb+Cx]、[Rb-Cx] 或 [Rb]，例如 [R2+4]。標記（變數名稱）要由組譯器換成位址，這裡請直接寫數字。`;
      Object.assign(f, { ra: a, rb: mm.rb, cx: mm.cx });
      break;
    }
    case "memR": {
      if ((err = need(2, `${def.name} Ra, [Rb+Rc]`))) return err;
      const a = reg(args[0], "Ra 必須是暫存器。");
      if (typeof a === "string") return a;
      const mm = /^\[\s*([A-Za-z0-9]+)\s*\+\s*([A-Za-z0-9]+)\s*\]$/.exec(args[1]);
      const b = mm ? parseReg(mm[1]) : null;
      const c = mm ? parseReg(mm[2]) : null;
      if (b === null || c === null) return `${def.name} 的位址必須是兩個暫存器相加，例如 [R2+R3]；CPU0 不能寫 [R2+R3*4]。`;
      Object.assign(f, { ra: a, rb: b, rc: c });
      break;
    }
    case "ldi": {
      if ((err = need(2, `${def.name} Ra, Cx 或 ${def.name} Ra, Rb+Cx`))) return err;
      const a = reg(args[0], "Ra 必須是暫存器。");
      if (typeof a === "string") return a;
      const n = parseNum(args[1]);
      if (n !== null) Object.assign(f, { ra: a, rb: 0, cx: n });
      else {
        const mm = /^([A-Za-z0-9]+)\s*([+-])\s*([0-9a-fA-Fx]+)$/.exec(args[1]);
        const b = mm ? parseReg(mm[1]) : null;
        const v = mm ? parseNum(mm[3]) : null;
        if (b === null || v === null) return `第二個參數要是常數（如 10、0x1F、-3）或 Rb+Cx（如 R1+50）。`;
        Object.assign(f, { ra: a, rb: b, cx: mm![2] === "-" ? -v : v });
      }
      break;
    }
    case "rr": case "rrr": case "rrc": case "r": {
      const n = { rr: 2, rrr: 3, rrc: 3, r: 1 }[def.syntax];
      const form = { rr: "Ra, Rb", rrr: "Ra, Rb, Rc", rrc: "Ra, Rb, Cx", r: "Ra" }[def.syntax];
      if ((err = need(n, `${def.name} ${form}`))) return err;
      const regs: number[] = [];
      for (let i = 0; i < (def.syntax === "rrc" ? 2 : n); i++) {
        const r = reg(args[i], `${def.name} 的第 ${i + 1} 個參數必須是暫存器。`);
        if (typeof r === "string") return r;
        regs.push(r);
      }
      f.ra = regs[0];
      f.rb = regs[1] ?? 0;
      if (def.syntax === "rrr") f.rc = regs[2];
      if (def.syntax === "rrc") {
        const v = parseNum(args[2]);
        if (v === null) return `${def.name} 的第三個參數是移動的位數（常數），例如 ${def.name} R1, R2, 4。`;
        f.cx = v;
      }
      break;
    }
    case "j": {
      if ((err = need(1, `${def.name} Cx`))) return err;
      const v = parseNum(args[0]);
      if (v === null) return `${def.name} 的參數請寫成位移常數，例如 ${def.name} 100 或 ${def.name} -0x18（標籤要由組譯器算成「目標 − PC」）。`;
      f.cx = v;
      break;
    }
    case "none":
      if (args.length) return `${def.name} 沒有參數。`;
  }
  if ((err = checkCx(f.cx, CX_BITS[def.fmt]))) return err;
  return { def, f, word: pack(f, def.fmt), text: toText(def, f) };
}

function signExtend(v: number, bits: number): number {
  const sign = 1 << (bits - 1);
  return (v & (sign - 1)) - (v & sign);
}

function decode(input: string): Encoded | string {
  const t = input.replace(/^0x/i, "").replace(/[\s_]/g, "");
  if (!/^[0-9a-fA-F]{1,8}$/.test(t)) return "請輸入 1～8 位十六進位數字，例如 13123000 或 001F000C。";
  const word = parseInt(t.padStart(8, "0"), 16) >>> 0;
  const op = word >>> 24;
  const def = BY_CODE.get(op);
  if (!def) return `運算碼 ${hex(op, 2)} 不在 CPU0 的指令編碼表中。`;
  const bits = CX_BITS[def.fmt];
  const f: Fields = {
    op,
    ra: def.fmt === "J" ? 0 : (word >>> 20) & 0xf,
    rb: def.fmt === "J" ? 0 : (word >>> 16) & 0xf,
    rc: def.fmt === "A" ? (word >>> 12) & 0xf : 0,
    cx: signExtend(word & (2 ** bits - 1), bits),
  };
  return { def, f, word, text: toText(def, f) };
}

/** Which fields an instruction actually uses (others are encoded as 0 / ignored). */
function used(def: Op): Set<string> {
  switch (def.syntax) {
    case "mem": case "ldi": return new Set(["OP", "Ra", "Rb", "Cx"]);
    case "memR": case "rrr": return new Set(["OP", "Ra", "Rb", "Rc"]);
    case "rr": return new Set(["OP", "Ra", "Rb"]);
    case "rrc": return new Set(["OP", "Ra", "Rb", "Cx"]);
    case "r": return new Set(["OP", "Ra"]);
    case "j": return new Set(["OP", "Cx"]);
    case "none": return new Set(["OP"]);
  }
}

type Seg = { name: string; hi: number; lo: number; value: number };

function segments(e: Encoded): Seg[] {
  const { f, def } = e;
  const bits = CX_BITS[def.fmt];
  const cxRaw = f.cx & (2 ** bits - 1);
  const segs: Seg[] = [{ name: "OP", hi: 31, lo: 24, value: f.op }];
  if (def.fmt !== "J") segs.push({ name: "Ra", hi: 23, lo: 20, value: f.ra }, { name: "Rb", hi: 19, lo: 16, value: f.rb });
  if (def.fmt === "A") segs.push({ name: "Rc", hi: 15, lo: 12, value: f.rc });
  segs.push({ name: "Cx", hi: bits - 1, lo: 0, value: cxRaw });
  return segs;
}

const mono: CSSProperties = { fontFamily: "var(--mono)" };
const input: CSSProperties = {
  font: "inherit", ...mono, flex: "1 1 14em", minWidth: 0, padding: "4px 8px",
  border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)", background: "transparent", color: "inherit",
};

const ENC_EXAMPLES = ["ADD R1, R2, R3", "LD R1, [R2+4]", "LDI R3, 10", "SHL R5, R1, 2", "LDR R6, [R5+R3]", "JMP 100", "PUSH LR"];
const DEC_EXAMPLES = ["001F000C", "002F003C", "21FFFFE8", "13115000", "2C000000"];

function Breakdown({ e, srcUsed }: { e: Encoded; srcUsed: Set<string> }) {
  const segs = segments(e);
  return (
    <>
      <div style={{ display: "flex", marginTop: "12px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        {segs.map((s, i) => {
          const w = s.hi - s.lo + 1;
          const on = srcUsed.has(s.name);
          return (
            <div key={s.name} style={{ flex: `${w} 1 0`, minWidth: 0, padding: "6px 4px", textAlign: "center", borderLeft: i ? "1px solid var(--line-strong)" : undefined, background: on ? tint(10) : undefined, color: on ? "var(--text)" : "var(--muted)" }}>
              <div style={{ fontSize: "var(--fs-sm)" }}>{s.name}</div>
              <div style={{ ...mono, fontWeight: 600 }}>{hex(s.value, Math.ceil(w / 4))}</div>
              <div style={{ ...mono, fontSize: "11px", color: "var(--muted)" }}>{s.hi}–{s.lo}</div>
            </div>
          );
        })}
      </div>
      <div style={{ ...mono, fontSize: "var(--fs-sm)", marginTop: "6px", overflowX: "auto", whiteSpace: "nowrap", color: "var(--muted)" }}>
        {segs.map((s) => bin(s.value, s.hi - s.lo + 1).replace(/(.{4})(?=.)/g, "$1 ")).join(" │ ")}
      </div>
    </>
  );
}

/** CPU0 assembler / disassembler for one instruction: field layout of A / L / J formats. */
export default function Cpu0Codec({ initial = "ADD R1, R2, R3" }: { initial?: string }) {
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [asm, setAsm] = useState(initial);
  const [code, setCode] = useState("001F000C");
  const [addr, setAddr] = useState("0000");

  const r = mode === "enc" ? encode(asm) : decode(code);
  const e = typeof r === "string" ? null : r;
  const pc = parseInt(addr.replace(/^0x/i, ""), 16);
  const showTarget = e && e.def.syntax === "j" && e.def.name !== "SWI" && Number.isFinite(pc);

  const description =
    "CPU0 指令編碼／解碼器。CPU0 指令固定 32 位元，31–24 位元是運算碼 OP。" +
    "A 型：OP、Ra（23–20）、Rb（19–16）、Rc（15–12）、Cx（11–0，12 位元）；" +
    "L 型：OP、Ra、Rb、Cx（15–0，16 位元）；J 型：OP、Cx（23–0，24 位元）。Cx 都是 2 補數。" +
    "暫存器欄位 4 位元，剛好一個十六進位數字。" +
    "例：ADD R1, R2, R3 → 13 1 2 3 000 = 13123000；LD R1, [R2+4] → 00 1 2 0004 = 00120004；" +
    "LDI R3, 10 → 0830000A；SHL R5, R1, 2 → 1E510002；JMP 100 → 26000064；RET → 2C000000。" +
    "解碼：001F000C = LD R1, [R15+12]（相對於 PC 定址）；21FFFFE8 = JNE −24，位於 0x28 時目標 = 0x2C − 0x18 = 0x14。" +
    "跳躍目標 = 指令位址 + 4 + Cx。LDR、STR、LBR、SBR 有三個暫存器，編成 A 型。";

  return (
    <Interactive description={description}>
      <div style={panel}>
        <div style={row}>
          <Chip active={mode === "enc"} onClick={() => setMode("enc")}>組合語言 → 機器碼</Chip>
          <Chip active={mode === "dec"} onClick={() => setMode("dec")}>機器碼 → 組合語言</Chip>
        </div>

        <div style={{ ...row, marginTop: "12px" }}>
          {mode === "enc" ? (
            <input aria-label="CPU0 組合語言指令" value={asm} onChange={(ev) => setAsm(ev.target.value)} spellCheck={false} style={input} />
          ) : (
            <input aria-label="32 位元機器碼（十六進位）" value={code} onChange={(ev) => setCode(ev.target.value)} spellCheck={false} style={input} />
          )}
          <label style={{ ...row, flexWrap: "nowrap", fontSize: "var(--fs-sm)" }}>
            指令位址 0x
            <input aria-label="指令位址（十六進位）" value={addr} onChange={(ev) => setAddr(ev.target.value)} spellCheck={false} style={{ ...input, flex: "0 0 6em" }} />
          </label>
        </div>
        <div style={{ ...row, marginTop: "8px" }}>
          <span style={muted}>範例：</span>
          {(mode === "enc" ? ENC_EXAMPLES : DEC_EXAMPLES).map((x) => (
            <Chip key={x} onClick={() => (mode === "enc" ? setAsm(x) : setCode(x))}>{x}</Chip>
          ))}
        </div>

        {!e && <p style={{ ...muted, marginTop: "12px" }}>{r as string}</p>}
        {e && (
          <>
            <Breakdown e={e} srcUsed={used(e.def)} />
            <table style={{ borderCollapse: "collapse", marginTop: "12px", fontSize: "var(--fs-sm)" }}>
              <tbody>
                {[
                  ["指令", <span style={mono}>{e.text}</span>],
                  ["機器碼", <span style={{ ...mono, fontWeight: 600 }}>{hex(e.word, 8)}</span>],
                  ["格式", `${e.def.fmt} 型，OP = ${hex(e.def.op, 2)}，Cx ${CX_BITS[e.def.fmt]} 位元`],
                  ["意義", e.def.desc],
                  ...(e.def.syntax === "mem" && e.f.rb === 15
                    ? [["定址", `相對於 PC：位址 = PC + ${e.f.cx}，PC 是下一條指令位址（指令位址 + 4）${Number.isFinite(pc) ? `，即 0x${hex(pc + 4 + e.f.cx, 4)}` : ""}`]]
                    : []),
                  ...(e.def.syntax === "mem" && e.f.rb === 0 ? [["定址", `Rb = R0（恆為 0），Cx 就是絕對位址 0x${hex(e.f.cx, 4)}`]] : []),
                  ...(showTarget
                    ? [["跳躍目標", `PC + Cx = (0x${hex(pc, 4)} + 4) + (${e.f.cx}) = 0x${hex(pc + 4 + e.f.cx, 4)}`]]
                    : []),
                ].map(([k, v], i) => (
                  <tr key={i}>
                    <td style={{ padding: "3px 12px 3px 0", color: "var(--muted)", whiteSpace: "nowrap", verticalAlign: "top" }}>{k}</td>
                    <td style={{ padding: "3px 0" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ ...muted, margin: "8px 0 0" }}>灰色欄位是這個指令用不到的部分，編碼時填 0。</p>
          </>
        )}
      </div>
    </Interactive>
  );
}
