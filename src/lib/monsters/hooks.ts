"use client";
import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("mc_theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("mc_theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);
  return [dark, setDark] as const;
}

export function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: string; id: number } | null>(null);
  const show = useCallback((msg: string, type = "success") => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 2800);
  }, []);
  return [toast, show] as const;
}

export function useStore() {
  const load = <T>(key: string, def: T): T => { try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? def; } catch { return def; } };
  const save = (key: string, val: unknown) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

  const [creatures,   setCreatures]   = useState<any[]>(() => load("mc_creatures", []));
  const [collections, setCollections] = useState<any[]>(() => load("mc_collections", []));

  const saveCreature = useCallback((creature: any, traits: any[], notes = "", image = "", tags: any[] = []) => {
    const existing = creatures.find(c => c.id === creature._editId);
    if (existing) {
      const updated = {
        ...existing,
        name: creature.name, cr: creature.challenge_rating, type: creature.type,
        creature, traits, notes, image, tags,
        updatedAt: new Date().toISOString(),
        versions: [
          { creature: existing.creature, traits: existing.traits, notes: existing.notes, savedAt: existing.updatedAt || existing.savedAt },
          ...(existing.versions || []),
        ].slice(0, 10),
      };
      setCreatures(p => { const n = p.map(c => c.id === existing.id ? updated : c); save("mc_creatures", n); return n; });
      return updated.id;
    }
    const entry = { id: Date.now(), name: creature.name, cr: creature.challenge_rating, type: creature.type, creature, traits, notes, image, tags, savedAt: new Date().toISOString(), versions: [] };
    setCreatures(p => { const n = [entry, ...p].slice(0, 50); save("mc_creatures", n); return n; });
    return entry.id;
  }, [creatures]);

  const removeCreature = useCallback((id: number) => {
    setCreatures(p => { const n = p.filter(c => c.id !== id); save("mc_creatures", n); return n; });
  }, []);

  const restoreVersion = useCallback((id: number, versionIdx: number) => {
    setCreatures(p => {
      const n = p.map(c => {
        if (c.id !== id) return c;
        const v = c.versions[versionIdx];
        if (!v) return c;
        return { ...c, creature: v.creature, traits: v.traits, notes: v.notes, updatedAt: new Date().toISOString(), versions: c.versions.filter((_: any, i: number) => i !== versionIdx) };
      });
      save("mc_creatures", n);
      return n;
    });
  }, []);

  const saveCollection = useCallback((col: any) => {
    setCollections(p => { const n = p.find(c => c.id === col.id) ? p.map(c => c.id === col.id ? col : c) : [...p, { ...col, id: Date.now() }]; save("mc_collections", n); return n; });
  }, []);

  const removeCollection = useCallback((id: number) => {
    setCollections(p => { const n = p.filter(c => c.id !== id); save("mc_collections", n); return n; });
  }, []);

  const exportJSON = useCallback((id: number) => {
    const entry = creatures.find(c => c.id === id);
    if (!entry) return;
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${entry.name.replace(/\s+/g, "_")}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [creatures]);

  const importJSON = useCallback((file: File, onDone: (err: string | null, name?: string) => void) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse((e.target as FileReader).result as string);
        if (!data.creature || !data.name) throw new Error("Invalid");
        const entry = { ...data, id: Date.now(), savedAt: new Date().toISOString(), versions: data.versions || [] };
        setCreatures(p => { const n = [entry, ...p].slice(0, 50); save("mc_creatures", n); return n; });
        onDone(null, entry.name);
      } catch { onDone("Arquivo inválido"); }
    };
    reader.readAsText(file);
  }, []);

  return { creatures, collections, saveCreature, removeCreature, restoreVersion, saveCollection, removeCollection, exportJSON, importJSON };
}

export const abilityCache = new Map<string, any>();
