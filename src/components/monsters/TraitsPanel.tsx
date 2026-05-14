"use client";
import { useState, useEffect } from "react";
import { API } from "@/lib/monsters/constants";
import { abilityCache } from "@/lib/monsters/hooks";
import { Spin, TypeBadge } from "./ui/micro";

interface Props {
  addedTraits: any[];
  showToast: (msg: string, type?: string) => void;
}

export function TraitsPanel({ addedTraits, showToast }: Props) {
  const [source,    setSource]    = useState("monsters");
  const [monList,   setMonList]   = useState<any[]>([]);
  const [spellList, setSpellList] = useState<any[]>([]);
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState<any>(null);
  const [monData,   setMonData]   = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [abTab,     setAbTab]     = useState("special");
  const [showDrop,  setShowDrop]  = useState(false);

  useEffect(() => {
    fetch(`${API}/api/monsters`).then(r => r.json()).then(d => setMonList(d.results ?? [])).catch(() => {});
    fetch(`${API}/api/spells`).then(r => r.json()).then(d => setSpellList(d.results ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true); setMonData(null);
    fetch(`${API}${selected.url}`).then(r => r.json()).then(d => {
      setMonData(d);
      abilityCache.set(selected.index, { name: d.name, specials: d.special_abilities || [], actions: d.actions || [], legendaries: d.legendary_actions || [], reactions: d.reactions || [] });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selected]);

  const list     = source === "monsters" ? monList : spellList;
  const filtered = search.length >= 1 ? list.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 50) : [];
  const clearSel = () => { setSelected(null); setMonData(null); setSearch(""); setShowDrop(false); };
  const switchSrc = (s: string) => { setSource(s); clearSel(); setAbTab("special"); };

  const specials    = (monData?.special_abilities ?? []).map((a: any) => ({ ...a, _type: "special" }));
  const actions     = (monData?.actions ?? []).map((a: any) => ({ ...a, _type: "action" }));
  const legendaries = (monData?.legendary_actions ?? []).map((a: any) => ({ ...a, _type: "legendary" }));
  const reactions   = (monData?.reactions ?? []).map((a: any) => ({ ...a, _type: "reaction" }));
  const TABS = [{ key: "special", list: specials }, { key: "action", list: actions }, { key: "legendary", list: legendaries }, { key: "reaction", list: reactions }].filter(t => t.list.length > 0);
  const TLAB: Record<string, string> = { special: "Especiais", action: "Ações", legendary: "Lendárias", reaction: "Reações" };
  const currentAbilities = TABS.find(t => t.key === abTab)?.list ?? [];

  const spellTrait = (d: any) => ({
    name: d.name,
    desc: `${d.level === 0 ? "Truque" : `Nível ${d.level}`} – ${d.school?.name}. Alcance: ${d.range ?? "-"}. Duração: ${d.duration ?? "-"}. ${(d.desc ?? []).join(" ").slice(0, 400)}`,
    type: "spell", _source: d.name, _spellIndex: d.index ?? null, _spellLevel: d.level ?? 0,
  });

  return (
    <aside className="traits-panel">
      <div className="traits-source-tabs">
        <button className={`src-tab${source === "monsters" ? " active" : ""}`} onClick={() => switchSrc("monsters")}>🐉 Monstros</button>
        <button className={`src-tab${source === "spells" ? " active" : ""}`}   onClick={() => switchSrc("spells")}>📜 Magias</button>
      </div>
      <div className="traits-header">
        <p className="traits-hint">{source === "monsters" ? "Busque um monstro e arraste habilidades" : "Busque uma magia e arraste para a ficha"}</p>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="mc-input search-input"
            placeholder={source === "monsters" ? "Ex: Ancient Red Dragon..." : "Ex: Fireball..."}
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDrop(true); if (!e.target.value) clearSel(); }}
            onFocus={() => setShowDrop(true)} />
          {search && <button className="search-clear" onClick={clearSel}>✕</button>}
        </div>
        {showDrop && filtered.length > 0 && !selected && (
          <div className="search-dropdown">
            {filtered.map(m => (
              <div key={m.index} className="search-item" onMouseDown={() => { setSelected(m); setSearch(m.name); setShowDrop(false); setAbTab("special"); }}>
                {m.name}
                {m.level != null && <span style={{ marginLeft: 8, fontSize: ".7rem", color: "var(--text4)" }}>Nv {m.level || "Truque"}</span>}
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div className="selected-badge">
            <div>
              <div className="selected-name">{selected.name}</div>
              {monData && source === "monsters" && <div className="selected-meta">CR {monData.challenge_rating} · {monData.type}</div>}
              {monData && source === "spells"   && <div className="selected-meta">{monData.level === 0 ? "Truque" : `Nv ${monData.level}`} · {monData.school?.name}</div>}
            </div>
            {loading && <Spin />}
            <button className="btn-icon" onClick={clearSel}>✕</button>
          </div>
        )}
        {monData && source === "monsters" && TABS.length > 0 && (
          <div className="abtabs">
            {TABS.map(t => (
              <button key={t.key} className={`abtab${abTab === t.key ? " active" : ""}`} onClick={() => setAbTab(t.key)}>
                {TLAB[t.key]} <span className="abtab-count">({t.list.length})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="traits-list scrollable">
        {!selected && <div className="traits-empty"><span className="traits-empty-icon">{source === "monsters" ? "🔍" : "📜"}</span><span>Busque {source === "monsters" ? "um monstro" : "uma magia"}</span></div>}
        {selected && loading && <div className="traits-loading"><Spin /></div>}
        {monData && !loading && source === "monsters" && currentAbilities.length === 0 && <div className="traits-empty"><span>Nenhuma habilidade aqui</span></div>}
        {monData && !loading && source === "monsters" && currentAbilities.map((t: any, i: number) => {
          const desc    = t.desc ?? t.description ?? "";
          const isAdded = addedTraits.some(a => a.name === t.name && a._source === selected?.name);
          const trait   = { name: t.name, desc, type: t._type, _source: selected?.name };
          return (
            <div key={i} className={`trait-card${isAdded ? " added" : ""}`} draggable onDragStart={e => e.dataTransfer.setData("traitJson", JSON.stringify(trait))}>
              <div className="trait-body">
                <div className="trait-title-row"><span className="trait-name">{isAdded ? "✓ " : ""}{t.name}</span><TypeBadge type={t._type} /></div>
                <div className="trait-desc">{desc.length > 120 ? desc.slice(0, 120) + "…" : desc}</div>
              </div>
            </div>
          );
        })}
        {monData && !loading && source === "spells" && (() => {
          const trait   = spellTrait(monData);
          const isAdded = addedTraits.some(a => a.name === monData.name);
          return (
            <div className={`trait-card spell-card${isAdded ? " added" : ""}`} draggable onDragStart={e => e.dataTransfer.setData("traitJson", JSON.stringify(trait))}>
              <div className="trait-body">
                <div className="trait-title-row"><span className="trait-name">{monData.name}</span><TypeBadge type="spell" /></div>
                <div className="spell-meta">{monData.level === 0 ? "Truque" : `${monData.level}º nível`} · {monData.school?.name} · Alcance: {monData.range}</div>
                <div className="trait-desc">{(monData.desc ?? []).join(" ").slice(0, 150) + "…"}</div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="traits-footer">
        <span className="traits-footer-label">Traits Adicionados</span>
        <span className="traits-footer-count" style={{ color: addedTraits.length > 0 ? "var(--rose)" : "var(--text4)" }}>{addedTraits.length}</span>
      </div>
    </aside>
  );
}
