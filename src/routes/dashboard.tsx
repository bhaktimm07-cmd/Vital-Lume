import { createFileRoute, Link } from "@tanstack/react-router";
import { Thermometer, Droplets, Wind, Ear, Waves, Wifi, WifiOff, Copy } from "lucide-react";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { StatusBanner } from "@/components/status-banner";
import { ReadingTile } from "@/components/reading-tile";
import { DEFAULT_THRESHOLDS, airQualityLabel } from "@/lib/evaluation";
import { useLiveHome, timeAgo, DEFAULT_DEVICE_ID } from "@/lib/vitallume";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live home · VitalLume" },
      {
        name: "description",
        content:
          "See the current temperature, air quality, sound and movement in the home, updating live.",
      },
      { property: "og:title", content: "Live home · VitalLume" },
      {
        property: "og:description",
        content: "Current home conditions at a glance, updating live as the sensor reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const t = DEFAULT_THRESHOLDS;

function Dashboard() {
  const { reading, device, online, classification, alerts, loading } = useLiveHome();
  const [copied, setCopied] = useState(false);
  const unacked = alerts.filter((a) => !a.acknowledged);

  const temp = reading?.temperature ?? null;
  const hum = reading?.humidity ?? null;
  const gas = reading?.gas ?? null;
  const sound = reading?.sound ?? null;

  const endpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/device/data`
      : "/api/public/device/data";

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">{device?.name ?? "Home sensor"}</h1>
            <p className="text-sm font-semibold text-muted-foreground">
              Updated {timeAgo(reading?.timestamp)} · live, no refresh needed
            </p>
          </div>
          <span
            className={`chip ${online ? "bg-safe-soft text-safe-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            Device {online ? "online" : "offline"}
          </span>
        </div>

        <StatusBanner
          classification={classification}
          activityPattern={reading?.activity_pattern}
          confidence={reading?.confidence}
          subtitle={
            loading
              ? "Connecting to the home sensor…"
              : !online
                ? `No readings for over ${t.offlineTimeoutSeconds} seconds. Check the sensor's power and Wi-Fi.`
                : unacked.length > 0
                  ? `${unacked.length} alert${unacked.length > 1 ? "s" : ""} waiting for someone to look`
                  : "Everything in the room looks the way it should."
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ReadingTile
            icon={Thermometer}
            label="Temperature"
            value={temp === null ? "—" : `${temp.toFixed(1)}°C`}
            detail={
              temp === null
                ? "Waiting for the sensor"
                : temp <= t.tempCold
                  ? "Too cold — add warmth"
                  : temp >= t.tempHot
                    ? "Too warm — cool the room"
                    : "Comfortable"
            }
            tone={
              temp === null
                ? "neutral"
                : temp <= t.tempCold - 4 || temp >= t.tempHot + 5
                  ? "danger"
                  : temp <= t.tempCold || temp >= t.tempHot
                    ? "warn"
                    : "safe"
            }
          />
          <ReadingTile
            icon={Droplets}
            label="Humidity"
            value={hum === null ? "—" : `${hum.toFixed(0)}%`}
            detail={
              hum === null
                ? "Waiting for the sensor"
                : hum <= t.humidityLow
                  ? "Air is very dry"
                  : hum >= t.humidityHigh
                    ? "Air is very damp"
                    : "Just right"
            }
            tone={
              hum === null ? "neutral" : hum <= t.humidityLow || hum >= t.humidityHigh ? "warn" : "safe"
            }
          />
          <ReadingTile
            icon={Wind}
            label="Air quality"
            value={airQualityLabel(gas)}
            detail={gas === null ? "Waiting for the sensor" : `Gas sensor reading ${gas.toFixed(0)}`}
            tone={
              gas === null
                ? "neutral"
                : gas >= t.gasCritical
                  ? "danger"
                  : gas >= t.gasWarning
                    ? "warn"
                    : "safe"
            }
          />
          <ReadingTile
            icon={Ear}
            label="Sound level"
            value={sound === null ? "—" : sound >= t.soundShock ? "Loud impact" : "Quiet"}
            detail={sound === null ? "Waiting for the sensor" : `${sound.toFixed(0)} dB in the room`}
            tone={sound === null ? "neutral" : sound >= t.soundShock ? "danger" : "safe"}
          />
          <ReadingTile
            icon={Waves}
            label="Movement"
            value={reading?.motion ? "Moving" : "Still"}
            detail={
              reading?.presence
                ? reading?.motion
                  ? "Someone is up and about"
                  : "Someone is present but not moving"
                : "Nobody detected in the room"
            }
            tone={
              !reading
                ? "neutral"
                : reading.presence && !reading.motion
                  ? "warn"
                  : reading.presence
                    ? "safe"
                    : "neutral"
            }
          />
          <div className="card-soft p-5">
            <p className="text-sm font-bold text-muted-foreground">Recent alerts</p>
            {alerts.length === 0 ? (
              <p className="mt-3 font-semibold text-muted-foreground">Nothing has needed attention.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {alerts.slice(0, 3).map((a) => (
                  <li key={a.id} className="rounded-2xl bg-secondary p-3 text-sm font-semibold">
                    <span
                      className={a.severity === "CRITICAL" ? "text-danger-foreground" : "text-warn-foreground"}
                    >
                      {a.severity === "CRITICAL" ? "Urgent" : "Heads up"}
                    </span>{" "}
                    — {a.message}
                  </li>
                ))}
              </ul>
            )}
            <Link to="/alerts" className="mt-4 inline-block text-sm font-extrabold text-primary">
              Open alerts →
            </Link>
          </div>
        </div>

        <section className="card-soft p-6">
          <h2 className="text-xl font-extrabold">Connect your sensor</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Point the device at this address and it will appear here within a couple of seconds.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="rounded-2xl bg-secondary px-4 py-2 text-sm font-bold">{endpoint}</code>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(endpoint);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="chip bg-primary text-primary-foreground"
            >
              <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-secondary p-4 text-xs font-semibold">{`POST ${endpoint}
Authorization: Bearer <your device key>
Content-Type: application/json

{"deviceId":"${DEFAULT_DEVICE_ID}","temperature":22.4,"humidity":46,
 "pressure":1012,"gas":60,"sound":38,"motion":true,"presence":true}`}</pre>
        </section>
      </main>
    </div>
  );
}
