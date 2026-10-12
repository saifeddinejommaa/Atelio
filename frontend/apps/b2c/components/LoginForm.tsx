"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { loginStep, type LoginState } from "@/lib/AuthActions";

const field = "mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 outline-none focus:border-primary";

const initial: LoginState = { step: "email", email: "" };

/**
 * Connexion sans mot de passe : e-mail, puis code à 6 chiffres reçu par e-mail.
 * Un nouveau client complète ensuite son nom et son téléphone.
 */
export default function LoginForm({ tenant, redirectTo }: { tenant: string; redirectTo: string }) {
  const [state, action, pending] = useActionState(loginStep, initial);

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="tenant" value={tenant} />
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.step === "email" && (
        <>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Adresse e-mail
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" autoFocus defaultValue={state.email} className={field} />
            <p className="mt-2 text-xs text-zinc-500">Nous vous envoyons un code de connexion : pas de mot de passe à retenir.</p>
          </div>
          <Message state={state} />
          <Button type="submit" name="action" value="send" size="lg" fullWidth loading={pending} loadingText="Envoi…">
            Recevoir un code
          </Button>
        </>
      )}

      {state.step === "code" && (
        <>
          <div>
            <label htmlFor="code" className="block text-sm font-medium">
              Code reçu par e-mail
            </label>
            <input
              key={state.email}
              id="code"
              name="code"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              className={`${field} text-center font-mono text-2xl tracking-[0.5em]`}
            />
            <p className="mt-2 text-xs text-zinc-500">Valable 10 minutes. Pensez à vérifier vos courriers indésirables.</p>
          </div>
          <Message state={state} />
          <Button type="submit" name="action" value="verify" size="lg" fullWidth loading={pending} loadingText="Vérification…">
            Se connecter
          </Button>
          <div className="flex justify-between text-sm">
            <button type="submit" name="action" value="change-email" formNoValidate className="text-zinc-600 hover:underline">
              Changer d’e-mail
            </button>
            {/* Renvoie un code à la même adresse. */}
            <input type="hidden" name="email" value={state.email} />
            <button type="submit" name="action" value="send" formNoValidate className="font-medium text-primary hover:underline">
              Renvoyer un code
            </button>
          </div>
        </>
      )}

      {state.step === "signup" && (
        <>
          <p className="rounded-lg bg-muted p-3 text-sm">
            Bienvenue ! Créez votre compte pour <strong>{state.email}</strong>.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium">
                Prénom
              </label>
              <input id="firstName" name="firstName" required autoFocus autoComplete="given-name" maxLength={100} className={field} />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium">
                Nom
              </label>
              <input id="lastName" name="lastName" required autoComplete="family-name" maxLength={100} className={field} />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Téléphone
            </label>
            <input id="phone" name="phone" type="tel" required autoComplete="tel" maxLength={30} className={field} />
            <p className="mt-2 text-xs text-zinc-500">Le garage vous appelle si besoin au sujet de votre véhicule.</p>
          </div>
          <Message state={state} />
          <Button type="submit" name="action" value="register" size="lg" fullWidth loading={pending} loadingText="Création…">
            Créer mon compte
          </Button>
        </>
      )}
    </form>
  );
}

function Message({ state }: { state: LoginState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.info) {
    return (
      <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
        {state.info}
      </p>
    );
  }
  return null;
}
