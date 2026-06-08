import { isTokenExpired } from "@/lib/auth-token";
import { useAuthStore } from "@/store";
import axios from "axios";
import type { AuthResponseDto } from "@repo/shared";
import {
  createAxiosHttpTransport,
  initDataAccess,
} from "@repo/shared/data-access";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

initDataAccess(
  createAxiosHttpTransport({
    baseUrl: API_URL,
    auth: {
      getToken: () => useAuthStore.getState().token,
      getRefreshToken: () => useAuthStore.getState().refreshToken,
      isTokenExpired,
      setSession: (token, refreshToken, user) =>
        useAuthStore.getState().setSession(token, refreshToken, user),
      clearSession: () => useAuthStore.getState().clearSession(),
    },
    refreshSession: async (refreshToken) => {
      const { data } = await axios.post<AuthResponseDto>(
        `${API_URL}/auth/refresh`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );
      return data;
    },
  }),
);
