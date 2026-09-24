import { Capacitor } from "@capacitor/core";

const PENDING_REVIEW_KEY = "neomart_pending_app_review";
const HANDLED_REVIEWS_KEY = "neomart_handled_app_reviews";

type ReviewPayload = Record<string, string | undefined>;
const subscribers = new Set<() => void>();
let pendingReview: ReviewPayload | null = readPendingReview();

function notify() {
  subscribers.forEach((subscriber) => subscriber());
}

function readPendingReview(): ReviewPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(PENDING_REVIEW_KEY);
    return value ? (JSON.parse(value) as ReviewPayload) : null;
  } catch {
    return null;
  }
}

function reviewIdentity(data: ReviewPayload) {
  return (
    data.notification_id?.trim() ||
    data.order_id?.trim() ||
    data.order_code?.trim() ||
    "app-review-request"
  );
}

function readHandledReviews() {
  if (typeof window === "undefined") return [];
  try {
    const value = localStorage.getItem(HANDLED_REVIEWS_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function markReviewHandled(data: ReviewPayload) {
  if (typeof window === "undefined") return;
  const identities = [...new Set([...readHandledReviews(), reviewIdentity(data)])];
  localStorage.setItem(HANDLED_REVIEWS_KEY, JSON.stringify(identities));
}

function hasHandledReview(data: ReviewPayload) {
  return readHandledReviews().includes(reviewIdentity(data));
}

export function isAppReviewRequest(data: ReviewPayload) {
  return (
    data.notification_type?.trim() === "APP_REVIEW_REQUEST" &&
    data.action?.trim() === "OPEN_APP_REVIEW"
  );
}

export function queueAppReviewRequest(data: ReviewPayload) {
  if (!isAppReviewRequest(data) || hasHandledReview(data)) return;
  if (pendingReview && reviewIdentity(pendingReview) === reviewIdentity(data)) return;
  pendingReview = data;
  if (typeof window !== "undefined") {
    localStorage.setItem(PENDING_REVIEW_KEY, JSON.stringify(data));
  }
  notify();
}

export function dismissAppReviewRequest() {
  if (pendingReview) markReviewHandled(pendingReview);
  pendingReview = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(PENDING_REVIEW_KEY);
  }
  notify();
}

export function markAppReviewStarted() {
  if (pendingReview) markReviewHandled(pendingReview);
  pendingReview = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(PENDING_REVIEW_KEY);
  }
  notify();
}

export async function openGooglePlayAppPage() {
  if (Capacitor.getPlatform() !== "android") return false;
  const { AppUpdate } = await import("@capawesome/capacitor-app-update");
  await AppUpdate.openAppStore();
  return true;
}

export function subscribeAppReview(listener: () => void) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function getPendingAppReview() {
  return pendingReview;
}
