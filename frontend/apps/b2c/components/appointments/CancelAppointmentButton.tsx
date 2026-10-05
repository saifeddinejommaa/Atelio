"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelAppointment } from "@/lib/appointment/appointment-actions";

export default function CancelAppointmentButton({ tenant, reference }: { tenant: string; reference: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function cancel() {
    setError("");
    startTransition(async () => {
      const result = await cancelAppointment(tenant, reference);
      if (result.ok) router.refresh();
      else setError(result.error);
      setConfirming(false);
    });
  }

  if (!confirming) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold transition-colors hover:border-red-600 hover:text-red-700"
        >
          Annuler le rendez-vous
        </button>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm">Confirmer l&apos;annulation ?</span>
      <button
        type="button"
        disabled={pending}
        onClick={cancel}
        className="rounded-brand bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? "Annulation…" : "Oui, annuler"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold hover:border-primary"
      >
        Non
      </button>
    </div>
  );
}
