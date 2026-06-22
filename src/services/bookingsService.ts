import type { Booking } from "../types/booking";

const storageKey = "courttime.bookings.v1";

export function listBookings(): Booking[] {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Booking[];
    return parsed.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  } catch {
    return [];
  }
}

export function saveBooking(booking: Booking): Booking[] {
  const bookings = listBookings();
  const next = [booking, ...bookings];
  persist(next);
  return next;
}

export function cancelBooking(bookingId: string): Booking[] {
  const next = listBookings().map((booking) =>
    booking.id === bookingId ? { ...booking, status: "cancelled" as const } : booking,
  );
  persist(next);
  return next;
}

function persist(bookings: Booking[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(bookings));
}
