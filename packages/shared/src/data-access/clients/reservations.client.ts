import type {
  ReservationDto,
  ReserveFromCartRequestDto,
} from "../../contracts";
import type { HttpTransport } from "../http";

export class ReservationsClient {
  constructor(private readonly http: HttpTransport) {}

  getReservations() {
    return this.http.request<ReservationDto[]>({
      method: "GET",
      url: "/reservations",
    });
  }

  reserveFromCart(data: ReserveFromCartRequestDto) {
    return this.http.request<ReservationDto[]>({
      method: "POST",
      url: "/reservations/from-cart",
      body: data,
    });
  }

  cancelReservation(id: string) {
    return this.http.request<void>({
      method: "DELETE",
      url: `/reservations/${id}`,
    });
  }
}

