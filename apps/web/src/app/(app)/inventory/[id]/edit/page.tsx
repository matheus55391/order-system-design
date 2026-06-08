"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthField, AuthInput } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashCard } from "@/components/dashboard/dash-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ApiError } from "@repo/shared/data-access";
import { inventoryService } from "@repo/shared/data-access";
import { addVariantSchema, updateProductSchema } from "@repo/shared";
import { useTenantId } from "@/hooks/use-tenant-id";
import {
  isUuid,
  revalidateInventory,
  setInventoryProductCache,
} from "@/lib/query-cache";
import { queryKeys } from "@/lib/query-keys";

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
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const validId = isUuid(id);

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
  } = useQuery({
    queryKey: queryKeys.inventory.detail(tenantId!, id),
    queryFn: () => inventoryService.getProduct(id),
    enabled: Boolean(tenantId && validId),
  });

  const productForm = useForm({
    resolver: zodResolver(updateProductSchema),
    defaultValues: { name: "", description: "", imageUrl: "" },
  });

  const variantForm = useForm({
    resolver: zodResolver(addVariantSchema),
    defaultValues: {
      sku: "",
      size: "",
      color: "",
      price: 0,
      totalStock: 0,
    },
  });

  useEffect(() => {
    if (!product) return;
    productForm.reset({
      name: product.name,
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
    });
  }, [product, productForm]);

  const saveProduct = useMutation({
    mutationFn: (values: {
      name?: string;
      description?: string | null;
      imageUrl?: string | null;
    }) =>
      inventoryService.updateProduct(id, {
        name: values.name,
        description: values.description ?? null,
        imageUrl: values.imageUrl ?? null,
      }),
    onSuccess: (updatedProduct) => {
      if (!tenantId) return;
      setInventoryProductCache(queryClient, tenantId, updatedProduct);
      revalidateInventory(queryClient, tenantId);
      toast.success("Produto atualizado");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao salvar produto",
      );
    },
  });

  const addVariant = useMutation({
    mutationFn: (values: {
      sku: string;
      size?: string;
      color?: string;
      price: number;
      totalStock: number;
    }) =>
      inventoryService.addVariant(id, {
        ...values,
        size: values.size || undefined,
        color: values.color || undefined,
      }),
    onSuccess: (updatedProduct) => {
      if (!tenantId) return;
      setInventoryProductCache(queryClient, tenantId, updatedProduct);
      revalidateInventory(queryClient, tenantId);
      toast.success("Variante adicionada");
      variantForm.reset();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao adicionar variante",
      );
    },
  });

  const updateVariant = useMutation({
    mutationFn: ({
      variantId,
      data,
    }: {
      variantId: string;
      data: {
        sku?: string;
        size?: string;
        color?: string;
        price?: number;
        totalStock?: number;
      };
    }) => inventoryService.updateVariant(variantId, data),
    onSuccess: (updatedProduct) => {
      if (!tenantId) return;
      setInventoryProductCache(queryClient, tenantId, updatedProduct);
      revalidateInventory(queryClient, tenantId);
      toast.success("Variante atualizada");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao atualizar variante",
      );
    },
  });

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
      <PageHeader
        title={product.name}
        description="Edite informações do produto, preços e estoque por variante"
      />

      <DashCard>
        <form
          onSubmit={productForm.handleSubmit((values) =>
            saveProduct.mutate(values),
          )}
          className="flex flex-col gap-4 p-5"
        >
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
              rows={3}
              {...productForm.register("description")}
            />
          </AuthField>

          <AuthField
            id="imageUrl"
            label="URL da imagem"
            error={productForm.formState.errors.imageUrl?.message}
          >
            <AuthInput id="imageUrl" {...productForm.register("imageUrl")} />
          </AuthField>

          <Button
            type="submit"
            disabled={saveProduct.isPending}
            className="w-fit"
          >
            {saveProduct.isPending ? "Salvando..." : "Salvar produto"}
          </Button>
        </form>
      </DashCard>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-400">Variantes e estoque</h2>

        {product.variants.map((variant) => (
          <VariantEditor
            key={variant.id}
            variant={variant}
            disabled={updateVariant.isPending}
            onSave={(data) =>
              updateVariant.mutate({ variantId: variant.id, data })
            }
          />
        ))}
      </section>

      <DashCard>
        <form
          onSubmit={variantForm.handleSubmit((values) => addVariant.mutate(values))}
          className="flex flex-col gap-4 p-5"
        >
          <h2 className="text-sm font-medium text-white">Nova variante</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              id="new-sku"
              label="SKU"
              error={variantForm.formState.errors.sku?.message}
            >
              <AuthInput id="new-sku" {...variantForm.register("sku")} />
            </AuthField>
            <AuthField
              id="new-price"
              label="Preço (R$)"
              error={variantForm.formState.errors.price?.message}
            >
              <AuthInput
                id="new-price"
                type="number"
                step="0.01"
                min="0"
                {...variantForm.register("price", { valueAsNumber: true })}
              />
            </AuthField>
            <AuthField id="new-size" label="Tamanho">
              <AuthInput id="new-size" {...variantForm.register("size")} />
            </AuthField>
            <AuthField id="new-color" label="Cor">
              <AuthInput id="new-color" {...variantForm.register("color")} />
            </AuthField>
            <AuthField
              id="new-stock"
              label="Estoque"
              error={variantForm.formState.errors.totalStock?.message}
            >
              <AuthInput
                id="new-stock"
                type="number"
                min="0"
                {...variantForm.register("totalStock", { valueAsNumber: true })}
              />
            </AuthField>
          </div>

          <Button type="submit" variant="outline" disabled={addVariant.isPending} className="w-fit">
            {addVariant.isPending ? "Adicionando..." : "Adicionar variante"}
          </Button>
        </form>
      </DashCard>

      <Link href="/inventory" className="text-sm text-zinc-500 hover:text-white">
        ← Voltar ao estoque
      </Link>
    </div>
  );
}

function VariantEditor({
  variant,
  disabled,
  onSave,
}: {
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
          <AuthInput placeholder="SKU" {...form.register("sku")} />
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

        <Button type="submit" variant="outline" size="sm" disabled={disabled} className="w-fit">
          Salvar variante
        </Button>
      </form>
    </DashCard>
  );
}
