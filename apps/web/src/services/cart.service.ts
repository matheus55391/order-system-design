import { ApiService } from "./api-service";
import type {
  AddToCartRequestDto,
  CartItemMutationResponseDto,
  CartResponseDto,
  UpdateCartItemRequestDto,
} from "./cart.service.dto";
import type { SuccessResponseDto } from "./shared.dto";

class CartService extends ApiService {
  getCart(storeSlug: string) {
    return this.get<CartResponseDto>(`/cart/stores/${storeSlug}`);
  }

  addItem(data: AddToCartRequestDto) {
    return this.post<CartItemMutationResponseDto, AddToCartRequestDto>(
      "/cart/items",
      data,
    );
  }

  updateItem(itemId: string, data: UpdateCartItemRequestDto) {
    return this.patch<CartItemMutationResponseDto, UpdateCartItemRequestDto>(
      `/cart/items/${itemId}`,
      data,
    );
  }

  removeItem(itemId: string) {
    return this.delete<SuccessResponseDto>(`/cart/items/${itemId}`);
  }
}

export const cartService = new CartService();
