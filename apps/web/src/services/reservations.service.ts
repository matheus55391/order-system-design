import { ApiService } from "./api-service";
import type {
  ReservationDto,
  ReserveFromCartRequestDto,
} from "./reservations.service.dto";

class ReservationsService extends ApiService {
  getReservations() {
    return this.get<ReservationDto[]>("/reservations");
  }

  reserveFromCart(data?: ReserveFromCartRequestDto) {
    return this.post<ReservationDto[], ReserveFromCartRequestDto>(
      "/reservations/from-cart",
      data ?? {},
    );
  }

  cancelReservation(id: string) {
    return this.delete<void>(`/reservations/${id}`);
  }
}

export const reservationsService = new ReservationsService();
