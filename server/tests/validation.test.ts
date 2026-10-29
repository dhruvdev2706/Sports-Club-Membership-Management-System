import { describe, it, expect } from 'vitest';
import { isBookingInPast, isValidDuration } from '../utils/validation';

describe('Booking Business Rules Validation', () => {
  it('should reject bookings in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday
    expect(isBookingInPast(pastDate.toISOString())).toBe(true);
  });

  it('should allow bookings in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
    expect(isBookingInPast(futureDate.toISOString())).toBe(false);
  });

  it('should reject booking durations less than 30 minutes', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const end = new Date('2026-01-01T10:15:00Z'); // 15 mins
    expect(isValidDuration(start.toISOString(), end.toISOString())).toBe(false);
  });

  it('should allow booking durations of 60 minutes', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const end = new Date('2026-01-01T11:00:00Z'); // 60 mins
    expect(isValidDuration(start.toISOString(), end.toISOString())).toBe(true);
  });

  it('should reject booking durations over 4 hours', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const end = new Date('2026-01-01T15:00:00Z'); // 5 hours
    expect(isValidDuration(start.toISOString(), end.toISOString())).toBe(false);
  });
});
