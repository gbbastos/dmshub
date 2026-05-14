"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { API, SIZES, ALIGNS, CRS, TYPES, SCRATCH_DEFAULTS, modStr } from "@/lib/monsters/constants";
import { Spin, SH, Tag, ThemeBtn, FieldLabel, TypeBadge } from "../ui/micro";
import { StatBlock } from "../statblock/StatBlock";
import { TraitsPanel } from "../TraitsPanel";
import { BaseAbilitiesEditor } from "./BaseAbilitiesEditor";
import { CREstimator } from "./CREstimator";
import { CollectionModal } from "../modals/CollectionModal";

interface Props {
  onBack: () => void;
  onForge: (creature: any, traits: any[], notes: string, image: string, entryId?: number | null, tags?: any[]) => void;
  dark: boolean;
  setDark: (fn: (d: boolean) => boolean) => void;
  store: any;
  showToast: (msg: string, type?: string) => void;
  sharedLoad?: any;
  goHome: () => void;
}

const STAT_KEYS = [{ key: "str", label: "FOR" }, { key: "dex", label: "DES" }, { key: "con", label: "CON" }, { key: "int", label: "INT" }, { key: "wis", label: "SAB" }, { key: "cha", label: "CAR" }];

export function Builder({ onBack, onForge, dark, setDark, store, showToast, sharedLoad, goHome }: Props) {
  const [mode,            setMode]            = useState("base");
  const [leftTab,         setLeftTab]         = useState("srd");
  const [monList,         setMonList]         = useState<any[]>([]);
  const [loadList,        setLoadList]        = useState(true);
  const [baseSearch,      setBaseSearch]      = useState("");
  const [baseMonster,     setBaseMonster]     = useState<any>(null);
  const [loadMon,         setLoadMon]         = useState(false);
  const [customName,      setCustomName]      = useState("");
  const [customSize,      setCustomSize]      = useState("Grande");
  const [customAlign,     setCustomAlign]     = useState("Caótico Mau");
  const [customCR,        setCustomCR]        = useState("10");
  const [customStats,     setCustomStats]     = useState({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
  const [scrType,         setScrType]         = useState("Monstrosidade");
  const [scrHp,           setScrHp]           = useState("22");
  const [scrDice,         setScrDice]         = useState("4d8+4");
  const [scrAC,           setScrAC]           = useState("13");
  const [scrSpeed,        setScrSpeed]        = useState("30");
  const [scrLang,         setScrLang]         = useState("—");
  const [imageUrl,        setImageUrl]        = useState("");
  const [traits,          setTraits]          = useState<any[]>([]);
  const [dragOver,        setDragOver]        = useState(false);
  const [showPreview,     setShowPreview]     = useState(false);
  const [showColModal,    setShowColModal]    = useState(false);
  const [savedTags,       setSavedTags]       = useState<any[]>([]);
  const [removedAbilities,setRemovedAbilities]= useState(new Set<string>());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/api/monsters`).then(r => { if (!r.ok) throw r.status; return r.json(); })
      .then(d => { setMonList(d.results ?? []); setLoadList(false); })
      .catch(e => { console.error(e); setLoadList(false); showToast("Erro ao carregar lista", "error"); });
  }, []);

  useEffect(() => {
    if (baseMonster) {
      setCustomStats({ str: baseMonster.strength ?? 10, dex: baseMonster.dexterity ?? 10, con: baseMonster.constitution ?? 10, int: baseMonster.intelligence ?? 10, wis: baseMonster.wisdom ?? 10, cha: baseMonster.charisma ?? 10 });
      setRemovedAbilities(new Set());
    }
  }, [baseMonster]);

  useEffect(() => { if (sharedLoad) onForge(sharedLoad.creature, sharedLoad.traits, sharedLoad.notes || "", sharedLoad.image || ""); }, []);

  const pickBase = async (m: any) => {
    setLoadMon(true);
    try {
      const d = await fetch(`${API}${m.url}`).then(r => { if (!r.ok) throw r.status; return r.json(); });
      setBaseMonster(d); setCustomName(d.name); showToast(`${d.name} carregado!`);
    } catch (e) { console.error(e); showToast("Erro ao carregar", "error"); }
    finally { setLoadMon(false); }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const raw = e.dataTransfer.getData("traitJson");
    if (!raw) return;
    try {
      const t = JSON.parse(raw);
      if (traits.some(x => x.name === t.name && x._source === t._source)) showToast(`"${t.name}" já adicionado.`, "error");
      else { setTraits(p => [...p, t]); showToast(`"${t.name}" adicionado!`); }
    } catch {}
  }, [traits]);

  const handleImport = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    store.importJSON(f, (err: string | null, name?: string) => { if (err) showToast(err, "error"); else showToast(`"${name}" importado!`); });
    e.target.value = "";
  };

  const loadSaved = (entry: any) => onForge(entry.creature, entry.traits, entry.notes || "", entry.image || "", entry.id);
  const filteredBase = monList.filter(m => m.name.toLowerCase().includes(baseSearch.toLowerCase()));

  const toggleAbility = (cat: string, name: string) => {
    const k = `${cat}::${name}`;
    setRemovedAbilities(prev => { const next = new Set(prev); next.has(k) ? next.delete(k) : next.add(k); return next; });
  };

  const buildCreature = () => {
    const filterAbilities = (list: any[], cat: string) => (list ?? []).filter((a: any) => !removedAbilities.has(`${cat}::${a.name}`));
    if (mode === "base") {
      if (!baseMonster) return null;
      return {
        ...baseMonster, name: customName || baseMonster.name, size: customSize, alignment: customAlign, challenge_rating: customCR,
        strength: customStats.str, dexterity: customStats.dex, constitution: customStats.con, intelligence: customStats.int, wisdom: customStats.wis, charisma: customStats.cha,
        special_abilities: filterAbilities(baseMonster.special_abilities, "special"), actions: filterAbilities(baseMonster.actions, "action"),
        legendary_actions: filterAbilities(baseMonster.legendary_actions, "legendary"), reactions: filterAbilities(baseMonster.reactions, "reaction"),
      };
    }
    return {
      ...SCRATCH_DEFAULTS, name: customName || "Nova Criatura", size: customSize, type: scrType, alignment: customAlign,
      challenge_rating: customCR, hit_points: parseInt(scrHp) || 22, hit_dice: scrDice,
      armor_class: [{ value: parseInt(scrAC) || 12 }], speed: { walk: `${scrSpeed} pés` },
      strength: customStats.str, dexterity: customStats.dex, constitution: customStats.con,
      intelligence: customStats.int, wisdom: customStats.wis, charisma: customStats.cha,
      languages: scrLang, senses: { passive_perception: 10 + Math.floor((customStats.wis - 10) / 2) },
    };
  };

  const creature  = buildCreature();
  const canForge  = mode === "scratch" ? !!customName.trim() : !!baseMonster;

  return (
    <div className="builder-page">
      <nav className="topnav">
        <a href="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="brand-icon" />
          <span className="brand-name">DM&apos;s Hub</span>
          <span className="brand-section">/ Criador de Monstro</span>
        </a>
        <div className="nav-actions">
          <a href="/" className="btn-secondary" style={{ textDecoration: "none" }}>← Hub</a>
          <ThemeBtn dark={dark} setDark={setDark} />
          <button className="btn-primary" disabled={!canForge} onClick={() => { if (!canForge) { showToast(mode === "base" ? "Selecione um monstro base!" : "Digite um nome!", "error"); return; } onForge(creature!, traits, "", imageUrl); }}>⚗ Gerar Ficha</button>
        </div>
      </nav>

      <div className="builder-grid">
        {/* LEFT */}
        <aside className="base-panel">
          <div className="left-tabs">
            <button className={`left-tab${leftTab === "srd" ? " active" : ""}`} onClick={() => setLeftTab("srd")}>📖 Monstros SRD</button>
            <button className={`left-tab${leftTab === "saved" ? " active" : ""}`} onClick={() => setLeftTab("saved")}>
              💾 Salvos {store.creatures.length > 0 && <span className="save-count">{store.creatures.length}</span>}
            </button>
          </div>

          {leftTab === "srd" && (
            <>
              <div className="base-panel-header">
                <input className="mc-input" placeholder="Buscar monstro..." value={baseSearch} onChange={e => setBaseSearch(e.target.value)} />
              </div>
              <div className="base-list scrollable">
                {loadList ? <div className="center-load"><Spin /></div>
                  : filteredBase.length === 0 ? <div className="empty-msg">Nenhum resultado</div>
                    : filteredBase.map(m => (
                      <div key={m.index} className={`mon-item${baseMonster?.index === m.index ? " active" : ""}`} onClick={() => !loadMon && pickBase(m)}>
                        {loadMon && baseMonster?.index === m.index ? <span style={{ color: "var(--rose)" }}>⟳ {m.name}</span> : m.name}
                      </div>
                    ))}
              </div>
              <div className="base-panel-footer">{filteredBase.length}/{monList.length} monstros</div>
            </>
          )}

          {leftTab === "saved" && (
            <div className="saved-list scrollable">
              <div className="saved-toolbar">
                <button className="btn-secondary btn-sm" onClick={() => setShowColModal(true)}>📁 Coleções</button>
                <button className="btn-secondary btn-sm" onClick={handleImport}>📥 Importar</button>
                <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={onFileChange} />
              </div>
              {store.creatures.length === 0
                ? <div className="empty-msg" style={{ padding: 24 }}>Nenhuma criatura salva.<br /><span style={{ fontSize: ".76rem" }}>Use 💾 na ficha para salvar.</span></div>
                : store.creatures.map((entry: any) => (
                  <div key={entry.id} className="saved-item">
                    <div className="saved-item-info" onClick={() => loadSaved(entry)}>
                      <div className="saved-name">{entry.name}</div>
                      <div className="saved-meta"><Tag cls="tag-cr">CR {entry.cr}</Tag><Tag cls="tag-type">{entry.type}</Tag></div>
                      {entry.tags?.length > 0 && (
                        <div className="saved-tags">
                          {entry.tags.map((tid: any) => { const col = store.collections.find((c: any) => c.id === tid); return col ? <span key={tid} className="mini-tag" style={{ background: col.color + "22", color: col.color }}>{col.name}</span> : null; })}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button className="btn-icon btn-xs" title="Exportar JSON" onClick={() => store.exportJSON(entry.id)}>📤</button>
                      <button className="btn-icon btn-xs" title="Remover" onClick={() => { store.removeCreature(entry.id); showToast("Removido"); }}>🗑</button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </aside>

        {/* CENTER */}
        <main className="builder-main scrollable">
          <div className="builder-inner">
            <div className="mode-toggle-wrap">
              <button className={`mode-btn${mode === "base" ? " active" : ""}`} onClick={() => setMode("base")}>🐉 Base SRD</button>
              <button className={`mode-btn${mode === "scratch" ? " active" : ""}`} onClick={() => setMode("scratch")}>✏️ Do Zero</button>
            </div>
            <SH label="Configuração da Criatura" />
            {mode === "base" && (
              baseMonster
                ? <div className="base-banner"><div className="base-banner-icon">🐉</div><div className="base-banner-info"><div className="base-banner-name">{baseMonster.name}</div><div className="base-banner-tags"><Tag cls="tag-cr">CR {baseMonster.challenge_rating}</Tag><Tag cls="tag-type">{baseMonster.type}</Tag></div></div><button className="btn-icon" onClick={() => { setBaseMonster(null); setCustomName(""); }}>✕</button></div>
                : <div className="base-placeholder">← Selecione um monstro base na lista à esquerda</div>
            )}
            <div style={{ marginBottom: 12 }}>
              <FieldLabel>URL da Imagem (opcional)</FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="mc-input" placeholder="https://exemplo.com/imagem.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                {imageUrl && <img src={imageUrl} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              </div>
            </div>
            <div className="fields-grid-2" style={{ marginBottom: 12 }}>
              <div><FieldLabel>Nome personalizado</FieldLabel><input className="mc-input" placeholder={baseMonster?.name ?? "Nome..."} value={customName} onChange={e => setCustomName(e.target.value)} /></div>
              <div><FieldLabel>Tamanho</FieldLabel><select className="mc-select" value={customSize} onChange={e => setCustomSize(e.target.value)}>{SIZES.map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="fields-grid-2" style={{ marginBottom: 12 }}>
              <div><FieldLabel>Alinhamento</FieldLabel><select className="mc-select" value={customAlign} onChange={e => setCustomAlign(e.target.value)}>{ALIGNS.map(a => <option key={a}>{a}</option>)}</select></div>
              <div><FieldLabel>CR</FieldLabel><select className="mc-select" value={customCR} onChange={e => setCustomCR(e.target.value)}>{CRS.map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            {mode === "scratch" && (
              <>
                <div className="fields-grid-2" style={{ marginBottom: 12 }}>
                  <div><FieldLabel>Tipo</FieldLabel><select className="mc-select" value={scrType} onChange={e => setScrType(e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                  <div><FieldLabel>CA</FieldLabel><input className="mc-input" type="number" value={scrAC} onChange={e => setScrAC(e.target.value)} /></div>
                </div>
                <div className="fields-grid-3" style={{ marginBottom: 12 }}>
                  <div><FieldLabel>HP Máx.</FieldLabel><input className="mc-input" type="number" value={scrHp} onChange={e => setScrHp(e.target.value)} /></div>
                  <div><FieldLabel>Dado de HP</FieldLabel><input className="mc-input" placeholder="4d8+4" value={scrDice} onChange={e => setScrDice(e.target.value)} /></div>
                  <div><FieldLabel>Velocidade (pés)</FieldLabel><input className="mc-input" type="number" value={scrSpeed} onChange={e => setScrSpeed(e.target.value)} /></div>
                </div>
                <div style={{ marginBottom: 12 }}><FieldLabel>Idiomas</FieldLabel><input className="mc-input" placeholder="Comum, Dracônico..." value={scrLang} onChange={e => setScrLang(e.target.value)} /></div>
              </>
            )}
            <div style={{ marginBottom: 16 }}>
              <FieldLabel>Atributos</FieldLabel>
              <div className="stats-grid">
                {STAT_KEYS.map(({ key, label }) => (
                  <div key={key} className="stat-edit-box">
                    <div className="stat-edit-label">{label}</div>
                    <input type="number" min="1" max="30" className="mc-input stat-edit-input" value={customStats[key as keyof typeof customStats]} onChange={e => setCustomStats(p => ({ ...p, [key]: parseInt(e.target.value) || 10 }))} />
                    <div className="stat-edit-mod">{modStr(customStats[key as keyof typeof customStats])}</div>
                  </div>
                ))}
              </div>
            </div>
            {store.collections.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <FieldLabel>Coleções / Tags</FieldLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {store.collections.map((c: any) => {
                    const on = savedTags.includes(c.id);
                    return <button key={c.id} onClick={() => setSavedTags(p => on ? p.filter(x => x !== c.id) : [...p, c.id])} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${c.color}`, background: on ? c.color + "22" : "transparent", color: on ? c.color : "var(--text3)", fontSize: ".75rem", cursor: "pointer", fontWeight: 600, transition: "all .15s" }}>{c.name}</button>;
                  })}
                </div>
              </div>
            )}
            {mode === "base" && baseMonster && <BaseAbilitiesEditor monster={baseMonster} removedAbilities={removedAbilities} onToggle={toggleAbility} />}
            <div className="field-divider" />
            <SH label="Traits Adicionados" />
            <div className={`dropzone${dragOver ? " over" : ""}`} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
              {traits.length === 0
                ? <div className="dropzone-empty"><span className="dropzone-empty-icon">⚗</span><span>Arraste habilidades da biblioteca →</span></div>
                : <div className="chips-wrap">{traits.map((t, i) => <div key={i} className="chip"><TypeBadge type={t.type} /><span className="chip-name">{t.name}</span>{t._source && <span className="chip-source">({t._source})</span>}<span className="rm" onClick={() => setTraits(p => p.filter((_, j) => j !== i))}>×</span></div>)}</div>
              }
            </div>
            {traits.length > 0 && <div style={{ textAlign: "right", marginTop: 6 }}><button className="btn-secondary" style={{ fontSize: ".72rem", color: "#dd4444", borderColor: "#dd4444" }} onClick={() => setTraits([])}>Limpar todos</button></div>}
            {/* CREstimator removido temporariamente */}
            <div className="forge-cta">
              <button className="btn-primary btn-forge" disabled={!canForge} onClick={() => { if (!canForge) { showToast(mode === "base" ? "Selecione um monstro!" : "Digite um nome!", "error"); return; } onForge(creature!, traits, "", imageUrl, null, savedTags); }}>⚗ Forjar Criatura</button>
            </div>
            <div className="preview-section">
              <button className="preview-toggle" onClick={() => setShowPreview(p => !p)} disabled={!creature}>{showPreview ? "▲ Ocultar Prévia" : "▼ Pré-visualizar Ficha"}</button>
              {showPreview && creature && <div className="preview-block"><StatBlock data={creature} extra={traits} image={imageUrl || undefined} /></div>}
            </div>
          </div>
        </main>

        {/* RIGHT */}
        <TraitsPanel addedTraits={traits} showToast={showToast} />
      </div>
      {showColModal && <CollectionModal collections={store.collections} onSave={store.saveCollection} onRemove={store.removeCollection} onClose={() => setShowColModal(false)} />}
    </div>
  );
}
