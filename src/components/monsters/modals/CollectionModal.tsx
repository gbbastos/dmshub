"use client";
import { useState } from "react";
import { COLLECTION_COLORS } from "@/lib/monsters/constants";
import { FieldLabel } from "../ui/micro";

interface Props {
  collections: any[];
  onSave: (col: any) => void;
  onRemove: (id: number) => void;
  onClose: () => void;
}

export function CollectionModal({ collections, onSave, onRemove, onClose }: Props) {
  const [name,  setName]  = useState("");
  const [color, setColor] = useState(COLLECTION_COLORS[0]);

  const create = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    setName("");
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">📁 Gerenciar Coleções</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Nome da Coleção</FieldLabel>
              <input className="mc-input" placeholder="Ex: Campanha do Norte" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && create()} />
            </div>
            <div>
              <FieldLabel>Cor</FieldLabel>
              <div style={{ display: "flex", gap: 4 }}>
                {COLLECTION_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: `2px solid ${color === c ? "var(--text)" : "transparent"}`, cursor: "pointer" }} />
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={create} style={{ padding: "9px 18px", flexShrink: 0 }}>+ Criar</button>
          </div>
          {collections.length === 0
            ? <div style={{ color: "var(--text4)", textAlign: "center", padding: "16px 0", fontStyle: "italic" }}>Nenhuma coleção criada.</div>
            : collections.map(c => (
              <div key={c.id} className="version-item">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                </div>
                <button className="btn-icon" onClick={() => onRemove(c.id)} title="Remover coleção">🗑</button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
