import { Config } from '../constants/config';

/**
 * Format ISO date string to readable DD MMM YYYY
 * e.g. "2024-06-15" → "15 Jun 2024"
 */
export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format ISO date string to readable DD MMM YYYY HH:MM
 */
export function formatDateTime(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
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
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date string is in the future (strictly after today)
 */
export function isFuture(date: string): boolean {
  const d = new Date(date);
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
 * Used for QR expiry — expires at midnight of appointment date
 */
export function getMidnight(date: string): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * Get max bookable date — today + 1 month
 */
export function getMaxBookingDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + Config.MAX_BOOKING_DAYS_AHEAD / 30);
  return d.toISOString().split('T')[0];
}

/**
 * Get today as YYYY-MM-DD
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get day before a date as YYYY-MM-DD
 */
export function getDayBefore(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Mask Aadhaar — show only last 4 digits
 * "123456789012" → "XXXX XXXX 9012"
 */
export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length < 4) return aadhaar;
  const last4 = aadhaar.slice(-4);
  return `XXXX XXXX ${last4}`;
}

/**
 * Get first name from full name
 */
export function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}