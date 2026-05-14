"use client";
import { modStr, crToXp } from "@/lib/monsters/constants";
import { isSpellcastingAbility } from "@/lib/monsters/spells";
import { AbilityEntry } from "./AbilityEntry";

interface Props {
  data: any;
  extra?: any[];
  image?: string;
  interactive?: boolean;
  onRoll?: (name: string, desc: string, expr: string) => void;
  onSpellClick?: (name: string) => void;
}

const ATTRS = [
  { l: "FOR", k: "strength" }, { l: "DES", k: "dexterity" }, { l: "CON", k: "constitution" },
  { l: "INT", k: "intelligence" }, { l: "SAB", k: "wisdom" }, { l: "CAR", k: "charisma" },
];

export function StatBlock({ data, extra = [], image, interactive = false, onRoll, onSpellClick }: Props) {
  if (!data) return null;

  const speedStr  = data.speed  ? Object.entries(data.speed).filter(([, v]) => v).map(([k, v]) => k === "walk" ? v : `${k} ${v}`).join(", ") : "—";
  const sensesStr = data.senses ? Object.entries(data.senses).map(([k, v]) => k === "passive_perception" ? `Percepção Passiva ${v}` : k.replace(/_/g, " ") + " " + v).join(", ") : "—";
  const acStr     = data.armor_class?.[0] ? `${data.armor_class[0].value}${data.armor_class[0].type ? ` (${data.armor_class[0].type})` : ""}` : "—";

  const hasSpellcasting  = data.special_abilities?.some((a: any) => isSpellcastingAbility(a.name));
  const extraSpecial     = extra.filter(t => t.type === "special");
  const extraActions     = extra.filter(t => t.type === "action");
  const extraLegendary   = extra.filter(t => t.type === "legendary");
  const extraReactions   = extra.filter(t => t.type === "reaction");
  const extraSpells      = extra.filter(t => t.type === "spell");
  const orphanSpells     = extraSpells.filter(() => !hasSpellcasting);
  const orphans          = extra.filter(t => !["special","action","legendary","reaction","spell"].includes(t.type));
  const orphanAll        = [...orphanSpells, ...orphans];

  const renderExtra = (list: any[]) => list.map((t, i) => (
    <AbilityEntry key={`ex-${i}`} ability={t} interactive={interactive} onRoll={onRoll} onSpellClick={onSpellClick} isSpell={t.type === "spell"} />
  ));

  return (
    <div className="stat-block">
      {image && <img src={image} alt={data.name} className="sb-image" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
      <div className="sb-name">{data.name}</div>
      <div className="sb-sub">{data.size} {data.type}{data.subtype ? ` (${data.subtype})` : ""}, {data.alignment}</div>
      <div className="sb-div" />
      <p><span className="sb-lbl">Classe de Armadura </span>{acStr}</p>
      <p>
        <span className="sb-lbl">Pontos de Vida </span>
        {interactive
          ? <><span>{data.hit_points} </span><span className="dice-expr" onClick={() => onRoll?.("HP", "", data.hit_dice?.replace(/\s/g, "") ?? "1d8")} title={`Rolar ${data.hit_dice}`}>({data.hit_dice})</span></>
          : <>{data.hit_points} ({data.hit_dice})</>
        }
      </p>
      <p><span className="sb-lbl">Velocidade </span>{speedStr}</p>
      <div className="sb-div" />
      <div className="sb-attrs">
        {ATTRS.map(a => (
          <div key={a.l} className="stat-box">
            <div className="stat-box-lbl">{a.l}</div>
            <div className="stat-box-val">{data[a.k] ?? 10}</div>
            <div className="stat-box-mod">{modStr(data[a.k])}</div>
          </div>
        ))}
      </div>
      <div className="sb-div" />
      {data.proficiencies?.length > 0 && <p><span className="sb-lbl">Proficiências </span>{data.proficiencies.map((p: any) => `${p.proficiency.name.replace("Saving Throw: ", "TR: ").replace("Skill: ", "")} ${p.value >= 0 ? "+" : ""}${p.value}`).join(", ")}</p>}
      {data.damage_vulnerabilities?.length > 0 && <p><span className="sb-lbl">Vulnerabilidades </span>{data.damage_vulnerabilities.join(", ")}</p>}
      {data.damage_resistances?.length > 0 && <p><span className="sb-lbl">Resistências </span>{data.damage_resistances.join(", ")}</p>}
      {data.damage_immunities?.length > 0 && <p><span className="sb-lbl">Imunidades a Dano </span>{data.damage_immunities.join(", ")}</p>}
      {data.condition_immunities?.length > 0 && <p><span className="sb-lbl">Imunidades (Cond.) </span>{data.condition_immunities.map((c: any) => c.name).join(", ")}</p>}
      <p><span className="sb-lbl">Sentidos </span>{sensesStr}</p>
      <p><span className="sb-lbl">Idiomas </span>{data.languages || "—"}</p>
      <p><span className="sb-lbl">Nível de Desafio </span>{data.challenge_rating} ({crToXp(data.challenge_rating)} XP)</p>

      {(extraSpecial.length > 0 || orphanAll.length > 0 || data.special_abilities?.length > 0) && (
        <>
          <div className="sb-div" />
          {data.special_abilities?.map((t: any, i: number) => {
            const sc = isSpellcastingAbility(t.name);
            const addedSpells = sc ? extraSpells.filter(() => hasSpellcasting) : [];
            return <AbilityEntry key={i} ability={t} interactive={interactive} onRoll={onRoll} onSpellClick={onSpellClick} isSpell={false} isSpellcasting={sc} addedSpells={addedSpells} />;
          })}
          {extraSpecial.length > 0 && <><div className="sb-added-label">✦ Habilidades Especiais Adicionadas</div>{renderExtra(extraSpecial)}</>}
          {orphanAll.length > 0 && renderExtra(orphanAll)}
        </>
      )}

      {(data.actions?.length > 0 || extraActions.length > 0) && (
        <>
          <div className="sb-sec">Ações</div>
          {data.actions?.map((a: any, i: number) => <AbilityEntry key={i} ability={a} interactive={interactive} onRoll={onRoll} onSpellClick={onSpellClick} isSpell={false} />)}
          {extraActions.length > 0 && <><div className="sb-added-label">✦ Ações Adicionadas</div>{renderExtra(extraActions)}</>}
        </>
      )}

      {(data.reactions?.length > 0 || extraReactions.length > 0) && (
        <>
          <div className="sb-sec">Reações</div>
          {data.reactions?.map((a: any, i: number) => <AbilityEntry key={i} ability={a} interactive={interactive} onRoll={onRoll} onSpellClick={onSpellClick} isSpell={false} />)}
          {extraReactions.length > 0 && renderExtra(extraReactions)}
        </>
      )}

      {(data.legendary_actions?.length > 0 || extraLegendary.length > 0) && (
        <>
          <div className="sb-sec">Ações Lendárias</div>
          <p style={{ fontStyle: "italic", color: "#5c3a00", marginBottom: 8, fontSize: ".8rem" }}>
            {data.name} pode executar 3 ações lendárias por rodada.
          </p>
          {data.legendary_actions?.map((a: any, i: number) => <AbilityEntry key={i} ability={a} interactive={interactive} onRoll={onRoll} onSpellClick={onSpellClick} isSpell={false} />)}
          {extraLegendary.length > 0 && <><div className="sb-added-label">✦ Ações Lendárias Adicionadas</div>{renderExtra(extraLegendary)}</>}
        </>
      )}
    </div>
  );
}
