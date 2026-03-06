export type CompareItem = {
  ticker: string;
  name: string;
};

const STORAGE_KEY = "canadian-etf-compare-basket-v1";

export function loadCompare(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 5);
  } catch {
    return [];
  }
}

export function saveCompare(items: CompareItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, 5))
    );
  } catch {
    // ignore
  }
}

