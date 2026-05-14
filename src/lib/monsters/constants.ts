export const API = "";

export const SIZES  = ["Minúsculo","Pequeno","Médio","Grande","Enorme","Gigantesco"];
export const TYPES  = ["Aberração","Besta","Celestial","Constructo","Dragão","Elemental","Fada","Demônio","Gigante","Humanoide","Monstrosidade","Morto-vivo","Planta","Gosma"];
export const ALIGNS = ["Leal Bom","Neutro Bom","Caótico Bom","Leal Neutro","Neutro","Caótico Neutro","Leal Mau","Neutro Mau","Caótico Mau","Sem Alinhamento"];
export const CRS    = ["0","1/8","1/4","1/2","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","30"];

export const CR_XP: Record<string, number> = {
  "0":10,"1/8":25,"1/4":50,"1/2":100,"1":200,"2":450,"3":700,"4":1100,
  "5":1800,"6":2300,"7":2900,"8":3900,"9":5000,"10":5900,"11":7200,
  "12":8400,"13":10000,"14":11500,"15":13000,"16":15000,"17":18000,
  "18":20000,"19":22000,"20":25000,"21":33000,"22":41000,"23":50000,
  "24":62000,"25":75000,"30":155000,
};

export const CR_NUM: Record<string, number> = {
  "0":0,"1/8":.125,"1/4":.25,"1/2":.5,"1":1,"2":2,"3":3,"4":4,"5":5,
  "6":6,"7":7,"8":8,"9":9,"10":10,"11":11,"12":12,"13":13,"14":14,
  "15":15,"16":16,"17":17,"18":18,"19":19,"20":20,"21":21,"22":22,
  "23":23,"24":24,"25":25,"30":30,
};

export const XP_THRESHOLDS: Record<number, number[]> = {
  1:[25,50,75,100],2:[50,100,150,200],3:[75,150,225,400],4:[125,250,375,500],
  5:[250,500,750,1100],6:[300,600,900,1400],7:[350,750,1100,1700],8:[450,900,1400,2100],
  9:[550,1100,1600,2400],10:[600,1200,1900,2800],11:[800,1600,2400,3600],12:[1000,2000,3000,4500],
  13:[1100,2200,3400,5100],14:[1250,2500,3800,5700],15:[1400,2800,4300,6400],16:[1600,3200,4800,7200],
  17:[2000,3900,5900,8800],18:[2100,4200,6300,9500],19:[2400,4900,7300,10900],20:[2800,5700,8500,12700],
};

export const CONDITIONS = [
  { id:"blinded",      label:"Cego",         icon:"😶‍🌫️", desc:"Falha automaticamente em testes que dependam de visão. Ataques contra ele têm vantagem; os seus têm desvantagem." },
  { id:"charmed",      label:"Enfeitiçado",   icon:"💕", desc:"Não pode atacar o encantador. O encantador tem vantagem em testes de carisma contra ele." },
  { id:"deafened",     label:"Ensurdecido",   icon:"🔇", desc:"Não pode ouvir. Falha automaticamente em testes que dependam de audição." },
  { id:"exhaustion",   label:"Exausto",       icon:"💤", desc:"Penalidades progressivas em seis níveis: desvantagem em testes → velocidade → ataque/salvaguarda → HP máx. → velocidade 0 → morte." },
  { id:"frightened",   label:"Amedrontado",   icon:"😱", desc:"Desvantagem em testes e ataques enquanto puder ver a fonte. Não pode se mover voluntariamente em direção a ela." },
  { id:"grappled",     label:"Agarrado",      icon:"🤝", desc:"Velocidade reduzida a 0. A condição termina se o agarrador for incapacitado ou se o alvo se mover para fora do alcance." },
  { id:"incapacitated",label:"Incapacitado",  icon:"🤯", desc:"Não pode executar ações nem reações." },
  { id:"invisible",    label:"Invisível",     icon:"👻", desc:"Impossível de ser visto sem meios mágicos. Ataques dele têm vantagem; ataques contra ele têm desvantagem." },
  { id:"paralyzed",    label:"Paralisado",    icon:"🧊", desc:"Incapacitado, não pode falar nem mover-se. Acertos automáticos a menos de 5 pés são críticos. Ataques contra ele têm vantagem." },
  { id:"petrified",    label:"Petrificado",   icon:"🪨", desc:"Transformado em pedra. Incapacitado, resistência a todos os danos, imune a veneno e doença." },
  { id:"poisoned",     label:"Envenenado",    icon:"🤢", desc:"Desvantagem em ataques e testes de habilidade." },
  { id:"prone",        label:"Caído",         icon:"🫃", desc:"Mover-se custa velocidade extra. Ataques corpo a corpo contra ele têm vantagem. Ataques à distância têm desvantagem." },
  { id:"restrained",   label:"Contido",       icon:"🕸️", desc:"Velocidade 0. Ataques contra ele têm vantagem; os seus têm desvantagem. Desvantagem em salvaguardas de DES." },
  { id:"stunned",      label:"Atordoado",     icon:"⭐", desc:"Incapacitado, não pode mover-se, fala balbuciada. Ataques contra ele têm vantagem. Falha automática em salvaguardas de FOR e DES." },
  { id:"unconscious",  label:"Inconsciente",  icon:"😵", desc:"Incapacitado, cai ao chão. Acertos a menos de 5 pés são críticos. Ataques contra ele têm vantagem." },
];

export const COLLECTION_COLORS = ["#e03f72","#e04040","#e08020","#20aa60","#2080e0","#8040e0","#606060"];

export const SCRATCH_DEFAULTS = {
  name:"Nova Criatura", size:"Médio", type:"Monstrosidade", alignment:"Neutro",
  challenge_rating:"1", hit_points:22, hit_dice:"4d8+4",
  armor_class:[{value:13,type:"armadura natural"}], speed:{walk:"30 pés"},
  strength:14, dexterity:12, constitution:13, intelligence:8, wisdom:10, charisma:7,
  languages:"—", senses:{passive_perception:10},
  proficiencies:[], damage_resistances:[], damage_immunities:[], condition_immunities:[],
  special_abilities:[], actions:[], legendary_actions:[],
};

export const crToXp  = (cr: string | number) => { const v = CR_XP[String(cr)]; return v != null ? v.toLocaleString("pt-BR") : "—"; };
export const modStr  = (v?: number) => { const m = Math.floor(((v ?? 10) - 10) / 2); return (m >= 0 ? "+" : "") + m; };
export const encShare = (d: unknown) => { try { return btoa(unescape(encodeURIComponent(JSON.stringify(d)))); } catch { return null; } };
export const decShare = (s: string) => { try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch { return null; } };
