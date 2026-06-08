import { ApiService } from "./api-service";
import type {
  CreateProductRequestDto,
  InventoryProductDto,
  UpdateProductRequestDto,
  UpdateVariantRequestDto,
} from "./inventory.service.dto";
import type { CreateProductVariantRequestDto } from "./inventory.service.dto";

class InventoryService extends ApiService {
  listProducts() {
    return this.get<InventoryProductDto[]>("/inventory/products");
  }

  getProduct(id: string) {
    return this.get<InventoryProductDto>(`/inventory/products/${id}`);
  }

  createProduct(data: CreateProductRequestDto) {
    return this.post<InventoryProductDto, CreateProductRequestDto>(
      "/inventory/products",
      data,
    );
  }

  updateProduct(id: string, data: UpdateProductRequestDto) {
    return this.patch<InventoryProductDto, UpdateProductRequestDto>(
      `/inventory/products/${id}`,
      data,
    );
  }

  addVariant(productId: string, data: CreateProductVariantRequestDto) {
    return this.post<InventoryProductDto, CreateProductVariantRequestDto>(
      `/inventory/products/${productId}/variants`,
      data,
    );
  }

  updateVariant(variantId: string, data: UpdateVariantRequestDto) {
    return this.patch<InventoryProductDto, UpdateVariantRequestDto>(
      `/inventory/variants/${variantId}`,
      data,
    );
  }
}

export const inventoryService = new InventoryService();
