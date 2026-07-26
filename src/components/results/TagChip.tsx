export default function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-medium text-slate-700">
      {label}
    </span>
  );
}
