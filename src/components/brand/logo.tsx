import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
  tone?: "light" | "dark";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.08em] text-zinc-950 uppercase",
        className
      )}
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-950 text-[10px] text-white">
        DS
      </span>
      Decksmith AI
    </Link>
  );
}
