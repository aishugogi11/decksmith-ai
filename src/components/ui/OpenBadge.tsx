interface OpenBadgeProps {
  isOpen: boolean;
  closesAt?: string;
}

export default function OpenBadge({ isOpen, closesAt }: OpenBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
        isOpen
          ? "bg-emerald-500/15 text-emerald-700"
          : "bg-rose-500/15 text-rose-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isOpen ? "bg-emerald-500" : "bg-rose-500"
        }`}
      />
      {isOpen ? (closesAt ? `Open · closes ${closesAt}` : "Open now") : "Closed"}
    </span>
  );
}
