const STORAGE_KEY = "pharmstudy_session";

export type LocalSession = {
  displayName: string;
  userId: string;
};

export function getSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalSession>;
    if (!parsed.displayName) return null;
    if (!parsed.userId) {
      const migrated: LocalSession = { displayName: parsed.displayName, userId: crypto.randomUUID() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return parsed as LocalSession;
  } catch {
    return null;
  }
}

export function setSession(session: { displayName: string }): void {
  const full: LocalSession = { displayName: session.displayName, userId: crypto.randomUUID() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
