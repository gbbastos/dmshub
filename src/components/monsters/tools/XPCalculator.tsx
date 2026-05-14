"use client";
import { useState } from "react";
import { CRS, CR_XP, XP_THRESHOLDS } from "@/lib/monsters/constants";
import { SH, FieldLabel } from "../ui/micro";

interface Props { onClose: () => void; }

export function XPCalculator({ onClose }: Props) {
  const [playerCount, setPlayerCount] = useState(4);
  const [playerLevel, setPlayerLevel] = useState(5);
  const [monsters,    setMonsters]    = useState([{ cr: "5", count: 1 }]);

  const addRow    = () => setMonsters(p => [...p, { cr: "5", count: 1 }]);
  const removeRow = (i: number) => setMonsters(p => p.filter((_, j) => j !== i));
  const updateRow = (i: number, k: string, v: any) => setMonsters(p => p.map((r, j) => j === i ? { ...r, [k]: v } : r));

  const thresholds = XP_THRESHOLDS[playerLevel] || XP_THRESHOLDS[5];
  const [easy, medium, hard, deadly] = thresholds.map(t => t * playerCount);
  const rawXP         = monsters.reduce((sum, r) => sum + (CR_XP[r.cr] || 0) * (parseInt(String(r.count)) || 1), 0);
  const totalMonsters = monsters.reduce((s, r) => s + (parseInt(String(r.count)) || 1), 0);
  const mult          = totalMonsters === 1 ? 1 : totalMonsters === 2 ? 1.5 : totalMonsters <= 6 ? 2 : totalMonsters <= 10 ? 2.5 : totalMonsters <= 14 ? 3 : 4;
  const adjXP         = Math.round(rawXP * mult);
  const difficulty    = adjXP >= deadly ? "Mortal 💀" : adjXP >= hard ? "Difícil 🔴" : adjXP >= medium ? "Médio 🟡" : adjXP >= easy ? "Fácil 🟢" : "Trivial ⚪";
  const diffColor     = adjXP >= deadly ? "#dd2222" : adjXP >= hard ? "#e05020" : adjXP >= medium ? "#c09010" : "#22aa66";

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">⚔️ Calculadora de Encontro</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="fields-grid-2" style={{ marginBottom: 16 }}>
            <div><FieldLabel>Número de Jogadores</FieldLabel><input className="mc-input" type="number" min="1" max="10" value={playerCount} onChange={e => setPlayerCount(parseInt(e.target.value) || 4)} /></div>
            <div><FieldLabel>Nível dos Jogadores</FieldLabel><input className="mc-input" type="number" min="1" max="20" value={playerLevel} onChange={e => setPlayerLevel(parseInt(e.target.value) || 5)} /></div>
          </div>
          <SH label="Monstros do Encontro" right={<button className="btn-secondary btn-sm" onClick={addRow}>+ Adicionar</button>} />
          <div style={{ marginBottom: 16 }}>
            {monsters.map((r, i) => (
              <div key={i} className="xp-row">
                <select className="mc-select" value={r.cr} onChange={e => updateRow(i, "cr", e.target.value)} style={{ flex: 1 }}>{CRS.map(c => <option key={c}>{c}</option>)}</select>
                <span className="xp-row-label">CR</span>
                <input className="mc-input" type="number" min="1" max="99" value={r.count} onChange={e => updateRow(i, "count", e.target.value)} style={{ width: 60, textAlign: "center" }} />
                <span className="xp-row-label">un.</span>
                <span className="xp-row-xp">{((CR_XP[r.cr] || 0) * (parseInt(String(r.count)) || 1)).toLocaleString("pt-BR")} XP</span>
                {monsters.length > 1 && <button className="btn-icon btn-xs" onClick={() => removeRow(i)}>🗑</button>}
              </div>
            ))}
          </div>
          <div className="xp-thresholds">
            {(["Fácil", "Médio", "Difícil", "Mortal"] as const).map((l, i) => (
              <div key={l} className="xp-threshold-item">
                <span className="xp-th-label">{l}</span>
                <span className="xp-th-val">{[easy, medium, hard, deadly][i].toLocaleString("pt-BR")} XP</span>
              </div>
            ))}
          </div>
          <div className="xp-result">
            <div className="xp-result-row"><span>XP bruto</span><span>{rawXP.toLocaleString("pt-BR")}</span></div>
            <div className="xp-result-row"><span>Multiplicador ({totalMonsters} monstros)</span><span>×{mult}</span></div>
            <div className="xp-result-row xp-result-total"><span>XP ajustado</span><span>{adjXP.toLocaleString("pt-BR")}</span></div>
            <div className="xp-difficulty" style={{ color: diffColor }}>{difficulty}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
