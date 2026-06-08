import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { InventoryService } from "../inventory/inventory.service";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

@Module({
  imports: [AuthModule],
  controllers: [CatalogController],
  providers: [CatalogService, InventoryService],
})
export class CatalogModule {}
