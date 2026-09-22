import { createFileRoute, Link } from "@tanstack/react-router";
import { Siren, PhoneCall, Users, Ambulance, ClipboardList, CheckCircle2 } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { acknowledgeAlert, timeAgo, useLiveHome } from "@/lib/vitallume";
import { ACTIVITY_LABELS } from "@/lib/evaluation";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Caregiver dispatch · VitalLume" },
      {
        name: "description",
        content:
          "When something urgent happens at home, see exactly what was detected and who gets notified.",
      },
      { property: "og:title", content: "Caregiver dispatch · VitalLume" },
      {
        property: "og:description",
        content: "The incident trace and escalation flow behind every urgent home alert.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dispatch,
});

const chain = [
  { icon: PhoneCall, who: "Primary caregiver", when: "Immediately", how: "Push + phone call" },
  { icon: Users, who: "Family circle", when: "After 60 seconds unanswered", how: "Push notification" },
  { icon: Ambulance, who: "Emergency services", when: "After 3 minutes unanswered", how: "Assisted call with incident summary" },
];

function Dispatch() {
  const { alerts, reading, device, refresh } = useLiveHome();
  const critical = alerts.filter((a) => a.severity === "CRITICAL");
  const incident = critical.find((a) => !a.acknowledged) ?? critical[0] ?? null;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-extrabold">Caregiver dispatch</h1>
          <p className="text-sm font-semibold text-muted-foreground">
            What happens the moment VitalLume sees something urgent.
          </p>
        </div>

        {!incident ? (
          <section className="card-soft bg-safe-soft p-8">
            <CheckCircle2 className="h-8 w-8 text-safe-foreground" />
            <h2 className="mt-3 text-2xl font-extrabold text-safe-foreground">No active incident</h2>
            <p className="mt-2 font-semibold text-muted-foreground">
              Nobody needs to be called. You can watch this page fill in by running the “Possible
              fall” scenario in the simulator.
            </p>
            <Link to="/simulator" className="mt-4 inline-block font-extrabold text-primary">
              Open the simulator →
            </Link>
          </section>
        ) : (
          <>
            <section
              className={`card-soft p-8 ${incident.acknowledged ? "bg-secondary" : "bg-danger-soft"}`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-3xl bg-card text-danger-foreground">
                  <Siren className="h-7 w-7" />
                </span>
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-danger-foreground">{incident.message}</h2>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {device?.name ?? "Home sensor"} · detected {timeAgo(incident.timestamp)} ·{" "}
                    {ACTIVITY_LABELS[reading?.activity_pattern ?? "UNKNOWN"]}
                  </p>
                </div>
                {incident.acknowledged ? (
                  <span className="chip bg-card text-muted-foreground">
                    Handled {timeAgo(incident.acknowledged_at)}
                  </span>
                ) : (
                  <button
                    onClick={async () => {
                      await acknowledgeAlert(incident.id);
                      await refresh();
                    }}
                    className="rounded-2xl bg-primary px-5 py-3 font-extrabold text-primary-foreground shadow-soft"
                  >
                    I'm responding
                  </button>
                )}
              </div>
            </section>

            <section className="card-soft p-6">
              <h3 className="flex items-center gap-2 text-xl font-extrabold">
                <ClipboardList className="h-5 w-5 text-primary" /> Incident trace
              </h3>
              <ul className="mt-4 space-y-3 text-sm font-semibold">
                <li className="rounded-2xl bg-secondary p-4">
                  Sensor reported: {reading?.temperature?.toFixed(1) ?? "—"}°C ·{" "}
                  {reading?.humidity?.toFixed(0) ?? "—"}% humidity · sound{" "}
                  {reading?.sound?.toFixed(0) ?? "—"} dB · {reading?.presence ? "person present" : "no presence"} ·{" "}
                  {reading?.motion ? "movement" : "no movement"}
                </li>
                <li className="rounded-2xl bg-secondary p-4">
                  Engine classified the moment as <b>{incident.severity}</b> from the{" "}
                  {incident.sensor ?? "combined"} signal
                  {incident.value !== null && incident.threshold !== null
                    ? ` (${incident.value} against a limit of ${incident.threshold})`
                    : ""}
                  .
                </li>
                <li className="rounded-2xl bg-secondary p-4">
                  Escalation opened at {new Date(incident.timestamp).toLocaleTimeString()} and stays
                  open until a caregiver responds.
                </li>
              </ul>
            </section>
          </>
        )}

        <section className="card-soft p-6">
          <h3 className="text-xl font-extrabold">Who gets notified</h3>
          <ol className="mt-4 space-y-3">
            {chain.map(({ icon: Icon, who, when, how }, i) => (
              <li key={who} className="flex flex-wrap items-center gap-4 rounded-2xl bg-secondary p-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="font-extrabold">
                    {i + 1}. {who}
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">{how}</p>
                </div>
                <span className="chip bg-card text-muted-foreground">{when}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
