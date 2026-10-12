import type { CustomerLogin, NewAccount } from "../entities/CustomerLogin";

/** Connexion des clients (site b2c) par code envoyé par e-mail. */
export interface ICustomerAuthRepository {
  /** Envoie un code à l'e-mail (même réponse que le compte existe ou non). */
  requestCode(email: string): Promise<void>;
  /** Vérifie le code reçu. */
  verifyCode(email: string, code: string): Promise<CustomerLogin>;
  /** Crée le compte de l'e-mail vérifié et ouvre la session. */
  register(signupToken: string, account: NewAccount): Promise<CustomerLogin>;
}
