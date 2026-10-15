/** Rôle d'application Microsoft Entra : Admin (responsable de la marque) ou Staff. Mêmes droits pour l'instant. */
export type StaffRole = "admin" | "staff";

/** Personne connectée au back-office (compte Microsoft relié à sa fiche employé). */
export type StaffMember = {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  role: StaffRole;
  garageId: number;
};
