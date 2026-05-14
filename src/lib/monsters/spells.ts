const ORDINALS: Record<number, string> = { 1:"1st", 2:"2nd", 3:"3rd", 4:"4th", 5:"5th", 6:"6th", 7:"7th", 8:"8th", 9:"9th" };

export function spellNameToIndex(name: string) {
  return name.toLowerCase().trim().replace(/[/]/g, "-").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

export function levelFromHeader(header: string) {
  if (/cantrip/i.test(header)) return 0;
  const m = header.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

export function parseSpellcasting(desc?: string) {
  if (!desc) return { preamble: "", sections: [] as any[] };
  const listRe = /[-•]?\s*(cantrips?\s*\([^)]*\)|(?:1st|2nd|3rd|\d+th)\s+level\s*\([^)]*\))\s*:\s*([^-\n\r•]*)/gi;
  const sections: any[] = [];
  let firstMatch: number | null = null;
  let m: RegExpExecArray | null;
  while ((m = listRe.exec(desc)) !== null) {
    if (firstMatch === null) firstMatch = m.index;
    const header    = m[1].trim();
    const spellText = m[2].trim();
    const spells    = spellText.split(",").map((s: string) => s.trim().replace(/\s+/g, " ")).filter(Boolean);
    const level     = levelFromHeader(header);
    const slotsMatch = header.match(/(\d+)\s*slot/i);
    sections.push({ header, spells, level, slots: slotsMatch ? slotsMatch[1] : null });
  }
  const preamble = firstMatch != null ? desc.slice(0, firstMatch).trim() : desc;
  return { preamble, sections };
}

export function isSpellcastingAbility(name?: string) {
  return /spellcasting|innate spellcasting/i.test(name ?? "");
}

export function spellLevelHeader(level: number, slots: string | null) {
  if (level === 0) return `Cantrips (at will)`;
  const ord = ORDINALS[level] ?? `${level}th`;
  return slots ? `${ord} level (${slots} slot${parseInt(slots) > 1 ? "s" : ""})` : `${ord} level`;
}
