"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthField, authInputClass } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { ApiError, api } from "@/lib/api";
import { registerSchema } from "@/schema";
import { useAuthStore } from "@/store";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.listTenants(),
  });

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      tenantSlug: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await api.register(values);
      setSession(response.token, response.user);
      toast.success("Conta criada com sucesso");
      router.push("/catalog");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao cadastrar",
      );
    }
  });

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Junte-se à plataforma B2B do seu tenant"
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
        <AuthField id="name" label="Nome" error={form.formState.errors.name?.message}>
          <input
            id="name"
            type="text"
            placeholder="Seu nome"
            className={authInputClass()}
            {...form.register("name")}
          />
        </AuthField>

        <AuthField id="email" label="E-mail" error={form.formState.errors.email?.message}>
          <input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
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
            placeholder="Mínimo 6 caracteres"
            className={authInputClass()}
            {...form.register("password")}
          />
        </AuthField>

        <AuthField
          id="tenantSlug"
          label="Empresa (tenant)"
          error={form.formState.errors.tenantSlug?.message}
        >
          <select
            id="tenantSlug"
            className={authInputClass()}
            {...form.register("tenantSlug")}
          >
            <option value="">Selecione sua empresa</option>
            {tenants?.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </AuthField>

        <AuthButton loading={form.formState.isSubmitting}>Criar conta</AuthButton>
      </form>
    </AuthShell>
  );
}
