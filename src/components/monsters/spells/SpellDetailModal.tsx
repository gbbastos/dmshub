"use client";
import { useState, useEffect } from "react";
import { API } from "@/lib/monsters/constants";
import { spellNameToIndex } from "@/lib/monsters/spells";
import { Spin } from "../ui/micro";
import { RollableText } from "../dice/RollableText";

interface Props {
  spellName: string;
  spellIndex?: string | null;
  onClose: () => void;
  onRoll?: (name: string, desc: string, expr: string) => void;
}

export function SpellDetailModal({ spellName, spellIndex, onClose, onRoll }: Props) {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!spellName) return;
    setLoading(true); setData(null); setError(null);
    const idx = spellIndex ?? spellNameToIndex(spellName);
    fetch(`${API}/api/spells/${idx}`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => {
        fetch(`${API}/api/spells?limit=500`).then(r => r.json())
          .then(d => {
            const hit = (d.results ?? []).find((s: any) => s.name.toLowerCase() === spellName.toLowerCase());
            if (!hit) throw new Error("not found");
            return fetch(`${API}${hit.url}`).then(r => r.json());
          })
          .then(s => { setData(s); setLoading(false); })
          .catch(() => { setError("Magia não encontrada na API."); setLoading(false); });
      });
  }, [spellIndex, spellName]);

  const level  = data ? (data.level === 0 ? "Truque" : `${data.level}º nível`) : "—";
  const desc   = data?.desc?.join("\n\n") ?? "";
  const upcast = data?.higher_level?.join("\n\n") ?? null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="spell-modal">
        <div className="spell-modal-header">
          <div className="spell-modal-icon">📜</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="spell-modal-title">{spellName}</div>
            <div className="spell-modal-meta">
              <span className="spell-meta-pill">{level}</span>
              {data?.school?.name && <span className="spell-meta-pill">{data.school.name}</span>}
              {data?.ritual      && <span className="spell-meta-pill">Ritual</span>}
              {data?.concentration && <span className="spell-meta-pill">Concentração</span>}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="spell-modal-body">
          {loading && <div className="spell-loading"><Spin /> Carregando magia...</div>}
          {error   && <div style={{ color: "var(--text4)", padding: "20px 0", textAlign: "center", fontStyle: "italic" }}>{error}</div>}
          {data && !loading && (
            <>
              <div className="spell-detail-grid">
                {([
                  ["Tempo de Conjuração", data.casting_time ?? "—"],
                  ["Alcance",             data.range ?? "—"],
                  ["Duração",             data.duration ?? "—"],
                  ["Componentes",         (data.components?.join(", ") ?? "—") + (data.material ? ` (${data.material})` : "")],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="spell-detail-item"><span>{l}</span><span>{v}</span></div>
                ))}
              </div>
              <div className="spell-desc-text">
                {onRoll
                  ? <RollableText text={desc} onRoll={expr => onRoll(spellName, desc, expr)} />
                  : desc
                }
              </div>
              {upcast && (
                <div className="spell-upcast">
                  <div className="spell-upcast-title">Em Níveis Superiores</div>
                  <div style={{ fontSize: ".84rem", color: "var(--text2)", lineHeight: 1.65 }}>{upcast}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
