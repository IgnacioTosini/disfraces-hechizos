import { describe, expect, it } from "vitest";
import { checkRentalAvailability, rentalPeriodsOverlap, type RentalReservation, type RequestedRental } from "./rental-availability";

const reservation = (overrides: Partial<RentalReservation> = {}): RentalReservation => ({
  variantId: "variant-1",
  quantity: 1,
  requestId: "request-confirmed",
  pickupDate: "2026-11-10",
  returnDate: "2026-11-12",
  status: "CONFIRMED",
  isAvailableAgain: false,
  ...overrides,
});

const requested = (overrides: Partial<RequestedRental> = {}): RequestedRental => ({
  variantId: "variant-1",
  quantity: 1,
  pickupDate: "2026-11-12",
  returnDate: "2026-11-14",
  ...overrides,
});

describe("disponibilidad por talle y fechas", () => {
  it("considera ocupadas las fechas compartidas entre alquileres", () => {
    expect(rentalPeriodsOverlap(
      { pickupDate: "2026-11-10", returnDate: "2026-11-12" },
      { pickupDate: "2026-11-12", returnDate: "2026-11-14" },
    )).toBe(true);
  });

  it("no confirma otro pedido del mismo talle y fechas si solo hay una unidad", () => {
    const result = checkRentalAvailability(new Map([["variant-1", 1]]), [requested()], [reservation()]);
    expect(result[0]).toMatchObject({ available: false, availableUnits: 0 });
  });

  it("permite la misma fecha cuando hay stock suficiente", () => {
    const result = checkRentalAvailability(new Map([["variant-1", 2]]), [requested()], [reservation()]);
    expect(result[0]).toMatchObject({ available: true, availableUnits: 1 });
  });

  it("solo descuenta reservas que se superponen y corresponden al mismo talle", () => {
    const result = checkRentalAvailability(new Map([["variant-1", 1]]), [requested({ pickupDate: "2026-11-13" })], [
      reservation({ returnDate: "2026-11-12" }),
      reservation({ variantId: "variant-2" }),
      reservation({ status: "CANCELLED" }),
      reservation({ status: "PENDING" }),
    ]);
    expect(result[0]).toMatchObject({ available: true, availableUnits: 1 });
  });

  it("mantiene bloqueado un disfraz devuelto hasta que el local confirme la revisión", () => {
    const result = checkRentalAvailability(new Map([["variant-1", 1]]), [requested({ pickupDate: "2026-11-15", returnDate: "2026-11-17" })], [
      reservation({ status: "RETURNED", returnDate: "2026-11-13", isAvailableAgain: false }),
    ]);
    expect(result[0]).toMatchObject({ available: false, availableUnits: 0 });
  });

  it("cuenta juntas las líneas solapadas del mismo pedido para limitar la cantidad", () => {
    const lines = [requested({ quantity: 1 }), requested({ quantity: 1, pickupDate: "2026-11-13" })];
    const result = checkRentalAvailability(new Map([["variant-1", 1]]), lines, []);
    expect(result.every((item) => !item.available)).toBe(true);
    expect(checkRentalAvailability(new Map([["variant-1", 2]]), lines, []).every((item) => item.available)).toBe(true);
  });
});
