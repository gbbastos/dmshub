"use client";
import { splitDiceText, parseDiceExpr } from "@/lib/monsters/dice";

interface Props {
  text: string;
  onRoll: (expr: string, content: string) => void;
}

export function RollableText({ text, onRoll }: Props) {
  const segs = splitDiceText(text ?? "");
  return (
    <>
      {segs.map((s, i) =>
        s.type === "dice"
          ? <span key={i} className="dice-expr" onClick={e => { e.stopPropagation(); onRoll(s.expr!, s.content); }} title={`Rolar ${s.expr}`}>{s.content}</span>
          : <span key={i}>{s.content}</span>
      )}
    </>
  );
}
