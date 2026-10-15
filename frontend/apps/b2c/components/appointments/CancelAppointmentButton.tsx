"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { cancelAppointment } from "@/lib/appointment/AppointmentActions";

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
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          Annuler le rendez-vous
        </Button>
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
      <Button variant="secondary" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
        Non
      </Button>
    </div>
  );
}
