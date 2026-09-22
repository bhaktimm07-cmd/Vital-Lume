import { CheckCircle2, AlertTriangle, Siren, WifiOff } from "lucide-react";
import { ACTIVITY_LABELS } from "@/lib/evaluation";

const styles: Record<string, { bg: string; text: string; title: string; icon: typeof CheckCircle2 }> = {
  NORMAL: {
    bg: "bg-safe-soft",
    text: "text-safe-foreground",
    title: "All calm at home",
    icon: CheckCircle2,
  },
  WARNING: {
    bg: "bg-warn-soft",
    text: "text-warn-foreground",
    title: "Something needs a look",
    icon: AlertTriangle,
  },
  CRITICAL: {
    bg: "bg-danger-soft",
    text: "text-danger-foreground",
    title: "Urgent — help may be needed",
    icon: Siren,
  },
  OFFLINE: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    title: "Sensor is offline",
    icon: WifiOff,
  },
};

export function StatusBanner({
  classification,
  activityPattern,
  confidence,
  subtitle,
}: {
  classification: string;
  activityPattern?: string | undefined;
  confidence?: number | undefined;
  subtitle: string;
}) {
  const s = styles[classification] ?? styles["NORMAL"]!;
  const Icon = s.icon;
  return (
    <section className={`card-soft ${s.bg} p-6 sm:p-8`}>
      <div className="flex flex-wrap items-center gap-5">
        <span className={`relative grid h-16 w-16 place-items-center rounded-3xl bg-card ${s.text}`}>
          <Icon className="h-8 w-8" />
          {classification === "CRITICAL" && (
            <span className="pulse-ring absolute inset-0 rounded-3xl text-danger" />
          )}
        </span>
        <div className="min-w-[14rem] flex-1">
          <h2 className={`text-2xl font-extrabold sm:text-3xl ${s.text}`}>{s.title}</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip bg-card text-foreground">
            {ACTIVITY_LABELS[activityPattern ?? "UNKNOWN"] ?? "Waiting for data"}
          </span>
          {typeof confidence === "number" && confidence > 0 && (
            <span className="chip bg-card text-muted-foreground">
              Confidence {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
