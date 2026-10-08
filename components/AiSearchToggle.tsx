"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_MODEL,
  getAiServerSnapshot,
  getAiSnapshot,
  initAiSettings,
  removeKey,
  resetAiSettings,
  saveKey,
  setAiEnabled,
  subscribeAi,
} from "@/lib/ai-settings";
import { probeToken } from "@/lib/live-search";

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m11 12 10-10" />
      <path d="m15 8 3 3" />
    </svg>
  );
}

function Panel({ onClose }: { onClose: () => void }) {
  const ai = useSyncExternalStore(subscribeAi, getAiSnapshot, getAiServerSnapshot);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleConnect() {
    const clean = token.trim();
    if (!clean) {
      setError("Paste your token first.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const probe = await probeToken(clean, DEFAULT_MODEL);
    setBusy(false);
    if (!probe.ok) {
      setError(
        `That token did not work. ${probe.message} Double-check it at huggingface.co/settings/tokens, and make sure you accepted the model's license terms there.`,
      );
      return;
    }
    saveKey(clean);
    setAiEnabled(true);
    setToken("");
    setNotice(`Connected. The model returned ${probe.dims}-dimensional embeddings.`);
  }

  function handleRemove() {
    removeKey();
    setNotice("Key removed. AI search is off.");
  }

  function handleReset() {
    resetAiSettings();
    setNotice("Everything reset: key removed, AI search off, cached embeddings cleared.");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="AI search settings"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Search with real AI</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
          Right now earthquery matches keywords. Paste a free Hugging&nbsp;Face
          token and your searches will use a real AI embedding model instead.
          Ask things like “places to grow grapes” and it finds vineyards, even
          when no keyword matches.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          Your token is stored <span className="font-medium text-neutral-700">only in this browser</span>.
          Searches go directly from your browser to Hugging&nbsp;Face. Our
          servers never see your key.
        </p>

        {ai.hasKey ? (
          <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle" />
            Connected. AI search is {ai.enabled ? "on" : "off"}.
          </div>
        ) : (
          <ol className="mt-5 space-y-2 text-sm text-neutral-600">
            <li>
              <span className="font-medium text-[#0a0a0a]">1.</span> Get a free token at{" "}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#2563eb] underline decoration-[#2563eb]/30 underline-offset-2 hover:decoration-[#2563eb]"
              >
                huggingface.co/settings/tokens
              </a>
            </li>
            <li>
              <span className="font-medium text-[#0a0a0a]">2.</span> Paste it below and hit Connect.
            </li>
            <li>
              <span className="font-medium text-[#0a0a0a]">3.</span> Flip the AI search switch in the header.
            </li>
          </ol>
        )}

        {!ai.hasKey && (
          <div className="mt-4">
            <label htmlFor="hf-token" className="text-xs font-medium text-neutral-500">
              Hugging Face token
            </label>
            <input
              id="hf-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="hf_…"
              autoComplete="off"
              spellCheck={false}
              className="mt-1.5 w-full rounded-xl border border-[#ececec] bg-white px-4 py-2.5 font-mono text-sm outline-none transition-shadow placeholder:text-neutral-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
            />
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">{error}</p>
        )}
        {notice && !error && (
          <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-800">{notice}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!ai.hasKey ? (
            <button
              type="button"
              onClick={handleConnect}
              disabled={busy}
              className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {busy ? "Checking token…" : "Connect"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setAiEnabled(!ai.enabled)}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors ${
                  ai.enabled ? "bg-neutral-400 hover:bg-neutral-500" : "bg-[#2563eb] hover:bg-[#1d4ed8]"
                }`}
              >
                {ai.enabled ? "Turn AI search off" : "Turn AI search on"}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-xl border border-[#ececec] px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-red-200 hover:text-red-600"
              >
                Remove key
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl px-3 py-2.5 text-sm text-neutral-400 transition-colors hover:text-neutral-600"
              >
                Reset everything
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-neutral-400">
          You can remove the key at any time. First AI search warms up once by
          embedding the 43 demo concepts (cached afterwards).
        </p>
      </div>
    </div>
  );
}

export default function AiSearchToggle() {
  const ai = useSyncExternalStore(subscribeAi, getAiSnapshot, getAiServerSnapshot);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    initAiSettings();
    const open = () => setPanelOpen(true);
    window.addEventListener("earthquery:open-ai-panel", open);
    return () => window.removeEventListener("earthquery:open-ai-panel", open);
  }, []);

  function handleToggle() {
    if (!ai.hasKey) {
      setPanelOpen(true);
      return;
    }
    setAiEnabled(!ai.enabled);
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={ai.enabled}
          title={ai.hasKey ? "Toggle AI search" : "Set up AI search"}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
            ai.enabled
              ? "border-[#2563eb]/30 bg-blue-50 text-[#1d4ed8]"
              : "border-[#ececec] bg-white text-neutral-600 hover:border-neutral-300"
          }`}
        >
          <span
            aria-hidden="true"
            className={`relative h-[16px] w-[28px] rounded-full transition-colors ${ai.enabled ? "bg-[#2563eb]" : "bg-neutral-200"}`}
          >
            <span
              className={`absolute top-[2px] h-[12px] w-[12px] rounded-full bg-white shadow transition-all ${ai.enabled ? "left-[14px]" : "left-[2px]"}`}
            />
          </span>
          AI search
        </button>
        {ai.hasKey && (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            aria-label="AI search settings"
            title="AI search settings"
            className="rounded-full border border-[#ececec] p-2 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600"
          >
            <KeyIcon />
          </button>
        )}
      </div>
      {/* Portal: the sticky blurred header is a containing block for fixed
          descendants (backdrop-filter), which would pin the overlay to the
          64px header instead of the viewport. */}
      {panelOpen &&
        createPortal(<Panel onClose={() => setPanelOpen(false)} />, document.body)}
    </>
  );
}
