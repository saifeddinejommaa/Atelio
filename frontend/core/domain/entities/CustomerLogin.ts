import type { AppointmentRequest } from "./appointment";

/**
 * Résultat d'un code de connexion vérifié : session ouverte (client connu),
 * ou inscription à terminer (e-mail inconnu : prénom, nom, téléphone à saisir).
 */
export type CustomerLogin =
  | { kind: "session"; token: string; /** ISO 8601 en UTC. */ expiresAt: string }
  | { kind: "signup"; signupToken: string };

/** Compte à créer après la vérification de l'e-mail. */
export type NewAccount = {
  firstName: string;
  lastName: string;
  phone: string;
};

/** Rendez-vous du client connecté : le client vient de la session, pas de la requête. */
export type MyAppointmentRequest = Omit<AppointmentRequest, "customerId">;
