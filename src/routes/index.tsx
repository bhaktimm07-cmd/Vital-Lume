import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, EyeOff, Thermometer, Wind, Ear, Waves, HeartHandshake } from "lucide-react";
import heroImage from "@/assets/hero-home.jpg";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VitalLume — the invisible home guardian" },
      {
        name: "description",
        content:
          "Ambient home safety for the people you love. VitalLume senses temperature, air, sound and movement — with no cameras and nothing to wear.",
      },
      { property: "og:title", content: "VitalLume — the invisible home guardian" },
      {
        property: "og:description",
        content:
          "Ambient home safety for the people you love. No cameras, no wearables — just a small sensor that quietly watches over the home.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Thermometer,
    title: "One small sensor",
    text: "A single device on a shelf reads temperature, humidity, air quality, sound and movement in the room.",
  },
  {
    icon: Waves,
    title: "It learns the room's rhythm",
    text: "VitalLume combines the readings to tell calm from concerning — a cold room, a gas leak, a loud fall.",
  },
  {
    icon: HeartHandshake,
    title: "Family gets a clear nudge",
    text: "Plain-language alerts, never jargon. If something is urgent, the caregiver flow kicks in immediately.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="chip bg-safe-soft text-safe-foreground">
              <ShieldCheck className="h-4 w-4" /> Privacy-first by design
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-6xl">
              The invisible home guardian
            </h1>
            <p className="mt-5 max-w-lg text-lg font-semibold text-muted-foreground">
              VitalLume quietly watches over a home using ambient sensors. No cameras. Nothing to
              wear. Just calm reassurance for families and caregivers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-2xl bg-primary px-6 py-3 text-base font-extrabold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
              >
                See the live home
              </Link>
              <Link
                to="/simulator"
                className="rounded-2xl border border-border bg-card px-6 py-3 text-base font-extrabold shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Try a demo scenario
              </Link>
            </div>
          </div>
          <img
            src={heroImage}
            alt="A grandmother reading in a cosy living room with a small VitalLume sensor on the sideboard"
            width={1280}
            height={960}
            className="rounded-[2rem] border border-border shadow-pop"
          />
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card-soft p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-safe-soft text-safe-foreground">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-xl font-extrabold">{title}</h3>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>

        <section className="card-soft mt-14 grid gap-8 p-8 md:grid-cols-2 md:p-10">
          <div>
            <span className="chip bg-warn-soft text-warn-foreground">
              <EyeOff className="h-4 w-4" /> What we never collect
            </span>
            <h2 className="mt-4 text-3xl font-extrabold">Dignity stays at home</h2>
            <p className="mt-3 font-semibold text-muted-foreground">
              No video, no audio recordings, no body-worn trackers, and no health diagnosis. The
              sensor reports numbers about the room — not pictures of a person.
            </p>
          </div>
          <ul className="grid gap-3 text-sm font-bold">
            {[
              ["No cameras", "Nothing is filmed, ever."],
              ["No wearables", "Nothing to charge, clip on or remember."],
              ["No recordings", "Sound is measured as a loudness level only."],
              ["Not a medical device", "VitalLume flags risk in the room, it does not diagnose."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-secondary p-4">
                <p className="text-secondary-foreground">{t}</p>
                <p className="mt-1 font-semibold text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Thermometer, label: "Temperature & humidity", text: "Too cold, too hot, too damp." },
            { icon: Wind, label: "Air quality", text: "Smoke, gas and stuffy air." },
            { icon: Ear, label: "Sound level", text: "Loud impacts like a fall." },
            { icon: Waves, label: "Movement & presence", text: "Someone there but not moving." },
          ].map(({ icon: Icon, label, text }) => (
            <div key={label} className="card-soft p-5">
              <Icon className="h-6 w-6 text-primary" />
              <p className="mt-3 font-extrabold">{label}</p>
              <p className="text-sm font-semibold text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
