"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Promotion } from "@atelio/core/domain";
import Button from "@/components/ui/Button";

/** Temps d'affichage de chaque promotion. */
const SLIDE_MS = 6000;

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const percent = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/**
 * Photo de la prestation : public/tenants/<marque>/prestations/<code sans tiret>.jpg.
 * Sans fichier, le navigateur ignore cette image et le fond de la bannière reste visible.
 */
function photoUrl(tenantSlug: string, serviceCode: string): string {
  return `/tenants/${tenantSlug}/prestations/${serviceCode.replaceAll("-", "")}.jpg`;
}

/** Bannières des promotions en cours en haut de l'accueil : une à la fois, avec défilement automatique. */
export default function PromotionCarousel({
  tenantSlug,
  promotions,
  bookingPath,
}: {
  tenantSlug: string;
  promotions: Promotion[];
  /** Lien de prise de rendez-vous, ex. "/gmg78/rendez-vous". */
  bookingPath: string;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = promotions.length;

  useEffect(() => {
    // Pas d'animation pour les visiteurs qui l'ont désactivée dans leur système.
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setCurrent((i) => (i + 1) % count), SLIDE_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;

  const promotion = promotions[Math.min(current, count - 1)];

  return (
    <section
      aria-label="Promotions en cours"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{ backgroundImage: `linear-gradient(90deg, rgb(0 0 0 / 0.75), rgb(0 0 0 / 0.25)), url("${photoUrl(tenantSlug, promotion.serviceCode)}")` }}
      className="relative bg-primary bg-cover bg-center text-white"
    >
      <div className="mx-auto flex min-h-64 max-w-7xl flex-col items-start justify-center px-16 py-10 sm:min-h-72">
        <span className="rounded-full bg-secondary px-3 py-1 text-lg font-extrabold text-on-secondary">
          -{percent.format(promotion.discountPercent)} %
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{promotion.title}</h2>
        <p className="mt-2 text-lg">
          {promotion.serviceName} :{" "}
          <span className="text-white/70 line-through">{euro.format(promotion.servicePrice)}</span>{" "}
          <span className="font-bold">{euro.format(promotion.discountedPrice)}</span>
        </p>
        <Button as={Link} href={`${bookingPath}?prestation=${promotion.serviceCode}`} className="mt-6">
          Réserver
        </Button>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Promotion précédente"
            onClick={() => setCurrent((current - 1 + count) % count)}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
          >
            <span aria-hidden className="text-2xl leading-none">‹</span>
          </button>
          <button
            type="button"
            aria-label="Promotion suivante"
            onClick={() => setCurrent((current + 1) % count)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
          >
            <span aria-hidden className="text-2xl leading-none">›</span>
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {promotions.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Promotion ${i + 1} sur ${count} : ${p.title}`}
                aria-current={i === current}
                onClick={() => setCurrent(i)}
                className={`h-2.5 w-2.5 rounded-full ${i === current ? "bg-white" : "bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
