import { AuditClient } from "./clients/audit.client";
import { AuthClient } from "./clients/auth.client";
import { CartClient } from "./clients/cart.client";
import { CatalogClient } from "./clients/catalog.client";
import { InventoryClient } from "./clients/inventory.client";
import { OrdersClient } from "./clients/orders.client";
import { ReservationsClient } from "./clients/reservations.client";
import type { DataAccess } from "./create-data-access";
import { createDataAccess } from "./create-data-access";
import type { HttpTransport } from "./http";

let instances: DataAccess | null = null;

export function initDataAccess(transport: HttpTransport): DataAccess {
  instances = createDataAccess(transport);
  return instances;
}

function getInstances(): DataAccess {
  if (!instances) {
    throw new Error(
      "Data access não inicializado. Importe '@/lib/data-access' no bootstrap do app.",
    );
  }
  return instances;
}

function clientProxy<T extends object>(getClient: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const client = getClient();
      const value = client[prop as keyof T];
      if (typeof value === "function") {
        return (value as (...args: unknown[]) => unknown).bind(client);
      }
      return value;
    },
  });
}

export const authService = clientProxy(() => getInstances().auth);
export const catalogService = clientProxy(() => getInstances().catalog);
export const cartService = clientProxy(() => getInstances().cart);
export const reservationsService = clientProxy(
  () => getInstances().reservations,
);
export const ordersService = clientProxy(() => getInstances().orders);
export const auditService = clientProxy(() => getInstances().audit);
export const inventoryService = clientProxy(() => getInstances().inventory);
