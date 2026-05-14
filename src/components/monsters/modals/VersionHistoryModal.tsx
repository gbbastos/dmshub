"use client";

interface Props {
  entry: any;
  onRestore: (id: number, idx: number) => void;
  onClose: () => void;
}

export function VersionHistoryModal({ entry, onRestore, onClose }: Props) {
  if (!entry) return null;
  const versions = entry.versions || [];
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">🕒 Histórico — {entry.name}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {versions.length === 0
            ? <div style={{ color: "var(--text4)", textAlign: "center", padding: "24px 0", fontStyle: "italic" }}>Nenhuma versão anterior salva.</div>
            : versions.map((v: any, i: number) => (
              <div key={i} className="version-item">
                <div>
                  <div className="version-name">{v.creature?.name || entry.name}</div>
                  <div className="version-date">{v.savedAt ? new Date(v.savedAt).toLocaleString("pt-BR") : "—"}</div>
                  {v.traits?.length > 0 && <div className="version-traits">{v.traits.length} trait(s): {v.traits.map((t: any) => t.name).join(", ")}</div>}
                </div>
                <button className="btn-secondary btn-sm" onClick={() => { onRestore(entry.id, i); onClose(); }}>↩ Restaurar</button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
