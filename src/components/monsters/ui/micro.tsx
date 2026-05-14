"use client";

export const Spin = () => <span className="spinner" />;

export function SH({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="sec-head">
      <div className="sec-head-dot" />
      <span className="sec-head-text">{label}</span>
      <div className="sec-head-line" />
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

export function ToastBanner({ toast }: { toast: { id: number; msg: string; type: string } | null }) {
  if (!toast) return null;
  return (
    <div key={toast.id} className={`toast toast-${toast.type}`}>
      {toast.type === "success" ? "✓  " : "⚠  "}{toast.msg}
    </div>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = { action:"badge-action", legendary:"badge-legendary", reaction:"badge-reaction", special:"badge-special", spell:"badge-spell" };
  const lbl: Record<string, string> = { action:"Ação", legendary:"Lendária", reaction:"Reação", special:"Especial", spell:"Magia" };
  return <span className={`type-badge ${map[type] ?? "badge-special"}`}>{lbl[type] ?? "Especial"}</span>;
}

export function Tag({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`tag ${cls}`}>{children}</span>;
}

export function ThemeBtn({ dark, setDark }: { dark: boolean; setDark: (fn: (d: boolean) => boolean) => void }) {
  return (
    <button className="btn-icon" title={dark ? "Modo Claro" : "Modo Escuro"} onClick={() => setDark(d => !d)}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="field-label">{children}</span>;
}
