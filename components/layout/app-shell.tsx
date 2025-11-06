"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ReactNode, useState, useEffect, useMemo } from "react";
import { MenuIcon, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, HomeIcon, DogIcon, UserIcon, CalendarIcon, MoneyIcon, SettingsIcon } from "../ui/icons";
import { useTheme } from "@/components/providers/theme-provider";

type NavItemConfig = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
  order: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
  order: number;
};

const DEFAULT_NAV_ITEMS_CONFIG: NavItemConfig[] = [
  { href: "/", label: "Dashboard", icon: HomeIcon, visible: true, order: 1 },
  { href: "/dogs", label: "Dogs", icon: DogIcon, visible: true, order: 2 },
  { href: "/clients", label: "Clients", icon: UserIcon, visible: true, order: 3 },
  { href: "/sessions", label: "Sessions", icon: CalendarIcon, visible: true, order: 4 },
  { href: "/tasks", label: "Tasks", icon: CalendarIcon, visible: true, order: 5 },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon, visible: true, order: 6 },
  { href: "/bookings", label: "Bookings", icon: CalendarIcon, visible: true, order: 7 },
  { href: "/media", label: "Media", icon: CalendarIcon, visible: true, order: 8 },
  { href: "/packages", label: "Packages", icon: MoneyIcon, visible: true, order: 9 },
  { href: "/billing", label: "Billing", icon: MoneyIcon, visible: true, order: 10 },
  { href: "/settings", label: "Settings", icon: SettingsIcon, visible: true, order: 11 },
  { href: "/audit", label: "Audit Log", icon: SettingsIcon, visible: true, order: 12 },
];

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
} | null;

type AppShellProps = {
  children: ReactNode;
  user?: CurrentUser;
};

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // Load nav items from localStorage or use defaults
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    if (typeof window === "undefined") {
      // Map icon names to components
      return DEFAULT_NAV_ITEMS_CONFIG.map((item) => ({
        ...item,
        icon: item.icon,
      }));
    }
    
    try {
      const saved = localStorage.getItem("navItems");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved with defaults to handle new items
        const merged = DEFAULT_NAV_ITEMS_CONFIG.map((defaultItem) => {
          const savedItem = parsed.find((item: any) => item.href === defaultItem.href);
          if (savedItem) {
            return {
              ...defaultItem,
              visible: savedItem.visible !== undefined ? savedItem.visible : defaultItem.visible,
              order: savedItem.order !== undefined ? savedItem.order : defaultItem.order,
            };
          }
          return defaultItem;
        });
        return merged.sort((a, b) => a.order - b.order);
      }
    } catch (error) {
      console.error("Failed to load nav items from localStorage", error);
    }
    
    // Map icon components
    return DEFAULT_NAV_ITEMS_CONFIG.map((item) => ({
      ...item,
      icon: item.icon,
    }));
  });

  // Save nav items to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Save only config (without icon component)
        const config = navItems.map(({ icon, ...rest }) => rest);
        localStorage.setItem("navItems", JSON.stringify(config));
      } catch (error) {
        console.error("Failed to save nav items to localStorage", error);
      }
    }
  }, [navItems]);

  // Listen for nav items updates from settings page
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem("navItems");
        if (saved) {
          const parsed = JSON.parse(saved);
          const merged = DEFAULT_NAV_ITEMS_CONFIG.map((defaultItem) => {
            const savedItem = parsed.find((item: any) => item.href === defaultItem.href);
            if (savedItem) {
              return {
                ...defaultItem,
                visible: savedItem.visible !== undefined ? savedItem.visible : defaultItem.visible,
                order: savedItem.order !== undefined ? savedItem.order : defaultItem.order,
              };
            }
            return defaultItem;
          });
          setNavItems(merged.sort((a, b) => a.order - b.order));
        }
      } catch (error) {
        console.error("Failed to reload nav items", error);
      }
    };

    window.addEventListener("navItemsUpdated", handleUpdate);
    return () => window.removeEventListener("navItemsUpdated", handleUpdate);
  }, []);

  // Filter and sort visible items
  const visibleNavItems = useMemo(() => {
    return navItems
      .filter((item) => item.visible)
      .sort((a, b) => a.order - b.order);
  }, [navItems]);

  return (
    <div className="flex min-h-screen bg-brand-surface dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <aside className={clsx(
        "hidden lg:flex flex-col border-r border-neutral-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 py-6 backdrop-blur transition-all duration-300",
        isCollapsed ? "w-16 pl-3 pr-3" : "w-64 pl-6 pr-4"
      )}>
        <div className={clsx("mb-8 flex items-center gap-2", isCollapsed && "justify-center")}>
          {!isCollapsed && (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-lg font-semibold text-brand-primary">
                DOYA
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-secondary dark:text-slate-200">
                  DOYA Training
                </p>
                <p className="text-xs text-neutral-500 dark:text-slate-400">Operations Console</p>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="rounded-lg p-1.5 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700 transition"
                title="Collapse sidebar"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            </>
          )}
          {isCollapsed && (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-lg font-semibold text-brand-primary">
                D
              </span>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="rounded-lg p-1.5 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700 transition"
                title="Expand sidebar"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        
        <nav className="flex flex-1 flex-col gap-2">
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium transition flex items-center gap-3",
                  isActive
                    ? "bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-orange-400"
                    : "text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={clsx(
              "w-full rounded-lg px-3 py-2 text-sm font-medium transition flex items-center gap-3 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Toggle theme" : undefined}
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5 flex-shrink-0" />
            ) : (
              <MoonIcon className="h-5 w-5 flex-shrink-0" />
            )}
            {!isCollapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {/* User Profile */}
          {user && (
            <Link
              href="/settings"
              className={clsx(
                "w-full rounded-lg px-3 py-2 text-sm font-medium transition flex items-center gap-3 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? user.name : undefined}
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-xs font-semibold text-brand-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-slate-200 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-800 shadow-xl z-50">
            <div className="flex h-full flex-col border-r border-neutral-200 dark:border-slate-700 py-6 pl-6 pr-4">
              <div className="mb-8 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-lg font-semibold text-brand-primary">
                  DOYA
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-secondary dark:text-slate-200">
                    DOYA Training
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-slate-400">Operations Console</p>
                </div>
              </div>
              <nav className="flex flex-1 flex-col gap-2">
                {visibleNavItems.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        "rounded-lg px-3 py-2 text-sm font-medium transition flex items-center gap-3",
                        isActive
                          ? "bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-orange-400"
                          : "text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700",
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={toggleTheme}
                className="w-full rounded-lg px-3 py-2 text-sm font-medium transition flex items-center gap-3 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <MoonIcon className="h-5 w-5 flex-shrink-0" />
                )}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center border-b border-neutral-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-5 w-5 text-neutral-600 dark:text-slate-300" />
          </button>
          <span className="text-sm font-semibold text-brand-secondary dark:text-slate-200">
            DOYA Training
          </span>
        </div>
        <div className="flex-1 px-4 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
