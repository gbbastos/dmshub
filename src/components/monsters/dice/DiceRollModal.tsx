"use client";

interface RollResult {
  rolls: number[];
  sum: number;
  modifier: number;
  total: number;
  expr: string;
  count: number;
  sides: number;
}

interface Props {
  result: RollResult | null;
  abilityName?: string;
  abilityDesc?: string;
  onReroll: (expr: string) => void;
  onClose: () => void;
}

export function DiceRollModal({ result, abilityName, abilityDesc, onReroll, onClose }: Props) {
  if (!result) return null;
  const { rolls, modifier, total, expr, count, sides } = result;
  const breakdown = modifier !== 0
    ? `${rolls.join(" + ")} ${modifier >= 0 ? "+ " : "− "}${Math.abs(modifier)} = ${total}`
    : `${rolls.join(" + ")} = ${total}`;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="roll-modal">
        <div className="roll-modal-header">
          <div>
            <div className="roll-modal-ability">{abilityName}</div>
            {abilityDesc && (
              <div style={{ fontSize: ".75rem", color: "#9a7030", marginTop: 3, lineHeight: 1.4, maxWidth: 320 }}>
                {abilityDesc.slice(0, 120)}{abilityDesc.length > 120 ? "…" : ""}
              </div>
            )}
          </div>
          <button className="btn-icon" style={{ background: "rgba(255,255,255,.08)", border: "1px solid #5a3a10", color: "#9a7030", flexShrink: 0 }} onClick={onClose}>✕</button>
        </div>
        <div className="roll-modal-body">
          <div className="roll-dice-row">
            {rolls.map((r, i) => (
              <div key={i} className={`roll-die-chip${r === sides ? " roll-max" : r === 1 ? " roll-min" : ""}`}>
                <span className={`roll-die-val${r === sides ? " roll-max" : r === 1 ? " roll-min" : ""}`}>{r}</span>
                <span className="roll-die-label">d{sides}</span>
              </div>
            ))}
            {modifier !== 0 && (
              <div className="roll-die-chip">
                <span className="roll-die-val" style={{ color: modifier > 0 ? "#88dd88" : "#ff8888" }}>{modifier > 0 ? `+${modifier}` : modifier}</span>
                <span className="roll-die-label">bônus</span>
              </div>
            )}
          </div>
          <div className="roll-total-row">
            <div className="roll-total-expr">{expr}</div>
            {count > 1 && <div className="roll-total-breakdown">{breakdown}</div>}
            <div className="roll-total-val">{total}</div>
            <div className="roll-total-label">RESULTADO</div>
          </div>
          <button className="roll-reroll-btn" onClick={() => onReroll(expr)}>🎲 Rolar Novamente</button>
        </div>
      </div>
    </div>
  );
}
