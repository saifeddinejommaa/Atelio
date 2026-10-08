import type { IconName } from "@/lib/garageService/services";

type Name =
  | IconName
  | "pin"
  | "calendar"
  | "euro"
  | "check"
  | "star"
  | "phone"
  | "clock"
  | "menu"
  | "close"
  | "car";

const paths: Record<Name, React.ReactNode> = {
  oil: <path d="M3 14h10l4-4h3l-2 3 1 6H5a2 2 0 0 1-2-2v-3Zm2-4h5m-2 0V7m-2 0h4" />,
  brake: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M5 7a9 9 0 0 1 5-3" />
    </>
  ),
  tire: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v5m0 8v5M3 12h5m8 0h5" />
    </>
  ),
  snow: <path d="M12 2v20M4.9 6.9l14.2 10.2M4.9 17.1 19.1 6.9M9 4l3 2 3-2M9 20l3-2 3 2" />,
  battery: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M7 7V5m10 2V5M7 13h3m5-1.5v3M13.5 13h3" />
    </>
  ),
  wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5Z" />,
  shield: (
    <>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  exhaust: <path d="M2 14h12a3 3 0 0 0 3-3V9h3m-6 9h4m0-3c1.5 0 2 1 2 1.5S20.5 18 19 18M2 10h8" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4m8-4v4" />
    </>
  ),
  euro: <path d="M17 6a7 7 0 1 0 0 12M4 10h10M4 14h10" />,
  check: <path d="m5 12 5 5 9-10" />,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  car: (
    <>
      <path d="M3 16v-4l2-5h14l2 5v4H3Z" />
      <circle cx="7" cy="16" r="2" />
      <circle cx="17" cy="16" r="2" />
      <path d="M3 12h18" />
    </>
  ),
};

export default function Icon({
  name,
  className = "h-6 w-6",
  filled = false,
}: {
  name: Name;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
