"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { clearSessionQueries } from "@/lib/query-cache";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthField, AuthInput } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { ApiError } from "@repo/shared/data-access";
import { authService } from "@repo/shared/data-access";
import { registerSchema } from "@repo/shared";
import { useAuthStore } from "@/store";

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await authService.register(values);
      clearSessionQueries(queryClient);
      setSession(response.token, response.refreshToken, response.user);
      toast.success("Empresa criada com sucesso");
      router.push("/store");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao cadastrar",
      );
    }
  });

  return (
    <AuthShell
      title="Criar sua loja"
      subtitle="Cadastre sua empresa e comece a vender"
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-white hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <AuthField
          id="companyName"
          label="Nome da empresa"
          error={form.formState.errors.companyName?.message}
        >
          <AuthInput
            id="companyName"
            type="text"
            placeholder="Minha Loja"
            {...form.register("companyName")}
          />
        </AuthField>

        <AuthField id="email" label="E-mail" error={form.formState.errors.email?.message}>
          <AuthInput
            id="email"
            type="email"
            placeholder="contato@minhaloja.com"
            {...form.register("email")}
          />
        </AuthField>

        <AuthField
          id="password"
          label="Senha"
          error={form.formState.errors.password?.message}
        >
          <AuthInput
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            {...form.register("password")}
          />
        </AuthField>

        <AuthButton loading={form.formState.isSubmitting}>Criar loja</AuthButton>
      </form>
    </AuthShell>
  );
}
