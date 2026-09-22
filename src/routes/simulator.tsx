import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Siren, Sun, CheckCircle2, PlugZap } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { StatusBanner } from "@/components/status-banner";
import { useLiveHome, runScenario, timeAgo } from "@/lib/vitallume";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Emergency simulator · VitalLume" },
      {
        name: "description",
        content: "Simulate a fall, a gas leak or an offline sensor and watch the home dashboard react.",
      },
      { property: "og:title", content: "Emergency simulator · VitalLume" },
      {
        property: "og:description",
        content: "Trigger demo scenarios and watch alerts propagate in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Simulator,
});

const scenarios = [
  {
    id: "normal",
    icon: CheckCircle2,
    title: "Calm evening",
    text: "Comfortable room, someone moving about.",
    tone: "bg-safe-soft text-safe-foreground",
  },
  {
    id: "warning_temp",
    icon: Sun,
    title: "Room too hot",
    text: "Temperature climbs past the safe range.",
    tone: "bg-warn-soft text-warn-foreground",
  },
  {
    id: "warning_gas",
    icon: Flame,
    title: "Air quality dropping",
    text: "Gas levels rise — smoke or a cooker left on.",
    tone: "bg-warn-soft text-warn-foreground",
  },
  {
    id: "critical_fall",
    icon: Siren,
    title: "Possible fall",
    text: "Loud impact, person present, no movement after.",
    tone: "bg-danger-soft text-danger-foreground",
  },
  {
    id: "device_offline",
    icon: PlugZap,
    title: "Sensor goes offline",
    text: "The device stops reporting entirely.",
    tone: "bg-muted text-muted-foreground",
  },
];

function Simulator() {
  const { reading, classification, refresh } = useLiveHome();
  const [busy, setBusy] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);

  async function trigger(id: string) {
    setBusy(id);
    await runScenario(id);
    await refresh();
    setLast(id);
    setBusy(null);
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-extrabold">Emergency simulator</h1>
          <p className="text-sm font-semibold text-muted-foreground">
            No hardware needed — press a scenario and watch it flow through the home, the alerts and
            the caregiver dispatch view.
          </p>
        </div>

        <StatusBanner
          classification={classification}
          activityPattern={reading?.activity_pattern}
          confidence={reading?.confidence}
          subtitle={`Live state · last reading ${timeAgo(reading?.timestamp)}`}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map(({ id, icon: Icon, title, text, tone }) => (
            <button
              key={id}
              onClick={() => void trigger(id)}
              disabled={busy !== null}
              className="card-soft p-6 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}>
                <Icon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-lg font-extrabold">{title}</p>
              <p className="text-sm font-semibold text-muted-foreground">{text}</p>
              <p className="mt-3 text-sm font-extrabold text-primary">
                {busy === id ? "Sending…" : last === id ? "Sent ✓" : "Run scenario →"}
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
