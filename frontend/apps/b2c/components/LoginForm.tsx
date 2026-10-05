"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { login } from "@/lib/auth-actions";

export default function LoginForm({ tenant, redirectTo }: { tenant: string; redirectTo: string }) {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="tenant" value={tenant} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.email}
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 outline-none focus:border-primary"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 outline-none focus:border-primary"
        />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={pending} loadingText="Connexion…">
        Se connecter
      </Button>
    </form>
  );
}
