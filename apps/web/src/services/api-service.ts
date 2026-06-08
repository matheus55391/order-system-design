import { isTokenExpired } from "@/lib/auth-token";
import { useAuthStore } from "@/store";
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { AuthResponseDto } from "./auth.service.dto";

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

export type ApiRequestConfig = AxiosRequestConfig & {
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
      const { data } = await axios.post<AuthResponseDto>(
        `${API_URL}/auth/refresh`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );
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

function toApiError(error: AxiosError): ApiError {
  const body = error.response?.data as { message?: string | string[] } | null;
  const message = Array.isArray(body?.message)
    ? body.message.join(", ")
    : (body?.message ?? "Erro na requisição");

  return new ApiError(message, error.response?.status ?? 500);
}

const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use(async (config) => {
  const apiConfig = config as InternalAxiosRequestConfig & ApiRequestConfig;
  if (apiConfig.skipAuth) return config;

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as
      | (InternalAxiosRequestConfig & ApiRequestConfig)
      | undefined;

    if (
      error.response?.status === 401 &&
      config &&
      !config.skipAuth &&
      !config._retried &&
      !config.url?.startsWith("/auth/")
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        config._retried = true;
        config.headers.Authorization = `Bearer ${newToken}`;
        return http.request(config);
      }
      useAuthStore.getState().clearSession();
    }

    throw toApiError(error);
  },
);

export abstract class ApiService {
  protected readonly http: AxiosInstance = http;

  protected get<TResponse>(
    url: string,
    config?: ApiRequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: "GET", url });
  }

  protected post<TResponse, TBody = undefined>(
    url: string,
    body?: TBody,
    config?: ApiRequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: "POST",
      url,
      data: body,
    });
  }

  protected patch<TResponse, TBody = undefined>(
    url: string,
    body?: TBody,
    config?: ApiRequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: "PATCH",
      url,
      data: body,
    });
  }

  protected delete<TResponse>(
    url: string,
    config?: ApiRequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: "DELETE", url });
  }

  private async request<TResponse>(
    config: ApiRequestConfig,
  ): Promise<TResponse> {
    const { data } = await this.http.request<TResponse>(config);
    return data;
  }
}
