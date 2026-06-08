export function getTokenExpiry(token: string): number | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const payload = JSON.parse(
      atob(segment.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  const exp = getTokenExpiry(token);
  if (!exp) return true;
  return exp <= Math.floor(Date.now() / 1000) + bufferSeconds;
}
