const siteUrlEnvKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const;

function normalizeSiteUrl(value: string): URL | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    return new URL(url.origin);
  } catch {
    return null;
  }
}

export function getSiteOrigin(): URL | null {
  for (const key of siteUrlEnvKeys) {
    const value = process.env[key];

    if (!value) continue;

    const normalized = normalizeSiteUrl(value);

    if (normalized) return normalized;
  }

  return null;
}

export function getSiteOriginOrLocal(): URL {
  return getSiteOrigin() ?? new URL("http://localhost:3000");
}

export function getAbsoluteUrl(pathname: string): string | null {
  const origin = getSiteOrigin();

  if (!origin) return null;

  return new URL(pathname, origin).toString();
}
