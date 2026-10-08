// Client-side store for the "AI search" (bring-your-own-key) feature.
//
// The Hugging Face token lives ONLY in this browser's localStorage. Search
// requests go directly from the browser to Hugging Face; our servers never
// see the key. Header toggle and HomeClient share state through this tiny
// external store (they sit in different parts of the tree).

export const DEFAULT_MODEL = "google/embeddinggemma-2";

const LS_KEY = "earthquery.hf_token";
const LS_ENABLED = "earthquery.ai_enabled";
const LS_MODEL = "earthquery.hf_model";
export const LS_CONCEPT_CACHE = "earthquery.concept_emb_v1";

export interface AiState {
  enabled: boolean;
  hasKey: boolean;
  model: string;
}

const SERVER_SNAPSHOT: AiState = { enabled: false, hasKey: false, model: DEFAULT_MODEL };

let state: AiState = SERVER_SNAPSHOT;
let initialized = false;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function subscribeAi(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getAiSnapshot(): AiState {
  return state;
}

export function getAiServerSnapshot(): AiState {
  return SERVER_SNAPSHOT;
}

/** Read localStorage into state. Call once from a client component. */
export function initAiSettings(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;
  state = {
    enabled: window.localStorage.getItem(LS_ENABLED) === "1",
    hasKey: !!window.localStorage.getItem(LS_KEY),
    model: window.localStorage.getItem(LS_MODEL) || DEFAULT_MODEL,
  };
  // A stored key with AI left on stays on; without a key it cannot be on.
  if (state.enabled && !state.hasKey) {
    state.enabled = false;
    window.localStorage.removeItem(LS_ENABLED);
  }
  emit();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LS_KEY);
}

export function getModelId(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return window.localStorage.getItem(LS_MODEL) || DEFAULT_MODEL;
}

export function saveKey(token: string): void {
  const clean = token.trim();
  if (!clean || typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, clean);
  state = { ...state, hasKey: true };
  emit();
}

/** Remove the key and turn AI search off. Keeps cached concept embeddings. */
export function removeKey(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_KEY);
  window.localStorage.removeItem(LS_ENABLED);
  state = { ...state, hasKey: false, enabled: false };
  emit();
}

/** Full reset: key, toggle, model, and cached concept embeddings. */
export function resetAiSettings(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_KEY);
  window.localStorage.removeItem(LS_ENABLED);
  window.localStorage.removeItem(LS_MODEL);
  window.localStorage.removeItem(LS_CONCEPT_CACHE);
  state = { enabled: false, hasKey: false, model: DEFAULT_MODEL };
  emit();
}

export function setAiEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  if (on && !state.hasKey) return; // cannot enable without a key
  window.localStorage.setItem(LS_ENABLED, on ? "1" : "0");
  state = { ...state, enabled: on };
  emit();
}

export function setModelId(model: string): void {
  const clean = model.trim();
  if (!clean || typeof window === "undefined") return;
  window.localStorage.setItem(LS_MODEL, clean);
  // Cached concept embeddings belong to the previous model.
  window.localStorage.removeItem(LS_CONCEPT_CACHE);
  state = { ...state, model: clean };
  emit();
}

/** Ask the header toggle to open its settings panel (cross-tree). */
export function openAiPanel(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("earthquery:open-ai-panel"));
}
