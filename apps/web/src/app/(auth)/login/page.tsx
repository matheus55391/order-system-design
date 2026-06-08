"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthField, authInputClass } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { ApiError, api } from "@/lib/api";
import { loginSchema } from "@/schema";
import { useAuthStore } from "@/store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await api.login(values.email, values.password);
      setSession(response.token, response.refreshToken, response.user);
      toast.success("Login realizado");
      router.push("/store");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao fazer login",
      );
    }
  });

  return (
    <AuthShell
      title="Entrar no Order System"
      subtitle="Bem-vindo de volta à plataforma B2B"
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/register" className="font-medium text-white hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <AuthField id="email" label="E-mail" error={form.formState.errors.email?.message}>
          <input
            id="email"
            type="email"
            placeholder="buyer@acme.com"
            className={authInputClass()}
            {...form.register("email")}
          />
        </AuthField>

        <AuthField
          id="password"
          label="Senha"
          error={form.formState.errors.password?.message}
        >
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className={authInputClass()}
            {...form.register("password")}
          />
        </AuthField>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-zinc-500 hover:text-orange-400"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <AuthButton loading={form.formState.isSubmitting}>Continuar</AuthButton>
      </form>
    </AuthShell>
  );
}
