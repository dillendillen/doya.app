import { SVGProps } from "react";

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M4 7h16a1 1 0 0 0 0-2H4a1 1 0 1 0 0 2Zm0 6h16a1 1 0 0 0 0-2H4a1 1 0 1 0 0 2Zm0 6h16a1 1 0 0 0 0-2H4a1 1 0 1 0 0 2Z"
      />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M21 20.29 16.71 16a7 7 0 1 0-.71.71L20.29 21a.5.5 0 0 0 .71 0 .5.5 0 0 0 0-.71ZM5 10.5A5.5 5.5 0 1 1 10.5 16 5.51 5.51 0 0 1 5 10.5Z"
      />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M11 5v6H5a1 1 0 1 0 0 2h6v6a1 1 0 1 0 2 0v-6h6a1 1 0 1 0 0-2h-6V5a1 1 0 1 0-2 0Z"
      />
    </svg>
  );
}

export function ArrowDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 18a1 1 0 0 1-.71-.29l-6-6a1 1 0 1 1 1.42-1.42L12 15.59l5.29-5.3a1 1 0 0 1 1.42 1.42l-6 6A1 1 0 0 1 12 18Z"
      />
    </svg>
  );
}
