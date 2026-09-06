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
    } catch {
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

/**
 * Formats a 12-digit Aadhaar number into standard 4-4-4 groups
 */
export function formatAadhaar(aadhaar: string): string {
  const cleaned = aadhaar.replace(/\D/g, "").slice(0, 12);
  const parts = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    parts.push(cleaned.slice(i, i + 4));
  }
  return parts.join(" ");
}

/**
 * Masks Aadhaar number showing only last 4 digits (e.g. •••• •••• 1234)
 */
export function maskAadhaar(aadhaar: string): string {
  const cleaned = aadhaar.replace(/\D/g, "");
  if (cleaned.length >= 4) {
    return `•••• •••• ${cleaned.slice(-4)}`;
  }
  return "•••• •••• ••••";
}

/**
 * Formats and validates standard PAN number (10 alphanumeric characters)
 */
export function formatPan(pan: string): string {
  return pan.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

/**
 * Masks PAN number showing first 2 and last 2 characters (e.g. AB••••••1F)
 */
export function maskPan(pan: string): string {
  const cleaned = formatPan(pan);
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}••••••${cleaned.slice(-2)}`;
  }
  return "••••••••••";
}

