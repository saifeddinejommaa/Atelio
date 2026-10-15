import type { Brand } from "../../domain";
import { gmg78 } from "./gmg78";
import { sej } from "./sej";

// Marques actives. Pour une nouvelle marque : créer son fichier ici, l'ajouter à la liste,
// déposer son logo dans public/tenants/<slug>/ de chaque app, puis la déclarer dans b2c et b2b.
export const brands: Brand[] = [gmg78, sej];

export function getBrand(slug: string): Brand | undefined {
  return brands.find((b) => b.slug === slug);
}

export { gmg78, sej };
