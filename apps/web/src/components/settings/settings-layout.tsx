"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  Plug,
  Store,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SettingsTab } from "@/lib/tenant-settings";
import { cn } from "@/lib/utils";

export const settingsNav: {
  id: SettingsTab;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "general", label: "Geral", icon: Building2 },
  { id: "marketplace", label: "Marketplace", icon: Store },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "integrations", label: "Integrações", icon: Plug },
  { id: "team", label: "Equipe", icon: Users },
];

export function SettingsSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && (
            <p className="max-w-xl text-sm text-zinc-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-800/80 py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      <div className="sm:min-w-[200px] sm:text-right">{children}</div>
    </div>
  );
}

export function SettingsPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-5">
      {children}
    </div>
  );
}

export function SettingsSidebar({
  active,
  onChange,
}: {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {settingsNav.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <Button
            key={item.id}
            type="button"
            variant={isActive ? "secondary" : "ghost"}
            onClick={() => onChange(item.id)}
            className={cn(
              "w-full justify-start gap-2.5 px-3 py-2.5 text-sm font-medium",
              !isActive && "text-muted-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}
