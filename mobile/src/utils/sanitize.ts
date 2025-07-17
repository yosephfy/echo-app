// mobile/src/utils/sanitize.ts

/**
 * Trim whitespace, convert to lowercase, and remove invalid characters for email.
 * Does not validate domain or syntax fully; use in combination with a proper validator on the backend.
 */
export function sanitizeEmail(input: string): string {
  return input
    .trim() // remove leading/trailing whitespace
    .toLowerCase() // normalize to lowercase
    .replace(/[^a-z0-9@._-]/g, ""); // allow only common email chars
}

/**
 * Remove HTML tags, trim, and collapse multiple spaces into one.
 * Safe for sending plain text to backend.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/\s+/g, " ") // collapse whitespace
    .trim(); // remove leading/trailing whitespace
}

/**
 * Normalize a username/handle: trim, lowercase, strip non-alphanumerics (optional underscores), and enforce max length.
 */
export function sanitizeHandle(input: string, maxLength = 30): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  return cleaned.slice(0, maxLength);
}

/**
 * Strip HTML and control characters, returning safe plain text for logs or previews.
 */
export function sanitizeLog(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // remove any HTML
    .replace(/[\x00-\x1F\x7F]/g, "") // remove control chars
    .trim();
}

/**
 * Escape special characters for safe inclusion in URLs or query parameters.
 */
export function sanitizeForUrl(input: string): string {
  return encodeURIComponent(input.trim());
}
