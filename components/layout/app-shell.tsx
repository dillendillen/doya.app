"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ReactNode } from "react";
import { MenuIcon } from "../ui/icons";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/dogs", label: "Dogs" },
  { href: "/clients", label: "Clients" },
  { href: "/sessions", label: "Sessions" },
  { href: "/plans", label: "Plans" },
  { href: "/tasks", label: "Tasks" },
  { href: "/media", label: "Media" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
  { href: "/audit", label: "Audit Log" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <aside className="hidden w-64 flex-col border-r border-neutral-200 bg-white/90 py-6 pl-6 pr-4 backdrop-blur lg:flex">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-lg font-semibold text-brand-primary">
            DOYA
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-secondary">
              DOYA Training
            </p>
            <p className="text-xs text-neutral-500">Operations Console</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-neutral-600 hover:bg-neutral-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 rounded-lg bg-neutral-100 p-3 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-800">Daily Focus</p>
          <p>Review progress on reactivity plans before end of day.</p>
        </div>
      </aside>
      <main className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white shadow-sm"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-5 w-5 text-neutral-600" />
          </button>
          <span className="text-sm font-semibold text-brand-secondary">
            DOYA Training
          </span>
        </div>
        <div className="flex-1 px-4 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
