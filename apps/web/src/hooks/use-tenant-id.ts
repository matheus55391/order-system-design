import { useAuthStore } from "@/store";

export function useTenantId() {
  return useAuthStore((state) => state.user?.tenant.id);
}
