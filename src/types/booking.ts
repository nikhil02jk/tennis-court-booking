export type CourtSurface = "hard" | "clay" | "grass";

export type Court = {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  surface: CourtSurface;
  courtCount: number;
  hasLights: boolean;
  rating: number;
  hourlyRate: number;
  openTime: string;
  closeTime: string;
  amenities: string[];
  imageTone: "green" | "blue" | "terracotta";
};

export type TimeSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
};

export type Booking = {
  id: string;
  courtId: string;
  courtName: string;
  userId?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  players: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

export type CourtReview = {
  id: string;
  courtId: string;
  courtName: string;
  userId?: string;
  rating: number;
  comment: string;
  createdAt: string;
};
