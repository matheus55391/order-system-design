import type { AuthUser } from "@repo/shared";
import { isTokenExpired } from "@/lib/auth-token";
import { useAuthStore } from "@/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
  skipAuth?: boolean;
  _retried?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken, setSession, clearSession } = useAuthStore.getState();
    if (!refreshToken) {
      clearSession();
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearSession();
        return null;
      }

      const data = (await response.json()) as LoginResponse;
      setSession(data.token, data.refreshToken, data.user);
      return data.token;
    } catch {
      clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getAccessToken(): Promise<string | null> {
  const { token, refreshToken } = useAuthStore.getState();
  if (token && !isTokenExpired(token)) return token;
  if (!refreshToken) return null;
  return refreshAccessToken();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token: tokenOverride, skipAuth, _retried, headers, ...rest } =
    options;

  let token = tokenOverride ?? null;
  if (!skipAuth && token === null) {
    token = await getAccessToken();
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (
    response.status === 401 &&
    !skipAuth &&
    !_retried &&
    !path.startsWith("/auth/")
  ) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, { ...options, token: newToken, _retried: true });
    }
    useAuthStore.getState().clearSession();
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;

    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? "Erro na requisição");

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser & {
    tenant: { id: string; name: string; slug: string };
  };
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  _count: { productPrices: number };
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number | null;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  variants: ProductVariant[];
}

export interface CartItem {
  id: string;
  quantity: number;
  priceTenantId: string;
  priceTenant: { id: string; name: string; slug: string };
  variant: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    productName: string;
    productImageUrl: string | null;
    availableStock: number;
    price: number;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export interface Reservation {
  id: string;
  quantity: number;
  status: string;
  expiresAt: string;
  priceTenantId: string;
  unitPrice: number;
  priceTenant: { id: string; name: string; slug: string };
  variant: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    productName: string;
    productImageUrl: string | null;
  };
}

export interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    priceTenant: { id: string; name: string; slug: string };
    variant: {
      id: string;
      sku: string;
      size: string | null;
      color: string | null;
      productName: string;
      productImageUrl: string | null;
    };
  }[];
}

export interface StockMovement {
  id: string;
  type: "RESERVE" | "RELEASE" | "SALE";
  quantity: number;
  createdAt: string;
  reservationId: string | null;
  orderId: string | null;
  priceTenant: { id: string; name: string; slug: string } | null;
  user: { id: string; name: string; email: string } | null;
  variant: { id: string; sku: string; productName: string };
}

export interface AuditSummary {
  reserve: { count: number; quantity: number };
  release: { count: number; quantity: number };
  sale: { count: number; quantity: number };
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    email: string;
    password: string;
    name: string;
    tenantSlug: string;
  }) =>
    request<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  listTenants: () =>
    request<{ slug: string; name: string }[]>("/auth/tenants"),

  refresh: (refreshToken: string) =>
    request<LoginResponse>("/auth/refresh", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    request<{ success: boolean }>("/auth/logout", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ refreshToken }),
    }),

  me: (token?: string) =>
    request<LoginResponse["user"]>("/auth/me", { token }),

  getProducts: (token: string) =>
    request<Product[]>("/catalog/products", { token }),

  listStores: (token: string) =>
    request<Store[]>("/catalog/stores", { token }),

  getStoreProducts: (token: string, slug: string) =>
    request<{ store: { id: string; name: string; slug: string }; products: Product[] }>(
      `/catalog/stores/${slug}/products`,
      { token },
    ),

  getCart: (token: string) => request<Cart>("/cart", { token }),

  addToCart: (
    token: string,
    variantId: string,
    quantity: number,
    priceTenantId?: string,
  ) =>
    request<unknown>("/cart/items", {
      method: "POST",
      token,
      body: JSON.stringify({ variantId, quantity, priceTenantId }),
    }),

  updateCartItem: (token: string, itemId: string, quantity: number) =>
    request<unknown>(`/cart/items/${itemId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ quantity }),
    }),

  removeFromCart: (token: string, itemId: string) =>
    request<{ success: boolean }>(`/cart/items/${itemId}`, {
      method: "DELETE",
      token,
    }),

  reserveFromCart: (token: string, cartItemIds?: string[]) =>
    request<Reservation[]>("/reservations/from-cart", {
      method: "POST",
      token,
      body: JSON.stringify({ cartItemIds }),
    }),

  getReservations: (token: string) =>
    request<Reservation[]>("/reservations", { token }),

  cancelReservation: (token: string, id: string) =>
    request<void>(`/reservations/${id}`, { method: "DELETE", token }),

  confirmOrder: (token: string, reservationIds: string[]) =>
    request<Order>("/orders/confirm", {
      method: "POST",
      token,
      body: JSON.stringify({ reservationIds }),
    }),

  getOrders: (token: string) => request<Order[]>("/orders", { token }),

  getAuditMovements: (token: string) =>
    request<StockMovement[]>("/audit/movements", { token }),

  getAuditSummary: (token: string) =>
    request<AuditSummary>("/audit/summary", { token }),
};
