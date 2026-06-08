/** Converte termo livre em tsquery AND para Prisma `search` (PostgreSQL FTS). */
export function sanitizeProductSearchTerm(raw: string): string | null {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}_-]/gu, ""))
    .filter(Boolean);

  if (tokens.length === 0) return null;
  return tokens.join(" & ");
}
