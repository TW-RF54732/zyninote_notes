import { useId, type CSSProperties, type ReactNode } from "react";

/** Shared look for this subject's probability widgets: monochrome, app tokens only. */
export const panel: CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--surface-2)",
  padding: "16px",
  margin: "16px 0",
  color: "var(--text-body)",
  fontSize: "var(--fs-body)",
};

export const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" };

export const muted: CSSProperties = { color: "var(--muted)", fontSize: "var(--fs-sm)" };

export const formula: CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "var(--fs-sm)",
  color: "var(--text)",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 12px",
  margin: "8px 0 0",
  overflowX: "auto",
  whiteSpace: "pre-wrap",
};

/** Tint of the text color, for highlighted regions and cells. */
export const tint = (percent: number) => `color-mix(in srgb, var(--text) ${percent}%, transparent)`;

export function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        font: "inherit",
        fontSize: "var(--fs-sm)",
        cursor: "pointer",
        padding: "4px 12px",
        borderRadius: "var(--radius-pill)",
        border: `1px solid ${active ? "var(--text)" : "var(--line-strong)"}`,
        background: active ? "var(--text)" : "transparent",
        color: active ? "var(--background)" : "var(--text-body)",
      }}
    >
      {children}
    </button>
  );
}

export function Slider({ label, value, onChange, min = 0, max = 1, step = 0.01 }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label style={{ ...row, flexWrap: "nowrap", fontSize: "var(--fs-sm)" }}>
      <span style={{ minWidth: "72px", fontFamily: "var(--mono)" }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, minWidth: 0, accentColor: "var(--text)" }}
      />
      <span style={{ minWidth: "56px", textAlign: "right", fontFamily: "var(--mono)" }}>{fmt(value)}</span>
    </label>
  );
}

/** Round away float noise and trailing zeros: 0.30000000004 → "0.3", 0.27857 → "0.2786". */
export function fmt(x: number, digits = 4): string {
  const s = (Math.round(x * 10 ** digits) / 10 ** digits).toFixed(digits);
  return s.replace(/\.?0+$/, "") || "0";
}

/** SVG ids must be unique per instance and safe inside url(#...). */
export function useSvgId(prefix: string): string {
  return prefix + useId().replace(/[^a-zA-Z0-9_-]/g, "");
}
