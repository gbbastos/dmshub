"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const DiceCanvas = dynamic(
  () => import("@/components/landing/DiceCanvas").then((m) => ({ default: m.DiceCanvas })),
  { ssr: false }
);

const i18n = {
  pt: {
    "cta.enter": "Entrar",
    "hero.eyebrow": "Grimório do Mestre · Edição Digital",
    "hero.subtitle": "No Players Allowed",
    "hero.tagline": "<em>Para o lado de lá da tela.</em><br/>Ferramentas, geradores e maquinaria narrativa para quem narra — feitas por quem cansou de improvisar com guardanapo.",
    "hero.scroll": "Role o d20 ↓",
    "projects.eyebrow": "Capítulo I",
    "projects.title": "Os <em>artefatos</em> do mestre",
    "projects.aside": "Três artefatos no forjamento. Mais a caminho — porque um Mestre nunca tem ferramentas demais.",
    "footer.quote": "\"O dado é lançado. Mas só por trás do biombo.\"",
    "footer.year": "© 2026",
    "footer.no_players": "No Players Allowed",
    "footer.crit": "Rolando contra a entropia",
    "card.tag.live": "Disponível",
    "card.tag.dev": "Em breve",
    "card.monster.title": "Criador de Monstro",
    "card.map.title": "Criador de Mapa",
    "card.shield.title": "Escudo Virtual",
  },
  en: {} as Record<string, string>,
  es: {} as Record<string, string>,
};

type Lang = "pt" | "en" | "es";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try { setDark(localStorage.getItem("mc_dark") === "1"); } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "";
    try { localStorage.setItem("mc_dark", dark ? "1" : "0"); } catch {}
  }, [dark]);
  return [dark, setDark] as const;
}

function t(lang: Lang, key: string): string {
  const src = i18n[lang] as Record<string, string>;
  const dict = (src && Object.keys(src).length ? src : i18n.pt) as Record<string, string>;
  return dict[key] ?? (i18n.pt as Record<string, string>)[key] ?? key;
}

/* --- Mask icon component --- */
const MaskIcon = ({ src }: { src: string }) => (
  <div style={{
    width: "100%", height: "100%", maxWidth: 180, maxHeight: 180,
    backgroundColor: "currentColor",
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    transition: "background-color 0.4s ease, transform 0.5s cubic-bezier(0.2,0.9,0.3,1)",
  }} />
);

/* --- Runes ring SVG --- */
function RunesSVG() {
  const RUNES = [
    ["M10 4 L10 28", "M10 4 L3 12", "M10 4 L17 12"],
    ["M6 4 L6 28", "M6 4 L15 9 L6 14", "M6 14 L15 22 L6 28"],
    ["M3 6 L17 26", "M17 6 L3 26"],
    ["M10 5 L17 16 L10 27 L3 16 Z", "M4 26 L1 31", "M16 26 L19 31"],
    ["M6 4 L6 28", "M6 4 L16 11 L6 18"],
    ["M16 5 L6 13 L14 21 L4 28"],
    ["M4 6 L16 26", "M16 6 L4 26", "M4 6 L16 6", "M4 26 L16 26"],
    ["M5 4 L5 28", "M5 4 L14 10 L5 16", "M5 16 L17 28"],
    ["M16 5 L4 16 L16 27"],
    ["M6 4 L6 28", "M6 4 L14 9"],
    ["M10 4 L10 28", "M10 4 L4 11", "M10 4 L16 11"],
    ["M5 4 L5 28", "M15 4 L15 28", "M5 16 L15 16"],
    ["M3 5 L3 27", "M17 5 L17 27", "M3 7 L17 25", "M17 7 L3 25"],
    ["M10 4 L10 28", "M10 5 L5 9", "M10 27 L15 23"],
    ["M6 4 L6 28", "M6 10 L13 16 L6 22"],
    ["M5 4 L5 28", "M15 4 L15 28", "M5 5 L15 13", "M15 5 L5 13"],
    ["M5 4 L5 28", "M5 8 L14 12", "M5 14 L14 18"],
    ["M5 11 L10 6 L15 11 L10 16 Z", "M10 16 L10 28"],
  ];
  const DOT = ["M9.4 13 L10.6 13", "M9.4 19 L10.6 19"];
  const RUNE_W = 20, RUNE_H = 32;
  const RADIUS = 246, CX = 280, CY = 280;

  const sequence: string[][] = [];
  for (let i = 0; i < RUNES.length; i++) {
    sequence.push(RUNES[i]);
    if ((i + 1) % 4 === 0) sequence.push(DOT);
  }
  while (sequence.length < 30) sequence.push(RUNES[sequence.length % RUNES.length]);
  const N = sequence.length;

  const jitter = (i: number, axis: number) => {
    const s = Math.sin(i * 12.9898 + axis * 78.233) * 43758.5453;
    return (s - Math.floor(s) - 0.5);
  };

  return (
    <svg viewBox="0 0 560 560" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: "rotateSlow 60s linear infinite", color: "var(--ink-2)", transition: "color 0.5s ease", pointerEvents: "none" }}>
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {Array.from({ length: N }, (_, i) => {
          const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
          const r = RADIUS + jitter(i, 0) * 3;
          const cx = CX + Math.cos(angle) * r;
          const cy = CY + Math.sin(angle) * r;
          const rotDeg = (angle * 180 / Math.PI) + 90 + jitter(i, 1) * 4;
          return (
            <g key={i} transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${rotDeg.toFixed(2)}) translate(${-RUNE_W / 2} ${-RUNE_H / 2})`}>
              {sequence[i].map((d, j) => <path key={j} d={d} />)}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const CARDS = [
  { id: "monster", href: "/monsters", status: "live", icon: "/icons/goblin.png",  titleKey: "card.monster.title" },
  { id: "map",     href: "/map",      status: "live", icon: "/icons/map.png",     titleKey: "card.map.title"     },
  { id: "shield",  href: "#",         status: "dev",  icon: "/icons/shield.png",  titleKey: "card.shield.title"  },
];

export default function Home() {
  const [dark, setDark] = useTheme();
  const [lang, setLang] = useState<Lang>("pt");

  return (
    <>
      <style>{`
        main, header, footer { position: relative; z-index: 2; }

        .lp-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 18px 32px;
          display: flex; align-items: center; justify-content: space-between;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          background: color-mix(in srgb, var(--bg) 75%, transparent);
          border-bottom: 1px solid var(--line);
          transition: background-color 0.5s ease, border-color 0.5s ease;
        }
        .lp-brand {
          font-family: var(--font-cormorant, serif); font-weight: 600; font-size: 22px;
          letter-spacing: -0.01em; color: var(--ink-2); text-decoration: none;
          display: flex; align-items: center; gap: 10px;
        }
        .lp-brand-mark { width: 18px; height: 18px; border: 1.5px solid currentColor; transform: rotate(45deg); position: relative; }
        .lp-brand-mark::after { content: ""; position: absolute; inset: 3px; border: 1px solid currentColor; opacity: 0.5; }
        .lp-header-actions { display: flex; align-items: center; gap: 14px; }
        .lp-lang { display: flex; gap: 2px; padding: 3px; border: 1px solid var(--line); border-radius: 999px; background: var(--bg-2); }
        .lp-lang button { background: transparent; border: 0; cursor: pointer; padding: 5px 11px; font-family: var(--font-dm-sans, sans-serif); font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); border-radius: 999px; transition: all 0.25s ease; }
        .lp-lang button.active { background: var(--ink-2); color: var(--bg-2); }
        .lp-lang button:hover:not(.active) { color: var(--ink); }
        .lp-theme-btn { width: 38px; height: 38px; border: 1px solid var(--line); background: var(--bg-2); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ink); transition: all 0.3s ease; }
        .lp-theme-btn:hover { border-color: var(--line-strong); transform: rotate(15deg); }
        .lp-theme-btn svg { width: 16px; height: 16px; }
        .lp-enter { font-family: var(--font-dm-sans, sans-serif); font-size: 13px; font-weight: 500; letter-spacing: 0.04em; padding: 9px 22px; border: 1px solid var(--ink-2); background: var(--ink-2); color: var(--bg-2); border-radius: 999px; cursor: pointer; transition: all 0.3s ease; text-decoration: none; }
        .lp-enter:hover { background: transparent; color: var(--ink-2); }

        .lp-hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120px 32px 60px; text-align: center; position: relative; }
        .lp-eyebrow { font-family: var(--font-dm-sans, sans-serif); font-size: 11px; font-weight: 500; letter-spacing: 0.4em; text-transform: uppercase; color: var(--muted); margin-bottom: 24px; display: flex; align-items: center; gap: 12px; animation: fadeUp 0.9s ease 0.2s both; }
        .lp-eyebrow::before, .lp-eyebrow::after { content: ""; width: 32px; height: 1px; background: var(--line-strong); }
        .lp-title { font-family: var(--font-cormorant, serif); font-weight: 600; font-size: clamp(72px, 14vw, 180px); line-height: 0.9; letter-spacing: -0.03em; color: var(--ink-2); margin-bottom: 12px; animation: fadeUp 1.1s cubic-bezier(0.2,0.9,0.3,1) 0.35s both; }
        .lp-subtitle { font-family: var(--font-dm-sans, sans-serif); font-size: 13px; font-weight: 500; letter-spacing: 0.32em; text-transform: uppercase; color: var(--ink-2); margin-bottom: 48px; animation: fadeUp 0.9s ease 0.55s both; }
        .lp-dice-stage { width: min(560px, 90vw); height: min(560px, 90vw); position: relative; margin: 0 auto; animation: fadeIn 1.5s ease 0.7s both; }
        .lp-tagline { max-width: 540px; font-size: 16px; color: var(--muted); margin-top: 20px; animation: fadeUp 0.9s ease 1.1s both; line-height: 1.7; }
        .lp-tagline em { font-family: var(--font-cormorant, serif); font-style: italic; color: var(--ink); font-size: 18px; }
        .lp-scroll { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); font-family: var(--font-dm-sans, sans-serif); font-size: 10px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--muted); display: flex; flex-direction: column; align-items: center; gap: 10px; animation: fadeIn 0.9s ease 1.4s both; }
        .lp-scroll::after { content: ""; width: 1px; height: 32px; background: var(--line-strong); animation: scrollPulse 2.4s ease-in-out infinite; transform-origin: top; }

        .lp-projects { padding: 140px 32px 120px; max-width: 1280px; margin: 0 auto; }
        .lp-section-head { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 24px; margin-bottom: 80px; padding-bottom: 32px; border-bottom: 1px solid var(--line); }
        .lp-section-eyebrow { font-family: var(--font-dm-sans, sans-serif); font-size: 11px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
        .lp-section-title { font-family: var(--font-cormorant, serif); font-weight: 500; font-size: clamp(40px, 6vw, 72px); letter-spacing: -0.02em; line-height: 1; color: var(--ink-2); }
        .lp-section-title em { font-style: italic; color: var(--accent); opacity: 0.8; }
        .lp-section-aside { max-width: 320px; font-size: 14px; color: var(--muted); line-height: 1.7; }
        .lp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }

        .lp-card { background: var(--bg-2); border: 1px solid var(--line); border-radius: 4px; padding: 40px 28px 32px; position: relative; transition: all 0.4s cubic-bezier(0.2,0.9,0.3,1); cursor: pointer; aspect-ratio: 4/5; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; overflow: hidden; isolation: isolate; text-decoration: none; color: inherit; }
        .lp-card::before, .lp-card::after { content: ""; position: absolute; width: 14px; height: 14px; border: 1px solid var(--line-strong); transition: all 0.4s ease; pointer-events: none; }
        .lp-card::before { top: 12px; left: 12px; border-right: 0; border-bottom: 0; }
        .lp-card::after { bottom: 12px; right: 12px; border-left: 0; border-top: 0; }
        .lp-card:hover { background: var(--ink-2); border-color: var(--ink-2); transform: translateY(-4px); box-shadow: var(--shadow); }
        .lp-card:hover::before, .lp-card:hover::after { border-color: var(--bg-2); width: 20px; height: 20px; }
        .lp-card-icon { flex: 1; width: 100%; max-height: 60%; display: flex; align-items: center; justify-content: center; padding: 8px; color: var(--ink-2); transition: color 0.4s ease, transform 0.5s cubic-bezier(0.2,0.9,0.3,1); }
        .lp-card:hover .lp-card-icon { color: var(--bg-2); transform: scale(1.06) rotate(-2deg); }
        .lp-card-title { font-family: var(--font-cormorant, serif); font-weight: 500; font-size: clamp(22px, 2.4vw, 28px); letter-spacing: -0.01em; color: var(--ink-2); line-height: 1.1; transition: color 0.4s ease; }
        .lp-card:hover .lp-card-title { color: var(--bg-2); }
        .lp-card-tag { position: absolute; top: 14px; right: 14px; font-family: var(--font-dm-sans, sans-serif); font-size: 9px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); display: inline-flex; align-items: center; gap: 6px; transition: color 0.4s ease; }
        .lp-card-tag::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: dmsPulse 2.4s ease-in-out infinite; }
        .lp-card:hover .lp-card-tag { color: color-mix(in srgb, var(--bg-2) 70%, transparent); }
        .lp-card-tag.live { color: #22a865; }

        footer { border-top: 1px solid var(--line); padding: 48px 32px 32px; text-align: center; position: relative; z-index: 2; }
        .lp-footer-mark { font-family: var(--font-cormorant, serif); font-style: italic; font-size: 18px; color: var(--ink-2); margin-bottom: 8px; }
        .lp-footer-quote { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
        .lp-footer-meta { display: flex; justify-content: center; gap: 24px; font-family: var(--font-dm-sans, sans-serif); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); flex-wrap: wrap; }
        .lp-footer-meta span { display: flex; align-items: center; gap: 8px; }
        .lp-footer-meta span::before { content: "✦"; color: var(--ink-2); opacity: 0.4; font-size: 8px; }
        .lp-footer-meta span:first-child::before { display: none; }

        @media (max-width: 720px) {
          .lp-header { padding: 14px 18px; }
          .lp-hero { padding: 100px 20px 40px; }
          .lp-projects { padding: 80px 20px 60px; }
          .lp-section-head { flex-direction: column; align-items: flex-start; }
          .lp-lang button { padding: 4px 8px; font-size: 10px; }
        }
      `}</style>

      <header className="lp-header">
        <a href="#" className="lp-brand">
          <span className="lp-brand-mark" />
          <span>DM&apos;s Hub</span>
        </a>
        <div className="lp-header-actions">
          <div className="lp-lang" role="tablist">
            {(["pt", "en", "es"] as Lang[]).map((l) => (
              <button key={l} className={lang === l ? "active" : ""} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="lp-theme-btn" onClick={() => setDark((d) => !d)} aria-label="Alternar tema">
            {dark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <Link href="/monsters" className="lp-enter">{t(lang, "cta.enter")}</Link>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-eyebrow">{t(lang, "hero.eyebrow")}</div>
          <h1 className="lp-title">DM&apos;s Hub</h1>
          <div className="lp-subtitle">{t(lang, "hero.subtitle")}</div>

          <div className="lp-dice-stage">
            <DiceCanvas />
            <RunesSVG />
          </div>

          <p className="lp-tagline" dangerouslySetInnerHTML={{ __html: t(lang, "hero.tagline") }} />
          <div className="lp-scroll">{t(lang, "hero.scroll")}</div>
        </section>

        <section className="lp-projects" id="projects">
          <div className="lp-section-head">
            <div>
              <div className="lp-section-eyebrow">{t(lang, "projects.eyebrow")}</div>
              <h2 className="lp-section-title" dangerouslySetInnerHTML={{ __html: t(lang, "projects.title") }} />
            </div>
            <p className="lp-section-aside">{t(lang, "projects.aside")}</p>
          </div>

          <div className="lp-grid">
            {CARDS.map(({ id, href, status, icon, titleKey }) => (
              <Link key={id} href={href} className="lp-card">
                <span className={`lp-card-tag${status === "live" ? " live" : ""}`}>
                  {t(lang, status === "live" ? "card.tag.live" : "card.tag.dev")}
                </span>
                <div className="lp-card-icon"><MaskIcon src={icon} /></div>
                <h3 className="lp-card-title">{t(lang, titleKey)}</h3>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <div className="lp-footer-mark">DM&apos;s Hub</div>
        <p className="lp-footer-quote">{t(lang, "footer.quote")}</p>
        <div className="lp-footer-meta">
          <span>{t(lang, "footer.year")}</span>
          <span>{t(lang, "footer.no_players")}</span>
          <span>{t(lang, "footer.crit")}</span>
        </div>
      </footer>
    </>
  );
}
