import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { TenantContext } from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  AuditSummaryResponseDto,
  StockMovementDto,
} from "./dto/audit.dto";
import { AuditService } from "./audit.service";

@ApiTags("audit")
@ApiBearerAuth("access-token")
@Controller("audit")
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("movements")
  @ApiOperation({ summary: "Histórico de movimentações de estoque" })
  @ApiQuery({ name: "limit", required: false, example: 50 })
  @ApiOkResponse({ type: StockMovementDto, isArray: true })
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
  @ApiOperation({ summary: "Resumo de movimentações por tipo" })
  @ApiOkResponse({ type: AuditSummaryResponseDto })
  getSummary(@CurrentUser() user: TenantContext) {
    return this.auditService.getSummary(user.tenantId);
  }
}
