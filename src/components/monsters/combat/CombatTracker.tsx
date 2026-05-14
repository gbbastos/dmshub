"use client";
import { useState } from "react";
import { CONDITIONS } from "@/lib/monsters/constants";
import { SH, FieldLabel } from "../ui/micro";

interface Props {
  goHome: () => void;
}

export function CombatTracker({ goHome }: Props) {
  const [creatures, setCreatures]     = useState<any[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [round, setRound]             = useState(1);
  const [adding, setAdding]           = useState({ name: "", hp: "20", initiative: "10" });

  const add = () => {
    if (!adding.name.trim()) return;
    const id = Date.now();
    setCreatures(p => [...p, { id, name: adding.name.trim(), maxHp: parseInt(adding.hp) || 20, hp: parseInt(adding.hp) || 20, initiative: parseInt(adding.initiative) || 10, conditions: [] }]);
    setAdding({ name: "", hp: "20", initiative: "10" });
  };
  const remove = (id: number) => setCreatures(p => { const n = p.filter(c => c.id !== id); if (currentTurn >= n.length) setCurrentTurn(Math.max(0, n.length - 1)); return n; });
  const update = (id: number, k: string, v: any) => setCreatures(p => p.map(c => c.id === id ? { ...c, [k]: v } : c));
  const applyDmg  = (id: number, n: number) => setCreatures(p => p.map(c => c.id === id ? { ...c, hp: Math.max(0, c.hp - n) } : c));
  const applyHeal = (id: number, n: number) => setCreatures(p => p.map(c => c.id === id ? { ...c, hp: Math.min(c.maxHp, c.hp + n) } : c));
  const sorted = [...creatures].sort((a, b) => b.initiative - a.initiative);
  const nextTurn = () => { if (sorted.length === 0) return; const next = (currentTurn + 1) % sorted.length; setCurrentTurn(next); if (next === 0) setRound(r => r + 1); };
  const rollAll  = () => { setCreatures(p => p.map(c => ({ ...c, initiative: Math.floor(Math.random() * 20) + 1 }))); setCurrentTurn(0); setRound(1); };
  const toggleCondition = (id: number, cid: string) => setCreatures(p => p.map(c => c.id === id ? { ...c, conditions: c.conditions.includes(cid) ? c.conditions.filter((x: string) => x !== cid) : [...c.conditions, cid] } : c));

  return (
    <div className="combat-page">
      <nav className="topnav">
        <div className="brand" style={{ cursor: "pointer" }} onClick={goHome}>
          <div className="brand-icon">⚗</div>
          <span className="brand-name">Monster&apos;s Cauldron</span>
        </div>
        <div style={{ fontFamily: "Cinzel,serif", fontWeight: 700, color: "var(--text3)", fontSize: ".85rem", letterSpacing: ".06em" }}>
          ⚔️ RASTREADOR DE COMBATE — Rodada {round}
        </div>
        <div className="nav-actions">
          <button className="btn-secondary" onClick={goHome}>← Início</button>
          <button className="btn-secondary" onClick={rollAll} title="Rolar iniciativa para todos">🎲 Rolar Tudo</button>
          <button className="btn-primary" onClick={nextTurn} disabled={sorted.length === 0}>Próximo Turno →</button>
        </div>
      </nav>

      <div className="combat-content">
        <div className="card combat-add-card">
          <SH label="Adicionar Criatura" />
          <div className="combat-add-row">
            <input className="mc-input" placeholder="Nome..." value={adding.name} onChange={e => setAdding(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && add()} style={{ flex: 2 }} />
            <div style={{ flex: 1 }}><FieldLabel>HP Máx.</FieldLabel><input className="mc-input" type="number" min="1" value={adding.hp} onChange={e => setAdding(p => ({ ...p, hp: e.target.value }))} /></div>
            <div style={{ flex: 1 }}><FieldLabel>Iniciativa</FieldLabel><input className="mc-input" type="number" value={adding.initiative} onChange={e => setAdding(p => ({ ...p, initiative: e.target.value }))} /></div>
            <button className="btn-primary" onClick={add} style={{ alignSelf: "flex-end", padding: "9px 20px" }}>+ Adicionar</button>
          </div>
        </div>

        {sorted.length === 0
          ? <div className="combat-empty"><span style={{ fontSize: "2.5rem" }}>⚔️</span><span>Adicione criaturas para iniciar o combate</span></div>
          : (
            <div className="combat-list">
              {sorted.map((c, i) => {
                const pct = Math.max(0, (c.hp / c.maxHp) * 100);
                const col = pct > 50 ? "#22aa66" : pct > 25 ? "#e08020" : "#dd2222";
                const isCurrent = i === currentTurn;
                return (
                  <div key={c.id} className={`combat-card${isCurrent ? " active-turn" : ""}`}>
                    <div className="combat-card-header">
                      <div className="combat-initiative">{c.initiative}</div>
                      <div className="combat-creature-name">{isCurrent && <span className="turn-arrow">▶ </span>}{c.name}</div>
                      <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                        {c.hp === 0 && <span className="dead-badge">INCAP.</span>}
                        <button className="btn-icon btn-xs" onClick={() => remove(c.id)}>🗑</button>
                      </div>
                    </div>
                    <div className="combat-hp-row">
                      <div style={{ flex: 1 }}>
                        <div className="hp-bar" style={{ marginBottom: 4 }}><div className="hp-fill" style={{ width: `${pct}%`, background: col }} /></div>
                        <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text)" }}>{c.hp} / {c.maxHp} HP</span>
                      </div>
                      <div className="combat-hp-btns">
                        {[1, 5, 10].map(n => <button key={n} className="btn-damage" onClick={() => applyDmg(c.id, n)} style={{ padding: "3px 7px", fontSize: ".72rem" }}>-{n}</button>)}
                        {[1, 5, 10].map(n => <button key={n} className="btn-heal" onClick={() => applyHeal(c.id, n)} style={{ padding: "3px 7px", fontSize: ".72rem" }}>+{n}</button>)}
                        <button className="btn-secondary btn-sm" onClick={() => update(c.id, "hp", c.maxHp)} style={{ fontSize: ".68rem" }}>Full</button>
                      </div>
                    </div>
                    <div className="combat-conditions">
                      {CONDITIONS.map(cond => (
                        <button key={cond.id} className={`cond-mini${c.conditions.includes(cond.id) ? " active" : ""}`} title={cond.label} onClick={() => toggleCondition(c.id, cond.id)}>{cond.icon}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}
