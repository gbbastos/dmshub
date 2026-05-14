"use client";
import { useState } from "react";
import { CONDITIONS } from "@/lib/monsters/constants";
import { SH } from "../ui/micro";

interface Props {
  active: string[];
  onChange: (ids: string[]) => void;
}

export function StatusTracker({ active, onChange }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const toggle = (id: string) => onChange(active.includes(id) ? active.filter(x => x !== id) : [...active, id]);

  return (
    <div className="status-tracker">
      <SH label="Condições de Status" />
      <div className="conditions-grid">
        {CONDITIONS.map(c => (
          <div key={c.id} className="condition-wrap" onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)}>
            <button className={`condition-btn${active.includes(c.id) ? " active" : ""}`} onClick={() => toggle(c.id)} title={c.desc}>
              <span className="cond-icon">{c.icon}</span>
              <span className="cond-label">{c.label}</span>
            </button>
            {hovered === c.id && <div className="cond-tooltip">{c.desc}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
