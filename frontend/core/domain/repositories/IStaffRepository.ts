import type { StaffMember } from "../entities/StaffMember";

export interface IStaffRepository {
  /** Employé connecté, ou null si le compte Microsoft n'est relié à aucun employé actif de la marque. */
  getMe(): Promise<StaffMember | null>;
}
