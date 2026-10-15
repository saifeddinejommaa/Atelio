import type { IStaffRepository, StaffMember, StaffRole } from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";

/** Réponse de GET /api/staff/me. */
type StaffMemberDto = Omit<StaffMember, "role"> & { role: string };

export class StaffApiRepository implements IStaffRepository {
  constructor(private readonly api: ApiClient) {}

  async getMe(): Promise<StaffMember | null> {
    try {
      const staff = await this.api.get<StaffMemberDto>("/staff/me");
      return staff && { ...staff, role: staff.role.toLowerCase() as StaffRole };
    } catch (error) {
      // Compte Microsoft valide mais sans rôle Atelio ou sans fiche employé active dans la marque.
      if (error instanceof ApiError && (error.status === 403 || error.status === 401)) return null;
      throw error;
    }
  }
}
