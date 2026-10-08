import { formatEuro, priceLabel, type Service } from "@/lib/garageService/services";

/** Prix d'un service : « à partir de 71,20 € », avec l'ancien prix barré et la remise s'il y a une promotion. */
export default function ServicePrice({ service, size = "text-xl" }: { service: Service; size?: string }) {
  const promo = service.discountPercent !== null && service.priceFrom !== null;

  return (
    <p className="mt-4 text-sm">
      {service.priceFrom !== null && "à partir de "}
      <span className={`${size} font-extrabold text-primary`}>{priceLabel(service, "")}</span>
      {promo && (
        <>
          <span className="ml-2 text-zinc-400 line-through">{formatEuro(service.basePrice)}</span>
          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-on-secondary">
            -{service.discountPercent} %
          </span>
        </>
      )}
    </p>
  );
}
