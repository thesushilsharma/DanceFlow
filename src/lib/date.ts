/**
 * Date utilities for consistent date handling across the application.
 * 
 * All dates are stored in UTC in the database and converted to local time for display.
 * This module provides formatting, parsing, and conversion utilities.
 * 
 * @example
 * ```ts
 * // Format a date for display
 * formatDate(new Date(), 'SHORT') // "Jan 15, 2026"
 * 
 * // Parse ISO string from database
 * const date = parseDate("2026-01-15T10:30:00Z")
 * 
 * // Convert to UTC for storage
 * const utcDate = toUTC(new Date())
 * ```
 */

import { format, parseISO } from "date-fns";

// ============================================================================
// DATE FORMAT CONSTANTS
// ============================================================================

/**
 * Predefined date format patterns for consistent formatting throughout the app.
 * Uses date-fns format tokens.
 * 
 * @see https://date-fns.org/docs/format
 */
export const DATE_FORMATS = {
  /** ISO 8601 UTC format for API/database storage - "2026-04-10T08:30:00Z" */
  ISO: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  /** Compact date for lists and cards - "Apr 10, 2026" */
  SHORT: "MMM d, yyyy",
  /** Full date for headers and detail views - "April 10, 2026" */
  LONG: "MMMM d, yyyy",
  /** Date with 12-hour time for events - "Apr 10, 2026 at 10:30 AM" */
  WITH_TIME: "MMM d, yyyy 'at' hh:mm a",
  /** 12-hour time only for schedules - "08:30 AM" */
  TIME_ONLY: "hh:mm a",
  /** Sortable date for tables - "2026-04-10" */
  TABLE: "yyyy-MM-dd",
  /** Full datetime for CSV/SQL/Excel exports - "2026-04-10 08:30:00" */
  EXPORT: "yyyy-MM-dd HH:mm:ss",
} as const;


export type DateFormatKey = keyof typeof DATE_FORMATS;

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format a date using a predefined format pattern.
 * 
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @param formatKey - Key from DATE_FORMATS constant
 * @returns Formatted date string
 * 
 * @example
 * ```ts
 * formatDate(new Date(), 'SHORT') // "Jan 15, 2026"
 * formatDate("2026-01-15T10:30:00Z", 'WITH_TIME') // "Jan 15, 2026 at 10:30 AM"
 * ```
 */
export function formatDate(
  date: Date | string | number,
  formatKey: DateFormatKey = "SHORT"
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(dateObj, DATE_FORMATS[formatKey]);
}

/**
 * Format a date with a custom pattern.
 * Use this when predefined formats don't meet your needs.
 * 
 * @param date - Date to format
 * @param pattern - Custom date-fns format pattern
 * @returns Formatted date string
 * 
 * @example
 * ```ts
 * formatDateCustom(new Date(), "EEEE, MMMM do") // "Wednesday, January 15th"
 * ```
 */
export function formatDateCustom(
  date: Date | string | number,
  pattern: string
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(dateObj, pattern);
}

// ============================================================================
// PARSING UTILITIES
// ============================================================================

/**
 * Parse an ISO 8601 date string into a Date object.
 * Handles UTC strings from the database.
 * 
 * @param isoString - ISO 8601 formatted date string
 * @returns Date object in local timezone
 * 
 * @example
 * ```ts
 * const date = parseDate("2026-01-15T10:30:00Z")
 * ```
 */
export function parseDate(isoString: string): Date {
  return parseISO(isoString);
}

/**
 * Safely parse a date that might be null or undefined.
 * Returns null if the input is invalid.
 * 
 * @param value - Date value that might be null/undefined
 * @returns Date object or null
 * 
 * @example
 * ```ts
 * const date = parseDateSafe(student.birthDate) // Date | null
 * ```
 */
export function parseDateSafe(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
}

// ============================================================================
// UTC CONVERSION UTILITIES
// ============================================================================

/**
 * Convert a local Date to UTC for database storage.
 * Preserves the date/time values but interprets them as UTC.
 * 
 * @param date - Local date to convert
 * @returns Date object representing the same moment in UTC
 * 
 * @example
 * ```ts
 * const localDate = new Date(2026, 0, 15, 10, 30) // Jan 15, 2026 10:30 local
 * const utcDate = toUTC(localDate) // Same values but in UTC
 * ```
 */
export function toUTC(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    )
  );
}

/**
 * Convert a UTC Date to local timezone for display.
 * 
 * @param utcDate - UTC date from database
 * @returns Date object in local timezone
 * 
 * @example
 * ```ts
 * const utcDate = parseDate("2026-01-15T10:30:00Z")
 * const localDate = toLocal(utcDate)
 * ```
 */
export function toLocal(utcDate: Date): Date {
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getUTCHours(),
    utcDate.getUTCMinutes(),
    utcDate.getUTCSeconds(),
    utcDate.getUTCMilliseconds()
  );
}

/**
 * Get current date/time in UTC for database operations.
 * 
 * @returns Current Date in UTC
 * 
 * @example
 * ```ts
 * const now = nowUTC() // Current time in UTC
 * ```
 */
export function nowUTC(): Date {
  return new Date();
}

// ============================================================================
// COMPARISON UTILITIES
// ============================================================================

/**
 * Check if a date is in the past.
 * 
 * @param date - Date to check
 * @returns True if the date is before now
 * 
 * @example
 * ```ts
 * if (isPast(event.date)) {
 *   console.log("Event has already occurred")
 * }
 * ```
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return dateObj < new Date();
}

/**
 * Check if a date is in the future.
 * 
 * @param date - Date to check
 * @returns True if the date is after now
 * 
 * @example
 * ```ts
 * if (isFuture(event.date)) {
 *   console.log("Event is upcoming")
 * }
 * ```
 */
export function isFuture(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return dateObj > new Date();
}

/**
 * Check if a date is today.
 * 
 * @param date - Date to check
 * @returns True if the date is today
 * 
 * @example
 * ```ts
 * if (isToday(class.date)) {
 *   console.log("Class is today!")
 * }
 * ```
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}
