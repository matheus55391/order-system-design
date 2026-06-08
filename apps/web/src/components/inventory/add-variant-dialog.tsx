"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AuthField, AuthInput } from "@/components/auth/auth-field";
import { SkuInput } from "@/components/inventory/sku-input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IntegerInput } from "@/components/ui/integer-input";
import { addVariantSchema } from "@repo/shared";
import { useTenantId } from "@/hooks/use-tenant-id";
import { useAddVariantMutation } from "@/query/add-variant.mutation";

const defaultValues = {
  sku: "",
  size: "",
  color: "",
  price: 0,
  totalStock: 0,
};

export function AddVariantDialog({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const tenantId = useTenantId();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(addVariantSchema),
    defaultValues,
  });

  const close = () => {
    form.reset(defaultValues);
    setOpen(false);
  };

  const addVariant = useAddVariantMutation({
    onSuccess: () => close(),
  });

  const onSubmit = form.handleSubmit((values) => {
    if (!tenantId) return;
    addVariant.mutate({ productId, tenantId, values });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => (value ? setOpen(true) : close())}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Plus className="size-4" />
          Adicionar variante
        </Button>
      </DialogTrigger>

      <DialogContent className="border-border bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova variante</DialogTitle>
          <DialogDescription>
            Adicione SKU, atributos, preço e estoque para {productName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <AuthField
            id="variant-sku"
            label="SKU"
            error={form.formState.errors.sku?.message}
          >
            <Controller
              name="sku"
              control={form.control}
              render={({ field }) => (
                <SkuInput
                  id="variant-sku"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  productName={productName}
                  size={form.watch("size")}
                  color={form.watch("color")}
                />
              )}
            />
          </AuthField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField id="variant-size" label="Tamanho">
              <AuthInput id="variant-size" {...form.register("size")} />
            </AuthField>
            <AuthField id="variant-color" label="Cor">
              <AuthInput id="variant-color" {...form.register("color")} />
            </AuthField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              id="variant-price"
              label="Preço"
              error={form.formState.errors.price?.message}
            >
              <Controller
                name="price"
                control={form.control}
                render={({ field }) => (
                  <CurrencyInput
                    id="variant-price"
                    placeholder="R$ 0,00"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </AuthField>
            <AuthField
              id="variant-totalStock"
              label="Estoque inicial"
              error={form.formState.errors.totalStock?.message}
            >
              <Controller
                name="totalStock"
                control={form.control}
                render={({ field }) => (
                  <IntegerInput
                    id="variant-totalStock"
                    placeholder="0"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </AuthField>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addVariant.isPending}
              className="bg-orange-500 font-semibold text-black hover:bg-orange-400"
            >
              {addVariant.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
