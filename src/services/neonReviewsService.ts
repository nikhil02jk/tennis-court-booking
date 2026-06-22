import { neonClient, type CourtReviewRow } from "../lib/neon";
import type { CourtReview } from "../types/booking";

export async function listRemoteReviews(courtId: string): Promise<CourtReview[]> {
  ensureNeonClient();
  const { data, error } = await neonClient!
    .from("court_reviews")
    .select("*")
    .eq("court_id", courtId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToReview);
}

export async function saveRemoteReview(review: CourtReview): Promise<CourtReview[]> {
  ensureNeonClient();
  const { error } = await neonClient!.from("court_reviews").insert(reviewToRow(review));
  if (error) throw new Error(error.message);
  return listRemoteReviews(review.courtId);
}

function ensureNeonClient() {
  if (!neonClient) {
    throw new Error("Neon is not configured. Add VITE_NEON_AUTH_URL and VITE_NEON_DATA_API_URL.");
  }
}

function rowToReview(row: CourtReviewRow): CourtReview {
  return {
    id: row.id,
    courtId: row.court_id,
    courtName: row.court_name,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function reviewToRow(review: CourtReview) {
  return {
    id: review.id,
    court_id: review.courtId,
    court_name: review.courtName,
    rating: review.rating,
    comment: review.comment,
  };
}
