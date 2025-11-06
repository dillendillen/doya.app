import { ReactNode } from "react";
import { clsx } from "clsx";

type CardProps = {
  title?: string;
  action?: ReactNode;
  actions?: Array<{ key: string; node: ReactNode }>;
  children: ReactNode;
  className?: string;
};

export function Card({ title, action, actions, children, className }: CardProps) {
  const headerActions = actions ? (
    <div className="flex items-center gap-2">
      {actions.map((a) => (
        <div key={a.key}>{a.node}</div>
      ))}
    </div>
  ) : action;

  return (
    <section
      className={clsx(
        "rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-slate-300 hover:bg-white sm:p-6",
        className,
      )}
    >
      {(title || headerActions) && (
        <header className="mb-4 flex items-center justify-between gap-4">
          {title && (
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {title}
            </h2>
          )}
          {headerActions}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
