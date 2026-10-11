/** Time-of-day greeting for the welcome section. */
export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 19) return "Good afternoon";
  return "Good evening";
}
