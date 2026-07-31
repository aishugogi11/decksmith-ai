"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DemoTour } from "@/features/demo/DemoTour";

/** Activates the guided product demo at /app?demo=1 */
export function DemoBootstrap() {
  const params = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (params.get("demo") === "1") {
      setActive(true);
      // Clean URL without remounting
      const url = new URL(window.location.href);
      url.searchParams.delete("demo");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [params]);

  return <DemoTour active={active} />;
}
