import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "./api-error";
import type { ApiAuthContext, RefreshSessionFn } from "./auth-context";
import type { HttpRequestConfig, HttpTransport } from "./http";

type AxiosApiConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
  _retried?: boolean;
};

function toApiError(error: AxiosError): ApiError {
  const body = error.response?.data as { message?: string | string[] } | null;
  const message = Array.isArray(body?.message)
    ? body.message.join(", ")
    : (body?.message ?? "Erro na requisição");

  return new ApiError(message, error.response?.status ?? 500);
}

export function createAxiosHttpTransport(options: {
  baseUrl: string;
  auth: ApiAuthContext;
  refreshSession: RefreshSessionFn;
}): HttpTransport {
  const { baseUrl, auth, refreshSession } = options;
  let refreshPromise: Promise<string | null> | null = null;

  async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      const refreshToken = auth.getRefreshToken();
      if (!refreshToken) {
        auth.clearSession();
        return null;
      }

      try {
        const data = await refreshSession(refreshToken);
        auth.setSession(data.token, data.refreshToken, data.user);
        return data.token;
      } catch {
        auth.clearSession();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  async function getAccessToken(): Promise<string | null> {
    const token = auth.getToken();
    if (token && !auth.isTokenExpired(token)) return token;
    if (!auth.getRefreshToken()) return null;
    return refreshAccessToken();
  }

  const http = axios.create({
    baseURL: baseUrl,
    headers: { "Content-Type": "application/json" },
  });

  http.interceptors.request.use(async (config) => {
    const apiConfig = config as InternalAxiosRequestConfig & AxiosApiConfig;
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
        | (InternalAxiosRequestConfig & AxiosApiConfig)
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
        auth.clearSession();
      }

      throw toApiError(error);
    },
  );

  return {
    async request<TResponse>(config: HttpRequestConfig): Promise<TResponse> {
      const axiosConfig: AxiosApiConfig = {
        method: config.method,
        url: config.url,
        data: config.body,
        skipAuth: config.skipAuth,
      };

      const { data } = await http.request<TResponse>(axiosConfig);
      return data;
    },
  };
}
