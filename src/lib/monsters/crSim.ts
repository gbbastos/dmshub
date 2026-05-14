const PARTY: Record<number, { hp: number; dpr: number; ac: number; atk: number }> = {
  1: { hp:28,  dpr:16,  ac:13, atk:4  }, 2: { hp:44,  dpr:22,  ac:13, atk:4  },
  3: { hp:60,  dpr:34,  ac:14, atk:5  }, 4: { hp:76,  dpr:42,  ac:14, atk:5  },
  5: { hp:100, dpr:58,  ac:15, atk:6  }, 6: { hp:116, dpr:66,  ac:15, atk:6  },
  7: { hp:132, dpr:74,  ac:15, atk:7  }, 8: { hp:152, dpr:82,  ac:16, atk:7  },
  9: { hp:172, dpr:90,  ac:16, atk:7  }, 10:{ hp:192, dpr:100, ac:16, atk:8  },
  11:{ hp:212, dpr:110, ac:17, atk:8  }, 12:{ hp:230, dpr:120, ac:17, atk:8  },
  13:{ hp:248, dpr:130, ac:17, atk:9  }, 14:{ hp:266, dpr:140, ac:18, atk:9  },
  15:{ hp:284, dpr:150, ac:18, atk:9  }, 16:{ hp:302, dpr:160, ac:18, atk:10 },
  17:{ hp:320, dpr:170, ac:18, atk:10 }, 18:{ hp:340, dpr:180, ac:18, atk:10 },
  19:{ hp:360, dpr:190, ac:19, atk:11 }, 20:{ hp:380, dpr:200, ac:19, atk:11 },
};

export { PARTY };

const OFFICIAL_CRS = [0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const CR_LABELS: Record<number, string> = { 0:"0", 0.125:"1/8", 0.25:"1/4", 0.5:"1/2" };

function snapToCR(val: number) {
  val = Math.max(0, Math.min(30, val));
  let closest = OFFICIAL_CRS[0];
  for (const c of OFFICIAL_CRS) {
    if (Math.abs(c - val) < Math.abs(closest - val)) closest = c;
  }
  return closest;
}
function fmtCR(v: number) { return CR_LABELS[v] ?? String(v); }

function avgDice(expr: string) {
  if (!expr) return 0;
  const clean = expr.replace(/\s/g, "");
  const m = clean.match(/^(\d+)d(\d+)([+\-]\d+)?$/i);
  if (!m) return parseInt(expr) || 0;
  const avg = parseInt(m[1]) * (parseInt(m[2]) + 1) / 2;
  const mod = m[3] ? parseInt(m[3]) : 0;
  return avg + mod;
}

function extractDamageFromText(text: string) {
  if (!text) return 0;
  let best = 0;
  const withFlat = text.matchAll(/(\d+)\s*\((\d+d\d+(?:\s*[+\-]\s*\d+)?)\)/g);
  for (const m of withFlat) { const v = parseInt(m[1]); best = Math.max(best, v); }
  if (best > 0) return best;
  const bare = text.matchAll(/(\d+d\d+(?:\s*[+\-]\s*\d+)?)/g);
  for (const m of bare) { const v = avgDice(m[1].replace(/\s/g, "")); best = Math.max(best, v); }
  return best;
}

function extractAttackBonus(text: string) {
  if (!text) return null;
  const m = text.match(/([+\-]\d+)\s*to hit/i);
  return m ? parseInt(m[1]) : null;
}

function estimateDPR(creature: any, extraTraits: any[] = []) {
  const allActions = [...(creature.actions ?? []), ...(creature.legendary_actions ?? []), ...extraTraits.filter(t => t.type === "action" || t.type === "legendary")];
  if (allActions.length === 0) return 5;
  let hasMultiattack = false;
  const damages: number[] = [];
  for (const a of allActions) {
    const desc = a.desc ?? a.description ?? "";
    if (/multiattack/i.test(a.name)) { hasMultiattack = true; continue; }
    const dmg = extractDamageFromText(desc);
    if (dmg > 0) damages.push(dmg);
  }
  damages.sort((a, b) => b - a);
  if (damages.length === 0) return 5;
  let dpr = hasMultiattack && damages.length >= 2 ? damages[0] + damages[1] : damages[0];
  const legendaryDmg = extraTraits.filter(t => t.type === "legendary").reduce((s, t) => s + extractDamageFromText(t.desc ?? ""), 0);
  dpr += legendaryDmg * 0.33;
  return Math.max(1, dpr);
}

function estimateAttackBonus(creature: any, extraTraits: any[] = []) {
  const allActions = [...(creature.actions ?? []), ...extraTraits.filter(t => t.type === "action")];
  for (const a of allActions) {
    const atk = extractAttackBonus(a.desc ?? a.description ?? "");
    if (atk != null) return atk;
  }
  const cr = parseFloat(String(creature.challenge_rating).replace("1/8", ".125").replace("1/4", ".25").replace("1/2", ".5")) || 1;
  return 2 + Math.floor(cr / 4);
}

function calcEHP(creature: any, extraTraits: any[] = []) {
  const hp = creature.hit_points ?? 10;
  const resists = creature.damage_resistances ?? [];
  const immunities = creature.damage_immunities ?? [];
  const allSpecials = [...(creature.special_abilities ?? []), ...extraTraits.filter(t => t.type === "special")];
  const hasMagicRes = allSpecials.some((a: any) => /magic resistance/i.test(a.name ?? "") || /advantage on saving throws against spells/i.test(a.desc ?? a.description ?? ""));
  const physicalTypes = ["bludgeoning", "piercing", "slashing"];
  let resMulti = 1.0;
  const physResist = physicalTypes.filter(t => resists.some((r: string) => r.toLowerCase().includes(t)));
  const physImmune = physicalTypes.filter(t => immunities.some((r: string) => r.toLowerCase().includes(t)));
  if (physImmune.length >= 2) resMulti *= 2.0;
  else if (physImmune.length === 1) resMulti *= 1.5;
  else if (physResist.length >= 2) resMulti *= 1.4;
  else if (physResist.length === 1) resMulti *= 1.2;
  const elemTypes = ["fire","cold","lightning","thunder","acid","poison","necrotic","radiant"];
  const elemRes = elemTypes.filter(t => resists.some((r: string) => r.toLowerCase().includes(t)));
  const elemImm = elemTypes.filter(t => immunities.some((r: string) => r.toLowerCase().includes(t)));
  if (elemImm.length >= 3) resMulti *= 1.35;
  else if (elemImm.length >= 1) resMulti *= 1.15;
  if (elemRes.length >= 3) resMulti *= 1.15;
  if (hasMagicRes) resMulti *= 1.2;
  return hp * resMulti;
}

function actionEconMultiplier(creature: any, extraTraits: any[] = []) {
  let mult = 1.0;
  const allSpecials = [...(creature.special_abilities ?? []), ...extraTraits.filter(t => t.type === "special")];
  const hasLeg = (creature.legendary_actions?.length ?? 0) > 0 || extraTraits.some(t => t.type === "legendary");
  const hasLegRes = allSpecials.some((a: any) => /legendary resistance/i.test(a.name ?? ""));
  const hasMultiattack = (creature.actions ?? []).some((a: any) => /multiattack/i.test(a.name ?? ""));
  if (hasLeg) mult *= 1.5;
  if (hasLegRes) mult *= 1.3;
  if (hasMultiattack) mult *= 1.15;
  mult *= 0.8;
  return mult;
}

function controlMultiplier(creature: any, extraTraits: any[] = []) {
  let mult = 1.0;
  const allText = [...(creature.actions ?? []), ...(creature.special_abilities ?? []), ...extraTraits]
    .map((a: any) => (a.desc ?? a.description ?? a.name ?? "").toLowerCase()).join(" ");
  if (/\bstun\b/.test(allText))             mult *= 1.3;
  if (/\bparalyz/.test(allText))            mult *= 1.35;
  if (/\bfrightened\b/.test(allText))       mult *= 1.15;
  if (/\bknocked prone\b/.test(allText))    mult *= 1.1;
  if (/each creature within/.test(allText)) mult *= 1.2;
  if (/save or/.test(allText))              mult *= 1.1;
  return mult;
}

export function simulateCR(creature: any, extraTraits: any[] = [], partyLevel = 5) {
  const party          = PARTY[Math.max(1, Math.min(20, partyLevel))];
  const monsterEHP     = calcEHP(creature, extraTraits);
  const monsterDPR     = estimateDPR(creature, extraTraits);
  const monsterATK     = estimateAttackBonus(creature, extraTraits);
  const monsterAC      = creature.armor_class?.[0]?.value ?? 13;
  const aeMulti        = actionEconMultiplier(creature, extraTraits);
  const ctrlMulti      = controlMultiplier(creature, extraTraits);
  const partyHitChance   = Math.max(0.05, Math.min(0.95, (21 + party.atk - monsterAC) / 20));
  const monsterHitChance = Math.max(0.05, Math.min(0.95, (21 + monsterATK - party.ac) / 20));
  const partyDPR_effective   = party.dpr * partyHitChance;
  const monsterDPR_effective = monsterDPR * monsterHitChance * aeMulti * ctrlMulti;
  let partyHP = party.hp, monsterHPsim = monsterEHP, rounds = 0;
  const MAX_ROUNDS = 200;
  const log: any[] = [];
  while (partyHP > 0 && monsterHPsim > 0 && rounds < MAX_ROUNDS) {
    rounds++;
    monsterHPsim -= partyDPR_effective;
    partyHP      -= monsterDPR_effective;
    if (rounds <= 6) log.push({ r: rounds, mHP: Math.round(monsterHPsim), pHP: Math.round(partyHP) });
  }
  const ttk_monster = monsterEHP / Math.max(0.1, partyDPR_effective);
  const ttk_party   = party.hp   / Math.max(0.1, monsterDPR_effective);
  const ratio       = ttk_party  / Math.max(0.1, ttk_monster);
  const crFloat     = partyLevel * (1 / ratio);
  const crSnapped   = snapToCR(crFloat);
  const outcome = partyHP <= 0 && monsterHPsim > 0 ? "monster" : monsterHPsim <= 0 && partyHP > 0 ? "party" : rounds >= MAX_ROUNDS ? "stalemate" : "party";
  return {
    cr: crSnapped, crLabel: fmtCR(crSnapped), crFloat: Math.round(crFloat * 10) / 10,
    ttk_monster: Math.round(ttk_monster * 10) / 10, ttk_party: Math.round(ttk_party * 10) / 10,
    ratio: Math.round(ratio * 100) / 100, rounds, outcome, roundLog: log,
    partyDPR_effective: Math.round(partyDPR_effective), monsterDPR_effective: Math.round(monsterDPR_effective * 10) / 10,
    monsterEHP: Math.round(monsterEHP), aeMulti: Math.round(aeMulti * 100) / 100, ctrlMulti: Math.round(ctrlMulti * 100) / 100,
    partyHitChance: Math.round(partyHitChance * 100), monsterHitChance: Math.round(monsterHitChance * 100),
  };
}
