import type { CourtReview } from "../types/booking";

const storageKey = "courttime.reviews.v1";

export function listLocalReviews(courtId: string): CourtReview[] {
  return listAllReviews()
    .filter((review) => review.courtId === courtId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveLocalReview(review: CourtReview): CourtReview[] {
  const next = [review, ...listAllReviews()];
  persist(next);
  return listLocalReviews(review.courtId);
}

function listAllReviews(): CourtReview[] {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CourtReview[];
  } catch {
    return [];
  }
}

function persist(reviews: CourtReview[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(reviews));
}
