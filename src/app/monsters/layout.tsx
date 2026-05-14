import "./monsters.css";
import type { ReactNode } from "react";

export const metadata = { title: "Monster's Cauldron — DM's Hub" };

export default function MonstersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
