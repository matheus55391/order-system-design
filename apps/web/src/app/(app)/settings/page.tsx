"use client";

import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthField, AuthInput, authInputClass } from "@/components/auth/auth-field";
import {
  SettingsPanel,
  SettingsRow,
  SettingsSection,
  SettingsSidebar,
} from "@/components/settings/settings-layout";
import { SettingsToggle } from "@/components/settings/settings-toggle";
import { Button } from "@/components/ui/button";
import { IntegerInput } from "@/components/ui/integer-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useTenantId } from "@/hooks/use-tenant-id";
import {
  defaultTenantSettings,
  loadTenantSettings,
  saveTenantSettings,
  type SettingsTab,
  type TenantSettings,
  webhookEventOptions,
} from "@/lib/tenant-settings";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";

function WebhookSparkline() {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];
  return (
    <div className="flex h-16 items-end gap-0.5 px-1 pt-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-orange-600/20 to-orange-400/70"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function DemoApiKey({ tenantSlug }: { tenantSlug: string }) {
  const key = `osd_${tenantSlug.replace(/-/g, "_")}_demo_key`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    toast.success("Chave copiada");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-xs text-zinc-400">
        {key}
      </code>
      <button
        type="button"
        onClick={copy}
        className="flex size-9 shrink-0 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 hover:text-white"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)!;
  const tenantId = useTenantId()!;
  const [tab, setTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<TenantSettings>(defaultTenantSettings);
  const [hydrated, setHydrated] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    "order.confirmed",
    "order.delivered",
  ]);

  useEffect(() => {
    setSettings(loadTenantSettings(tenantId));
    setHydrated(true);
  }, [tenantId]);

  const persist = useCallback(
    (next: TenantSettings) => {
      setSettings(next);
      saveTenantSettings(tenantId, next);
    },
    [tenantId],
  );

  const saveMarketplace = () => {
    persist(settings);
    toast.success("Preferências de marketplace salvas");
  };

  const saveNotifications = () => {
    persist(settings);
    toast.success("Preferências de notificação salvas");
  };

  const createWebhook = () => {
    const url = webhookUrl.trim();
    if (!url) {
      toast.error("Informe a URL do webhook");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("URL inválida");
      return;
    }
    if (webhookEvents.length === 0) {
      toast.error("Selecione ao menos um evento");
      return;
    }

    const webhook = {
      id: crypto.randomUUID(),
      url,
      events: webhookEvents,
      createdAt: new Date().toISOString(),
      lastEventAt: null,
    };

    persist({
      ...settings,
      webhooks: [webhook, ...settings.webhooks],
    });
    setWebhookUrl("");
    toast.success("Webhook criado (simulação local)");
  };

  const removeWebhook = (id: string) => {
    persist({
      ...settings,
      webhooks: settings.webhooks.filter((w) => w.id !== id),
    });
    toast.success("Webhook removido");
  };

  if (!hydrated) {
    return <p className="text-muted-foreground">Carregando configurações...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Configurações</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Preferências da empresa {user.tenant.name} — salvas localmente neste
          navegador (demo)
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <SettingsSidebar active={tab} onChange={setTab} />

        <div className="min-w-0">
          {tab === "general" && (
            <SettingsSection
              title="Geral"
              description="Dados da conta e da empresa. Identidade e slug são definidos no cadastro."
            >
              <SettingsPanel>
                <SettingsRow label="Nome da empresa">
                  <span className="text-sm text-zinc-300">{user.tenant.name}</span>
                </SettingsRow>
                <SettingsRow label="Slug no marketplace" hint="URL pública da loja">
                  <code className="text-sm text-orange-400">
                    /marketplace/{user.tenant.slug}
                  </code>
                </SettingsRow>
                <SettingsRow label="ID do tenant" hint="Referência técnica">
                  <code className="text-xs text-zinc-500">{user.tenant.id}</code>
                </SettingsRow>
                <SettingsRow label="Seu nome">
                  <span className="text-sm text-zinc-300">{user.name}</span>
                </SettingsRow>
                <SettingsRow label="E-mail">
                  <span className="text-sm text-zinc-300">{user.email}</span>
                </SettingsRow>
                <SettingsRow label="Perfil">
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                    {user.role}
                  </span>
                </SettingsRow>
              </SettingsPanel>

              <p className="text-xs text-zinc-600">
                Edição de perfil e senha: use recuperação de senha na tela de
                login. Backend de settings completo fica fora do escopo deste
                estudo.
              </p>
            </SettingsSection>
          )}

          {tab === "marketplace" && (
            <SettingsSection
              title="Marketplace"
              description="Como sua loja aparece para outras empresas que compram de você."
              action={
                <Button
                  type="button"
                  onClick={saveMarketplace}
                  className="bg-orange-500 text-black hover:bg-orange-400"
                >
                  Salvar alterações
                </Button>
              }
            >
              <SettingsPanel>
                <SettingsRow
                  label="Aceitando pedidos"
                  hint="Quando desligado, compradores ainda veem o catálogo, mas você sinaliza indisponibilidade operacional"
                >
                  <SettingsToggle
                    label="Aceitando pedidos"
                    checked={settings.marketplace.acceptingOrders}
                    onChange={(acceptingOrders) =>
                      setSettings((s) => ({
                        ...s,
                        marketplace: { ...s.marketplace, acceptingOrders },
                      }))
                    }
                  />
                </SettingsRow>
                <SettingsRow
                  label="Pedido mínimo"
                  hint="Valor mínimo por checkout nesta loja (simulação)"
                >
                  <CurrencyInput
                    value={settings.marketplace.minOrderValue}
                    onValueChange={(minOrderValue) =>
                      setSettings((s) => ({
                        ...s,
                        marketplace: { ...s.marketplace, minOrderValue },
                      }))
                    }
                    className={cn(authInputClass(), "h-10 w-full max-w-[160px]")}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Prazo de envio"
                  hint="Dias úteis estimados até finalizar pedidos recebidos"
                >
                  <div className="flex items-center justify-end gap-2">
                    <IntegerInput
                      value={settings.marketplace.leadTimeDays}
                      onValueChange={(leadTimeDays) =>
                        setSettings((s) => ({
                          ...s,
                          marketplace: {
                            ...s.marketplace,
                            leadTimeDays: Math.max(1, leadTimeDays),
                          },
                        }))
                      }
                      min={1}
                      max={60}
                      className={cn(authInputClass(), "h-10 w-20")}
                    />
                    <span className="text-sm text-zinc-500">dias</span>
                  </div>
                </SettingsRow>
              </SettingsPanel>

              <Link
                href="/store"
                className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:underline"
              >
                Ver painel da sua loja
                <ArrowUpRight className="size-3.5" />
              </Link>
            </SettingsSection>
          )}

          {tab === "notifications" && (
            <SettingsSection
              title="Notificações"
              description="Alertas por e-mail (simulados — MailHog em desenvolvimento)."
              action={
                <Button
                  type="button"
                  onClick={saveNotifications}
                  className="bg-orange-500 text-black hover:bg-orange-400"
                >
                  Salvar alterações
                </Button>
              }
            >
              <SettingsPanel>
                <SettingsRow
                  label="Novo pedido recebido"
                  hint="Quando outra empresa confirma compra na sua loja"
                >
                  <SettingsToggle
                    label="Novo pedido recebido"
                    checked={settings.notifications.orderReceived}
                    onChange={(orderReceived) =>
                      setSettings((s) => ({
                        ...s,
                        notifications: { ...s.notifications, orderReceived },
                      }))
                    }
                  />
                </SettingsRow>
                <SettingsRow
                  label="Pedido finalizado"
                  hint="Confirmação de entrega para o comprador"
                >
                  <SettingsToggle
                    label="Pedido finalizado"
                    checked={settings.notifications.orderDelivered}
                    onChange={(orderDelivered) =>
                      setSettings((s) => ({
                        ...s,
                        notifications: { ...s.notifications, orderDelivered },
                      }))
                    }
                  />
                </SettingsRow>
                <SettingsRow
                  label="Estoque baixo"
                  hint="Quando disponível ficar abaixo do limite no ledger"
                >
                  <SettingsToggle
                    label="Estoque baixo"
                    checked={settings.notifications.lowStock}
                    onChange={(lowStock) =>
                      setSettings((s) => ({
                        ...s,
                        notifications: { ...s.notifications, lowStock },
                      }))
                    }
                  />
                </SettingsRow>
              </SettingsPanel>
            </SettingsSection>
          )}

          {tab === "integrations" && (
            <div className="flex flex-col gap-10">
              <SettingsSection
                title="Criar webhook"
                description={
                  <>
                    Envie eventos do sistema para seu ERP em tempo real.{" "}
                    <span className="text-zinc-400">
                      Simulação local — sem disparo real.
                    </span>
                  </>
                }
              >
                <div className="flex flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
                  <AuthField id="webhook-url" label="URL de destino">
                    <AuthInput
                      id="webhook-url"
                      placeholder="https://seu-erp.com/webhooks/order-system"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </AuthField>

                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Eventos
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {webhookEventOptions.map((event) => (
                        <label
                          key={event.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 px-3 py-2.5 hover:border-zinc-700"
                        >
                          <input
                            type="checkbox"
                            checked={webhookEvents.includes(event.id)}
                            onChange={(e) => {
                              setWebhookEvents((prev) =>
                                e.target.checked
                                  ? [...prev, event.id]
                                  : prev.filter((id) => id !== event.id),
                              );
                            }}
                            className="mt-0.5 accent-orange-500"
                          />
                          <span className="flex flex-col gap-0.5">
                            <span className="text-sm text-zinc-200">
                              {event.label}
                            </span>
                            <span className="font-mono text-xs text-zinc-600">
                              {event.id}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={createWebhook}
                    className="w-fit bg-orange-500 text-black hover:bg-orange-400"
                  >
                    Criar webhook
                  </Button>
                </div>
              </SettingsSection>

              <SettingsSection title="Webhooks" description="Endpoints configurados">
                {settings.webhooks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-500">
                    Nenhum webhook configurado
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {settings.webhooks.map((wh) => (
                      <div
                        key={wh.id}
                        className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50"
                      >
                        <WebhookSparkline />
                        <div className="flex flex-1 flex-col gap-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-mono text-xs text-zinc-300">
                              {wh.url}
                            </p>
                            <ExternalLink className="size-3.5 shrink-0 text-zinc-600" />
                          </div>
                          <p className="text-xs text-zinc-500">
                            Escutando {wh.events.length} evento
                            {wh.events.length !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {wh.lastEventAt
                              ? `Último evento ${new Date(wh.lastEventAt).toLocaleString("pt-BR")}`
                              : "Aguardando primeiro evento"}
                          </p>
                          <div className="mt-auto flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => removeWebhook(wh.id)}
                              className="text-zinc-600 hover:text-red-400"
                              title="Remover"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SettingsSection>

              <SettingsSection
                title="Chave de API"
                description="Para integrações server-to-server (valor de demonstração)."
              >
                <SettingsPanel>
                  <SettingsRow label="API Key" hint="Não rotacionável neste demo">
                    <DemoApiKey tenantSlug={user.tenant.slug} />
                  </SettingsRow>
                </SettingsPanel>
              </SettingsSection>
            </div>
          )}

          {tab === "team" && (
            <SettingsSection
              title="Equipe"
              description="Membros com acesso ao painel da empresa."
            >
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-orange-500/15 text-lg font-semibold text-orange-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-white">{user.name}</span>
                    <span className="text-sm text-zinc-500">{user.email}</span>
                    <span className="mt-1 w-fit rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-500">
                <strong className="font-medium text-zinc-400">
                  Limitação intencional:
                </strong>{" "}
                1 usuário por empresa neste projeto de estudo. Em produção,
                haveria convites, papéis (compras, estoque, financeiro) e
                auditoria por membro.
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}
