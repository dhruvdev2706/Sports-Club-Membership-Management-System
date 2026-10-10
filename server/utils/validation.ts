export function isBookingInPast(startTime: string): boolean {
  const start = new Date(startTime);
  const now = new Date();
  return start.getTime() < now.getTime();
}

export function isValidDuration(startTime: string, endTime: string): boolean {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMinutes = (end - start) / 60000;
  // Valid durations are between 30 mins and 4 hours
  return durationMinutes >= 30 && durationMinutes <= 240;
}
