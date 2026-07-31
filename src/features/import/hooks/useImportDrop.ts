"use client";

import { useCallback, useState } from "react";
import { useImportStore } from "@/features/import/store";

/** Shared drag-and-drop helpers for import surfaces. */
export function useImportDrop() {
  const importFile = useImportStore((s) => s.importFile);
  const [dragOver, setDragOver] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void importFile(file);
    },
    [importFile]
  );

  return { dragOver, onDragOver, onDragLeave, onDrop, importFile };
}
