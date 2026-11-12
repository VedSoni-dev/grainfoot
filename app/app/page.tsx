import Playground from "@/components/Playground";
import { PublikGate } from "@/components/PublikGate";
import "./playground.css";

// The software lives here, behind Sign in with publik. The landing page at / is public.
export const metadata = { title: "grainfoot · your footer" };

export default function AppPage() {
  return (
    <PublikGate appName="grainfoot">
      <Playground />
    </PublikGate>
  );
}
