import { Suspense } from "react";
import { Workspace } from "@/components/app/workspace";
import { DemoBootstrap } from "@/components/app/demo-bootstrap";

export default function AppPage() {
  return (
    <>
      <Suspense fallback={null}>
        <DemoBootstrap />
      </Suspense>
      <Workspace />
    </>
  );
}
