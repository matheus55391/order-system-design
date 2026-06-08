import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CatalogModule } from "../catalog/catalog.module";
import { InventoryManagementController } from "./inventory-management.controller";
import { InventoryManagementService } from "./inventory-management.service";

@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [InventoryManagementController],
  providers: [InventoryManagementService],
})
export class InventoryManagementModule {}
