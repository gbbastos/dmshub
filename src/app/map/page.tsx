"use client";
import dynamic from "next/dynamic";

const HextashApp = dynamic(
  () => import("@/components/map/HextashApp").then((m) => ({ default: m.HextashApp })),
  { ssr: false }
);

export default function MapPage() {
  return <HextashApp />;
}
