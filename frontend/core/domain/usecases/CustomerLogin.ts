import type { CustomerLogin, NewAccount } from "../entities/CustomerLogin";
import { ValidationError } from "../errors";
import type { ICustomerAuthRepository } from "../repositories/ICustomerAuthRepository";
import { isValidPhone } from "../rules/phone";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(clean)) throw new ValidationError("Adresse e-mail invalide.");
  return clean;
}

/** Envoie un code de connexion à l'e-mail. */
export class RequestLoginCode {
  constructor(private readonly repository: ICustomerAuthRepository) {}

  async execute(email: string): Promise<void> {
    return this.repository.requestCode(checkEmail(email));
  }
}

/** Vérifie le code à 6 chiffres reçu par e-mail. */
export class VerifyLoginCode {
  constructor(private readonly repository: ICustomerAuthRepository) {}

  async execute(email: string, code: string): Promise<CustomerLogin> {
    const digits = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(digits)) throw new ValidationError("Le code contient 6 chiffres.");
    return this.repository.verifyCode(checkEmail(email), digits);
  }
}

/** Crée le compte après la vérification de l'e-mail. */
export class RegisterAccount {
  constructor(private readonly repository: ICustomerAuthRepository) {}

  async execute(signupToken: string, account: NewAccount): Promise<CustomerLogin> {
    const firstName = account.firstName.trim();
    const lastName = account.lastName.trim();
    if (!firstName) throw new ValidationError("Le prénom est obligatoire.");
    if (!lastName) throw new ValidationError("Le nom est obligatoire.");
    if (!isValidPhone(account.phone)) throw new ValidationError("Numéro de téléphone invalide.");
    return this.repository.register(signupToken, { firstName, lastName, phone: account.phone.trim() });
  }
}
