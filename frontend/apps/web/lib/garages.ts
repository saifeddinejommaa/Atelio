// Données fictives en attendant l'API backend (chaque client aura ses garages dans sa base).
// Pour brancher l'API, seule getGarages() est à modifier : le reste du site passe par elle.
export type Garage = {
  id: string;
  city: string;
  address: string;
  postalCode: string;
  phone: string;
  hours: string;
  /** Prestations réalisées dans ce garage (toutes si vide). */
  services: string[];
};

export const garages: Garage[] = [
  { id: "paris-15", city: "Paris 15e", address: "42 rue de Vaugirard", postalCode: "75015", phone: "01 45 00 00 15", hours: "Lun-Sam 8h-19h", services: [] },
  { id: "boulogne", city: "Boulogne-Billancourt", address: "12 avenue Édouard Vaillant", postalCode: "92100", phone: "01 46 00 00 92", hours: "Lun-Sam 8h30-18h30", services: [] },
  { id: "lyon-7", city: "Lyon 7e", address: "88 avenue Jean Jaurès", postalCode: "69007", phone: "04 72 00 00 07", hours: "Lun-Ven 8h-18h, Sam 9h-12h", services: ["vidange", "freinage", "pneus", "batterie"] },
  { id: "villeurbanne", city: "Villeurbanne", address: "5 cours Émile Zola", postalCode: "69100", phone: "04 78 00 00 69", hours: "Lun-Sam 8h-18h", services: [] },
  { id: "lille", city: "Lille", address: "27 rue Nationale", postalCode: "59000", phone: "03 20 00 00 59", hours: "Lun-Sam 8h30-19h", services: [] },
  { id: "nantes", city: "Nantes", address: "3 boulevard des Anglais", postalCode: "44100", phone: "02 40 00 00 44", hours: "Lun-Ven 8h-18h30", services: ["vidange", "pneus", "climatisation"] },
];

/** Liste des garages d'un client. Plus tard : appel à l'API .NET du client. */
export async function getGarages(tenantSlug: string): Promise<Garage[]> {
  // ex. : const res = await fetch(`${process.env.API_URL}/garages`, { headers: { "X-Tenant": tenantSlug } });
  //       return res.json();
  void tenantSlug;
  return garages;
}

export type DaySlots = { date: string; slots: { time: string; available: boolean }[] };

/** Créneaux des 14 prochains jours ouvrés (hors dimanche), de 8h30 à 17h30. */
export function getSlots(garageId: string, from = new Date()): DaySlots[] {
  const days: DaySlots[] = [];
  const day = new Date(from);
  day.setHours(0, 0, 0, 0);
  let seed = [...garageId].reduce((acc, c) => acc + c.charCodeAt(0), 0);

  while (days.length < 14) {
    day.setDate(day.getDate() + 1);
    if (day.getDay() === 0) continue;

    const slots = [];
    const lastHour = day.getDay() === 6 ? 12 : 17;
    for (let h = 8; h <= lastHour; h++) {
      for (const m of [0, 30]) {
        if ((h === 8 && m === 0) || (h === lastHour && m === 30)) continue;
        seed = (seed * 9301 + 49297) % 233280;
        slots.push({
          time: `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`,
          available: seed / 233280 > 0.35,
        });
      }
    }
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    days.push({ date: iso, slots });
  }
  return days;
}
