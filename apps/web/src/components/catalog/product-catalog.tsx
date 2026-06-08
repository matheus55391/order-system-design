"use client";

import { ShoppingCart } from "lucide-react";
import { DashCard } from "@/components/dashboard/dash-card";
import { ProductImage } from "@/components/product-image";
import type { ProductDto } from "@/services";
import { cn } from "@/lib/utils";
import type { CatalogView } from "./view-toggle";

function VariantRow({
  variant,
  quantity,
  onQuantityChange,
  onAddToCart,
  disabled,
  compact,
}: {
  variant: ProductDto["variants"][number];
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-950/50 p-3",
        compact && "flex flex-wrap items-center gap-3 sm:flex-nowrap",
      )}
    >
      <div className={cn("min-w-0 flex-1", compact && "flex items-center gap-4")}>
        <div className={compact ? "min-w-[140px]" : undefined}>
          <p className="text-sm font-medium text-zinc-200">{variant.sku}</p>
          <p className="text-xs text-zinc-600">
            {[variant.size, variant.color].filter(Boolean).join(" · ")}
          </p>
        </div>
        {compact && (
          <p className="text-xs text-orange-400">
            {variant.availableStock} disp.
          </p>
        )}
        {!compact && (
          <p className="mt-1 text-xs text-orange-400">
            {variant.availableStock} disponíveis
          </p>
        )}
      </div>
      <div
        className={cn(
          "flex items-center gap-2",
          !compact && "mt-2",
          compact && "shrink-0",
        )}
      >
        <p
          className={cn(
            "font-semibold text-white",
            compact ? "text-sm min-w-[72px] text-right" : "text-sm",
          )}
        >
          {variant.price?.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
        <input
          type="number"
          min={1}
          max={variant.availableStock}
          value={quantity}
          onChange={(e) => onQuantityChange(Number(e.target.value))}
          className="h-8 w-16 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-sm text-white"
        />
        <button
          type="button"
          disabled={variant.availableStock === 0 || disabled}
          onClick={onAddToCart}
          className="flex h-8 items-center gap-1.5 rounded-md bg-orange-500 px-3 text-xs font-semibold text-black transition-colors hover:bg-orange-400 disabled:opacity-40"
        >
          <ShoppingCart className="size-3.5" />
          Carrinho
        </button>
      </div>
    </div>
  );
}

function ProductCardGrid({
  product,
  quantities,
  onQuantityChange,
  onAddToCart,
  addToCartPending,
}: {
  product: ProductDto;
  quantities: Record<string, number>;
  onQuantityChange: (variantId: string, qty: number) => void;
  onAddToCart: (variantId: string, quantity: number) => void;
  addToCartPending?: boolean;
}) {
  return (
    <DashCard>
      <div className="flex flex-col">
        <div className="relative aspect-[4/3] w-full">
          <ProductImage src={product.imageUrl} alt={product.name} />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div>
            <h3 className="font-medium text-white">{product.name}</h3>
            <p className="text-xs text-zinc-500 line-clamp-2">
              {product.description}
            </p>
          </div>
          {product.variants.map((variant) => (
            <VariantRow
              key={variant.id}
              variant={variant}
              quantity={quantities[variant.id] ?? 1}
              onQuantityChange={(qty) => onQuantityChange(variant.id, qty)}
              onAddToCart={() =>
                onAddToCart(variant.id, quantities[variant.id] ?? 1)
              }
              disabled={addToCartPending}
            />
          ))}
        </div>
      </div>
    </DashCard>
  );
}

function ProductCardList({
  product,
  quantities,
  onQuantityChange,
  onAddToCart,
  addToCartPending,
}: {
  product: ProductDto;
  quantities: Record<string, number>;
  onQuantityChange: (variantId: string, qty: number) => void;
  onAddToCart: (variantId: string, quantity: number) => void;
  addToCartPending?: boolean;
}) {
  return (
    <DashCard>
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg sm:aspect-square sm:w-36">
          <ProductImage src={product.imageUrl} alt={product.name} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <h3 className="font-medium text-white">{product.name}</h3>
            <p className="text-xs text-zinc-500">{product.description}</p>
            <p className="mt-1 text-xs text-zinc-600">
              {product.variants.length} variações
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {product.variants.map((variant) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                quantity={quantities[variant.id] ?? 1}
                compact
                onQuantityChange={(qty) => onQuantityChange(variant.id, qty)}
                onAddToCart={() =>
                  onAddToCart(variant.id, quantities[variant.id] ?? 1)
                }
                disabled={addToCartPending}
              />
            ))}
          </div>
        </div>
      </div>
    </DashCard>
  );
}

export function ProductCatalog({
  products,
  view,
  quantities,
  onQuantityChange,
  onAddToCart,
  addToCartPending,
}: {
  products: ProductDto[];
  view: CatalogView;
  quantities: Record<string, number>;
  onQuantityChange: (variantId: string, qty: number) => void;
  onAddToCart: (variantId: string, quantity: number) => void;
  addToCartPending?: boolean;
}) {
  if (products.length === 0) {
    return <p className="text-zinc-500">Nenhum produto encontrado.</p>;
  }

  const Card = view === "grid" ? ProductCardGrid : ProductCardList;

  return (
    <div
      className={cn(
        "gap-4",
        view === "grid"
          ? "grid sm:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col",
      )}
    >
      {products.map((product) => (
        <Card
          key={product.id}
          product={product}
          quantities={quantities}
          onQuantityChange={onQuantityChange}
          onAddToCart={onAddToCart}
          addToCartPending={addToCartPending}
        />
      ))}
    </div>
  );
}
