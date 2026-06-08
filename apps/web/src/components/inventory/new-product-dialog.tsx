"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/services";
import { inventoryService } from "@/services";
import { createProductSchema } from "@/schema";
import { cn } from "@/lib/utils";

const defaultImage =
  process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_IMAGE ??
  "http://localhost:9000/products/default-product.webp";

const defaultValues = {
  name: "",
  description: "",
  imageUrl: defaultImage,
  variant: {
    sku: "",
    size: "",
    color: "",
    price: 0,
    totalStock: 0,
  },
};

const fieldClass = "border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600";

export function NewProductDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues,
  });

  const close = () => {
    form.reset(defaultValues);
    onOpenChange(false);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const product = await inventoryService.createProduct({
        ...values,
        description: values.description || undefined,
        imageUrl: values.imageUrl || undefined,
        variant: {
          ...values.variant,
          size: values.variant.size || undefined,
          color: values.variant.color || undefined,
        },
      });
      toast.success("Produto cadastrado");
      void queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      close();
      router.push(`/inventory/${product.id}/edit`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao cadastrar produto",
      );
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => (value ? onOpenChange(true) : close())}
    >
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>
            Cadastre o produto com a primeira variante, preço e estoque
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <AuthField
            id="dialog-name"
            label="Nome"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="dialog-name"
              className={fieldClass}
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
              rows={2}
              className={cn(fieldClass, "min-h-0")}
              {...form.register("description")}
            />
          </AuthField>

          <AuthField
            id="dialog-imageUrl"
            label="URL da imagem"
            error={form.formState.errors.imageUrl?.message}
          >
            <Input
              id="dialog-imageUrl"
              className={fieldClass}
              {...form.register("imageUrl")}
            />
          </AuthField>

          <div className="rounded-lg border border-zinc-800 p-3">
            <p className="mb-3 text-sm font-medium text-white">
              Primeira variante
            </p>
            <div className="flex flex-col gap-3">
              <AuthField
                id="dialog-sku"
                label="SKU"
                error={form.formState.errors.variant?.sku?.message}
              >
                <Input
                  id="dialog-sku"
                  className={fieldClass}
                  {...form.register("variant.sku")}
                />
              </AuthField>

              <div className="grid gap-3 sm:grid-cols-2">
                <AuthField id="dialog-size" label="Tamanho">
                  <Input
                    id="dialog-size"
                    className={fieldClass}
                    {...form.register("variant.size")}
                  />
                </AuthField>
                <AuthField id="dialog-color" label="Cor">
                  <Input
                    id="dialog-color"
                    className={fieldClass}
                    {...form.register("variant.color")}
                  />
                </AuthField>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <AuthField
                  id="dialog-price"
                  label="Preço (R$)"
                  error={form.formState.errors.variant?.price?.message}
                >
                  <Input
                    id="dialog-price"
                    type="number"
                    step="0.01"
                    min="0"
                    className={fieldClass}
                    {...form.register("variant.price", { valueAsNumber: true })}
                  />
                </AuthField>
                <AuthField
                  id="dialog-totalStock"
                  label="Estoque inicial"
                  error={form.formState.errors.variant?.totalStock?.message}
                >
                  <Input
                    id="dialog-totalStock"
                    type="number"
                    min="0"
                    className={fieldClass}
                    {...form.register("variant.totalStock", {
                      valueAsNumber: true,
                    })}
                  />
                </AuthField>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-zinc-800 pt-4 sm:justify-end">
            <Button type="button" variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="bg-orange-500 font-semibold text-black hover:bg-orange-400"
            >
              {form.formState.isSubmitting ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
