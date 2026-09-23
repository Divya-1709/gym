/**
 * Formats a phone number for WhatsApp direct chat
 * Ensures standard country code (91 for India if 10 digits) and removes non-numeric chars
 */
export const formatWhatsAppPhone = (phone?: string): string => {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  // Remove leading zeros
  while (digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  // If starts with 910 and has 13 digits, remove the 0 after 91
  if (digits.startsWith("910") && digits.length === 13) {
    digits = "91" + digits.substring(3);
  }
  // If 10 digits (standard Indian mobile number), prepend 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
};

/**
 * Returns direct WhatsApp chat URL that bypasses the search/landing page and opens client's chat directly
 */
export const getDirectWhatsAppUrl = (phone?: string, message?: string): string => {
  const formattedPhone = formatWhatsAppPhone(phone);
  if (!formattedPhone) return "";
  const encodedText = message ? encodeURIComponent(message) : "";

  // If user is on a mobile device (Android, iPhone), use api.whatsapp.com to launch WhatsApp app directly
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  }

  // On desktop browsers (Chrome, Edge, Windows), use web.whatsapp.com/send/?phone= directly
  // This bypasses the intermediate wa.me landing page and directly loads the client's chat in WhatsApp Web!
  return `https://web.whatsapp.com/send/?phone=${formattedPhone}&text=${encodedText}`;
};

/**
 * Native desktop protocol link (opens installed WhatsApp Desktop Windows/Mac app directly)
 */
export const getWhatsAppDesktopAppUrl = (phone?: string, message?: string): string => {
  const formattedPhone = formatWhatsAppPhone(phone);
  if (!formattedPhone) return "";
  const encodedText = message ? encodeURIComponent(message) : "";
  return `whatsapp://send?phone=${formattedPhone}&text=${encodedText}`;
};

/**
 * Opens WhatsApp directly in client's chat
 */
export const openDirectWhatsApp = (phone?: string, message?: string): Window | null => {
  const url = getDirectWhatsAppUrl(phone, message);
  if (!url) return null;
  return window.open(url, "_blank");
};

