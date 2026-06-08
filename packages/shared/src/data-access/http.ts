export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface HttpRequestConfig {
  method: HttpMethod;
  /** Path + query (ex: `/orders?limit=10`) */
  url: string;
  body?: unknown;
  /**
   * When true, the web transport skips auth/refresh interceptors.
   * Used for endpoints like `/auth/*` and other public calls.
   */
  skipAuth?: boolean;
}

export interface HttpTransport {
  request<TResponse>(config: HttpRequestConfig): Promise<TResponse>;
}

