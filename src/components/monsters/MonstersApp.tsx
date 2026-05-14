"use client";
import { useState, useEffect } from "react";
import { decShare } from "@/lib/monsters/constants";
import { useTheme, useToast, useStore } from "@/lib/monsters/hooks";
import { ToastBanner } from "./ui/micro";
import { Builder } from "./builder/Builder";
import { SheetView } from "./sheet/SheetView";
import { CombatTracker } from "./combat/CombatTracker";
import { Comparator } from "./tools/Comparator";
import { AbilitySearch } from "./tools/AbilitySearch";

type Page = "builder" | "sheet" | "combat" | "compare" | "ability-search";

export function MonstersApp() {
  const [dark, setDark]     = useTheme();
  const [toast, showToast]  = useToast();
  const store               = useStore();
  const [page, setPage]     = useState<Page>("builder");
  const [sheetData, setSheet] = useState<any>(null);
  const [sharedLoad, setShared] = useState<any>(null);

  const goHome = () => setPage("builder");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("c");
    if (c) {
      const data = decShare(c);
      if (data?.creature) {
        window.history.replaceState({}, "", window.location.pathname);
        setShared(data);
        setPage("builder");
        showToast("Criatura compartilhada carregada!");
      } else {
        showToast("Link inválido", "error");
      }
    }
  }, []);

  const goForge = (creature: any, traits: any[], notes = "", image = "", entryId: number | null = null) => {
    setSheet({ creature, traits, notes, image, entryId });
    setPage("sheet");
  };

  return (
    <>
      <ToastBanner toast={toast} />
      {page === "builder" && <Builder onBack={goHome} onForge={goForge} dark={dark} setDark={setDark} store={store} showToast={showToast} sharedLoad={sharedLoad} goHome={goHome} />}
      {page === "sheet" && sheetData && <SheetView {...sheetData} entryId={sheetData.entryId} onBack={() => setPage("builder")} onNew={() => { setSheet(null); setPage("builder"); }} dark={dark} setDark={setDark} store={store} showToast={showToast} goHome={goHome} />}
      {page === "combat"         && <CombatTracker goHome={goHome} />}
      {page === "compare"        && <Comparator creatures={store.creatures} goHome={goHome} />}
      {page === "ability-search" && <AbilitySearch goHome={goHome} />}
    </>
  );
}
