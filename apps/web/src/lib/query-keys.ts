export const queryKeys = {
  cart: (tenantId: string, storeSlug: string) =>
    ["cart", tenantId, storeSlug] as const,
  reservations: (tenantId: string) => ["reservations", tenantId] as const,
  orders: (tenantId: string) => ["orders", tenantId] as const,
  ordersIncoming: (tenantId: string) =>
    ["orders", tenantId, "incoming"] as const,
  auditSummary: (tenantId: string) => ["audit", tenantId, "summary"] as const,
  auditMovements: (tenantId: string, limit = 50) =>
    ["audit", tenantId, "movements", limit] as const,
  inventory: {
    all: (tenantId: string, search?: string) =>
      ["inventory", tenantId, "products", search ?? ""] as const,
    detail: (tenantId: string, productId: string) =>
      ["inventory", tenantId, "product", productId] as const,
  },
  stores: (tenantId: string) => ["stores", tenantId] as const,
  storeProducts: (slug: string, search?: string) =>
    ["store-products", slug, search ?? ""] as const,
} as const;
