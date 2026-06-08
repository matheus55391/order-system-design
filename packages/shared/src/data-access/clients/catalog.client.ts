import type {
  ProductDto,
  StoreCatalogResponseDto,
  StoreListItemDto,
} from "../../contracts";
import type { HttpTransport } from "../http";
import { withSearchQuery } from "../search-query";

export class CatalogClient {
  constructor(private readonly http: HttpTransport) {}

  getProducts(search?: string) {
    return this.http.request<ProductDto[]>({
      method: "GET",
      url: withSearchQuery("/catalog/products", search),
    });
  }

  listStores() {
    return this.http.request<StoreListItemDto[]>({
      method: "GET",
      url: "/catalog/stores",
    });
  }

  getStoreProducts(slug: string, search?: string) {
    return this.http.request<StoreCatalogResponseDto>({
      method: "GET",
      url: withSearchQuery(`/catalog/stores/${slug}/products`, search),
    });
  }

  getProduct(id: string) {
    return this.http.request<ProductDto>({
      method: "GET",
      url: `/catalog/products/${id}`,
    });
  }
}

