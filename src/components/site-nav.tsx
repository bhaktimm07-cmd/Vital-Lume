import { Link } from "@tanstack/react-router";
import { Home, Activity, Bell, Siren, Zap } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Live home", icon: Activity },
  { to: "/simulator", label: "Simulator", icon: Zap },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/dispatch", label: "Dispatch", icon: Siren },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 pr-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Activity className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-extrabold">VitalLume</span>
        </Link>
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground [&.active]:bg-secondary [&.active]:text-secondary-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
