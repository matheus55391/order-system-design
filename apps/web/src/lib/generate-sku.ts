function slugToken(value: string, maxLength: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .toUpperCase();
}

export function generateSku(options?: {
  productName?: string;
  size?: string;
  color?: string;
}): string {
  const prefix =
    slugToken(options?.productName?.trim() || "", 3) || "SKU";
  const size = slugToken(options?.size?.trim() || "", 6);
  const color = slugToken(options?.color?.trim() || "", 8);

  if (size || color) {
    return [prefix, size, color].filter(Boolean).join("-");
  }

  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}
