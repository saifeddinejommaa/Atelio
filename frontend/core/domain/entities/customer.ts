export type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

/** Fiche d'un nouveau client, par exemple saisie par le garage (e-mail facultatif). */
export type NewCustomer = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
};
