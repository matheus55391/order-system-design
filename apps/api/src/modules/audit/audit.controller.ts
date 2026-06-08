import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { TenantContext } from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuditService } from "./audit.service";

@Controller("audit")
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("movements")
  listMovements(
    @CurrentUser() user: TenantContext,
    @Query("limit") limit?: string,
  ) {
    const parsed = limit ? Number(limit) : 50;
    return this.auditService.listMovements(
      user.tenantId,
      Number.isFinite(parsed) ? parsed : 50,
    );
  }

  @Get("summary")
  getSummary(@CurrentUser() user: TenantContext) {
    return this.auditService.getSummary(user.tenantId);
  }
}
