import type {
  AuditSummaryResponseDto,
  StockMovementDto,
} from "../../contracts";
import type { HttpTransport } from "../http";

export class AuditClient {
  constructor(private readonly http: HttpTransport) {}

  getMovements(limit = 50) {
    return this.http.request<StockMovementDto[]>({
      method: "GET",
      url: `/audit/movements?limit=${limit}`,
    });
  }

  getSummary() {
    return this.http.request<AuditSummaryResponseDto>({
      method: "GET",
      url: "/audit/summary",
    });
  }
}

