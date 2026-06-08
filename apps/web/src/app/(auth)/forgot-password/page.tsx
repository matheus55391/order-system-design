"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthField, authInputClass } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { ApiError } from "@/services";
import { authService } from "@/services";
import { forgotPasswordSchema } from "@/schema";

export default function ForgotPasswordPage() {
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await authService.forgotPassword(values);
      toast.success(result.message);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao enviar e-mail",
      );
    }
  });

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviaremos um link para redefinir sua senha"
      footer={
        <Link href="/login" className="font-medium text-white hover:underline">
          Voltar ao login
        </Link>
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

        <p className="text-xs text-zinc-600">
          O e-mail será enviado via MailHog em desenvolvimento. Acesse{" "}
          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noreferrer"
            className="text-orange-400 hover:underline"
          >
            localhost:8025
          </a>{" "}
          para visualizar.
        </p>

        <AuthButton loading={form.formState.isSubmitting}>Enviar link</AuthButton>
      </form>
    </AuthShell>
  );
}
