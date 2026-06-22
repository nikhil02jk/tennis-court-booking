import { createClient } from "@neondatabase/neon-js";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

export type BookingRow = {
  id: string;
  user_id: string;
  court_id: string;
  court_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  players: number;
  status: "confirmed" | "cancelled";
  created_at: string;
};

export type CourtReviewRow = {
  id: string;
  user_id: string;
  court_id: string;
  court_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type Database = {
  public: {
    Tables: {
      bookings: {
        Row: BookingRow;
        Insert: Omit<BookingRow, "user_id" | "created_at"> & {
          user_id?: string;
          created_at?: string;
        };
        Update: Partial<BookingRow>;
      };
      court_reviews: {
        Row: CourtReviewRow;
        Insert: Omit<CourtReviewRow, "user_id" | "created_at"> & {
          user_id?: string;
          created_at?: string;
        };
        Update: Partial<CourtReviewRow>;
      };
    };
  };
};

export const neonConfig = {
  authUrl: import.meta.env.VITE_NEON_AUTH_URL,
  dataApiUrl: import.meta.env.VITE_NEON_DATA_API_URL,
};

export const isNeonConfigured = Boolean(neonConfig.authUrl && neonConfig.dataApiUrl);

export const neonClient = isNeonConfigured
  ? createClient<Database>({
      auth: {
        url: neonConfig.authUrl,
        adapter: BetterAuthReactAdapter(),
      },
      dataApi: {
        url: neonConfig.dataApiUrl,
      },
    })
  : null;

export const authClient = neonClient?.auth ?? null;
