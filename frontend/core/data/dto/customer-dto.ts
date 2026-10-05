/** Client tel que renvoyé par GET /api/customers/... */
export type CustomerDto = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};
