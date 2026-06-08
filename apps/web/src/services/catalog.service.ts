import { ApiService } from "./api-service";
import type {
  ProductDto,
  StoreCatalogResponseDto,
  StoreListItemDto,
} from "./catalog.service.dto";

class CatalogService extends ApiService {
  getProducts() {
    return this.get<ProductDto[]>("/catalog/products");
  }

  listStores() {
    return this.get<StoreListItemDto[]>("/catalog/stores");
  }

  getStoreProducts(slug: string) {
    return this.get<StoreCatalogResponseDto>(
      `/catalog/stores/${slug}/products`,
    );
  }

  getProduct(id: string) {
    return this.get<ProductDto>(`/catalog/products/${id}`);
  }
}

export const catalogService = new CatalogService();
