/**
 * Securely hashes a security PIN using browser-native SHA-256 when in secure contexts (HTTPS/localhost),
 * and falls back to a deterministic string hash in non-secure contexts (e.g. mobile HTTP local IP addresses)
 * to prevent browser crashes.
 */
export async function hashPin(pin: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(pin);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      // Fall back if native execution fails
    }
  }

  // Plain JS fallback hash for non-secure HTTP local IP views
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to a 32-bit integer
  }
  return "demo-hash-" + Math.abs(hash).toString(16);
}

/**
 * Formats a phone number for display (e.g. +91 98765 43210)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Obscures a phone number for demo verification views
 */
export function obscurePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 XXXXX ${cleaned.slice(5)}`;
  }
  return phone;
}
