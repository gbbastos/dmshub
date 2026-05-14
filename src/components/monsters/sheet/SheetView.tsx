"use client";
import { useState, useCallback } from "react";
import { encShare } from "@/lib/monsters/constants";
import { rollDiceExpr } from "@/lib/monsters/dice";
import { Tag, ThemeBtn, SH } from "../ui/micro";
import { StatBlock } from "../statblock/StatBlock";
import { DiceRoller } from "../tools/DiceRoller";
import { DiceRollModal } from "../dice/DiceRollModal";
import { SpellDetailModal } from "../spells/SpellDetailModal";
import { XPCalculator } from "../tools/XPCalculator";
import { VersionHistoryModal } from "../modals/VersionHistoryModal";
import { CREstimator } from "../builder/CREstimator";

interface Props {
  entryId?: number | null;
  creature: any;
  traits: any[];
  notes?: string;
  image?: string;
  onBack: () => void;
  onNew: () => void;
  dark: boolean;
  setDark: (fn: (d: boolean) => boolean) => void;
  store: any;
  showToast: (msg: string, type?: string) => void;
  goHome: () => void;
}

export function SheetView({ entryId, creature, traits, notes, image, onBack, onNew, dark, setDark, store, showToast, goHome }: Props) {
  const [localNotes, setLocalNotes] = useState(notes || "");
  const [showXP,     setShowXP]     = useState(false);
  const [showVer,    setShowVer]    = useState(false);
  const [combatLog,  setCombatLog]  = useState<any[]>([]);
  const [rollResult, setRollResult] = useState<any>(null);
  const [rollAbility,setRollAbility]= useState<any>(null);
  const [spellModal, setSpellModal] = useState<any>(null);

  const addLogEntry = useCallback((entry: any) => {
    if (entry === null) { setCombatLog([]); return; }
    setCombatLog(p => [entry, ...p.slice(0, 49)]);
  }, []);

  const handleAbilityRoll = useCallback((abilityName: string, abilityDesc: string, expr: string) => {
    const result = rollDiceExpr(expr);
    if (!result) return;
    setRollAbility({ name: abilityName, desc: abilityDesc });
    setRollResult(result);
    const { rolls, total, modifier, count } = result;
    const modStr2 = modifier !== 0 ? ` ${modifier >= 0 ? "+" : ""}${modifier}` : "";
    const breakdown = count > 1 ? ` (${rolls.join("+")}${modStr2})` : "";
    const t = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    addLogEntry({ text: `🎲 ${abilityName} — ${expr}: ${total}${breakdown}`, color: "#6b3fa0", t, id: Date.now() });
  }, [addLogEntry]);

  const handleReroll = useCallback((expr: string) => {
    const result = rollDiceExpr(expr);
    if (!result) return;
    setRollResult(result);
    const { rolls, total, modifier, count } = result;
    const modStr2 = modifier !== 0 ? ` ${modifier >= 0 ? "+" : ""}${modifier}` : "";
    const breakdown = count > 1 ? ` (${rolls.join("+")}${modStr2})` : "";
    const t = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    addLogEntry({ text: `🔄 Rerolar ${rollAbility?.name} — ${expr}: ${total}${breakdown}`, color: "#9a6030", t, id: Date.now() });
  }, [rollAbility, addLogEntry]);

  const handleSpellClick = useCallback((spellName: string) => {
    const trait = traits.find(t => t.name === spellName && t.type === "spell");
    setSpellModal({ name: spellName, index: trait?._spellIndex ?? null });
  }, [traits]);

  const entry = store.creatures.find((c: any) => c.id === entryId);

  const saveNotes = () => {
    if (entry) { store.saveCreature({ ...creature, _editId: entryId }, traits, localNotes, image, entry.tags || []); showToast("Notas salvas!"); }
  };

  const shareLink = () => {
    const enc = encShare({ creature, traits, notes: localNotes, image });
    if (!enc) { showToast("Erro ao gerar link", "error"); return; }
    const url = `${window.location.origin}${window.location.pathname}?c=${enc}`;
    navigator.clipboard.writeText(url).then(() => showToast("Link copiado!"), () => { prompt("Copie:", url); });
  };

  const handleSave = () => {
    store.saveCreature({ ...creature, _editId: entryId }, traits, localNotes, image, entry?.tags || []);
    showToast(`"${creature.name}" salvo!`);
  };

  return (
    <div className="sheet-page">
      <nav className="topnav no-print">
        <a href="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="brand-icon" />
          <span className="brand-name">DM&apos;s Hub</span>
          <span className="brand-section">/ Ficha da Criatura</span>
        </a>
        <div className="nav-actions">
          <button className="btn-secondary" onClick={onBack}>← Caldeirão</button>
          <button className="btn-secondary" onClick={onNew}>✦ Nova</button>
          <button className="btn-secondary" onClick={handleSave}>💾 Salvar</button>
          <button className="btn-secondary" onClick={() => setShowXP(true)}>⚔️ XP</button>
          {entry?.versions?.length > 0 && <button className="btn-secondary" onClick={() => setShowVer(true)}>🕒 Versões</button>}
          <button className="btn-secondary" onClick={shareLink}>🔗 Link</button>
          <button className="btn-primary" onClick={() => window.print()}>🖨️ PDF</button>
          <ThemeBtn dark={dark} setDark={setDark} />
        </div>
      </nav>
      <div className="sheet-content">
        <div className="sheet-header no-print">
          <div>
            <h2 className="sheet-title">{creature.name}</h2>
            <div className="tag-row">
              <Tag cls="tag-cr">CR {creature.challenge_rating}</Tag>
              <Tag cls="tag-type">{creature.type}</Tag>
              {traits.length > 0 && <Tag cls="tag-extra">+{traits.length} traits</Tag>}
              {entry?.tags?.map((t: any) => {
                const col = store.collections.find((c: any) => c.id === t);
                return col ? <span key={t} className="tag" style={{ background: col.color + "22", color: col.color, border: `1px solid ${col.color}55` }}>{col.name}</span> : null;
              })}
            </div>
          </div>
          <div style={{ fontSize: ".72rem", color: "var(--text4)", textAlign: "right", maxWidth: 180, lineHeight: 1.5 }}>
            <span style={{ display: "block", marginBottom: 2 }}>🎲 Clique nos dados para rolar</span>
            <span>📖 Clique para ver magias completas</span>
          </div>
        </div>
        <div className="sheet-block-wrap">
          <StatBlock data={creature} extra={traits} image={image} interactive onRoll={handleAbilityRoll} onSpellClick={handleSpellClick} />
        </div>
        {/* CREstimator removido temporariamente */}
        <div className="no-print card" style={{ padding: "18px", marginBottom: 16 }}>
          <SH label="Notas do Mestre" right={<button className="btn-secondary btn-sm" onClick={saveNotes}>Salvar Notas</button>} />
          <textarea className="mc-input" rows={4} placeholder="Segredos, táticas, falas, ganchos de história... (não aparece no PDF)" value={localNotes} onChange={e => setLocalNotes(e.target.value)} style={{ resize: "vertical", lineHeight: 1.6 }} />
        </div>
        <div className="no-print">
          <DiceRoller maxHp={creature?.hit_points} dexterity={creature?.dexterity} sharedLog={combatLog} onLogEntry={addLogEntry} />
        </div>
      </div>
      {showXP  && <XPCalculator onClose={() => setShowXP(false)} />}
      {showVer && entry && <VersionHistoryModal entry={entry} onRestore={store.restoreVersion} onClose={() => setShowVer(false)} />}
      {rollResult && <DiceRollModal result={rollResult} abilityName={rollAbility?.name} abilityDesc={rollAbility?.desc} onReroll={handleReroll} onClose={() => { setRollResult(null); setRollAbility(null); }} />}
      {spellModal && <SpellDetailModal spellName={spellModal.name} spellIndex={spellModal.index} onClose={() => setSpellModal(null)} onRoll={handleAbilityRoll} />}
    </div>
  );
}
