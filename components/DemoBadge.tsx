export default function DemoBadge({
  tiles,
  className = "",
}: {
  tiles: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ${className}`}
      title="v1 searches a bundled demo index with simulated vectors, not live satellite embeddings."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" aria-hidden="true" />
      Demo index · {tiles} tiles · Ontario + 22 world regions
    </span>
  );
}
