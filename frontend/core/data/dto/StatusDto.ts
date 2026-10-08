/** Ligne d'une table de statuts (GET /statuses/...). */
export type StatusDto = {
  id: number;
  label: string;
  isActive: boolean;
};
