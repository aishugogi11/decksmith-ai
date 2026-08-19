"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FilePlus2,
  LayoutTemplate,
  Settings,
  Clock3,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { DEMO_RECENTS } from "@/lib/mock-ai";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const sidebarOpen = usePresentationStore((s) => s.sidebarOpen);
  const setSidebarOpen = usePresentationStore((s) => s.setSidebarOpen);
  const newPresentation = usePresentationStore((s) => s.newPresentation);
  const presentation = usePresentationStore((s) => s.presentation);

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 268 : 72 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="relative z-20 flex h-full shrink-0 flex-col border-r border-stone-200/90 bg-[var(--ink)] text-[var(--paper)]"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-5">
        <div className={sidebarOpen ? "min-w-0" : "sr-only"}>
          <Logo href="/app" tone="dark" />
        </div>
        {!sidebarOpen && (
          <Link
            href="/app"
            className="grid h-8 w-8 place-items-center rounded-sm bg-[var(--paper)]"
          >
            <span className="h-2 w-2 rounded-[1px] bg-[var(--accent)]" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
          className="text-stone-400 hover:bg-white/10 hover:text-[var(--paper)]"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="px-3">
        <Button
          variant="accent"
          className={cn("w-full justify-start", !sidebarOpen && "justify-center px-0")}
          onClick={newPresentation}
        >
          <FilePlus2 className="h-4 w-4" />
          {sidebarOpen && "New Presentation"}
        </Button>
      </div>

      <nav className="mt-4 space-y-1 px-2">
        <button
          type="button"
          onClick={() =>
            void usePresentationStore.getState().browseTemplateExamples()
          }
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-stone-400 transition hover:bg-white/8 hover:text-[var(--paper)]",
            !sidebarOpen && "justify-center"
          )}
        >
          <LayoutTemplate className="h-4 w-4" />
          {sidebarOpen && "Templates"}
        </button>
        <SideLink href="/app" icon={Settings} label="Settings" open={sidebarOpen} />
      </nav>

      {sidebarOpen && (
        <div className="mt-6 flex-1 overflow-auto px-3 pb-6">
          <p className="mb-2 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            <Clock3 className="h-3 w-3" />
            Recent
          </p>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                className="w-full rounded-md bg-white/10 px-3 py-2.5 text-left text-sm text-[var(--paper)]"
              >
                <span className="line-clamp-1 font-medium">{presentation.title}</span>
                <span className="mt-0.5 block text-[11px] text-stone-500">Current</span>
              </button>
            </li>
            {DEMO_RECENTS.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full rounded-md px-3 py-2.5 text-left text-sm text-stone-400 transition hover:bg-white/6 hover:text-stone-200"
                >
                  <span className="line-clamp-1">{r.title}</span>
                  <span className="mt-0.5 block text-[11px] text-stone-600">
                    {r.updatedAt}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto border-t border-white/10 p-3">
        <Link
          href="/"
          className={cn(
            "block rounded-md px-3 py-2 text-xs text-stone-500 transition hover:bg-white/6 hover:text-stone-300",
            !sidebarOpen && "text-center"
          )}
        >
          {sidebarOpen ? "← Marketing site" : "←"}
        </Link>
      </div>
    </motion.aside>
  );
}

function SideLink({
  href,
  icon: Icon,
  label,
  open,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  open: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-stone-400 transition hover:bg-white/8 hover:text-[var(--paper)]",
        !open && "justify-center"
      )}
    >
      <Icon className="h-4 w-4" />
      {open && label}
    </Link>
  );
}
