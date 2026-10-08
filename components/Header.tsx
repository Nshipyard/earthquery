function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" rx="2.5" fill="#2563eb" />
      <rect x="15" y="1" width="10" height="10" rx="2.5" fill="#2563eb" opacity="0.45" />
      <rect x="1" y="15" width="10" height="10" rx="2.5" fill="#2563eb" opacity="0.45" />
      <rect x="15" y="15" width="10" height="10" rx="2.5" fill="#2563eb" opacity="0.2" />
    </svg>
  );
}

const NAV = [
  { label: "How it works", href: "#how" },
  { label: "API", href: "#api" },
  { label: "FAQ", href: "#faq" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#ececec] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[17px] font-semibold tracking-tight">earthquery</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-neutral-600 transition-colors hover:text-[#0a0a0a]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#search"
          className="rounded-full bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Try the demo
        </a>
      </div>
    </header>
  );
}
