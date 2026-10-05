// Client de l'API .NET, partagé par les sites b2c et b2b.
// Chaque appel envoie l'en-tête X-Tenant : l'API choisit la base de la marque blanche.

export type ApiConfig = {
  /** URL de l'API, sans le préfixe /api (ex. http://localhost:5063). */
  baseUrl: string;
  /** Identifiant de la marque côté API (en-tête X-Tenant). */
  tenant: string;
};

/** Paramètres de query string. Un tableau donne un paramètre répété (?id=1&id=2). */
export type QueryParams = Record<string, string | number | boolean | (string | number)[] | undefined>;

type ApiEnvelope<T> = { code: number; response: T | null; responseMessage: string | null };

/** Erreur renvoyée par l'API. Pour un statut 4xx, le message est destiné à l'utilisateur. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export class ApiClient {
  constructor(private readonly config: ApiConfig) {}

  /** GET sur l'API. Renvoie null si la ressource n'existe pas (404). */
  async get<T>(path: string, query?: QueryParams): Promise<T | null> {
    const res = await this.send("GET", path, query);
    if (res.status === 404) return null;
    return this.read<T>(res, path);
  }

  /** POST sur l'API. Renvoie null si l'API ne renvoie pas de contenu (204). */
  async post<T>(path: string, body: unknown): Promise<T | null> {
    return this.read<T>(await this.send("POST", path, undefined, body), path);
  }

  /** PUT sur l'API. Renvoie null si l'API ne renvoie pas de contenu (204). */
  async put<T>(path: string, body: unknown): Promise<T | null> {
    return this.read<T>(await this.send("PUT", path, undefined, body), path);
  }

  /** DELETE sur l'API. */
  async delete(path: string): Promise<void> {
    await this.read(await this.send("DELETE", path), path);
  }

  private send(method: string, path: string, query?: QueryParams, body?: unknown): Promise<Response> {
    const headers: Record<string, string> = { "X-Tenant": this.config.tenant, Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    return fetch(this.url(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  }

  private async read<T>(res: Response, path: string): Promise<T | null> {
    if (res.status === 204) return null;

    const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
    if (!res.ok || !body) {
      throw new ApiError(res.status, body?.responseMessage ?? `Erreur API ${res.status} sur ${path}`);
    }
    return body.response;
  }

  private url(path: string, query?: QueryParams): string {
    const url = `${this.config.baseUrl.replace(/\/$/, "")}/api${path}`;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined) continue;
      for (const v of Array.isArray(value) ? value : [value]) params.append(key, String(v));
    }
    return params.size ? `${url}?${params}` : url;
  }
}
