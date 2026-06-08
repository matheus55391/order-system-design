/** Nomes das filas — única fonte de verdade para publishers e consumers. */
export const QUEUES = {
  RESERVATION_EXPIRY: "reservation.expiry",
  EMAIL_SEND: "email.send",
  ORDER_CONFIRMED: "order.confirmed",
} as const;

export const DLX = {
  EXCHANGE: "dlx",
  QUEUE: "failed.messages",
} as const;

export const MQ_RETRY = {
  MAX_RETRIES: 3,
  RETRY_BASE_MS: 2_000,
} as const;

/** Todas as filas de negócio que precisam ser declaradas no boot. */
export const BUSINESS_QUEUES = Object.values(QUEUES);
