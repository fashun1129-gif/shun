const ALLOWED_EMAIL_DOMAINS = ["okayama-u.ac.jp", "s.okayama-u.ac.jp"];

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export const DOMAIN_RESTRICTION_MESSAGE = "岡山大学のアカウントでのみログイン可能です";
