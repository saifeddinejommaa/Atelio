import type { TenantConfig } from "@/tenants/types";

/** Numéros de téléphone de la marque, cliquables : « 01 71 48 31 83 ou 06 52 52 61 00 ». */
export default function ContactPhones({ contact, linkClassName }: { contact: TenantConfig["contact"]; linkClassName?: string }) {
  return (
    <>
      <a href={`tel:${contact.phone}`} className={linkClassName}>
        {contact.phoneLabel}
      </a>
      {contact.secondPhone && (
        <>
          {" ou "}
          <a href={`tel:${contact.secondPhone.phone}`} className={linkClassName}>
            {contact.secondPhone.label}
          </a>
        </>
      )}
    </>
  );
}
