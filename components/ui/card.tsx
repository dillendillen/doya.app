import { ReactNode } from "react";
import { clsx } from "clsx";

type CardProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Card({ title, action, children, className }: CardProps) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6",
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-4">
          {title && (
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
