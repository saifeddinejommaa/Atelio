/** Numéro de téléphone exploitable : au moins 9 chiffres, séparateurs et indicatif libres. */
export function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 9;
}
