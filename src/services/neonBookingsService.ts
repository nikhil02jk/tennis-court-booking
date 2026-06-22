import { neonClient, type BookingRow } from "../lib/neon";
import type { Booking } from "../types/booking";

export async function listRemoteBookings(): Promise<Booking[]> {
  ensureNeonClient();
  const { data, error } = await neonClient!
    .from("bookings")
    .select("*")
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToBooking);
}

export async function saveRemoteBooking(booking: Booking): Promise<Booking[]> {
  ensureNeonClient();
  const { error } = await neonClient!.from("bookings").insert(bookingToRow(booking));
  if (error) throw new Error(error.message);
  return listRemoteBookings();
}

export async function cancelRemoteBooking(bookingId: string): Promise<Booking[]> {
  ensureNeonClient();
  const { error } = await neonClient!
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
  return listRemoteBookings();
}

function ensureNeonClient() {
  if (!neonClient) {
    throw new Error("Neon is not configured. Add VITE_NEON_AUTH_URL and VITE_NEON_DATA_API_URL.");
  }
}

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    courtId: row.court_id,
    courtName: row.court_name,
    userId: row.user_id,
    date: row.booking_date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    durationMinutes: row.duration_minutes,
    players: row.players,
    status: row.status,
    createdAt: row.created_at,
  };
}

function bookingToRow(booking: Booking) {
  return {
    id: booking.id,
    court_id: booking.courtId,
    court_name: booking.courtName,
    booking_date: booking.date,
    start_time: booking.startTime,
    end_time: booking.endTime,
    duration_minutes: booking.durationMinutes,
    players: booking.players,
    status: booking.status,
  };
}
