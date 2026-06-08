"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthField, authInputClass } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { ApiError, api } from "@/lib/api";
import { resetPasswordSchema } from "@/schema";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api.resetPassword(values.token, values.password);
      toast.success("Senha redefinida com sucesso");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao redefinir senha",
      );
    }
  });

  if (!token) {
    return (
      <AuthShell
        title="Link inválido"
        subtitle="Solicite um novo link de recuperação"
        footer={
          <Link href="/forgot-password" className="font-medium text-white hover:underline">
            Recuperar senha
          </Link>
        }
      >
        <p className="text-center text-sm text-zinc-500">
          Token não encontrado na URL.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nova senha"
      subtitle="Defina uma nova senha para sua conta"
      footer={
        <Link href="/login" className="font-medium text-white hover:underline">
          Voltar ao login
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <input type="hidden" {...form.register("token")} />

        <AuthField
          id="password"
          label="Nova senha"
          error={form.formState.errors.password?.message}
        >
          <input
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            className={authInputClass()}
            {...form.register("password")}
          />
        </AuthField>

        <AuthButton loading={form.formState.isSubmitting}>Redefinir senha</AuthButton>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
