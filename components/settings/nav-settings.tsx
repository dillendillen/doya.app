"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

type NavItem = {
  href: string;
  label: string;
  visible: boolean;
  order: number;
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", visible: true, order: 1 },
  { href: "/dogs", label: "Dogs", visible: true, order: 2 },
  { href: "/clients", label: "Clients", visible: true, order: 3 },
  { href: "/sessions", label: "Sessions", visible: true, order: 4 },
  { href: "/tasks", label: "Tasks", visible: true, order: 5 },
  { href: "/calendar", label: "Calendar", visible: true, order: 6 },
  { href: "/bookings", label: "Bookings", visible: true, order: 7 },
  { href: "/media", label: "Media", visible: true, order: 8 },
  { href: "/packages", label: "Packages", visible: true, order: 9 },
  { href: "/billing", label: "Billing", visible: true, order: 10 },
  { href: "/settings", label: "Settings", visible: true, order: 11 },
  { href: "/audit", label: "Audit Log", visible: true, order: 12 },
];

export function NavSettings() {
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_NAV_ITEMS;
    
    try {
      const saved = localStorage.getItem("navItems");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults
        return DEFAULT_NAV_ITEMS.map((defaultItem) => {
          const savedItem = parsed.find((item: NavItem) => item.href === defaultItem.href);
          return savedItem ? { ...defaultItem, ...savedItem } : defaultItem;
        }).sort((a, b) => a.order - b.order);
      }
    } catch (error) {
      console.error("Failed to load nav items", error);
    }
    return DEFAULT_NAV_ITEMS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("navItems", JSON.stringify(navItems));
      } catch (error) {
        console.error("Failed to save nav items", error);
      }
    }
  }, [navItems]);

  const handleToggleVisible = (href: string) => {
    setNavItems((prev) => {
      const updated = prev.map((item) =>
        item.href === href ? { ...item, visible: !item.visible } : item
      );
      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("navItems", JSON.stringify(updated));
          // Trigger a custom event to notify AppShell
          window.dispatchEvent(new Event("navItemsUpdated"));
        } catch (error) {
          console.error("Failed to save nav items", error);
        }
      }
      return updated;
    });
  };

  const moveItem = (href: string, direction: "up" | "down") => {
    setNavItems((prev) => {
      const items = [...prev];
      const index = items.findIndex((item) => item.href === href);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return prev;

      // Swap orders
      const tempOrder = items[index].order;
      items[index].order = items[newIndex].order;
      items[newIndex].order = tempOrder;

      // Sort by order
      const sorted = items.sort((a, b) => a.order - b.order);
      
      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("navItems", JSON.stringify(sorted));
          // Trigger a custom event to notify AppShell
          window.dispatchEvent(new Event("navItemsUpdated"));
        } catch (error) {
          console.error("Failed to save nav items", error);
        }
      }
      
      return sorted;
    });
  };

  const visibleItems = navItems.filter((item) => item.visible);
  const hiddenItems = navItems.filter((item) => !item.visible);

  return (
    <Card title="Navigation Settings">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-slate-300 mb-2">
            Visible Pages
          </h3>
          <div className="space-y-2">
            {visibleItems.map((item, index) => (
              <div
                key={item.href}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3"
              >
                <button
                  onClick={() => moveItem(item.href, "up")}
                  disabled={index === 0}
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveItem(item.href, "down")}
                  disabled={index === visibleItems.length - 1}
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <span className="flex-1 text-sm font-medium text-neutral-700 dark:text-slate-300">
                  {item.label}
                </span>
                <button
                  onClick={() => handleToggleVisible(item.href)}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Hide
                </button>
              </div>
            ))}
          </div>
        </div>

        {hiddenItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-slate-300 mb-2">
              Hidden Pages
            </h3>
            <div className="space-y-2">
              {hiddenItems.map((item) => (
                <div
                  key={item.href}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-slate-600 bg-neutral-50 dark:bg-slate-900 p-3"
                >
                  <span className="flex-1 text-sm text-neutral-500 dark:text-slate-400">
                    {item.label}
                  </span>
                  <button
                    onClick={() => handleToggleVisible(item.href)}
                    className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    Show
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

