"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AuthField, AuthInput, authInputClass } from "@/components/auth/auth-field";
import { AddVariantDialog } from "@/components/inventory/add-variant-dialog";
import { ProductImageUpload } from "@/components/inventory/product-image-upload";
import { SkuInput } from "@/components/inventory/sku-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashCard } from "@/components/dashboard/dash-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { updateProductSchema } from "@repo/shared";
import { ApiError } from "@repo/shared/data-access";
import { useTenantId } from "@/hooks/use-tenant-id";
import { isUuid } from "@/lib/query-cache";
import { cn } from "@/lib/utils";
import { useGetInventoryProductQuery } from "@/query/get-inventory-product.query";
import { useUpdateProductMutation } from "@/query/update-product.mutation";
import { useUpdateVariantMutation } from "@/query/update-variant.mutation";

const productFormSchema = updateProductSchema.omit({ imageUrl: true });

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const tenantId = useTenantId();
  const validId = isUuid(id);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!validId) {
      router.replace("/inventory");
    }
  }, [validId, router]);

  const {
    data: product,
    isPending,
    isError,
    error,
  } = useGetInventoryProductQuery(tenantId, id, validId);

  const productForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!product) return;
    productForm.reset({
      name: product.name,
      description: product.description ?? "",
    });
    setImageFile(null);
  }, [product, productForm]);

  const saveProduct = useUpdateProductMutation();
  const updateVariant = useUpdateVariantMutation();

  if (!validId) {
    return null;
  }

  if (isPending && !product) {
    return <p className="text-muted-foreground">Carregando produto...</p>;
  }

  if (isError && !product) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-red-400">
          {error instanceof ApiError
            ? error.message
            : "Erro ao carregar produto"}
        </p>
        <Link
          href="/inventory"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao estoque
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground">Produto não encontrado</p>
        <Link
          href="/inventory"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao estoque
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={product.name}
          description="Edite informações do produto, preços e estoque por variante"
        />
        <Link
          href="/inventory"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </div>

      <DashCard>
        <form
          onSubmit={productForm.handleSubmit((values) => {
            if (!tenantId) return;
            saveProduct.mutate({
              productId: id,
              tenantId,
              values: {
                ...values,
                imageUrl: product.imageUrl ?? null,
              },
              imageFile,
            });
          })}
          className="p-5"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
            <section className="rounded-xl border border-border bg-card/50 p-5">
              <AuthField id="edit-image" label="Imagem do produto">
                <ProductImageUpload
                  value={imageFile}
                  onChange={setImageFile}
                  currentImageUrl={product.imageUrl}
                />
              </AuthField>
            </section>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-medium text-white">Dados do produto</h2>

              <AuthField
                id="name"
                label="Nome"
                error={productForm.formState.errors.name?.message}
              >
                <AuthInput id="name" {...productForm.register("name")} />
              </AuthField>

              <AuthField
                id="description"
                label="Descrição"
                error={productForm.formState.errors.description?.message}
              >
                <Textarea
                  id="description"
                  rows={4}
                  className={cn(authInputClass(), "min-h-28 resize-none py-3")}
                  {...productForm.register("description")}
                />
              </AuthField>

              <Button
                type="submit"
                disabled={saveProduct.isPending}
                className="w-fit bg-orange-500 font-semibold text-black hover:bg-orange-400"
              >
                {saveProduct.isPending ? "Salvando..." : "Salvar produto"}
              </Button>
            </div>
          </div>
        </form>
      </DashCard>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-zinc-400">
            Variantes e estoque
          </h2>
          <AddVariantDialog productId={id} productName={product.name} />
        </div>

        {product.variants.length === 0 ? (
          <DashCard>
            <p className="p-5 text-sm text-muted-foreground">
              Nenhuma variante cadastrada. Use o botão acima para adicionar.
            </p>
          </DashCard>
        ) : (
          product.variants.map((variant) => (
            <VariantEditor
              key={variant.id}
              productName={product.name}
              variant={variant}
              disabled={updateVariant.isPending}
              onSave={(data) => {
                if (!tenantId) return;
                updateVariant.mutate({ variantId: variant.id, tenantId, data });
              }}
            />
          ))
        )}
      </section>
    </div>
  );
}

function VariantEditor({
  productName,
  variant,
  disabled,
  onSave,
}: {
  productName: string;
  variant: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    price: number | null;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
  };
  disabled?: boolean;
  onSave: (data: {
    sku: string;
    size: string;
    color: string;
    price: number;
    totalStock: number;
  }) => void;
}) {
  const form = useForm({
    defaultValues: {
      sku: variant.sku,
      size: variant.size ?? "",
      color: variant.color ?? "",
      price: variant.price ?? 0,
      totalStock: variant.totalStock,
    },
  });

  useEffect(() => {
    form.reset({
      sku: variant.sku,
      size: variant.size ?? "",
      color: variant.color ?? "",
      price: variant.price ?? 0,
      totalStock: variant.totalStock,
    });
  }, [variant, form]);

  return (
    <DashCard>
      <form
        onSubmit={form.handleSubmit((values) => onSave(values))}
        className="flex flex-col gap-4 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-sm text-white">{variant.sku}</p>
          <p className="text-xs text-zinc-600">
            {variant.availableStock} disp. · {variant.reservedStock} reservado ·{" "}
            {formatCurrency(variant.price ?? 0)}/un.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Controller
            name="sku"
            control={form.control}
            render={({ field }) => (
              <SkuInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="SKU"
                productName={productName}
                size={form.watch("size")}
                color={form.watch("color")}
              />
            )}
          />
          <AuthInput placeholder="Tamanho" {...form.register("size")} />
          <AuthInput placeholder="Cor" {...form.register("color")} />
          <AuthInput
            type="number"
            step="0.01"
            min="0"
            placeholder="Preço"
            {...form.register("price", { valueAsNumber: true })}
          />
          <AuthInput
            type="number"
            min={variant.reservedStock}
            placeholder="Estoque total"
            {...form.register("totalStock", { valueAsNumber: true })}
          />
        </div>

        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-fit"
        >
          Salvar variante
        </Button>
      </form>
    </DashCard>
  );
}
