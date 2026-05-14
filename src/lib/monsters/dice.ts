export const DICE_RE = /(\d+\s*)?\((\d+d\d+(?:\s*[+\-]\s*\d+)?)\)|(\d+d\d+(?:\s*[+\-]\s*\d+)?)/gi;

export function parseDiceExpr(expr: string) {
  const m = expr.replace(/\s/g, "").match(/^(\d+)d(\d+)([+\-]\d+)?$/i);
  if (!m) return null;
  return { count: parseInt(m[1]), sides: parseInt(m[2]), modifier: m[3] ? parseInt(m[3]) : 0 };
}

export function rollDiceExpr(expr: string) {
  const p = parseDiceExpr(expr);
  if (!p) return null;
  const rolls = Array.from({ length: p.count }, () => Math.floor(Math.random() * p.sides) + 1);
  const sum   = rolls.reduce((a, b) => a + b, 0);
  return { rolls, sum, modifier: p.modifier, total: sum + p.modifier, expr: expr.trim(), count: p.count, sides: p.sides };
}

export function rollMultiExpr(raw: string) {
  const cleaned = raw.replace(/\s/g, "");
  const tokens  = cleaned.match(/[+\-]?[0-9]+d[0-9]+|[+\-]?\d+/gi) ?? [];
  if (tokens.length === 0) return null;
  const groups: any[] = [];
  let grand = 0;
  for (const token of tokens) {
    const diceM = token.match(/^([+\-]?)(\d+)d(\d+)$/i);
    if (diceM) {
      const sign  = diceM[1] === "-" ? -1 : 1;
      const count = parseInt(diceM[2]);
      const sides = parseInt(diceM[3]);
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const sub   = rolls.reduce((a, b) => a + b, 0) * sign;
      grand += sub;
      groups.push({ label: `${sign < 0 ? "-" : ""}${count}d${sides}`, rolls, sides, sub, sign });
    } else {
      const n = parseInt(token);
      if (!isNaN(n)) { grand += n; groups.push({ label: n >= 0 ? `+${n}` : String(n), flat: n }); }
    }
  }
  return { groups, grandTotal: grand, exprStr: cleaned };
}

export function splitDiceText(text: string) {
  const segs: Array<{ type: string; content: string; expr?: string }> = [];
  let last = 0;
  DICE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DICE_RE.exec(text)) !== null) {
    if (m.index > last) segs.push({ type: "text", content: text.slice(last, m.index) });
    const diceExpr = (m[2] ?? m[3] ?? "").replace(/\s/g, "");
    segs.push(parseDiceExpr(diceExpr)
      ? { type: "dice", content: m[0], expr: diceExpr }
      : { type: "text", content: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ type: "text", content: text.slice(last) });
  return segs;
}

export function hasDice(text?: string) {
  if (!text) return false;
  DICE_RE.lastIndex = 0;
  const m = DICE_RE.exec(text);
  DICE_RE.lastIndex = 0;
  if (!m) return false;
  return !!parseDiceExpr((m[2] ?? m[3] ?? "").replace(/\s/g, ""));
}
