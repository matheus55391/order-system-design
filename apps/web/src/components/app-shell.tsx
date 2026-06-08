"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CartHeaderButton } from "@/components/cart-header-button";
import { authService } from "@/services";
import { clearSessionQueries } from "@/lib/query-cache";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/store", label: "Minha loja" },
  { href: "/inventory", label: "Estoque" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/orders", label: "Pedidos" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = () => {
    if (refreshToken) {
      void authService.logout({ refreshToken }).catch(() => undefined);
    }
    clearSessionQueries(queryClient);
    clearSession();
    router.push("/login");
  };

  return (
    <div className="app-theme min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/store" className="flex items-center gap-2.5">
              <svg viewBox="0 0 40 40" className="size-7" aria-hidden>
                <rect x="4" y="8" width="8" height="24" rx="4" fill="#f97316" />
                <rect x="16" y="4" width="8" height="32" rx="4" fill="#f97316" opacity="0.7" />
                <rect x="28" y="10" width="8" height="20" rx="4" fill="#f97316" opacity="0.5" />
              </svg>
              <span className="text-sm font-medium text-zinc-300">
                {user?.name ?? "Order System"}
              </span>
            </Link>
            {user && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                {user.tenant.slug}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-600 sm:inline">
              {user?.role}
            </span>
            {user && <CartHeaderButton />}
            <Link
              href="/settings"
              title="Configurações"
              className={cn(
                "flex size-8 items-center justify-center rounded-full border transition-colors",
                pathname.startsWith("/settings")
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300",
              )}
            >
              <Settings className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex size-8 items-center justify-center rounded-full border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
              title="Sair"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative shrink-0 pb-3 text-sm font-medium transition-colors",
                  active ? "text-white" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-orange-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
