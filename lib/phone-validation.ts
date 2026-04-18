/** Client-safe phone checks (same rules as `validatePhoneNumber` in cleaner-auth). */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
}
