// VitalLume evaluation engine — non-diagnostic, physics/threshold based.
// No respiration, heart-rate or any vital-sign inference anywhere.

export type Classification = "NORMAL" | "WARNING" | "CRITICAL";
export type RiskLevel = "LOW" | "MODERATE" | "ELEVATED" | "HIGH";

export type Thresholds = {
  tempCold: number;
  tempHot: number;
  humidityLow: number;
  humidityHigh: number;
  gasWarning: number;
  gasCritical: number;
  soundShock: number;
  offlineTimeoutSeconds: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  tempCold: 16,
  tempHot: 32,
  humidityLow: 25,
  humidityHigh: 70,
  gasWarning: 180,
  gasCritical: 320,
  soundShock: 85,
  offlineTimeoutSeconds: 60,
};

export type Reading = {
  temperature?: number | null;
  humidity?: number | null;
  pressure?: number | null;
  gas?: number | null;
  sound?: number | null;
  motion?: boolean | null;
  presence?: boolean | null;
};

export type Finding = {
  type: string;
  severity: "WARNING" | "CRITICAL";
  message: string;
  sensor: string;
  value: number | null;
  threshold: number | null;
};

export type Evaluation = {
  classification: Classification;
  riskLevel: RiskLevel;
  activityPattern: string;
  confidence: number;
  findings: Finding[];
};

const num = (v: number | null | undefined): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export function evaluateReading(r: Reading, t: Thresholds = DEFAULT_THRESHOLDS): Evaluation {
  const findings: Finding[] = [];
  const temp = num(r.temperature);
  const hum = num(r.humidity);
  const gas = num(r.gas);
  const sound = num(r.sound);
  const motion = !!r.motion;
  const presence = !!r.presence;

  if (temp !== null) {
    if (temp <= t.tempCold - 4) {
      findings.push({
        type: "TEMPERATURE_CRITICAL",
        severity: "CRITICAL",
        message: `It is dangerously cold in the home (${temp.toFixed(1)}°C).`,
        sensor: "temperature",
        value: temp,
        threshold: t.tempCold - 4,
      });
    } else if (temp <= t.tempCold) {
      findings.push({
        type: "TEMPERATURE_LOW",
        severity: "WARNING",
        message: `The room is getting cold (${temp.toFixed(1)}°C).`,
        sensor: "temperature",
        value: temp,
        threshold: t.tempCold,
      });
    } else if (temp >= t.tempHot + 5) {
      findings.push({
        type: "TEMPERATURE_CRITICAL",
        severity: "CRITICAL",
        message: `Dangerous heat detected (${temp.toFixed(1)}°C).`,
        sensor: "temperature",
        value: temp,
        threshold: t.tempHot + 5,
      });
    } else if (temp >= t.tempHot) {
      findings.push({
        type: "TEMPERATURE_HIGH",
        severity: "WARNING",
        message: `The room is getting hot (${temp.toFixed(1)}°C).`,
        sensor: "temperature",
        value: temp,
        threshold: t.tempHot,
      });
    }
  }

  if (hum !== null) {
    if (hum <= t.humidityLow) {
      findings.push({
        type: "HUMIDITY_LOW",
        severity: "WARNING",
        message: `The air is very dry (${hum.toFixed(0)}% humidity).`,
        sensor: "humidity",
        value: hum,
        threshold: t.humidityLow,
      });
    } else if (hum >= t.humidityHigh) {
      findings.push({
        type: "HUMIDITY_HIGH",
        severity: "WARNING",
        message: `The air is very damp (${hum.toFixed(0)}% humidity).`,
        sensor: "humidity",
        value: hum,
        threshold: t.humidityHigh,
      });
    }
  }

  if (gas !== null) {
    if (gas >= t.gasCritical) {
      findings.push({
        type: "GAS_CRITICAL",
        severity: "CRITICAL",
        message: "Possible gas or smoke leak — air quality is unsafe.",
        sensor: "gas",
        value: gas,
        threshold: t.gasCritical,
      });
    } else if (gas >= t.gasWarning) {
      findings.push({
        type: "GAS_WARNING",
        severity: "WARNING",
        message: "Air quality is dropping — something is in the air.",
        sensor: "gas",
        value: gas,
        threshold: t.gasWarning,
      });
    }
  }

  // Fall-like event: a loud shock followed by presence in the room but no movement.
  const shock = sound !== null && sound >= t.soundShock;
  if (shock && presence && !motion) {
    findings.push({
      type: "FALL_SUSPECTED",
      severity: "CRITICAL",
      message: "Loud impact detected and someone is present but not moving — possible fall.",
      sensor: "sound",
      value: sound,
      threshold: t.soundShock,
    });
  } else if (shock) {
    findings.push({
      type: "LOUD_NOISE",
      severity: "WARNING",
      message: "An unusually loud noise was detected.",
      sensor: "sound",
      value: sound,
      threshold: t.soundShock,
    });
  } else if (presence && !motion) {
    findings.push({
      type: "INACTIVITY",
      severity: "WARNING",
      message: "Someone is in the room but has been still for a while.",
      sensor: "motion",
      value: 0,
      threshold: 1,
    });
  }

  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  const warnCount = findings.filter((f) => f.severity === "WARNING").length;
  const classification: Classification = hasCritical
    ? "CRITICAL"
    : warnCount > 0
      ? "WARNING"
      : "NORMAL";

  const riskLevel: RiskLevel = hasCritical
    ? "HIGH"
    : warnCount >= 2
      ? "ELEVATED"
      : warnCount === 1
        ? "MODERATE"
        : "LOW";

  let activityPattern = "QUIET_HOME";
  if (findings.some((f) => f.type === "FALL_SUSPECTED")) activityPattern = "POSSIBLE_FALL";
  else if (motion && presence) activityPattern = "ACTIVE_MOVEMENT";
  else if (presence && !motion) activityPattern = "RESTING";
  else if (motion) activityPattern = "PASSING_THROUGH";
  else if (!presence) activityPattern = "NOBODY_HOME";

  const sensorsSeen = [temp, hum, gas, sound].filter((v) => v !== null).length;
  const confidence = Math.min(
    0.99,
    0.55 + sensorsSeen * 0.08 + (presence || motion ? 0.08 : 0) + (hasCritical ? 0.06 : 0),
  );

  return {
    classification,
    riskLevel,
    activityPattern,
    confidence: Number(confidence.toFixed(2)),
    findings,
  };
}

export const ACTIVITY_LABELS: Record<string, string> = {
  QUIET_HOME: "Quiet at home",
  ACTIVE_MOVEMENT: "Moving around",
  RESTING: "Resting / still",
  PASSING_THROUGH: "Brief movement",
  NOBODY_HOME: "Nobody home",
  POSSIBLE_FALL: "Possible fall",
  UNKNOWN: "Waiting for data",
};

export function airQualityLabel(gas: number | null | undefined, t = DEFAULT_THRESHOLDS) {
  const v = num(gas ?? null);
  if (v === null) return "No reading";
  if (v >= t.gasCritical) return "Unsafe";
  if (v >= t.gasWarning) return "Poor";
  if (v >= t.gasWarning * 0.6) return "Fair";
  return "Good";
}
