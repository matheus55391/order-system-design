import type {
  CreateProductRequestDto,
  CreateProductVariantRequestDto,
  InventoryProductDto,
  UpdateProductRequestDto,
  UpdateVariantRequestDto,
} from "../../contracts";
import type { HttpTransport } from "../http";
import { withSearchQuery } from "../search-query";

export class InventoryClient {
  constructor(private readonly http: HttpTransport) {}

  listProducts(search?: string) {
    return this.http.request<InventoryProductDto[]>({
      method: "GET",
      url: withSearchQuery("/inventory/products", search),
    });
  }

  getProduct(id: string) {
    return this.http.request<InventoryProductDto>({
      method: "GET",
      url: `/inventory/products/${id}`,
    });
  }

  uploadProductImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return this.http.request<{ url: string }>({
      method: "POST",
      url: "/inventory/images",
      body: formData,
    });
  }

  createProduct(data: CreateProductRequestDto) {
    return this.http.request<InventoryProductDto>({
      method: "POST",
      url: "/inventory/products",
      body: data,
    });
  }

  updateProduct(id: string, data: UpdateProductRequestDto) {
    return this.http.request<InventoryProductDto>({
      method: "PATCH",
      url: `/inventory/products/${id}`,
      body: data,
    });
  }

  addVariant(productId: string, data: CreateProductVariantRequestDto) {
    return this.http.request<InventoryProductDto>({
      method: "POST",
      url: `/inventory/products/${productId}/variants`,
      body: data,
    });
  }

  updateVariant(variantId: string, data: UpdateVariantRequestDto) {
    return this.http.request<InventoryProductDto>({
      method: "PATCH",
      url: `/inventory/variants/${variantId}`,
      body: data,
    });
  }
}

