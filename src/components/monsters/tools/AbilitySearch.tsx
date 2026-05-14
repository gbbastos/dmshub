"use client";
import { useState, useEffect, useRef } from "react";
import { API } from "@/lib/monsters/constants";
import { abilityCache } from "@/lib/monsters/hooks";
import { SH, TypeBadge } from "../ui/micro";

interface Props { goHome: () => void; }

function highlightText(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: "#ffe066", borderRadius: 2, padding: "0 2px" }}>{p}</mark>
      : p
  );
}

export function AbilitySearch({ goHome }: Props) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<any[]>([]);
  const [monList,  setMonList]  = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPct,  setScanPct]  = useState(0);
  const abortRef = useRef(false);

  useEffect(() => {
    fetch(`${API}/api/monsters`).then(r => r.json()).then(d => setMonList(d.results ?? [])).catch(() => {});
  }, []);

  const searchCache = () => {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const found: any[] = [];
    abilityCache.forEach((data, idx) => {
      const all = [...(data.specials || []), ...(data.actions || []), ...(data.legendaries || []), ...(data.reactions || [])];
      all.forEach((a: any) => {
        const name = (a.name || "").toLowerCase();
        const desc = (a.desc || a.description || "").toLowerCase();
        if (name.includes(q) || desc.includes(q)) found.push({ monster: data.name, monsterIdx: idx, ...a });
      });
    });
    setResults(found); setSearched(true);
  };

  const deepScan = async () => {
    if (!query.trim()) return;
    abortRef.current = false;
    setScanning(true); setResults([]); setSearched(false); setScanPct(0);
    const toFetch = monList.filter(m => !abilityCache.has(m.index)).slice(0, 50);
    for (let i = 0; i < toFetch.length; i++) {
      if (abortRef.current) break;
      try {
        const d = await fetch(`${API}${toFetch[i].url}`).then(r => r.json());
        abilityCache.set(toFetch[i].index, { name: d.name, specials: d.special_abilities || [], actions: d.actions || [], legendaries: d.legendary_actions || [], reactions: d.reactions || [] });
      } catch {}
      setScanPct(Math.round(((i + 1) / toFetch.length) * 100));
      await new Promise(r => setTimeout(r, 30));
    }
    setScanning(false);
    searchCache();
  };

  const q = query.toLowerCase();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav className="topnav">
        <div className="brand" style={{ cursor: "pointer" }} onClick={goHome}><div className="brand-icon">⚗</div><span className="brand-name">Monster&apos;s Cauldron</span></div>
        <div className="nav-actions"><button className="btn-secondary" onClick={goHome}>← Início</button></div>
      </nav>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
        <SH label="Busca por Habilidade (Cross-Monster)" />
        <p style={{ color: "var(--text3)", fontSize: ".86rem", marginBottom: 16, lineHeight: 1.6 }}>
          Busca nas habilidades de todos os monstros já carregados nesta sessão ({abilityCache.size} em cache).
          Use &quot;Varrer API&quot; para carregar os primeiros 50 monstros automaticamente.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input className="mc-input" placeholder='Ex: "fire breath", "frightened", "multiattack"...' value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchCache()} style={{ flex: 1 }} />
          <button className="btn-primary" onClick={searchCache}>🔍 Buscar Cache</button>
          <button className="btn-secondary" onClick={deepScan} disabled={scanning}>{scanning ? `Varrendo ${scanPct}%...` : "🌐 Varrer API"}</button>
          {scanning && <button className="btn-secondary" onClick={() => { abortRef.current = true; setScanning(false); }}>✕ Parar</button>}
        </div>
        {scanning && <div className="scan-bar"><div className="scan-fill" style={{ width: `${scanPct}%` }} /></div>}
        {searched && (
          results.length === 0
            ? <div style={{ textAlign: "center", color: "var(--text4)", padding: "40px 0", fontStyle: "italic" }}>Nenhum resultado para &quot;{query}&quot;.<br />Tente &quot;Varrer API&quot; para expandir o cache.</div>
            : (
              <>
                <div style={{ color: "var(--text3)", fontSize: ".8rem", marginBottom: 12 }}>{results.length} resultado(s) encontrado(s):</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.map((r, i) => (
                    <div key={i} className="ability-result-card">
                      <div className="ability-result-header">
                        <span className="ability-result-name">{r.name}</span>
                        <TypeBadge type={r._type || "special"} />
                        <span className="ability-result-source">— {r.monster}</span>
                      </div>
                      <div className="ability-result-desc">{highlightText(r.desc || r.description || "", q)}</div>
                    </div>
                  ))}
                </div>
              </>
            )
        )}
      </div>
    </div>
  );
}
