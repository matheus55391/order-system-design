export function formatBrlFromNumber(value: number): string {
  if (!value) return "";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function maskBrlFromInput(raw: string): {
  display: string;
  value: number;
} {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { display: "", value: 0 };

  const value = Number(digits) / 100;
  return {
    display: value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    value,
  };
}

export function parseBrlToNumber(display: string): number {
  const digits = display.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
}

export function formatIntegerFromNumber(value: number): string {
  if (!value) return "";
  return value.toLocaleString("pt-BR");
}

export function maskIntegerFromInput(raw: string): {
  display: string;
  value: number;
} {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { display: "", value: 0 };

  const value = Number(digits);
  return { display: value.toLocaleString("pt-BR"), value };
}
