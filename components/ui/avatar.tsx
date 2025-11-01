import Image from "next/image";
import { clsx } from "clsx";

type AvatarProps = {
  label: string;
  src?: string | null;
  className?: string;
};

export function Avatar({ label, src, className }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={label}
        width={32}
        height={32}
        className={clsx("h-8 w-8 rounded-full object-cover", className)}
      />
    );
  }

  const initials = label
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={clsx(
        "flex h-8 w-8 items-center justify-center rounded-full bg-brand-secondary/10 text-xs font-semibold text-brand-secondary",
        className,
      )}
    >
      {initials}
    </span>
  );
}
