import { ReactNode } from "react";
import { SearchIcon, PlusIcon, ArrowDownIcon } from "../ui/icons";

type TopBarAction =
  | {
      key?: string;
      label: string;
      href?: string;
      onClick?: () => void;
    }
  | {
      key: string;
      node: ReactNode;
    };

type TopBarProps = {
  title: string;
  actions?: TopBarAction[];
  extraActions?: ReactNode;
};

export function TopBar({ title, actions = [], extraActions }: TopBarProps) {
  return (
    <div className="flex flex-col gap-4 bg-white/90 px-4 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <h1 className="text-xl font-semibold text-brand-secondary lg:text-2xl">
          {title}
        </h1>
        <p className="text-sm text-neutral-500">
          Manage daily operations and follow-ups with confidence.
        </p>
      </div>
      <div className="flex flex-1 flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Search dogs, clients, sessions…"
            className="w-full rounded-lg border border-neutral-200 bg-white px-9 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => {
            if ("node" in action) {
              return (
                <span key={action.key} className="inline-flex">
                  {action.node}
                </span>
              );
            }

            const key = action.key ?? action.label;
            const content = (
              <>
                <PlusIcon className="h-4 w-4 text-brand-primary" />
                {action.label}
              </>
            );

            if (action.href) {
              return (
                <a
                  key={key}
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-brand-primary hover:text-brand-primary"
                >
                  {content}
                </a>
              );
            }

            return (
              <button
                type="button"
                key={key}
                onClick={action.onClick}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-brand-primary hover:text-brand-primary"
              >
                {content}
              </button>
            );
          })}
          {extraActions}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-brand-secondary hover:text-brand-secondary"
          >
            Today
            <ArrowDownIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
