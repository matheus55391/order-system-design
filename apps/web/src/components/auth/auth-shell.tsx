import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="auth-theme flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link href="/login" className="flex size-12 items-center justify-center">
            <svg viewBox="0 0 40 40" className="size-10" aria-hidden>
              <rect x="4" y="8" width="8" height="24" rx="4" fill="#f97316" />
              <rect x="16" y="4" width="8" height="32" rx="4" fill="#f97316" opacity="0.7" />
              <rect x="28" y="10" width="8" height="20" rx="4" fill="#f97316" opacity="0.5" />
            </svg>
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {title}
            </h1>
            <p className="text-sm text-zinc-500">{subtitle}</p>
          </div>
        </div>

        {children}

        {footer && (
          <p className="text-center text-sm text-zinc-500">{footer}</p>
        )}
      </div>
    </div>
  );
}
