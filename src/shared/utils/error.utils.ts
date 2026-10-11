/**
 * Turns anything thrown into a readable message.
 * Needed because Tauri rejects with plain strings while JS code throws Error objects.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unexpected error";
}
