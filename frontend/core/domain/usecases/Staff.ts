import type { StaffMember } from "../entities/StaffMember";
import type { IStaffRepository } from "../repositories/IStaffRepository";

/** Employé connecté au back-office, ou null s'il n'a pas accès à cette marque. */
export class GetCurrentStaff {
  constructor(private readonly repository: IStaffRepository) {}

  execute(): Promise<StaffMember | null> {
    return this.repository.getMe();
  }
}
