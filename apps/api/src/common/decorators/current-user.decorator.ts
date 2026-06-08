import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { TenantContext } from "@repo/shared";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest<{ user: TenantContext }>();
    return request.user;
  },
);
