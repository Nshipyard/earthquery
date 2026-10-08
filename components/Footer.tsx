export default function Footer() {
  return (
    <footer className="border-t border-[#ececec] bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <p className="text-[15px] font-semibold tracking-tight">earthquery</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-600">
            Natural-language search over satellite imagery embeddings. v1 runs on
            a bundled demo index; the production path targets AlphaEarth and
            EmbeddingGemma 2.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><a href="#how" className="hover:text-[#0a0a0a]">How it works</a></li>
            <li><a href="#api" className="hover:text-[#0a0a0a]">API docs</a></li>
            <li><a href="/llms.txt" className="hover:text-[#0a0a0a]">llms.txt</a></li>
            <li><a href="#faq" className="hover:text-[#0a0a0a]">FAQ</a></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Data sources</p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li>
              <a
                href="https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL"
                className="hover:text-[#0a0a0a]"
              >
                AlphaEarth embeddings (CC-BY 4.0)
              </a>
            </li>
            <li>
              <a href="https://huggingface.co/google" className="hover:text-[#0a0a0a]">
                EmbeddingGemma 2 (Apache 2.0)
              </a>
            </li>
            <li>
              <span>
                Map tiles © <a href="https://www.esri.com" className="hover:text-[#0a0a0a]">Esri</a> (World Light Gray)
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#ececec]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
          <span>earthquery · MIT License</span>
          <span>Demo index with simulated vectors. Not satellite analysis.</span>
        </div>
      </div>
    </footer>
  );
}
