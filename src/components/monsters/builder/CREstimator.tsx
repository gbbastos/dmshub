"use client";
import { useState } from "react";
import { simulateCR, PARTY } from "@/lib/monsters/crSim";

interface Props { creature: any; traits: any[]; }

export function CREstimator({ creature, traits }: Props) {
  const [partyLevel, setPartyLevel] = useState(5);
  const [open, setOpen] = useState(true);
  if (!creature) return null;

  const sim = simulateCR(creature, traits, partyLevel);
  const diffColor = sim.cr <= partyLevel * 0.5 ? "#22aa66" : sim.cr <= partyLevel ? "#e08020" : sim.cr <= partyLevel * 1.5 ? "#dd5500" : "#dd2222";
  const diffLabel = sim.cr < partyLevel - 1 ? "Trivial" : sim.cr < partyLevel ? "Fácil" : sim.cr === partyLevel ? "Igual ao Nível" : sim.cr <= partyLevel + 2 ? "Desafiador" : sim.cr <= partyLevel + 4 ? "Difícil" : "Mortal";
  const outcomeEmoji = sim.outcome === "monster" ? "💀 Party derrotada" : sim.outcome === "stalemate" ? "🔄 Empate" : "⚔️ Party vence";

  return (
    <div className="cr-estimator">
      <button className="cr-toggle" onClick={() => setOpen(p => !p)}>
        <div className="sec-head-dot" style={{ flexShrink: 0 }} />
        <span className="sec-head-text">CR Estimado por Simulação</span>
        <div className="cr-badge-inline" style={{ background: diffColor + "22", color: diffColor, border: `1px solid ${diffColor}55` }}>CR {sim.crLabel}</div>
        <span className="bae-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="cr-body">
          <div className="cr-party-row">
            <span className="cr-label">Nível da Party:</span>
            <div className="cr-level-btns">
              {[1,2,3,4,5,6,7,8,9,10,12,15,17,20].map(l => (
                <button key={l} className={`cr-level-btn${partyLevel === l ? " active" : ""}`} onClick={() => setPartyLevel(l)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="cr-result-card">
            <div className="cr-result-left">
              <div className="cr-result-cr" style={{ color: diffColor }}>CR {sim.crLabel}</div>
              <div className="cr-result-sub" style={{ color: diffColor }}>{diffLabel}</div>
              <div className="cr-result-float">≈ {sim.crFloat} (contínuo)</div>
            </div>
            <div className="cr-result-right">
              <div className="cr-outcome">{outcomeEmoji}</div>
              <div className="cr-rounds">em ~{sim.rounds} rodadas</div>
            </div>
          </div>
          <div className="cr-stats-grid">
            {[
              ["DPR Party",    `${sim.partyDPR_effective}/rd`,    `(${sim.partyHitChance}% acerto)`],
              ["DPR Monstro",  `${sim.monsterDPR_effective}/rd`,  `(${sim.monsterHitChance}% acerto)`],
              ["HP Efetivo",   `${sim.monsterEHP}`,               "(com resist.)"],
              ["TTK Monstro",  `${sim.ttk_monster}rd`,            "party mata em"],
              ["TTK Party",    `${sim.ttk_party}rd`,              "monstro mata em"],
              ["Eco. de Ações",`×${sim.aeMulti}`,                 `+ controle ×${sim.ctrlMulti}`],
            ].map(([l, v, s]) => (
              <div key={l} className="cr-stat">
                <span className="cr-stat-label">{l}</span>
                <span className="cr-stat-val">{v}</span>
                <span className="cr-stat-sub">{s}</span>
              </div>
            ))}
          </div>
          {sim.roundLog.length > 0 && (
            <div className="cr-round-log">
              <div className="cr-round-log-title">Simulação rodada-a-rodada</div>
              <div className="cr-round-log-header"><span>Rd</span><span>HP Monstro</span><span>HP Party</span></div>
              {sim.roundLog.map((r: any) => (
                <div key={r.r} className="cr-round-row">
                  <span className="cr-round-num">{r.r}</span>
                  <div className="cr-round-bar-wrap">
                    <div className="cr-round-bar cr-round-bar-m" style={{ width: `${Math.max(0, (r.mHP / sim.monsterEHP) * 100)}%` }} />
                    <span className="cr-round-val">{Math.max(0, r.mHP)}</span>
                  </div>
                  <div className="cr-round-bar-wrap">
                    <div className="cr-round-bar cr-round-bar-p" style={{ width: `${Math.max(0, (r.pHP / (PARTY[partyLevel]?.hp ?? 100)) * 100)}%` }} />
                    <span className="cr-round-val" style={{ color: r.pHP < 0 ? "#dd2222" : "inherit" }}>{Math.max(0, r.pHP)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="cr-disclaimer">⚠️ Estimativa matemática baseada em simulação de combate. Considere contexto, terreno e táticas ao usar este valor.</p>
        </div>
      )}
    </div>
  );
}
