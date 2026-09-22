import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { acknowledgeAlert, timeAgo, useLiveHome, type Alert } from "@/lib/vitallume";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts · VitalLume" },
      {
        name: "description",
        content: "Every alert the home sensor has raised, in plain language, with one-tap acknowledge.",
      },
      { property: "og:title", content: "Alerts · VitalLume" },
      {
        property: "og:description",
        content: "Active and past home alerts with plain-language explanations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

const explain: Record<string, string> = {
  TEMPERATURE_LOW: "The room dropped below a comfortable temperature.",
  TEMPERATURE_HIGH: "The room climbed above a comfortable temperature.",
  TEMPERATURE_CRITICAL: "The temperature reached a level that can be dangerous.",
  HUMIDITY_LOW: "Very dry air can irritate breathing and skin.",
  HUMIDITY_HIGH: "Very damp air encourages mould and feels unpleasant.",
  GAS_WARNING: "The air sensor picked up more particles or fumes than usual.",
  GAS_CRITICAL: "The air sensor spiked — treat as a possible gas or smoke leak.",
  LOUD_NOISE: "A sudden loud sound was heard in the room.",
  FALL_SUSPECTED: "A loud impact was followed by someone present but not moving.",
  INACTIVITY: "Someone has been in the room without moving for a while.",
};

function AlertRow({ alert, onAck }: { alert: Alert; onAck: (id: string) => void }) {
  const critical = alert.severity === "CRITICAL";
  return (
    <li
      className={`card-soft flex flex-wrap items-start gap-4 p-5 ${
        alert.acknowledged ? "opacity-70" : critical ? "bg-danger-soft" : "bg-warn-soft"
      }`}
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-2xl bg-card ${
          critical ? "text-danger-foreground" : "text-warn-foreground"
        }`}
      >
        {alert.acknowledged ? <CheckCircle2 className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
      </span>
      <div className="min-w-[14rem] flex-1">
        <p className="font-extrabold">{alert.message}</p>
        <p className="text-sm font-semibold text-muted-foreground">
          {explain[alert.type] ?? "Sensor threshold crossed."}
        </p>
        <p className="mt-1 text-xs font-bold text-muted-foreground">
          {critical ? "Urgent" : "Heads up"} · {alert.sensor ?? "sensor"} · {timeAgo(alert.timestamp)}
          {alert.value !== null && alert.threshold !== null
            ? ` · measured ${alert.value} vs limit ${alert.threshold}`
            : ""}
        </p>
      </div>
      {alert.acknowledged ? (
        <span className="chip bg-card text-muted-foreground">
          Acknowledged {timeAgo(alert.acknowledged_at)}
        </span>
      ) : (
        <button
          onClick={() => onAck(alert.id)}
          className="rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground shadow-soft"
        >
          I've got this
        </button>
      )}
    </li>
  );
}

function AlertsPage() {
  const { alerts, refresh } = useLiveHome();
  const [pending, setPending] = useState<string | null>(null);
  const active = alerts.filter((a) => !a.acknowledged);
  const past = alerts.filter((a) => a.acknowledged);

  async function ack(id: string) {
    setPending(id);
    await acknowledgeAlert(id);
    await refresh();
    setPending(null);
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-extrabold">Alerts</h1>
          <p className="text-sm font-semibold text-muted-foreground">
            {active.length === 0
              ? "Nothing needs your attention right now."
              : `${active.length} alert${active.length > 1 ? "s" : ""} waiting${pending ? " · saving…" : ""}`}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">Needs attention</h2>
          {active.length === 0 ? (
            <p className="card-soft p-6 font-semibold text-muted-foreground">All clear. 🌿</p>
          ) : (
            <ul className="space-y-3">
              {active.map((a) => (
                <AlertRow key={a.id} alert={a} onAck={(id) => void ack(id)} />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">Earlier</h2>
          {past.length === 0 ? (
            <p className="card-soft p-6 font-semibold text-muted-foreground">No past alerts yet.</p>
          ) : (
            <ul className="space-y-3">
              {past.slice(0, 20).map((a) => (
                <AlertRow key={a.id} alert={a} onAck={(id) => void ack(id)} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
