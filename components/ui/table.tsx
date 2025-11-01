import { ReactNode } from "react";
import { clsx } from "clsx";

type TableProps = {
  headers: string[];
  children: ReactNode;
  className?: string;
};

export function Table({ headers, children, className }: TableProps) {
  return (
    <div className={clsx("overflow-hidden rounded-xl border border-neutral-200", className)}>
      <table className="min-w-full divide-y divide-neutral-200 bg-white">
        <thead className="bg-neutral-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700">
          {children}
        </tbody>
      </table>
    </div>
  );
}
