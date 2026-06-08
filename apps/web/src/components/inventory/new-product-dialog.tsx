"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AuthField, AuthInput, authInputClass } from "@/components/auth/auth-field";
import { ProductImageUpload } from "@/components/inventory/product-image-upload";
import { SkuInput } from "@/components/inventory/sku-input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FullscreenDialogContent } from "@/components/inventory/fullscreen-dialog-content";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IntegerInput } from "@/components/ui/integer-input";
import { Textarea } from "@/components/ui/textarea";
import { createProductFormSchema } from "@repo/shared";
import { useTenantId } from "@/hooks/use-tenant-id";
import { useCreateProductMutation } from "@/query/create-product.mutation";
import { cn } from "@/lib/utils";

const defaultValues = {
  name: "",
  description: "",
  variant: {
    sku: "",
    size: "",
    color: "",
    price: 0,
    totalStock: 0,
  },
};

export function NewProductDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const tenantId = useTenantId();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(createProductFormSchema),
    defaultValues,
  });

  const resetForm = () => {
    form.reset(defaultValues);
    setImageFile(null);
  };

  const close = () => {
    resetForm();
    onOpenChange(false);
  };

  const createProduct = useCreateProductMutation({
    onSuccess: (productId) => {
      close();
      router.push(`/inventory/${productId}/edit`);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    if (!tenantId) return;
    createProduct.mutate({ tenantId, values, imageFile });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => (value ? onOpenChange(true) : close())}
    >
      <FullscreenDialogContent>
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left sm:px-8">
          <DialogTitle className="text-2xl font-semibold">
            Novo produto
          </DialogTitle>
          <DialogDescription>
            Cadastre o produto com a primeira variante, preço e estoque
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
            <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-10">
              <section className="rounded-xl border border-border bg-card/50 p-5">
                <AuthField id="dialog-image" label="Imagem do produto">
                  <ProductImageUpload
                    value={imageFile}
                    onChange={setImageFile}
                  />
                </AuthField>
              </section>

              <div className="flex flex-col gap-6">
                <section className="space-y-4">
                  <AuthField
                    id="dialog-name"
                    label="Nome"
                    error={form.formState.errors.name?.message}
                  >
                    <AuthInput
                      id="dialog-name"
                      placeholder="Ex.: Camiseta básica algodão"
                      {...form.register("name")}
                    />
                  </AuthField>

                  <AuthField
                    id="dialog-description"
                    label="Descrição"
                    error={form.formState.errors.description?.message}
                  >
                    <Textarea
                      id="dialog-description"
                      rows={4}
                      placeholder="Descreva o produto, material, uso..."
                      className={cn(
                        authInputClass(),
                        "min-h-28 resize-none py-3",
                      )}
                      {...form.register("description")}
                    />
                  </AuthField>
                </section>

                <section className="rounded-xl border border-border bg-card/50 p-5">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-foreground">
                      Primeira variante
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      SKU, atributos, preço e estoque inicial
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <AuthField
                      id="dialog-sku"
                      label="SKU"
                      error={form.formState.errors.variant?.sku?.message}
                    >
                      <Controller
                        name="variant.sku"
                        control={form.control}
                        render={({ field }) => (
                          <SkuInput
                            id="dialog-sku"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            productName={form.watch("name")}
                            size={form.watch("variant.size")}
                            color={form.watch("variant.color")}
                          />
                        )}
                      />
                    </AuthField>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField id="dialog-size" label="Tamanho">
                        <AuthInput
                          id="dialog-size"
                          placeholder="Ex.: M, 42, Único"
                          {...form.register("variant.size")}
                        />
                      </AuthField>
                      <AuthField id="dialog-color" label="Cor">
                        <AuthInput
                          id="dialog-color"
                          placeholder="Ex.: Preto, Azul marinho"
                          {...form.register("variant.color")}
                        />
                      </AuthField>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField
                        id="dialog-price"
                        label="Preço"
                        error={form.formState.errors.variant?.price?.message}
                      >
                        <Controller
                          name="variant.price"
                          control={form.control}
                          render={({ field }) => (
                            <CurrencyInput
                              id="dialog-price"
                              placeholder="R$ 0,00"
                              value={field.value}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          )}
                        />
                      </AuthField>
                      <AuthField
                        id="dialog-totalStock"
                        label="Estoque inicial"
                        error={
                          form.formState.errors.variant?.totalStock?.message
                        }
                      >
                        <Controller
                          name="variant.totalStock"
                          control={form.control}
                          render={({ field }) => (
                            <IntegerInput
                              id="dialog-totalStock"
                              placeholder="0"
                              value={field.value}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          )}
                        />
                      </AuthField>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-background/90 px-6 py-4 backdrop-blur sm:justify-end sm:px-8">
            <Button
              type="button"
              variant="ghost"
              onClick={close}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createProduct.isPending}
              className="min-w-32 bg-orange-500 font-semibold text-black hover:bg-orange-400"
            >
              {createProduct.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </FullscreenDialogContent>
    </Dialog>
  );
}
