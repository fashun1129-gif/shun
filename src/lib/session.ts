const STORAGE_KEY = "pharmstudy_session";

export type LocalSession = {
  displayName: string;
};

export function getSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSession;
    return parsed.displayName ? parsed : null;
  } catch {
    return null;
  }
}

export function setSession(session: LocalSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
