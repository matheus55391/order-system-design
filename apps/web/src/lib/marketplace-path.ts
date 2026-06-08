export function getMarketplaceStoreSlug(pathname: string): string | null {
  const match = pathname.match(/^\/marketplace\/([^/]+)/);
  return match?.[1] ?? null;
}
