"use client";
import { parseSpellcasting, spellLevelHeader } from "@/lib/monsters/spells";
import { RollableText } from "../dice/RollableText";

interface Props {
  desc?: string;
  addedSpells?: any[];
  onSpellClick?: (name: string) => void;
  onRoll?: (name: string, desc: string, expr: string) => void;
  interactive?: boolean;
}

export function SpellcastingDisplay({ desc, addedSpells = [], onSpellClick, onRoll, interactive }: Props) {
  const { preamble, sections } = parseSpellcasting(desc);
  const merged = sections.map((s: any) => ({ ...s, spells: [...s.spells], isAdded: false }));

  for (const spell of addedSpells) {
    const lvl = spell._spellLevel ?? 0;
    const existing = merged.find((s: any) => s.level === lvl);
    const name = spell.name;
    const alreadyIn = merged.some((s: any) => s.spells.some((sp: string) => sp.toLowerCase() === name.toLowerCase()));
    if (alreadyIn) continue;
    if (existing) { existing.spells.push(name); existing.isAdded = true; }
    else {
      merged.push({ header: spellLevelHeader(lvl, null), spells: [name], level: lvl, slots: null, isNew: true });
      merged.sort((a: any, b: any) => a.level - b.level);
    }
  }

  return (
    <span>
      {preamble && (
        <em>
          {interactive
            ? <RollableText text={preamble} onRoll={(expr) => onRoll?.("Spellcasting", preamble, expr)} />
            : preamble
          }{" "}
        </em>
      )}
      {merged.length > 0 && (
        <span className="spell-list-block">
          {merged.map((sec: any, si: number) => (
            <span key={si} className="spell-list-section">
              <span className={`spell-list-header${sec.isNew || sec.isAdded ? " spell-list-header-added" : ""}`}>{sec.header}:</span>{" "}
              {sec.spells.map((spell: string, idx: number) => (
                <span key={idx}>
                  <span className="spell-link" onClick={e => { e.stopPropagation(); onSpellClick?.(spell); }} title={`Ver ${spell}`}>{spell}</span>
                  {idx < sec.spells.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
