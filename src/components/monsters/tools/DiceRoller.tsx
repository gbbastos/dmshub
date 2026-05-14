"use client";
import { useState, useEffect, useCallback } from "react";
import { modStr } from "@/lib/monsters/constants";
import { rollMultiExpr } from "@/lib/monsters/dice";
import { SH } from "../ui/micro";
import { StatusTracker } from "../combat/StatusTracker";

interface LogEntry { text: string; color: string; t: string; id: number; }
interface Props {
  maxHp?: number;
  dexterity?: number;
  sharedLog?: LogEntry[];
  onLogEntry?: (entry: LogEntry | null) => void;
}

export function DiceRoller({ maxHp, dexterity = 10, sharedLog, onLogEntry }: Props) {
  const [hp,          setHp]          = useState(maxHp ?? 0);
  const [rolls,       setRolls]       = useState<any[]>([]);
  const [showLog,     setShowLog]     = useState(false);
  const [dmg,         setDmg]         = useState("");
  const [heal,        setHeal]        = useState("");
  const [conditions,  setConditions]  = useState<string[]>([]);
  const [customExpr,  setCustomExpr]  = useState("");
  const [customErr,   setCustomErr]   = useState("");
  const [localLog,    setLocalLog]    = useState<LogEntry[]>([]);

  useEffect(() => { setHp(maxHp ?? 0); }, [maxHp]);

  const log    = sharedLog ?? localLog;
  const addLog = useCallback((text: string, color: string) => {
    const t = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const entry: LogEntry = { text, color, t, id: Date.now() };
    if (onLogEntry) onLogEntry(entry);
    else setLocalLog(p => [entry, ...p.slice(0, 49)]);
  }, [onLogEntry]);

  const rollDie = (sides: number) => {
    const v = Math.floor(Math.random() * sides) + 1;
    setRolls(p => [{ v, sides, id: Date.now() }, ...p.slice(0, 11)]);
    addLog(`🎲 d${sides}: ${v}`, v === sides ? "var(--rose)" : v === 1 ? "#dd2222" : "var(--text3)");
  };

  const rollInit = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const dmod = Math.floor((dexterity - 10) / 2);
    const tot  = roll + dmod;
    setRolls(p => [{ v: tot, sides: 20, label: "Init", id: Date.now() }, ...p.slice(0, 11)]);
    addLog(`🎯 Iniciativa: ${roll} ${dmod >= 0 ? "+" : ""}${dmod} = ${tot}`, "#6b3fa0");
  };

  const rollCustom = () => {
    setCustomErr("");
    const raw = customExpr.trim();
    if (!raw) return;
    const result = rollMultiExpr(raw);
    if (!result || result.groups.length === 0) { setCustomErr("Expressão inválida. Use ex: 2d6+4d8+3"); return; }
    const { groups, grandTotal, exprStr } = result;
    const allDice = groups.filter((g: any) => g.rolls).flatMap((g: any) => g.rolls.map((v: number) => ({ v, sides: g.sides, id: Math.random() })));
    setRolls(p => [...allDice, ...p].slice(0, 12));
    const breakdown = groups.map((g: any) => g.rolls ? `[${g.rolls.join("+")}]` : g.label).join(" ");
    addLog(`🎲 ${exprStr}: ${breakdown} = ${grandTotal}`, "#6b3fa0");
  };

  const applyDmg = () => {
    const n = parseInt(dmg); if (!n || n <= 0) return;
    setHp(prev => { const next = Math.max(0, prev - n); addLog(`💥 Dano: ${n} (${prev}→${next})${next === 0 ? " — INCAP." : ""}`, next === 0 ? "#dd2222" : "#c07020"); return next; });
    setDmg("");
  };
  const applyHeal = () => {
    const n = parseInt(heal); if (!n || n <= 0) return;
    setHp(prev => { const next = Math.min(maxHp ?? prev + n, prev + n); addLog(`💚 Cura: ${n} (${prev}→${next})`, "#22aa66"); return next; });
    setHeal("");
  };

  const pct     = maxHp && maxHp > 0 ? Math.max(0, (hp / maxHp) * 100) : 0;
  const hpColor = pct > 50 ? "#22aa66" : pct > 25 ? "#e08020" : "#dd2222";

  return (
    <div className="card dice-card">
      <SH label="Mesa de Jogo" />
      {maxHp && maxHp > 0 && (
        <div className="hp-section">
          <div className="hp-bar-row">
            <span className="field-label" style={{ margin: 0 }}>HP</span>
            <div className="hp-track"><div className="hp-bar"><div className="hp-fill" style={{ width: `${pct}%`, background: hpColor }} /></div></div>
            <span className="hp-label">{hp} / {maxHp}</span>
          </div>
          <div className="hp-controls">
            <div className="hp-input-group">
              <input className="mc-input hp-input" type="number" min="0" placeholder="Dano..." value={dmg} onChange={e => setDmg(e.target.value)} onKeyDown={e => e.key === "Enter" && applyDmg()} />
              <button className="btn-damage" onClick={applyDmg}>💥</button>
            </div>
            <div className="hp-input-group">
              <input className="mc-input hp-input" type="number" min="0" placeholder="Cura..." value={heal} onChange={e => setHeal(e.target.value)} onKeyDown={e => e.key === "Enter" && applyHeal()} />
              <button className="btn-heal" onClick={applyHeal}>💚</button>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => { setHp(maxHp!); addLog(`✨ HP restaurado (${maxHp})`, "#22aa66"); }}>Full HP</button>
          </div>
        </div>
      )}
      <div className="dice-section">
        <div className="custom-expr-row">
          <input className="mc-input custom-expr-input" placeholder="Ex: 2d6 + 4d8 + 3" value={customExpr} onChange={e => { setCustomExpr(e.target.value); setCustomErr(""); }} onKeyDown={e => e.key === "Enter" && rollCustom()} />
          <button className="btn-primary" onClick={rollCustom} style={{ padding: "8px 16px", fontSize: ".82rem", flexShrink: 0 }}>🎲 Rolar</button>
        </div>
        {customErr && <div style={{ fontSize: ".72rem", color: "var(--rose)", marginBottom: 6 }}>{customErr}</div>}
        <button className="btn-initiative" onClick={rollInit}>🎯 Rolar Iniciativa <span className="init-mod">(DES {modStr(dexterity)})</span></button>
        <div className="dice-row">
          {[4, 6, 8, 10, 12, 20, 100].map(d => <button key={d} className="die-btn" onClick={() => rollDie(d)}>d{d}</button>)}
        </div>
        {rolls.length > 0 && (
          <div className="rolls-row">
            {rolls.map((r: any) => (
              <div key={r.id} className="roll-result" style={{ borderColor: r.v === r.sides ? "var(--rose)" : r.v === 1 ? "#dd4444" : "var(--border)" }}>
                <div className="roll-val" style={{ color: r.v === r.sides ? "var(--rose)" : r.v === 1 ? "#dd4444" : "var(--text)" }}>{r.v}</div>
                <div className="roll-die">{r.label || `d${r.sides}`}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="no-print" style={{ marginTop: 16 }}>
        <StatusTracker active={conditions} onChange={setConditions} />
      </div>
      <div className="log-section">
        <button className="log-toggle" onClick={() => setShowLog(p => !p)}>
          📋 Log de Combate {log.length > 0 && <span className="log-count">{log.length}</span>}
          <span style={{ marginLeft: "auto" }}>{showLog ? "▲" : "▼"}</span>
        </button>
        {showLog && (
          <div className="log-body">
            {log.length === 0
              ? <div className="log-empty">Nenhuma ação ainda.</div>
              : log.map(e => <div key={e.id} className="log-entry"><span className="log-time">{e.t}</span><span style={{ color: e.color }}>{e.text}</span></div>)
            }
            {log.length > 0 && <button className="btn-secondary btn-sm" style={{ marginTop: 8, width: "100%" }} onClick={() => { if (onLogEntry) onLogEntry(null); else setLocalLog([]); }}>Limpar log</button>}
          </div>
        )}
      </div>
    </div>
  );
}
