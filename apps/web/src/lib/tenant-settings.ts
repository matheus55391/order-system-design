export type SettingsTab =
  | "general"
  | "marketplace"
  | "notifications"
  | "integrations"
  | "team";

export interface MarketplaceSettings {
  acceptingOrders: boolean;
  minOrderValue: number;
  leadTimeDays: number;
}

export interface NotificationSettings {
  orderReceived: boolean;
  orderDelivered: boolean;
  lowStock: boolean;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
  lastEventAt: string | null;
}

export interface TenantSettings {
  marketplace: MarketplaceSettings;
  notifications: NotificationSettings;
  webhooks: WebhookConfig[];
}

const STORAGE_KEY = "order-system-tenant-settings";

export const defaultTenantSettings: TenantSettings = {
  marketplace: {
    acceptingOrders: true,
    minOrderValue: 0,
    leadTimeDays: 3,
  },
  notifications: {
    orderReceived: true,
    orderDelivered: true,
    lowStock: false,
  },
  webhooks: [],
};

export function loadTenantSettings(tenantId: string): TenantSettings {
  if (typeof window === "undefined") return defaultTenantSettings;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTenantSettings;
    const all = JSON.parse(raw) as Record<string, TenantSettings>;
    return { ...defaultTenantSettings, ...all[tenantId] };
  } catch {
    return defaultTenantSettings;
  }
}

export function saveTenantSettings(
  tenantId: string,
  settings: TenantSettings,
): void {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, TenantSettings>) : {};
    all[tenantId] = settings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota errors in demo
  }
}

export const webhookEventOptions = [
  { id: "order.confirmed", label: "Pedido confirmado" },
  { id: "order.delivered", label: "Pedido finalizado" },
  { id: "order.canceled", label: "Pedido cancelado" },
  { id: "stock.low", label: "Estoque baixo" },
] as const;
