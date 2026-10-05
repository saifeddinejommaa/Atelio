import type { Garage as GarageEntity } from "@atelio/core/domain";

/** Garage tel qu'affiché sur le site. */
export type Garage = {
  id: number;
  /** Nom du garage, ex. "Paris 15e" (affiché après le nom de la marque). */
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  /** Horaires lisibles, ex. "Lun-Sam 8h30-18h30". */
  hours: string;
  /** Codes des prestations réalisées dans ce garage. */
  serviceCodes: string[];
};

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** "08:30" => "8h30", "18:00" => "18h". */
function formatTime(time: string): string {
  const [h, m] = time.split(":");
  return `${Number(h)}h${m === "00" ? "" : m}`;
}

/** Jours 1 à 6, 08:30-18:30 => "Lun-Sam 8h30-18h30". */
export function formatHours(openDays: number[], openingTime: string, closingTime: string): string {
  const days = [...new Set(openDays)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (days.length === 0) return "Fermé";

  const contiguous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  const dayText =
    contiguous && days.length > 2
      ? `${dayLabels[days[0] - 1]}-${dayLabels[days[days.length - 1] - 1]}`
      : days.map((d) => dayLabels[d - 1]).join(", ");
  return `${dayText} ${formatTime(openingTime)}-${formatTime(closingTime)}`;
}

export function toGarage(entity: GarageEntity): Garage {
  return {
    id: entity.id,
    name: entity.name,
    address: entity.addressLine,
    postalCode: entity.postalCode,
    city: entity.city,
    phone: entity.phone ?? "",
    hours: formatHours(entity.openDays, entity.openingTime, entity.closingTime),
    serviceCodes: entity.serviceCodes,
  };
}
