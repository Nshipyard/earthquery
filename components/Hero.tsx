import DemoBadge from "./DemoBadge";
import HeroPreview from "./HeroPreview";

const EXAMPLES = [
  "solar farms in deserts",
  "golf courses near lakes",
  "container ports",
  "airports",
  "wind farms",
  "rice paddies",
];

export default function Hero({
  query,
  onQueryChange,
  onSubmit,
  tileCount,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: () => void;
  tileCount: number;
}) {
  return (
    <section id="search" className="scroll-mt-24 border-b border-[#ececec]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-14 md:pb-24 md:pt-20 lg:grid-cols-2">
        {/* min-w-0 on grid items: prevents the preview frame's URL pill min-content from forcing the columns wider than the viewport on mobile. */}
        <div className="min-w-0">
          <DemoBadge tiles={tileCount} />
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Ask the planet a question.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600">
            earthquery turns plain English into vector search over satellite
            imagery embeddings. Type “solar farms in deserts” and get matching
            locations on a map, ranked by embedding similarity.
          </p>
          <form
            role="search"
            className="mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="flex items-center rounded-2xl border border-[#ececec] bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-shadow focus-within:shadow-[0_2px_16px_rgba(37,99,235,0.12)] focus-within:ring-2 focus-within:ring-[#2563eb]/20">
              <input
                name="q"
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="golf courses near lakes"
                aria-label="Search the planet"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-neutral-400"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-[#2563eb] px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#1d4ed8]"
              >
                Search
              </button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  onQueryChange(ex);
                  onSubmit();
                }}
                className="rounded-full border border-[#ececec] px-3 py-1 text-xs text-neutral-600 transition-colors hover:border-[#2563eb] hover:text-[#2563eb]"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <HeroPreview />
          <p className="mt-3 text-center text-xs text-neutral-400">
            Live preview: real demo-index results for “solar farms in deserts”.
          </p>
        </div>
      </div>
    </section>
  );
}
