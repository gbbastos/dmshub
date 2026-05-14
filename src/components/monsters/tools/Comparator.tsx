"use client";
import { useState } from "react";
import { FieldLabel } from "../ui/micro";
import { StatBlock } from "../statblock/StatBlock";

interface Props {
  creatures: any[];
  goHome: () => void;
}

export function Comparator({ creatures: savedList, goHome }: Props) {
  const [leftId,  setLeftId]  = useState<number | null>(null);
  const [rightId, setRightId] = useState<number | null>(null);
  const left  = savedList.find(c => c.id === leftId);
  const right = savedList.find(c => c.id === rightId);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav className="topnav">
        <div className="brand" style={{ cursor: "pointer" }} onClick={goHome}>
          <div className="brand-icon">⚗</div><span className="brand-name">Monster&apos;s Cauldron</span>
        </div>
        <div className="nav-actions"><button className="btn-secondary" onClick={goHome}>← Início</button></div>
      </nav>
      <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
        <div className="fields-grid-2" style={{ marginBottom: 20 }}>
          {([["left", leftId, setLeftId], ["right", rightId, setRightId]] as const).map(([side, val, setter]) => (
            <div key={side}>
              <FieldLabel>Criatura {side === "left" ? "Esquerda" : "Direita"}</FieldLabel>
              <select className="mc-select" value={val || ""} onChange={e => setter(parseInt(e.target.value) || null)}>
                <option value="">-- Selecionar --</option>
                {savedList.map(c => <option key={c.id} value={c.id}>{c.name} (CR {c.cr})</option>)}
              </select>
            </div>
          ))}
        </div>
        {savedList.length < 2 && <div style={{ textAlign: "center", color: "var(--text4)", padding: "40px 0", fontStyle: "italic" }}>Salve pelo menos 2 criaturas para comparar.</div>}
        {savedList.length >= 2 && (
          <div className="compare-grid">
            <div className="compare-col">
              {left ? <StatBlock data={left.creature} extra={left.traits || []} image={left.image} /> : <div className="compare-placeholder">Selecione uma criatura acima</div>}
            </div>
            <div className="compare-col">
              {right ? <StatBlock data={right.creature} extra={right.traits || []} image={right.image} /> : <div className="compare-placeholder">Selecione uma criatura acima</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
