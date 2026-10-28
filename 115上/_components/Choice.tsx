import { useState } from "react";
import { Interactive } from "zyninote";
import { muted, panel, tint } from "./prob-ui.tsx";

type Props = {
  /** Option texts without the letter, in the order shown. */
  options: string[];
  /** Letter of the correct option, e.g. "B". */
  answer: string;
};

const LETTERS = "ABCDEFGH";

/** Multiple-choice question: click an option to check it. Nothing is saved; reloading clears the choice. */
export default function Choice({ options, answer }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = LETTERS.indexOf(answer);
  const done = picked !== null;

  return (
    <Interactive
      description={`選擇題選項：${options.map((o, i) => `${LETTERS[i]}. ${o}`).join("；")}。正確答案：${answer}. ${options[correct]}。`}
    >
      <div style={{ ...panel, display: "grid", gap: "8px" }}>
        {options.map((o, i) => {
          const isAnswer = done && i === correct;
          const isWrong = done && i === picked && i !== correct;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setPicked(i)}
              style={{
                font: "inherit",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${isAnswer ? "var(--text)" : "var(--line-strong)"}`,
                background: isAnswer ? tint(16) : "transparent",
                color: isWrong ? "var(--muted)" : "var(--text-body)",
                textDecoration: isWrong ? "line-through" : undefined,
              }}
            >
              <span style={{ fontFamily: "var(--mono)" }}>{LETTERS[i]}.</span>
              <span style={{ flex: 1 }}>{o}</span>
              {isAnswer && <span aria-label="正確">✓</span>}
              {isWrong && <span aria-label="錯誤">✗</span>}
            </button>
          );
        })}
        {done && (
          <div style={muted}>
            {picked === correct ? "答對了。" : `正確答案是 ${answer}。`}
            <button
              type="button"
              onClick={() => setPicked(null)}
              style={{ font: "inherit", marginLeft: "8px", cursor: "pointer", background: "none", border: "none", color: "inherit", textDecoration: "underline", padding: 0 }}
            >
              重選
            </button>
          </div>
        )}
      </div>
    </Interactive>
  );
}
