import type { AuthUser } from "@repo/shared";

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

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

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
  user: AuthUser & {
    tenant: { id: string; name: string; slug: string };
  };
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
  variants: ProductVariant[];
}

export interface CartItem {
  id: string;
  quantity: number;
  reservationId: string;
  expiresAt: string;
  variant: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    productName: string;
    price: number;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
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
    variant: {
      id: string;
      sku: string;
      size: string | null;
      color: string | null;
      productName: string;
    };
  }[];
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

  me: (token: string) =>
    request<LoginResponse["user"]>("/auth/me", { token }),

  getProducts: (token: string) =>
    request<Product[]>("/catalog/products", { token }),

  getCart: (token: string) => request<Cart>("/cart", { token }),

  addToCart: (token: string, variantId: string, quantity: number) =>
    request<CartItem>("/cart/items", {
      method: "POST",
      token,
      body: JSON.stringify({ variantId, quantity }),
    }),

  removeFromCart: (token: string, itemId: string) =>
    request<{ success: boolean }>(`/cart/items/${itemId}`, {
      method: "DELETE",
      token,
    }),

  confirmOrder: (token: string, reservationIds: string[]) =>
    request<Order>("/orders/confirm", {
      method: "POST",
      token,
      body: JSON.stringify({ reservationIds }),
    }),

  getOrders: (token: string) => request<Order[]>("/orders", { token }),
};
