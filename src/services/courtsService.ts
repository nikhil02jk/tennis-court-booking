import { courts } from "../data/courts";
import type { Court, TimeSlot } from "../types/booking";

const busySeed: Record<string, string[]> = {
  "riverside-park": ["08:00", "12:00", "17:00", "18:00"],
  "elmwood-clay": ["10:00", "14:00", "15:00"],
  "civic-center": ["07:00", "11:00", "16:00", "19:00"],
  "boulder-creek": ["09:00", "12:00", "18:00"],
  "meadow-club": ["09:00", "13:00", "16:00"],
};

export function listCourts(): Court[] {
  return courts;
}

export function getCourt(courtId: string): Court | undefined {
  return courts.find((court) => court.id === courtId);
}

export function getAvailability(courtId: string, date: string): TimeSlot[] {
  const court = getCourt(courtId);
  if (!court) return [];

  const openHour = Number(court.openTime.split(":")[0]);
  const closeHour = Number(court.closeTime.split(":")[0]);
  const dateOffset = getDateOffset(date);
  const seededBusy = busySeed[courtId] ?? [];

  return Array.from({ length: closeHour - openHour }, (_, index) => {
    const hour = openHour + index;
    const startTime = `${hour.toString().padStart(2, "0")}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;
    const patternBusy = (hour + dateOffset + courtId.length) % 7 === 0;
    const seeded = seededBusy.includes(startTime);
    const available = !seeded && !patternBusy;

    return {
      startTime,
      endTime,
      available,
      reason: available ? undefined : seeded ? "Booked" : "League hold",
    };
  });
}

function getDateOffset(date: string): number {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getDay() + parsed.getDate();
}
