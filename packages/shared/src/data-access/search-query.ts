export function withSearchQuery(path: string, search?: string): string {
  const term = search?.trim();
  if (!term) return path;
  const params = new URLSearchParams({ q: term });
  return `${path}?${params.toString()}`;
}
