/**
 * Escape special characters in a string before use in SQL LIKE/ILIKE patterns.
 * Prevents user input containing %, _, or \ from acting as wildcards.
 */
export function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}
