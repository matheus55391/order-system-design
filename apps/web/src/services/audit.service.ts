import { ApiService } from "./api-service";
import type {
  AuditSummaryResponseDto,
  StockMovementDto,
} from "./audit.service.dto";

class AuditService extends ApiService {
  getMovements(limit = 50) {
    return this.get<StockMovementDto[]>(`/audit/movements?limit=${limit}`);
  }

  getSummary() {
    return this.get<AuditSummaryResponseDto>("/audit/summary");
  }
}

export const auditService = new AuditService();
