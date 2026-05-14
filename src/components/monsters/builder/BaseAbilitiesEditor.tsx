"use client";
import { useState } from "react";
import { TypeBadge } from "../ui/micro";

interface Props {
  monster: any;
  removedAbilities: Set<string>;
  onToggle: (cat: string, name: string) => void;
}

const SECTIONS = [
  { cat: "special",   label: "Especiais",  icon: "✦", key: "special_abilities"  },
  { cat: "action",    label: "Ações",       icon: "⚔️", key: "actions"           },
  { cat: "legendary", label: "Lendárias",   icon: "👑", key: "legendary_actions" },
  { cat: "reaction",  label: "Reações",     icon: "🔄", key: "reactions"         },
];

export function BaseAbilitiesEditor({ monster, removedAbilities, onToggle }: Props) {
  const [open, setOpen] = useState(true);
  const activeSections = SECTIONS.map(s => ({ ...s, list: monster[s.key] ?? [] })).filter(s => s.list.length > 0);
  if (activeSections.length === 0) return null;

  const totalRemoved = removedAbilities.size;
  const totalAll = activeSections.reduce((s, sec) => s + sec.list.length, 0);

  return (
    <div className="base-abilities-editor" style={{ marginBottom: 20 }}>
      <button className="bae-toggle" onClick={() => setOpen(p => !p)}>
        <div className="sec-head-dot" style={{ flexShrink: 0 }} />
        <span className="sec-head-text">Habilidades do Monstro Base</span>
        <span className="bae-counter">
          {totalRemoved > 0
            ? <span className="bae-removed-badge">{totalRemoved} removida{totalRemoved > 1 ? "s" : ""}</span>
            : <span style={{ color: "var(--text4)", fontSize: ".72rem" }}>{totalAll} habilidades</span>
          }
        </span>
        <span className="bae-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="bae-body">
          <p className="bae-hint">Clique para <strong>remover</strong> uma habilidade da ficha final. Clique novamente para restaurá-la.</p>
          {activeSections.map(sec => (
            <div key={sec.cat} className="bae-section">
              <div className="bae-section-title"><span>{sec.icon}</span><span>{sec.label}</span><span className="bae-section-count">{sec.list.length}</span></div>
              <div className="bae-list">
                {sec.list.map((ability: any, i: number) => {
                  const key     = `${sec.cat}::${ability.name}`;
                  const removed = removedAbilities.has(key);
                  const desc    = ability.desc ?? ability.description ?? "";
                  return (
                    <div key={i} className={`bae-item${removed ? " removed" : ""}`} onClick={() => onToggle(sec.cat, ability.name)} title={removed ? "Clique para restaurar" : "Clique para remover da ficha"}>
                      <div className="bae-item-check">{removed ? <span className="bae-x">✕</span> : <span className="bae-check">✓</span>}</div>
                      <div className="bae-item-body">
                        <div className="bae-item-name">{ability.name}</div>
                        {desc && <div className="bae-item-desc">{desc.length > 90 ? desc.slice(0, 90) + "…" : desc}</div>}
                      </div>
                      <TypeBadge type={sec.cat} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {totalRemoved > 0 && (
            <button className="btn-secondary btn-sm" style={{ marginTop: 8, width: "100%" }}
              onClick={() => activeSections.forEach(sec => sec.list.forEach((a: any) => { if (removedAbilities.has(`${sec.cat}::${a.name}`)) onToggle(sec.cat, a.name); }))}>
              ↩ Restaurar Todas
            </button>
          )}
        </div>
      )}
    </div>
  );
}
