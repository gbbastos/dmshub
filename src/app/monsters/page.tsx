"use client";
import dynamic from "next/dynamic";

const MonstersApp = dynamic(
  () => import("@/components/monsters/MonstersApp").then((m) => ({ default: m.MonstersApp })),
  { ssr: false }
);

export default function MonstersPage() {
  return <MonstersApp />;
}
