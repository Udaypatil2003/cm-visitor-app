import { Config } from '../constants/config';

/**
 * Safe local parser.
 * "2026-05-29"          → local midnight (not UTC midnight)
 * "2026-05-29T10:30:00" → parsed normally (already has time component)
 */
function parseLocal(date: string): Date {
  // Date-only strings (YYYY-MM-DD) must get a local-time suffix
  // to prevent the JS engine treating them as UTC.
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T00:00:00`);
  }
  return new Date(date);
}

/**
 * Format ISO date string to readable DD MMM YYYY
 * e.g. "2024-06-15" → "15 Jun 2024"
 */
export function formatDate(date: string): string {
  return parseLocal(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Long format — "29 May 2026"
 * Used by UpcomingPassTicket
 */
export function formatLongDate(date: string): string {
  return parseLocal(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format ISO date string to readable DD MMM YYYY HH:MM
 */
export function formatDateTime(date: string): string {
  return parseLocal(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if a date string is today
 */
export function isToday(date: string): boolean {
  const d = parseLocal(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date string is strictly after today
 */
export function isFuture(date: string): boolean {
  const d = parseLocal(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d > today;
}

/**
 * Check if a date string is today or in the future
 */
export function isTodayOrFuture(date: string): boolean {
  return isToday(date) || isFuture(date);
}

/**
 * Get midnight (end of day) ISO string for a given date
 * Used for QR expiry
 */
export function getMidnight(date: string): string {
  const d = parseLocal(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * Get max bookable date — today + 1 month, as YYYY-MM-DD
 */
export function getMaxBookingDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.round(Config.MAX_BOOKING_DAYS_AHEAD / 30));
  return d.toISOString().split('T')[0];
}

/**
 * Get today as YYYY-MM-DD
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the day before a date as YYYY-MM-DD
 */
export function getDayBefore(date: string): string {
  const d = parseLocal(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Mask Aadhaar — show only last 4 digits
 * "123456789012" → "XXXX XXXX 9012"
 */
export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length < 4) return aadhaar;
  return `XXXX XXXX ${aadhaar.slice(-4)}`;
}

/**
 * Get first name from full name
 */
export function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}