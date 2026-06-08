import type {
  ProductDto,
  StoreCatalogResponseDto,
  StoreListItemDto,
} from "../../contracts";
import type { HttpTransport } from "../http";

export class CatalogClient {
  constructor(private readonly http: HttpTransport) {}

  getProducts() {
    return this.http.request<ProductDto[]>({
      method: "GET",
      url: "/catalog/products",
    });
  }

  listStores() {
    return this.http.request<StoreListItemDto[]>({
      method: "GET",
      url: "/catalog/stores",
    });
  }

  getStoreProducts(slug: string) {
    return this.http.request<StoreCatalogResponseDto>({
      method: "GET",
      url: `/catalog/stores/${slug}/products`,
    });
  }

  getProduct(id: string) {
    return this.http.request<ProductDto>({
      method: "GET",
      url: `/catalog/products/${id}`,
    });
  }
}

