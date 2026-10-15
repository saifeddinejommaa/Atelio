/** Immatriculation française : AB-123-CD (tirets facultatifs). */
export const PLATE_PATTERN = /^[A-Z]{2}-?\d{3}-?[A-Z]{2}$/i;

export function isValidPlate(plate: string): boolean {
  return PLATE_PATTERN.test(plate.trim());
}

/** "ab123cd" => "AB-123-CD". */
export function formatPlate(plate: string): string {
  const raw = plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return raw.length === 7 ? `${raw.slice(0, 2)}-${raw.slice(2, 5)}-${raw.slice(5)}` : plate.toUpperCase();
}
