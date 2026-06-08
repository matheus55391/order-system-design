"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthField, authInputClass } from "@/components/auth/auth-field";
import { DashCard } from "@/components/dashboard/dash-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ApiError } from "@/services";
import { inventoryService } from "@/services";
import { addVariantSchema, updateProductSchema } from "@/schema";

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
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["inventory-product", id],
    queryFn: () => inventoryService.getProduct(id),
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
    onSuccess: () => {
      toast.success("Produto atualizado");
      void queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory-product", id] });
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
    onSuccess: () => {
      toast.success("Variante adicionada");
      variantForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory-product", id] });
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
    onSuccess: () => {
      toast.success("Variante atualizada");
      void queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory-product", id] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao atualizar variante",
      );
    },
  });

  if (isLoading || !product) {
    return <p className="text-zinc-500">Carregando produto...</p>;
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
            <input
              id="name"
              className={authInputClass()}
              {...productForm.register("name")}
            />
          </AuthField>

          <AuthField
            id="description"
            label="Descrição"
            error={productForm.formState.errors.description?.message}
          >
            <textarea
              id="description"
              rows={3}
              className={authInputClass("h-auto py-2")}
              {...productForm.register("description")}
            />
          </AuthField>

          <AuthField
            id="imageUrl"
            label="URL da imagem"
            error={productForm.formState.errors.imageUrl?.message}
          >
            <input
              id="imageUrl"
              className={authInputClass()}
              {...productForm.register("imageUrl")}
            />
          </AuthField>

          <button
            type="submit"
            disabled={saveProduct.isPending}
            className="h-9 w-fit rounded-lg bg-orange-500 px-4 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
          >
            {saveProduct.isPending ? "Salvando..." : "Salvar produto"}
          </button>
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
              <input
                id="new-sku"
                className={authInputClass()}
                {...variantForm.register("sku")}
              />
            </AuthField>
            <AuthField
              id="new-price"
              label="Preço (R$)"
              error={variantForm.formState.errors.price?.message}
            >
              <input
                id="new-price"
                type="number"
                step="0.01"
                min="0"
                className={authInputClass()}
                {...variantForm.register("price", { valueAsNumber: true })}
              />
            </AuthField>
            <AuthField id="new-size" label="Tamanho">
              <input
                id="new-size"
                className={authInputClass()}
                {...variantForm.register("size")}
              />
            </AuthField>
            <AuthField id="new-color" label="Cor">
              <input
                id="new-color"
                className={authInputClass()}
                {...variantForm.register("color")}
              />
            </AuthField>
            <AuthField
              id="new-stock"
              label="Estoque"
              error={variantForm.formState.errors.totalStock?.message}
            >
              <input
                id="new-stock"
                type="number"
                min="0"
                className={authInputClass()}
                {...variantForm.register("totalStock", { valueAsNumber: true })}
              />
            </AuthField>
          </div>

          <button
            type="submit"
            disabled={addVariant.isPending}
            className="h-9 w-fit rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 hover:text-white disabled:opacity-50"
          >
            {addVariant.isPending ? "Adicionando..." : "Adicionar variante"}
          </button>
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
          <input
            className={authInputClass()}
            placeholder="SKU"
            {...form.register("sku")}
          />
          <input
            className={authInputClass()}
            placeholder="Tamanho"
            {...form.register("size")}
          />
          <input
            className={authInputClass()}
            placeholder="Cor"
            {...form.register("color")}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            className={authInputClass()}
            placeholder="Preço"
            {...form.register("price", { valueAsNumber: true })}
          />
          <input
            type="number"
            min={variant.reservedStock}
            className={authInputClass()}
            placeholder="Estoque total"
            {...form.register("totalStock", { valueAsNumber: true })}
          />
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="h-8 w-fit rounded-lg border border-zinc-700 px-3 text-xs text-zinc-400 hover:text-white disabled:opacity-50"
        >
          Salvar variante
        </button>
      </form>
    </DashCard>
  );
}
