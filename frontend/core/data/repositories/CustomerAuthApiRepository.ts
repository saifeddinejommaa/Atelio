import type { CustomerLogin, ICustomerAuthRepository, NewAccount } from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";

/** Réponse de /auth/customer/verify et /register : session, ou inscription à terminer. */
type CustomerLoginDto = { token: string | null; expiresAt: string | null; signupToken: string | null };

function toLogin(dto: CustomerLoginDto | null): CustomerLogin {
  if (dto?.token && dto.expiresAt) {
    // L'API renvoie des dates UTC, parfois sans le suffixe "Z".
    const expiresAt = /(Z|[+-]\d{2}:\d{2})$/.test(dto.expiresAt) ? dto.expiresAt : `${dto.expiresAt}Z`;
    return { kind: "session", token: dto.token, expiresAt };
  }
  if (dto?.signupToken) return { kind: "signup", signupToken: dto.signupToken };
  throw new ApiError(500, "L'API n'a pas renvoyé de session.");
}

export class CustomerAuthApiRepository implements ICustomerAuthRepository {
  constructor(private readonly api: ApiClient) {}

  async requestCode(email: string): Promise<void> {
    await this.api.post("/auth/customer/code", { email });
  }

  async verifyCode(email: string, code: string): Promise<CustomerLogin> {
    return toLogin(await this.api.post<CustomerLoginDto>("/auth/customer/verify", { email, code }));
  }

  async register(signupToken: string, account: NewAccount): Promise<CustomerLogin> {
    return toLogin(await this.api.post<CustomerLoginDto>("/auth/customer/register", { signupToken, ...account }));
  }
}
