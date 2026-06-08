"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTenantId } from "@/hooks/use-tenant-id";
import { getMarketplaceStoreSlug } from "@/lib/marketplace-path";
import { useGetCartQuery } from "@/query/get-cart.query";
import { cn } from "@/lib/utils";

export function CartHeaderButton() {
  const pathname = usePathname();
  const tenantId = useTenantId();
  const storeSlug = getMarketplaceStoreSlug(pathname);

  const { data: cart } = useGetCartQuery(tenantId, storeSlug ?? undefined);

  if (!storeSlug) return null;

  const itemCount = cart?.items.length ?? 0;
  const active = pathname === `/marketplace/${storeSlug}/cart`;

  return (
    <Link
      href={`/marketplace/${storeSlug}/cart`}
      title={`Carrinho — ${cart?.store.name ?? storeSlug}`}
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full border transition-colors",
        active
          ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
          : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300",
      )}
    >
      <ShoppingCart className="size-3.5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-black">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Link>
  );
}
