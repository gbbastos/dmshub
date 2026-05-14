"use client";
import { hasDice } from "@/lib/monsters/dice";
import { isSpellcastingAbility, parseSpellcasting } from "@/lib/monsters/spells";
import { RollableText } from "../dice/RollableText";
import { SpellcastingDisplay } from "../spells/SpellcastingDisplay";

interface Props {
  ability: any;
  interactive?: boolean;
  onRoll?: (name: string, desc: string, expr: string) => void;
  onSpellClick?: (name: string) => void;
  isSpell?: boolean;
  isSpellcasting?: boolean;
  addedSpells?: any[];
}

export function AbilityEntry({ ability, interactive, onRoll, onSpellClick, isSpell, isSpellcasting, addedSpells }: Props) {
  const name = ability.name ?? "";
  const desc = ability.desc ?? ability.description ?? "";

  if (isSpellcasting && interactive) {
    return (
      <p className="sb-entry sb-spellcasting">
        <strong className="sb-tname">{name}.</strong>{" "}
        <SpellcastingDisplay desc={desc} addedSpells={addedSpells ?? []} onSpellClick={onSpellClick} onRoll={onRoll} interactive={interactive} />
      </p>
    );
  }

  if (isSpellcasting && !interactive) {
    const { preamble, sections } = parseSpellcasting(desc);
    return (
      <p className="sb-entry sb-spellcasting">
        <strong className="sb-tname">{name}.</strong>{" "}
        <em>
          {preamble}{" "}
          {sections.map((sec: any, si: number) => (
            <span key={si} className="spell-list-section">
              <span className="spell-list-header">{sec.header}: </span>
              {sec.spells.join(", ")}
            </span>
          ))}
        </em>
      </p>
    );
  }

  const clickable = interactive && (hasDice(desc) || isSpell);
  const handleClick = () => { if (isSpell && onSpellClick) onSpellClick(name); };

  return (
    <p className={`sb-entry${clickable ? " ability-row" : ""}`} onClick={clickable ? handleClick : undefined}>
      <strong className="sb-tname">{name}.</strong>{" "}
      {interactive && !isSpell
        ? <em><RollableText text={desc} onRoll={(expr) => onRoll!(name, desc, expr)} /></em>
        : <em>{desc}</em>
      }
      {isSpell && interactive && (
        <span style={{ marginLeft: 6, fontSize: ".72rem", color: "var(--purple)", cursor: "pointer" }}
          onClick={e => { e.stopPropagation(); onSpellClick?.(name); }} title="Ver detalhes da magia">📖</span>
      )}
    </p>
  );
}
