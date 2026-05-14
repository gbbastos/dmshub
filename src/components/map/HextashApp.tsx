"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ── Biomes & Structures ── */
const BIOMES = [
  { id: "plains",    n: "Planície",   c: "#a8c46a", i: "🌾" },
  { id: "forest",    n: "Floresta",   c: "#3d6b3a", i: "🌲" },
  { id: "jungle",    n: "Selva",      c: "#2d5a2d", i: "🌴" },
  { id: "hills",     n: "Colinas",    c: "#8b7d4a", i: "⛰️" },
  { id: "mountain",  n: "Montanha",   c: "#6b6b6b", i: "🏔️" },
  { id: "snow",      n: "Neve",       c: "#e8eef5", i: "❄️" },
  { id: "desert",    n: "Deserto",    c: "#e8c878", i: "🏜️" },
  { id: "swamp",     n: "Pântano",    c: "#4a5d3a", i: "🐸" },
  { id: "tundra",    n: "Tundra",     c: "#b5b8a0", i: "🌿" },
  { id: "badlands",  n: "Ermo",       c: "#b8704a", i: "🪨" },
  { id: "water",     n: "Oceano",     c: "#3a6b9e", i: "🌊" },
  { id: "shallow",   n: "Raso",       c: "#6bb0d4", i: "🐟" },
];
const STRUCT = [
  { id: "city",    n: "Cidade",   i: "🏰" },
  { id: "town",    n: "Vila",     i: "🏘️" },
  { id: "village", n: "Aldeia",   i: "🏠" },
  { id: "tower",   n: "Torre",    i: "🗼" },
  { id: "ruins",   n: "Ruínas",   i: "🏛️" },
  { id: "dungeon", n: "Masmorra", i: "⚔️" },
  { id: "cave",    n: "Caverna",  i: "🕳️" },
  { id: "temple",  n: "Templo",   i: "⛩️" },
  { id: "port",    n: "Porto",    i: "⚓" },
];

/* ── Hex math helpers (pure fns, used inside canvas and outside) ── */
const HEX = 38;
function hp(q: number, r: number) { return { x: HEX * Math.sqrt(3) * (q + r / 2), y: HEX * 1.5 * r }; }
function phHex(x: number, y: number) {
  const q = (Math.sqrt(3) / 3 * x - y / 3) / HEX, r = y * 2 / 3 / HEX, s = -q - r;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}
function hn(q: number, r: number, R: number) {
  const o: { q: number; r: number }[] = [];
  for (let dq = -R; dq <= R; dq++)
    for (let dr = Math.max(-R, -dq - R); dr <= Math.min(R, -dq + R); dr++)
      o.push({ q: q + dq, r: r + dr });
  return o;
}
const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function cL(q: number, r: number) {
  const col = q + Math.floor(r / 2), i = ((col % 26) + 26) % 26, pre = Math.floor(Math.abs(col) / 26);
  return (col < 0 ? "-" : "") + (pre > 0 ? L[pre - 1] : "") + L[i] + (r + 20);
}
function hc(cx: number, cy: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 3 * i + Math.PI / 6;
    return [cx + HEX * Math.cos(a), cy + HEX * Math.sin(a)];
  });
}
function ek(e: { a: { q: number; r: number }; b: { q: number; r: number } }) {
  const { a, b } = e;
  return (a.q < b.q || (a.q === b.q && a.r < b.r))
    ? `${a.q},${a.r}|${b.q},${b.r}` : `${b.q},${b.r}|${a.q},${a.r}`;
}

/* ── Noise helpers ── */
function mul(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function nz(seed: number) {
  const r = mul(seed), g: Record<string, number> = {};
  function G(x: number, y: number) { const k = `${x},${y}`; if (!g[k]) g[k] = r() * 2 - 1; return g[k]; }
  function sm(t: number) { return t * t * (3 - 2 * t); }
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const tl = G(xi, yi), tr = G(xi + 1, yi), bl = G(xi, yi + 1), br = G(xi + 1, yi + 1);
    const u = sm(xf), v = sm(yf);
    return (tl * (1 - u) + tr * u) * (1 - v) + (bl * (1 - u) + br * u) * v;
  };
}
function fbm(n: (x: number, y: number) => number, x: number, y: number, o: number) {
  let v = 0, a = 1, f = 1, s = 0;
  for (let i = 0; i < o; i++) { v += a * n(x * f, y * f); s += a; a *= 0.5; f *= 2; }
  return v / s;
}

/* ── State type ── */
interface Hex { q: number; r: number; b?: string; s?: string; N?: { n: string; d: string; e: string; l: string } }
interface Edge { a: { q: number; r: number }; b: { q: number; r: number }; t: string }
interface State {
  hx: Record<string, Hex>;
  ed: Record<string, Edge>;
  z: number; ox: number; oy: number;
  mode: string; bi: string; str: string | null; et: string; br: number;
  p: boolean; pn: boolean; lx: number; ly: number;
  rs: [number, number] | null;
  L: Record<string, boolean>;
  un: string[]; rd: string[];
  nh: { q: number; r: number } | null;
}

export function HextashApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mnRef = useRef<HTMLInputElement>(null);
  const [dark, setDark] = useState(false);
  const [status, setStatus] = useState("Hex: -");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("Hex");
  const [noteN, setNoteN] = useState("");
  const [noteD, setNoteD] = useState("");
  const [noteE, setNoteE] = useState("");
  const [noteL, setNoteL] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [genSeed, setGenSeed] = useState("1234");
  const [genSize, setGenSize] = useState("16");
  const [genSea, setGenSea] = useState("0.42");
  const [genScale, setGenScale] = useState("0.12");
  const [mapName, setMapName] = useState("Terras Esquecidas");
  const [activeBiome, setActiveBiome] = useState("plains");
  const [activeStruct, setActiveStruct] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState("paint");
  const [activeBrush, setActiveBrush] = useState(1);
  const [activeEdge, setActiveEdge] = useState("river");
  const [layers, setLayers] = useState({ terrain: true, edges: true, structures: true, notes: true, grid: true, coords: true, frame: true });

  /* mutable canvas state (not React state to avoid rerenders) */
  const S = useRef<State>({
    hx: {}, ed: {}, z: 1, ox: 0, oy: 0,
    mode: "paint", bi: "plains", str: null, et: "river", br: 1,
    p: false, pn: false, lx: 0, ly: 0, rs: null,
    L: { terrain: true, edges: true, structures: true, notes: true, grid: true, coords: true, frame: true },
    un: [], rd: [], nh: null,
  });

  useEffect(() => {
    try { setDark(localStorage.getItem("mc_dark") === "1"); } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "";
    try { localStorage.setItem("mc_dark", dark ? "1" : "0"); } catch {}
  }, [dark]);

  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    const cv = canvasRef.current!;
    const wrap = wrapRef.current!;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d")!;
    const s = S.current;

    function dh(cx: number, cy: number, fill: string | CanvasGradient | null, stroke: boolean | string = true) {
      const pts = hc(cx, cy);
      ctx.beginPath();
      pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill as string; ctx.fill(); }
      if (stroke !== false) { ctx.strokeStyle = stroke === true ? "#2a1f15" : stroke as string; ctx.lineWidth = 1; ctx.stroke(); }
    }

    function draw() {
      const mn = mnRef.current?.value ?? mapName;
      ctx.fillStyle = "#0f0a06"; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.save();
      ctx.translate(cv.width / 2 + s.ox, cv.height / 2 + s.oy);
      ctx.scale(s.z, s.z);

      const R = 22;
      if (s.L.grid) {
        for (let q = -R; q <= R; q++)
          for (let r = -R; r <= R; r++) { const { x, y } = hp(q, r); dh(x, y, "#1a1410", false); }
      }
      if (s.L.terrain) {
        for (const k in s.hx) {
          const h = s.hx[k]; const { x, y } = hp(h.q, h.r);
          const B = BIOMES.find(b => b.id === h.b); if (!B) continue;
          const g = ctx.createRadialGradient(x, y, HEX * 0.25, x, y, HEX * 1.05);
          g.addColorStop(0, B.c); g.addColorStop(1, B.c + "aa");
          dh(x, y, g, false);
          ctx.font = `${HEX * 0.55}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.globalAlpha = 0.65; ctx.fillText(B.i, x, y + HEX * 0.08); ctx.globalAlpha = 1;
        }
      }
      if (s.L.grid) {
        for (const k in s.hx) { const h = s.hx[k]; const { x, y } = hp(h.q, h.r); dh(x, y, null); }
      }
      if (s.L.edges) {
        for (const k in s.ed) {
          const E = s.ed[k];
          const c1 = hp(E.a.q, E.a.r), c2 = hp(E.b.q, E.b.r);
          const mx = (c1.x + c2.x) / 2, my = (c1.y + c2.y) / 2;
          ctx.strokeStyle = E.t === "river" ? "#4a8bc4" : "#8b6a3a";
          ctx.lineWidth = E.t === "river" ? 5 : 3;
          if (E.t === "road") ctx.setLineDash([6, 4]);
          ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.quadraticCurveTo(mx, my, c2.x, c2.y); ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      if (s.L.structures) {
        for (const k in s.hx) {
          const h = s.hx[k]; if (!h.s) continue;
          const st = STRUCT.find(x => x.id === h.s); if (!st) continue;
          const { x, y } = hp(h.q, h.r);
          ctx.font = `${HEX * 0.85}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(st.i, x, y);
        }
      }
      if (s.L.notes) {
        for (const k in s.hx) {
          const h = s.hx[k]; if (!h.N || (!h.N.n && !h.N.d)) continue;
          const { x, y } = hp(h.q, h.r);
          ctx.font = `${HEX * 0.4}px serif`; ctx.fillText("📌", x + HEX * 0.5, y - HEX * 0.5);
        }
      }
      if (s.L.coords) {
        for (const k in s.hx) {
          const h = s.hx[k]; const { x, y } = hp(h.q, h.r);
          ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.font = `bold ${HEX * 0.22}px monospace`;
          ctx.textAlign = "center"; ctx.fillText(cL(h.q, h.r), x, y - HEX * 0.7);
        }
      }
      ctx.restore();
      if (s.L.frame) {
        ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, cv.width - 20, cv.height - 20);
        ctx.strokeStyle = "#d4a574"; ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, cv.width - 36, cv.height - 36);
        ctx.fillStyle = "rgba(26,20,16,0.9)";
        ctx.fillRect(cv.width / 2 - 180, 22, 360, 34);
        ctx.fillStyle = "#d4a574"; ctx.font = "bold 22px Georgia";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(mn, cv.width / 2, 40);
        const cx2 = cv.width - 70, cy2 = 75;
        ctx.fillStyle = "rgba(26,20,16,0.9)"; ctx.beginPath(); ctx.arc(cx2, cy2, 32, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#d4a574"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = "#d4a574"; ctx.beginPath(); ctx.moveTo(cx2, cy2 - 25); ctx.lineTo(cx2 - 6, cy2); ctx.lineTo(cx2 + 6, cy2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#8b6a3a"; ctx.beginPath(); ctx.moveTo(cx2, cy2 + 25); ctx.lineTo(cx2 - 6, cy2); ctx.lineTo(cx2 + 6, cy2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#d4a574"; ctx.font = "bold 11px Georgia"; ctx.textAlign = "center"; ctx.fillText("N", cx2, cy2 - 33);
        const sx2 = 30, sy2 = cv.height - 40, sw = 120;
        ctx.fillStyle = "rgba(26,20,16,0.9)"; ctx.fillRect(sx2 - 5, sy2 - 5, sw + 10, 28);
        ctx.strokeStyle = "#d4a574"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx2, sy2 + 5); ctx.lineTo(sx2 + sw, sy2 + 5); ctx.stroke();
        for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(sx2 + sw * i / 4, sy2); ctx.lineTo(sx2 + sw * i / 4, sy2 + 10); ctx.stroke(); }
        ctx.fillStyle = "#d4a574"; ctx.font = "10px Georgia"; ctx.textAlign = "left"; ctx.fillText("1 hex ≈ 6 milhas", sx2, sy2 + 20);
      }
    }
    drawRef.current = draw;

    function rz() { cv.width = wrap.clientWidth; cv.height = wrap.clientHeight; draw(); }
    window.addEventListener("resize", rz); rz();

    function s2w(x: number, y: number) { return { x: (x - cv.width / 2 - s.ox) / s.z, y: (y - cv.height / 2 - s.oy) / s.z }; }
    function ce(wx: number, wy: number) {
      const { q, r } = phHex(wx, wy), c = hp(q, r);
      const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]] as const;
      let B: { a: { q: number; r: number }; b: { q: number; r: number } } | null = null, bd = 1e9;
      for (const [dq, dr] of dirs) {
        const n = { q: q + dq, r: r + dr }, cn = hp(n.q, n.r);
        const mx2 = (c.x + cn.x) / 2, my2 = (c.y + cn.y) / 2;
        const d = (wx - mx2) ** 2 + (wy - my2) ** 2;
        if (d < bd) { bd = d; B = { a: { q, r }, b: n }; }
      }
      return B;
    }
    function ff(q: number, r: number) {
      const hx = s.hx[`${q},${r}`], t = hx?.b ?? null, nb = s.bi;
      if (t === nb) return;
      const Q = [{ q, r }]; const vis: Record<string, boolean> = {};
      while (Q.length) {
        const c = Q.shift()!; const k = `${c.q},${c.r}`;
        if (vis[k]) continue; vis[k] = true;
        const h2 = s.hx[k]; if ((h2?.b ?? null) !== t) continue;
        if (!h2) s.hx[k] = { q: c.q, r: c.r }; s.hx[k].b = nb;
        for (const [dq, dr] of [[-1, 0] as const, [1, 0] as const, [0, -1] as const, [0, 1] as const, [1, -1] as const, [-1, 1] as const])
          Q.push({ q: c.q + dq, r: c.r + dr });
      }
    }
    function ap(sx: number, sy: number, init: boolean) {
      const w = s2w(sx, sy);
      if (s.mode === "edge") {
        if (!init) return;
        const e = ce(w.x, w.y); if (!e) return;
        const k = ek(e); if (s.ed[k]) delete s.ed[k]; else s.ed[k] = { ...e, t: s.et };
        draw(); return;
      }
      const { q, r } = phHex(w.x, w.y);
      if (s.mode === "note") { if (init) openNote(q, r); return; }
      if (s.mode === "pick") { if (!init) return; const h = s.hx[`${q},${r}`]; if (h?.b) { s.bi = h.b; setActiveBiome(h.b); } return; }
      if (s.mode === "fill") { if (init) { ff(q, r); draw(); } return; }
      if (s.mode === "rect") return;
      const cs = hn(q, r, s.br - 1);
      for (const c of cs) {
        const k = `${c.q},${c.r}`;
        if (s.mode === "erase") { delete s.hx[k]; }
        else {
          if (!s.hx[k]) s.hx[k] = { q: c.q, r: c.r };
          if (s.str && s.mode === "paint") s.hx[k].s = s.str; else s.hx[k].b = s.bi;
        }
      }
      draw();
    }
    function ar(x1: number, y1: number, x2: number, y2: number) {
      const w1 = s2w(x1, y1), w2 = s2w(x2, y2);
      const X1 = Math.min(w1.x, w2.x), X2 = Math.max(w1.x, w2.x);
      const Y1 = Math.min(w1.y, w2.y), Y2 = Math.max(w1.y, w2.y);
      for (let r = -30; r <= 30; r++)
        for (let q = -30; q <= 30; q++) {
          const { x, y } = hp(q, r);
          if (x >= X1 && x <= X2 && y >= Y1 && y <= Y2) {
            const k = `${q},${r}`; if (!s.hx[k]) s.hx[k] = { q, r }; s.hx[k].b = s.bi;
          }
        }
      draw();
    }
    function pu() { s.un.push(JSON.stringify({ h: s.hx, e: s.ed })); if (s.un.length > 50) s.un.shift(); s.rd = []; }
    const undo = () => { if (s.un.length < 2) return; s.rd.push(s.un.pop()!); const st = JSON.parse(s.un[s.un.length - 1]); s.hx = st.h; s.ed = st.e; draw(); };
    const redo = () => { if (!s.rd.length) return; const x = s.rd.pop()!; s.un.push(x); const st = JSON.parse(x); s.hx = st.h; s.ed = st.e; draw(); };
    (window as any).__hextash_undo = undo;
    (window as any).__hextash_redo = redo;
    (window as any).__hextash_draw = draw;
    (window as any).__hextash_pu = pu;
    (window as any).__hextash_ar = ar;

    cv.addEventListener("mousedown", (e) => {
      if (e.button === 2) { const w = s2w(e.offsetX, e.offsetY); const { q, r } = phHex(w.x, w.y); openNote(q, r); e.preventDefault(); return; }
      if (e.button === 1 || e.shiftKey) { s.pn = true; s.lx = e.clientX; s.ly = e.clientY; return; }
      if (s.mode === "rect") { s.rs = [e.offsetX, e.offsetY]; return; }
      s.p = true; ap(e.offsetX, e.offsetY, true);
    });
    cv.addEventListener("mousemove", (e) => {
      if (s.pn) { s.ox += e.clientX - s.lx; s.oy += e.clientY - s.ly; s.lx = e.clientX; s.ly = e.clientY; draw(); }
      else if (s.p) ap(e.offsetX, e.offsetY, false);
      const w = s2w(e.offsetX, e.offsetY); const { q, r } = phHex(w.x, w.y);
      setStatus(`Hex: ${cL(q, r)} (${q},${r})`);
    });
    cv.addEventListener("mouseup", (e) => {
      if (s.rs) { ar(s.rs[0], s.rs[1], e.offsetX, e.offsetY); s.rs = null; pu(); }
      else if (s.p) pu();
      s.p = false; s.pn = false;
    });
    cv.addEventListener("mouseleave", () => { s.p = false; s.pn = false; });
    cv.addEventListener("contextmenu", (e) => e.preventDefault());
    cv.addEventListener("wheel", (e) => {
      e.preventDefault(); s.z = Math.max(0.3, Math.min(3, s.z * (e.deltaY < 0 ? 1.1 : 0.9))); draw();
    }, { passive: false });

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      else if (e.ctrlKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    document.addEventListener("keydown", onKey);
    pu();

    return () => {
      window.removeEventListener("resize", rz);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function openNote(q: number, r: number) {
    S.current.nh = { q, r };
    const k = `${q},${r}`, h = S.current.hx[k] || { q, r };
    const n = h.N || { n: "", d: "", e: "", l: "" };
    setNoteTitle(`Hex ${cL(q, r)}`);
    setNoteN(n.n || ""); setNoteD(n.d || ""); setNoteE(n.e || ""); setNoteL(n.l || "");
    setNoteOpen(true);
  }
  function saveNote() {
    const nh = S.current.nh; if (!nh) return;
    const k = `${nh.q},${nh.r}`;
    if (!S.current.hx[k]) S.current.hx[k] = { q: nh.q, r: nh.r };
    S.current.hx[k].N = { n: noteN, d: noteD, e: noteE, l: noteL };
    (window as any).__hextash_pu?.(); (window as any).__hextash_draw?.();
    setNoteOpen(false);
  }
  function deleteNote() {
    const nh = S.current.nh; if (!nh) return;
    const k = `${nh.q},${nh.r}`; if (S.current.hx[k]) delete S.current.hx[k].N;
    (window as any).__hextash_pu?.(); (window as any).__hextash_draw?.();
    setNoteOpen(false);
  }
  function generate() {
    const sd = +genSeed || 1, sz = +genSize || 15, sea = +genSea || 0.4, sc = +genScale || 0.12;
    const e = nz(sd), m = nz(sd + 999), tNoise = nz(sd + 333);
    S.current.hx = {}; S.current.ed = {};
    for (let q = -sz; q <= sz; q++)
      for (let r = -sz; r <= sz; r++) {
        if (Math.abs(q + r) > sz) continue;
        const { x, y } = hp(q, r);
        const E = (fbm(e, x * sc * 0.1, y * sc * 0.1, 4) + 1) / 2;
        const D = Math.sqrt(q * q + r * r + q * r) / sz;
        const el = E * (1 - D * 0.75);
        const M = (fbm(m, x * sc * 0.15, y * sc * 0.15, 3) + 1) / 2;
        const T = (fbm(tNoise, x * sc * 0.08, y * sc * 0.08, 2) + 1) / 2 - Math.abs(r) / sz * 0.4;
        let b: string;
        if (el < sea - 0.1) b = "water";
        else if (el < sea) b = "shallow";
        else if (el > 0.72) b = T < 0.3 ? "snow" : "mountain";
        else if (el > 0.58) b = "hills";
        else if (T < 0.25) b = "tundra";
        else if (T > 0.75 && M < 0.3) b = "desert";
        else if (M > 0.75 && T > 0.6) b = "jungle";
        else if (M > 0.6) b = el < sea + 0.05 ? "swamp" : "forest";
        else if (M < 0.35) b = "badlands";
        else b = "plains";
        S.current.hx[`${q},${r}`] = { q, r, b };
      }
    (window as any).__hextash_pu?.(); (window as any).__hextash_draw?.();
    setGenOpen(false);
  }
  function saveMap() {
    const d = { name: mapName, hx: S.current.hx, ed: S.current.ed };
    const b = new Blob([JSON.stringify(d)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "hextash.json"; a.click();
  }
  function loadMap() {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json";
    inp.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => {
        const d = JSON.parse(ev.target!.result as string);
        S.current.hx = d.hx || d.hexes || d; S.current.ed = d.ed || d.edges || {};
        if (d.name) setMapName(d.name);
        (window as any).__hextash_pu?.(); (window as any).__hextash_draw?.();
      };
      r.readAsText(f);
    };
    inp.click();
  }
  function exportPng() {
    const a = document.createElement("a"); a.href = canvasRef.current!.toDataURL("image/png"); a.download = `${mapName || "mapa"}.png`; a.click();
  }
  function clearMap() {
    if (!confirm("Limpar todo o mapa?")) return;
    S.current.hx = {}; S.current.ed = {};
    (window as any).__hextash_pu?.(); (window as any).__hextash_draw?.();
  }
  function setMode(mode: string) { S.current.mode = mode; setActiveMode(mode); if (mode !== "paint") { S.current.str = null; setActiveStruct(null); } }
  function setBrush(br: number) { S.current.br = br; setActiveBrush(br); }
  function setEdgeType(et: string) { S.current.et = et; setActiveEdge(et); }
  function setLayer(key: string, val: boolean) { S.current.L[key] = val; setLayers(l => ({ ...l, [key]: val })); (window as any).__hextash_draw?.(); }
  function pickBiome(id: string) { S.current.bi = id; S.current.str = null; setActiveBiome(id); setActiveStruct(null); }
  function pickStruct(id: string) { S.current.str = id; setActiveStruct(id); }

  return (
    <>
      <style>{`
        .hx-root { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: var(--bg); }
        .hx-header { background: color-mix(in srgb, var(--bg) 80%, transparent); backdrop-filter: blur(12px); padding: 10px 20px; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; position: sticky; top: 0; z-index: 10; flex-shrink: 0; }
        .hx-brand { font-family: var(--font-cormorant, serif); font-weight: 600; font-size: 20px; color: var(--ink-2); text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .hx-diamond { width: 14px; height: 14px; border: 1.5px solid currentColor; transform: rotate(45deg); position: relative; flex-shrink: 0; }
        .hx-diamond::after { content: ""; position: absolute; inset: 2px; border: 1px solid currentColor; opacity: 0.5; }
        .hx-name { background: var(--bg-2); border: 1px solid var(--line); color: var(--ink); padding: 5px 10px; font-family: var(--font-dm-sans, sans-serif); font-size: 13px; border-radius: 6px; width: 180px; }
        .hx-name:focus { outline: none; border-color: var(--ink-2); }
        .hx-tb { display: flex; gap: 4px; flex-wrap: wrap; margin-left: auto; align-items: center; }
        .hx-btn { background: var(--bg-2); color: var(--ink); border: 1px solid var(--line); padding: 6px 14px; cursor: pointer; font-family: var(--font-dm-sans, sans-serif); border-radius: 999px; font-size: 11px; font-weight: 500; letter-spacing: 0.03em; transition: all 0.2s; white-space: nowrap; }
        .hx-btn:hover { border-color: var(--ink-2); color: var(--ink-2); }
        .hx-btn-primary { background: var(--ink-2); color: var(--bg-2); border-color: var(--ink-2); }
        .hx-btn-primary:hover { background: transparent; color: var(--ink-2); }
        .hx-theme { width: 32px; height: 32px; border: 1px solid var(--line); background: var(--bg-2); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ink); transition: all 0.2s; }
        .hx-theme:hover { border-color: var(--line-strong); transform: rotate(15deg); }
        .hx-theme svg { width: 14px; height: 14px; }
        .hx-home { font-family: var(--font-dm-sans, sans-serif); font-size: 11px; color: var(--muted); text-decoration: none; letter-spacing: 0.05em; text-transform: uppercase; }
        .hx-home:hover { color: var(--ink-2); }

        .hx-body { flex: 1; display: flex; overflow: hidden; }
        .hx-aside { width: 220px; background: var(--bg-2); padding: 12px; overflow-y: auto; border-right: 1px solid var(--line); flex-shrink: 0; }
        .hx-aside h3 { font-family: var(--font-dm-sans, sans-serif); font-size: 10px; font-weight: 500; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted); margin: 14px 0 6px; border-bottom: 1px solid var(--line); padding-bottom: 4px; }
        .hx-aside h3:first-child { margin-top: 0; }
        .hx-pal { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; }
        .hx-tile { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 18px; border: 2px solid transparent; border-radius: 4px; cursor: pointer; background: var(--bg); transition: all 0.15s; }
        .hx-tile span { font-size: 7px; color: var(--muted); font-family: var(--font-dm-sans, sans-serif); margin-top: 1px; }
        .hx-tile:hover { border-color: var(--ink-2); }
        .hx-tile.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
        .hx-row { display: flex; gap: 3px; flex-wrap: wrap; margin-bottom: 3px; }
        .hx-row button { flex: 1; background: var(--bg); color: var(--ink); border: 1px solid var(--line); padding: 5px; cursor: pointer; border-radius: 4px; font-family: var(--font-dm-sans, sans-serif); font-size: 11px; min-width: 32px; transition: all 0.15s; }
        .hx-row button:hover { border-color: var(--ink-2); color: var(--ink-2); }
        .hx-row button.active { background: var(--ink-2); color: var(--bg-2); border-color: var(--ink-2); }
        .hx-layer { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-family: var(--font-dm-sans, sans-serif); font-size: 12px; color: var(--ink); cursor: pointer; }
        .hx-hint { font-size: 10px; color: var(--muted); margin-top: 8px; line-height: 1.5; font-family: var(--font-dm-sans, sans-serif); }

        .hx-wrap { flex: 1; position: relative; background: #0f0a06; overflow: hidden; }
        canvas { display: block; cursor: crosshair; }
        .hx-status { position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,.75); padding: 4px 10px; border-radius: 4px; font-size: 11px; color: #d4a574; font-family: var(--font-dm-sans, sans-serif); }

        .hx-note { position: absolute; right: 0; top: 0; bottom: 0; width: 300px; background: var(--bg-2); border-left: 1px solid var(--line); padding: 16px; overflow-y: auto; z-index: 10; display: flex; flex-direction: column; gap: 8px; }
        .hx-note h3 { font-family: var(--font-cormorant, serif); font-size: 18px; color: var(--ink-2); margin-bottom: 4px; }
        .hx-note label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); font-family: var(--font-dm-sans, sans-serif); margin-top: 8px; margin-bottom: 3px; }
        .hx-note input, .hx-note textarea { width: 100%; background: var(--bg); border: 1px solid var(--line); color: var(--ink); padding: 7px; font-family: var(--font-dm-sans, sans-serif); border-radius: 4px; font-size: 13px; }
        .hx-note input:focus, .hx-note textarea:focus { outline: none; border-color: var(--ink-2); }
        .hx-note textarea { resize: vertical; min-height: 70px; }
        .hx-note-actions { display: flex; gap: 6px; margin-top: 8px; }

        .hx-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .hx-modal { background: var(--bg-2); border: 1px solid var(--line); padding: 24px; border-radius: 8px; min-width: 320px; }
        .hx-modal h2 { font-family: var(--font-cormorant, serif); font-size: 22px; color: var(--ink-2); margin-bottom: 16px; }
        .hx-modal label { display: block; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); font-family: var(--font-dm-sans, sans-serif); margin-top: 10px; margin-bottom: 3px; }
        .hx-modal input { width: 100%; background: var(--bg); border: 1px solid var(--line); color: var(--ink); padding: 7px; font-family: var(--font-dm-sans, sans-serif); border-radius: 4px; font-size: 13px; }
        .hx-modal input:focus { outline: none; border-color: var(--ink-2); }
        .hx-modal-actions { display: flex; gap: 8px; margin-top: 16px; }
      `}</style>

      <div className="hx-root">
        {/* Header */}
        <header className="hx-header">
          <Link href="/" className="hx-brand">
            <span className="hx-diamond" />
            <span>Hextash</span>
          </Link>
          <input ref={mnRef} className="hx-name" value={mapName} onChange={e => { setMapName(e.target.value); (window as any).__hextash_draw?.(); }} />
          <div className="hx-tb">
            <button className="hx-btn hx-btn-primary" onClick={() => setGenOpen(true)}>🎲 Gerar</button>
            <button className="hx-btn" onClick={() => (window as any).__hextash_undo?.()}>↶ Desfazer</button>
            <button className="hx-btn" onClick={() => (window as any).__hextash_redo?.()}>↷ Refazer</button>
            <button className="hx-btn" onClick={saveMap}>💾 Salvar</button>
            <button className="hx-btn" onClick={loadMap}>📂 Carregar</button>
            <button className="hx-btn" onClick={exportPng}>🖼️ PNG</button>
            <button className="hx-btn" onClick={clearMap}>🗑️</button>
            <button className="hx-theme" onClick={() => setDark(d => !d)} aria-label="Tema">
              {dark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <Link href="/" className="hx-home">← Hub</Link>
          </div>
        </header>

        {/* Body */}
        <div className="hx-body">
          {/* Sidebar */}
          <aside className="hx-aside">
            <h3>Ferramenta</h3>
            <div className="hx-row">
              {[["paint", "🖌️ Pintar"], ["fill", "🪣 Preencher"], ["rect", "▭ Retângulo"], ["pick", "💧 Conta-gotas"]].map(([m, lbl]) => (
                <button key={m} className={activeMode === m ? "active" : ""} onClick={() => setMode(m)}>{lbl}</button>
              ))}
            </div>
            <div className="hx-row">
              <button className={activeMode === "edge" ? "active" : ""} onClick={() => setMode("edge")}>〰️ Rio/Estrada</button>
            </div>
            <div className="hx-row">
              <button className={activeMode === "note" ? "active" : ""} onClick={() => setMode("note")}>📝 Nota</button>
              <button className={activeMode === "erase" ? "active" : ""} onClick={() => setMode("erase")}>🚫 Apagar</button>
            </div>

            <h3>Pincel</h3>
            <div className="hx-row">
              {[[1, "1"], [2, "7"], [3, "19"]].map(([br, lbl]) => (
                <button key={br} className={activeBrush === br ? "active" : ""} onClick={() => setBrush(br as number)}>{lbl}</button>
              ))}
            </div>

            <h3>Biomas</h3>
            <div className="hx-pal">
              {BIOMES.map(b => (
                <div key={b.id} className={`hx-tile${activeBiome === b.id ? " active" : ""}`} style={{ background: activeBiome === b.id ? b.c + "55" : undefined }} onClick={() => pickBiome(b.id)}>
                  {b.i}<span>{b.n}</span>
                </div>
              ))}
            </div>

            <h3>Estruturas</h3>
            <div className="hx-pal">
              {STRUCT.map(st => (
                <div key={st.id} className={`hx-tile${activeStruct === st.id ? " active" : ""}`} onClick={() => pickStruct(st.id)}>
                  {st.i}<span>{st.n}</span>
                </div>
              ))}
            </div>

            <h3>Tipo de Borda</h3>
            <div className="hx-row">
              <button className={activeEdge === "river" ? "active" : ""} onClick={() => setEdgeType("river")}>💧 Rio</button>
              <button className={activeEdge === "road" ? "active" : ""} onClick={() => setEdgeType("road")}>═ Estrada</button>
            </div>

            <h3>Camadas</h3>
            {Object.entries(layers).map(([key, val]) => (
              <label key={key} className="hx-layer">
                <input type="checkbox" checked={val} onChange={e => setLayer(key, e.target.checked)} />
                {key === "terrain" ? "Terreno" : key === "edges" ? "Rios/Estradas" : key === "structures" ? "Estruturas" : key === "notes" ? "Marcadores" : key === "grid" ? "Grade" : key === "coords" ? "Coordenadas" : "Moldura"}
              </label>
            ))}

            <p className="hx-hint">Clique/arraste: pintar · Shift+arrastar: mover · Scroll: zoom · Direito: nota · Ctrl+Z/Y</p>
          </aside>

          {/* Canvas */}
          <div className="hx-wrap" ref={wrapRef}>
            <canvas ref={canvasRef} />
            <div className="hx-status">{status}</div>

            {/* Note panel */}
            {noteOpen && (
              <div className="hx-note">
                <h3>{noteTitle}</h3>
                <label>Nome</label><input value={noteN} onChange={e => setNoteN(e.target.value)} />
                <label>Descrição</label><textarea value={noteD} onChange={e => setNoteD(e.target.value)} />
                <label>Encontros</label><textarea value={noteE} onChange={e => setNoteE(e.target.value)} placeholder="1. 2d6 goblins..." />
                <label>Loot / NPCs</label><textarea value={noteL} onChange={e => setNoteL(e.target.value)} />
                <div className="hx-note-actions">
                  <button className="hx-btn hx-btn-primary" onClick={saveNote}>Salvar</button>
                  <button className="hx-btn" onClick={deleteNote}>Excluir</button>
                  <button className="hx-btn" onClick={() => setNoteOpen(false)}>Fechar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate modal */}
      {genOpen && (
        <div className="hx-modal-overlay">
          <div className="hx-modal">
            <h2>Gerar Continente</h2>
            <label>Seed</label><input value={genSeed} onChange={e => setGenSeed(e.target.value)} />
            <label>Raio (hexes)</label><input type="number" value={genSize} onChange={e => setGenSize(e.target.value)} />
            <label>Nível do mar</label><input type="number" step="0.05" value={genSea} onChange={e => setGenSea(e.target.value)} />
            <label>Escala</label><input type="number" step="0.01" value={genScale} onChange={e => setGenScale(e.target.value)} />
            <div className="hx-modal-actions">
              <button className="hx-btn hx-btn-primary" onClick={generate}>Gerar</button>
              <button className="hx-btn" onClick={() => setGenOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
