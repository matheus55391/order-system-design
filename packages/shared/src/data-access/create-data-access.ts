import { AuditClient } from "./clients/audit.client";
import { AuthClient } from "./clients/auth.client";
import { CartClient } from "./clients/cart.client";
import { CatalogClient } from "./clients/catalog.client";
import { InventoryClient } from "./clients/inventory.client";
import { OrdersClient } from "./clients/orders.client";
import { ReservationsClient } from "./clients/reservations.client";
import type { HttpTransport } from "./http";

export interface DataAccess {
  auth: AuthClient;
  catalog: CatalogClient;
  cart: CartClient;
  reservations: ReservationsClient;
  orders: OrdersClient;
  audit: AuditClient;
  inventory: InventoryClient;
}

export function createDataAccess(transport: HttpTransport): DataAccess {
  return {
    auth: new AuthClient(transport),
    catalog: new CatalogClient(transport),
    cart: new CartClient(transport),
    reservations: new ReservationsClient(transport),
    orders: new OrdersClient(transport),
    audit: new AuditClient(transport),
    inventory: new InventoryClient(transport),
  };
}
