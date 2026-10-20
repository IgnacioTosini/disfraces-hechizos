export type RentalPeriod = { pickupDate: string | Date; returnDate: string | Date };

export type RentalReservation = RentalPeriod & {
  variantId: string;
  quantity: number;
  requestId: string;
  status: "PENDING" | "CONTACTED" | "CONFIRMED" | "PICKED_UP" | "RETURNED" | "CANCELLED";
  isAvailableAgain: boolean;
};

export type RequestedRental = RentalPeriod & { variantId: string; quantity: number };

export type AvailabilityResult = RequestedRental & { available: boolean; availableUnits: number };

export type RentalReservationRow = Omit<RentalReservation, "requestId" | "status"> & {
  rentalRequestId: string;
  rentalRequest: { status: RentalReservation["status"] };
};

export function toRentalReservation(item: RentalReservationRow): RentalReservation {
  return { ...item, requestId: item.rentalRequestId, status: item.rentalRequest.status };
}

function dateKey(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

export function rentalPeriodsOverlap(first: RentalPeriod, second: RentalPeriod) {
  return dateKey(first.pickupDate) <= dateKey(second.returnDate)
    && dateKey(first.returnDate) >= dateKey(second.pickupDate);
}

function blocksPeriod(reservation: RentalReservation, requested: RequestedRental) {
  if (reservation.status === "RETURNED") {
    return !reservation.isAvailableAgain && dateKey(reservation.returnDate) <= dateKey(requested.returnDate);
  }
  return (reservation.status === "CONFIRMED" || reservation.status === "PICKED_UP")
    && rentalPeriodsOverlap(reservation, requested);
}

/** Calculates availability using the same rule for the catalog, cart, and admin confirmation. */
export function checkRentalAvailability(
  stockByVariant: ReadonlyMap<string, number>,
  requestedItems: RequestedRental[],
  reservations: RentalReservation[],
  excludedRequestId?: string,
): AvailabilityResult[] {
  return requestedItems.map((requested) => {
    const stock = stockByVariant.get(requested.variantId) ?? 0;
    const reservedUnits = reservations
      .filter((reservation) => reservation.variantId === requested.variantId
        && reservation.requestId !== excludedRequestId
        && blocksPeriod(reservation, requested))
      .reduce((total, reservation) => total + reservation.quantity, 0);
    const availableUnits = Math.max(0, stock - reservedUnits);
    const requestedTogether = requestedItems
      .filter((item) => item.variantId === requested.variantId && rentalPeriodsOverlap(item, requested))
      .reduce((total, item) => total + item.quantity, 0);

    return { ...requested, availableUnits, available: availableUnits >= requestedTogether };
  });
}
