import type { LucideIcon } from "lucide-react";

type Tone = "safe" | "warn" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  safe: "bg-safe-soft text-safe-foreground",
  warn: "bg-warn-soft text-warn-foreground",
  danger: "bg-danger-soft text-danger-foreground",
  neutral: "bg-sky-soft text-foreground",
};

export function ReadingTile({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string | undefined;
  tone?: Tone;
}) {
  return (
    <div className="card-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className={`chip ${tones[tone]}`}>
          {tone === "danger" ? "Act now" : tone === "warn" ? "Watch" : tone === "safe" ? "Good" : "Info"}
        </span>
      </div>
      <p className="mt-4 text-sm font-bold text-muted-foreground">{label}</p>
      <p className="font-display text-3xl font-extrabold">{value}</p>
      {detail && <p className="mt-1 text-sm font-semibold text-muted-foreground">{detail}</p>}
    </div>
  );
}
