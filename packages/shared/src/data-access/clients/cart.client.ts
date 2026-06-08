import type {
  AddToCartRequestDto,
  CartItemMutationResponseDto,
  CartResponseDto,
  SuccessResponseDto,
  UpdateCartItemRequestDto,
} from "../../contracts";
import type { HttpTransport } from "../http";

export class CartClient {
  constructor(private readonly http: HttpTransport) {}

  getCart(storeSlug: string) {
    return this.http.request<CartResponseDto>({
      method: "GET",
      url: `/cart/stores/${storeSlug}`,
    });
  }

  addItem(data: AddToCartRequestDto) {
    return this.http.request<CartItemMutationResponseDto>({
      method: "POST",
      url: "/cart/items",
      body: data,
    });
  }

  updateItem(itemId: string, data: UpdateCartItemRequestDto) {
    return this.http.request<CartItemMutationResponseDto>({
      method: "PATCH",
      url: `/cart/items/${itemId}`,
      body: data,
    });
  }

  removeItem(itemId: string) {
    return this.http.request<SuccessResponseDto>({
      method: "DELETE",
      url: `/cart/items/${itemId}`,
    });
  }
}

