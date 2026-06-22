import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  DollarSign,
  Moon,
  MapPin,
  MessageSquare,
  Search,
  Star,
  Sun,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { authClient, isNeonConfigured } from "./lib/neon";
import { cancelBooking, listBookings, saveBooking } from "./services/bookingsService";
import { getAvailability, listCourts } from "./services/courtsService";
import { cancelRemoteBooking, listRemoteBookings, saveRemoteBooking } from "./services/neonBookingsService";
import { listRemoteReviews, saveRemoteReview } from "./services/neonReviewsService";
import { listLocalReviews, saveLocalReview } from "./services/reviewsService";
import type { Booking, Court, CourtReview, CourtSurface, TimeSlot } from "./types/booking";

const today = new Date().toISOString().slice(0, 10);
const allCourts = listCourts();
type Theme = "light" | "dark";

export function App() {
  const [selectedCourtId, setSelectedCourtId] = useState(allCourts[0].id);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [query, setQuery] = useState("");
  const [surface, setSurface] = useState<CourtSurface | "all">("all");
  const [bookings, setBookings] = useState<Booking[]>(() => listBookings());
  const [players, setPlayers] = useState(2);
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [bookingStatus, setBookingStatus] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [reviews, setReviews] = useState<CourtReview[]>([]);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewError, setReviewError] = useState("");
  const bookingMode = isNeonConfigured && isSignedIn ? "neon" : "local";
  const reviewMode = bookingMode;

  useEffect(() => {
    let active = true;

    async function syncBookings() {
      setBookingError("");
      if (!isNeonConfigured || !isSignedIn) {
        setBookings(listBookings());
        setBookingStatus(isNeonConfigured ? "Sign in to save bookings to Neon." : "Using local demo storage.");
        return;
      }

      setBookingStatus("Loading Neon bookings...");
      try {
        const remoteBookings = await listRemoteBookings();
        if (!active) return;
        setBookings(remoteBookings);
        setBookingStatus("Bookings are syncing with Neon.");
      } catch (error) {
        if (!active) return;
        setBookings(listBookings());
        setBookingStatus("Using local bookings until Neon is reachable.");
        setBookingError(getErrorMessage(error));
      }
    }

    void syncBookings();
    return () => {
      active = false;
    };
  }, [isSignedIn]);

  useEffect(() => {
    let active = true;

    async function syncReviews() {
      setReviewError("");
      if (!isNeonConfigured || !isSignedIn) {
        setReviews(listLocalReviews(selectedCourtId));
        setReviewStatus(isNeonConfigured ? "Sign in to add and view Neon reviews." : "Using local demo reviews.");
        return;
      }

      setReviewStatus("Loading court reviews...");
      try {
        const remoteReviews = await listRemoteReviews(selectedCourtId);
        if (!active) return;
        setReviews(remoteReviews);
        setReviewStatus("Reviews are syncing with Neon.");
      } catch (error) {
        if (!active) return;
        setReviews(listLocalReviews(selectedCourtId));
        setReviewStatus("Using local reviews until Neon reviews are ready.");
        setReviewError(getErrorMessage(error));
      }
    }

    void syncReviews();
    return () => {
      active = false;
    };
  }, [isSignedIn, selectedCourtId]);

  const filteredCourts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allCourts.filter((court) => {
      const matchesText =
        court.name.toLowerCase().includes(normalized) ||
        court.neighborhood.toLowerCase().includes(normalized) ||
        court.address.toLowerCase().includes(normalized);
      const matchesSurface = surface === "all" || court.surface === surface;
      return matchesText && matchesSurface;
    });
  }, [query, surface]);

  const selectedCourt = allCourts.find((court) => court.id === selectedCourtId) ?? allCourts[0];
  const availability = useMemo(
    () => getAvailability(selectedCourt.id, selectedDate),
    [selectedCourt.id, selectedDate],
  );
  const activeBookings = bookings.filter((booking) => booking.status === "confirmed");
  const localTakenSlots = activeBookings
    .filter((booking) => booking.courtId === selectedCourt.id && booking.date === selectedDate)
    .map((booking) => booking.startTime);

  const effectiveAvailability = availability.map((slot) => ({
    ...slot,
    available: slot.available && !localTakenSlots.includes(slot.startTime),
    reason: localTakenSlots.includes(slot.startTime) ? "Your booking" : slot.reason,
  }));

  function chooseCourt(court: Court) {
    setSelectedCourtId(court.id);
    setSelectedSlot(null);
  }

  async function confirmBooking() {
    if (!selectedSlot) return;

    const booking: Booking = {
      id: crypto.randomUUID(),
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      durationMinutes: 60,
      players,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    setBookingError("");
    setBookingStatus(bookingMode === "neon" ? "Saving booking to Neon..." : "Saving booking locally...");

    try {
      const nextBookings =
        bookingMode === "neon" ? await saveRemoteBooking(booking) : saveBooking(booking);
      setBookings(nextBookings);
      setSelectedSlot(null);
      setBookingStatus(bookingMode === "neon" ? "Booking saved to Neon." : "Booking saved locally.");
    } catch (error) {
      setBookingError(getErrorMessage(error));
      setBookingStatus("Booking was not saved.");
    }
  }

  async function handleCancel(bookingId: string) {
    setBookingError("");
    setBookingStatus(bookingMode === "neon" ? "Cancelling booking in Neon..." : "Cancelling booking locally...");

    try {
      const nextBookings =
        bookingMode === "neon" ? await cancelRemoteBooking(bookingId) : cancelBooking(bookingId);
      setBookings(nextBookings);
      setBookingStatus(bookingMode === "neon" ? "Booking cancelled in Neon." : "Booking cancelled locally.");
    } catch (error) {
      setBookingError(getErrorMessage(error));
      setBookingStatus("Booking was not cancelled.");
    }
  }

  async function handleReviewSubmit(rating: number, comment: string) {
    const review: CourtReview = {
      id: crypto.randomUUID(),
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    setReviewError("");
    setReviewStatus(reviewMode === "neon" ? "Saving review to Neon..." : "Saving review locally...");

    try {
      const nextReviews =
        reviewMode === "neon" ? await saveRemoteReview(review) : saveLocalReview(review);
      setReviews(nextReviews);
      setReviewStatus(reviewMode === "neon" ? "Review saved to Neon." : "Review saved locally.");
    } catch (error) {
      setReviewError(getErrorMessage(error));
      setReviewStatus("Review was not saved.");
    }
  }

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("courttime.theme.v1", next);
      return next;
    });
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <section className="booking-workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">CourtTime</p>
            <h1>Book a tennis court</h1>
          </div>
          <div className="topbar-actions">
            <button
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              aria-pressed={theme === "dark"}
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
              <span>{theme === "light" ? "Dark" : "Light"}</span>
            </button>
            <div className="date-control">
              <CalendarDays size={18} aria-hidden="true" />
              <input
                aria-label="Booking date"
                type="date"
                min={today}
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedSlot(null);
                }}
              />
            </div>
          </div>
        </header>

        <section className="court-finder" aria-label="Find courts">
          <div className="searchbox">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Search courts"
              placeholder="Search court, neighborhood, or address"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="surface-tabs" aria-label="Surface filter">
            {(["all", "hard", "clay", "grass"] as const).map((option) => (
              <button
                key={option}
                className={surface === option ? "active" : ""}
                type="button"
                onClick={() => setSurface(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <div className="main-grid">
          <section className="court-list" aria-label="Available courts">
            {filteredCourts.map((court) => (
              <button
                key={court.id}
                className={`court-card ${court.id === selectedCourt.id ? "selected" : ""}`}
                type="button"
                onClick={() => chooseCourt(court)}
              >
                <span className={`court-thumbnail ${court.imageTone}`} aria-hidden="true">
                  <span />
                </span>
                <span className="court-card-copy">
                  <strong>{court.name}</strong>
                  <span>
                    <MapPin size={14} aria-hidden="true" />
                    {court.neighborhood} · {court.courtCount} courts
                  </span>
                  <span>
                    <Star size={14} aria-hidden="true" />
                    {court.rating} · {court.surface} · {court.hasLights ? "lights" : "daylight"}
                  </span>
                </span>
                <span className="rate">${court.hourlyRate}/hr</span>
              </button>
            ))}
          </section>

          <section className="schedule-panel" aria-label="Court schedule">
            <CourtVisual court={selectedCourt} />

            <div className="court-detail">
              <div>
                <p className="eyebrow">{selectedCourt.neighborhood}</p>
                <h2>{selectedCourt.name}</h2>
                <p>{selectedCourt.address}</p>
              </div>
              <div className="detail-metrics" aria-label="Court details">
                <span>
                  <Clock size={16} aria-hidden="true" />
                  {formatTime(selectedCourt.openTime)}-{formatTime(selectedCourt.closeTime)}
                </span>
                <span>
                  <DollarSign size={16} aria-hidden="true" />
                  {selectedCourt.hourlyRate}/hr
                </span>
                <span>
                  {selectedCourt.hasLights ? <Zap size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
                  {selectedCourt.hasLights ? "Lighted" : "Daylight"}
                </span>
              </div>
            </div>

            <div className="slot-grid" aria-label="Available time slots">
              {effectiveAvailability.map((slot) => (
                <button
                  key={slot.startTime}
                  className={`slot ${selectedSlot?.startTime === slot.startTime ? "selected" : ""}`}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot)}
                  title={slot.available ? "Available" : slot.reason}
                >
                  <span>{formatTime(slot.startTime)}</span>
                  <small>{slot.available ? "Open" : slot.reason}</small>
                </button>
              ))}
            </div>

            <ReviewsPanel
              canSubmit={!isNeonConfigured || isSignedIn}
              mode={reviewMode}
              onSubmit={handleReviewSubmit}
              reviews={reviews}
              status={reviewStatus}
              error={reviewError}
            />
          </section>

          <aside className="booking-panel" aria-label="Booking summary">
            <AuthPanel onSessionChange={setIsSignedIn} />

            <div className="panel-section">
              <p className="eyebrow">Booking</p>
              <h2>Reserve a slot</h2>
              <p className={`sync-state ${bookingMode}`}>{bookingStatus}</p>
              {bookingError ? <p className="sync-error">{bookingError}</p> : null}
              <SummaryRow icon={<MapPin size={17} />} label="Court" value={selectedCourt.name} />
              <SummaryRow icon={<CalendarDays size={17} />} label="Date" value={formatDate(selectedDate)} />
              <SummaryRow
                icon={<Clock size={17} />}
                label="Time"
                value={selectedSlot ? `${formatTime(selectedSlot.startTime)}-${formatTime(selectedSlot.endTime)}` : "Choose a slot"}
              />
              <label className="players-control">
                <span>
                  <Users size={17} aria-hidden="true" />
                  Players
                </span>
                <input
                  min="1"
                  max="4"
                  type="number"
                  value={players}
                  onChange={(event) => setPlayers(Number(event.target.value))}
                />
              </label>
              <button className="primary-action" type="button" disabled={!selectedSlot} onClick={confirmBooking}>
                <Check size={18} aria-hidden="true" />
                Confirm booking
              </button>
            </div>

            <div className="panel-section">
              <p className="eyebrow">My bookings</p>
              <div className="booking-list">
                {activeBookings.length === 0 ? (
                  <p className="empty-state">No upcoming reservations yet.</p>
                ) : (
                  activeBookings.map((booking) => (
                    <article className="booking-item" key={booking.id}>
                      <div>
                        <strong>{booking.courtName}</strong>
                        <span>
                          {formatDate(booking.date)} · {formatTime(booking.startTime)}
                        </span>
                      </div>
                      <button
                        aria-label={`Cancel ${booking.courtName} booking`}
                        type="button"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </article>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ReviewsPanel({
  canSubmit,
  error,
  mode,
  onSubmit,
  reviews,
  status,
}: {
  canSubmit: boolean;
  error: string;
  mode: "local" | "neon";
  onSubmit: (rating: number, comment: string) => Promise<void>;
  reviews: CourtReview[];
  status: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : 0;

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed || !canSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, trimmed);
      setComment("");
      setRating(5);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="reviews-panel" aria-label="Court reviews">
      <div className="reviews-header">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2>Court feedback</h2>
        </div>
        <div className="review-score" aria-label="Average rating">
          <Star size={18} aria-hidden="true" />
          <strong>{reviews.length ? averageRating.toFixed(1) : "New"}</strong>
          <span>{reviews.length} reviews</span>
        </div>
      </div>

      <p className={`sync-state ${mode}`}>{status}</p>
      {error ? <p className="sync-error">{error}</p> : null}

      <form className="review-form" onSubmit={submitReview}>
        <div className="rating-picker" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              aria-label={`${value} star rating`}
              aria-pressed={rating === value}
              className={rating >= value ? "active" : ""}
              type="button"
              onClick={() => setRating(value)}
              disabled={!canSubmit}
            >
              <Star size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
        <textarea
          aria-label="Review comment"
          disabled={!canSubmit}
          maxLength={500}
          placeholder={canSubmit ? "Share court conditions, lights, wait time, or tips" : "Sign in to add a review"}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          required
        />
        <button
          className="secondary-action"
          type="submit"
          disabled={!canSubmit || isSubmitting || comment.trim().length < 3}
        >
          <MessageSquare size={17} aria-hidden="true" />
          Add review
        </button>
      </form>

      <div className="review-list">
        {reviews.length === 0 ? (
          <p className="empty-state">No reviews for this court yet.</p>
        ) : (
          reviews.map((review) => (
            <article className="review-item" key={review.id}>
              <div className="review-item-header">
                <span className="stars" aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
                <span>{formatReviewDate(review.createdAt)}</span>
              </div>
              <p>{review.comment}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function AuthPanel({ onSessionChange }: { onSessionChange: (signedIn: boolean) => void }) {
  if (!isNeonConfigured || !authClient) {
    return (
      <div className="panel-section auth-panel">
        <p className="eyebrow">Account</p>
        <h2>Neon not configured</h2>
        <p>Add your Neon Auth URL and Data API URL to `.env` to enable sign-in and database bookings.</p>
      </div>
    );
  }

  return <ConfiguredAuthPanel onSessionChange={onSessionChange} />;
}

function ConfiguredAuthPanel({ onSessionChange }: { onSessionChange: (signedIn: boolean) => void }) {
  const session = authClient!.useSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = session.data?.user;

  useEffect(() => {
    onSessionChange(Boolean(user));
  }, [onSessionChange, user]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    try {
      if (mode === "sign-up") {
        await authClient!.signUp.email({ email, password, name: name || email });
      } else {
        await authClient!.signIn.email({ email, password });
      }
      await session.refetch();
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    setAuthError("");
    setIsSubmitting(true);

    try {
      await authClient!.signOut();
      await session.refetch();
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel-section auth-panel">
      <p className="eyebrow">Account</p>
      <h2>{user ? "Signed in" : mode === "sign-in" ? "Sign in" : "Create account"}</h2>
      {session.isPending ? <p>Checking session...</p> : null}
      {user ? (
        <>
          <p className="account-email">{user.email ?? user.name ?? "Neon user"}</p>
          <button className="secondary-action" type="button" disabled={isSubmitting} onClick={signOut}>
            Sign out
          </button>
        </>
      ) : (
        <form className="auth-form" onSubmit={submitAuth}>
          {mode === "sign-up" ? (
            <input
              aria-label="Name"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          ) : null}
          <input
            aria-label="Email"
            autoComplete="email"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            aria-label="Password"
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
          <button
            className="link-action"
            type="button"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          >
            {mode === "sign-in" ? "Need an account?" : "Already have an account?"}
          </button>
        </form>
      )}
      {authError ? <p className="sync-error">{authError}</p> : null}
    </div>
  );
}

function CourtVisual({ court }: { court: Court }) {
  return (
    <div className={`court-visual ${court.imageTone}`} aria-hidden="true">
      <div className="court-lines">
        <span className="net" />
        <span className="service-line top" />
        <span className="service-line bottom" />
        <span className="center-line" />
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="summary-row">
      <span className="summary-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: minute ? "2-digit" : undefined,
  }).format(new Date(2026, 0, 1, hour, minute));
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getStoredTheme(): Theme {
  const stored = window.localStorage.getItem("courttime.theme.v1");
  return stored === "dark" ? "dark" : "light";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
