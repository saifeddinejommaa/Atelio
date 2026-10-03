-- =============================================================================
-- Atelio : schéma de la base d'UNE marque blanche (PostgreSQL)
-- Chaque marque blanche a sa propre base, avec exactement cette structure.
--
-- Création d'une base client (exemple) :
--   createdb -U postgres atelio_garage_dupont
--   psql -U postgres -d atelio_garage_dupont -f tenant_schema.sql
-- =============================================================================

BEGIN;

-- Mise à jour automatique de updated_at -----------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Clients de la marque (utilisateurs du site web)
-- -----------------------------------------------------------------------------
CREATE TABLE customer (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name     varchar(100) NOT NULL,
  last_name      varchar(100) NOT NULL,
  email          varchar(255) NOT NULL,
  phone          varchar(30),
  is_active      boolean      NOT NULL DEFAULT true,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now()
);
-- E-mail unique sans tenir compte des majuscules
CREATE UNIQUE INDEX ux_customer_email ON customer (lower(email));

-- -----------------------------------------------------------------------------
-- Véhicules des clients
-- -----------------------------------------------------------------------------
CREATE TABLE vehicle (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id   bigint       NOT NULL REFERENCES customer (id),
  plate         varchar(15)  NOT NULL,                  -- format AB-123-CD
  make          varchar(50),
  model         varchar(80),
  year          smallint     CHECK (year BETWEEN 1950 AND 2100),
  fuel          varchar(20)  CHECK (fuel IN ('petrol', 'diesel', 'hybrid', 'electric', 'lpg', 'other')),
  category      varchar(20)  CHECK (category IN ('city', 'compact', 'suv', 'utility')),  -- sert au calcul du devis
  mileage       integer      CHECK (mileage >= 0),      -- dernier kilométrage connu
  is_active     boolean      NOT NULL DEFAULT true,     -- false si le client a vendu le véhicule
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
-- Une même voiture peut changer de propriétaire : l'unicité est par client.
CREATE UNIQUE INDEX ux_vehicle_customer_plate ON vehicle (customer_id, upper(plate));
CREATE INDEX ix_vehicle_plate ON vehicle (upper(plate));

-- -----------------------------------------------------------------------------
-- Garages (adresses) de la marque : au moins un, même pour une marque mono-garage
-- -----------------------------------------------------------------------------
CREATE TABLE garage (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         varchar(150) NOT NULL,
  address_line varchar(255) NOT NULL,
  postal_code  varchar(10)  NOT NULL,
  city         varchar(100) NOT NULL,
  country      char(2)      NOT NULL DEFAULT 'FR',
  latitude     numeric(9,6) NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude    numeric(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  phone        varchar(30),
  email        varchar(255),
  -- Horaires : les rendez-vous sont placés entre l'ouverture et la fermeture,
  -- selon la durée des services demandés et le nombre d'employés présents.
  opening_time time         NOT NULL DEFAULT '08:00',
  closing_time time         NOT NULL DEFAULT '18:00',
  open_days    smallint[]   NOT NULL DEFAULT '{1,2,3,4,5,6}',  -- jours ouverts, 1 = lundi ... 7 = dimanche
  is_active    boolean      NOT NULL DEFAULT true,
  CHECK (closing_time > opening_time),
  CHECK (open_days <@ '{1,2,3,4,5,6,7}'::smallint[])
);
CREATE INDEX ix_garage_city ON garage (postal_code, city);

-- -----------------------------------------------------------------------------
-- Employés d'un garage : leur nombre (présents) donne la capacité du garage
-- -----------------------------------------------------------------------------
CREATE TABLE employee (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  garage_id   bigint       NOT NULL REFERENCES garage (id),
  first_name  varchar(100) NOT NULL,
  last_name   varchar(100) NOT NULL,
  role        varchar(20)  NOT NULL DEFAULT 'mechanic'
              CHECK (role IN ('mechanic', 'manager', 'reception')),
  email       varchar(255),
  phone       varchar(30),
  is_active   boolean      NOT NULL DEFAULT true,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX ix_employee_garage ON employee (garage_id) WHERE is_active;

-- Absences (congés, maladie...) : retirent l'employé de la capacité sur la période,
-- et permettent de repérer les rendez-vous à replanifier.
CREATE TABLE employee_absence (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id bigint       NOT NULL REFERENCES employee (id) ON DELETE CASCADE,
  start_at    timestamptz  NOT NULL,
  end_at      timestamptz  NOT NULL,
  reason      varchar(20)  NOT NULL DEFAULT 'leave'
              CHECK (reason IN ('leave', 'sick', 'training', 'other')),
  comment     text,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX ix_employee_absence_period ON employee_absence (employee_id, start_at, end_at);

-- -----------------------------------------------------------------------------
-- Services proposés par la marque (vidange, freinage, pneus...)
-- -----------------------------------------------------------------------------
CREATE TABLE service (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code             varchar(50)  NOT NULL UNIQUE,      -- identifiant utilisé dans les URL (ex. "freinage")
  name             varchar(150) NOT NULL,
  description      text,
  price            numeric(10,2) NOT NULL CHECK (price >= 0),           -- prix TTC
  duration_minutes integer      NOT NULL CHECK (duration_minutes > 0),  -- durée estimée, sert au planning
  is_active        boolean      NOT NULL DEFAULT true,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Promotions : remise en % sur le prix d'un service, activable / désactivable.
-- Appliquée au prix du service lors du devis et de la facturation.
-- -----------------------------------------------------------------------------
CREATE TABLE promotion (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service_id  bigint        NOT NULL REFERENCES service (id),
  title       varchar(150)  NOT NULL,
  description text,
  discount_percent numeric(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  is_active   boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX ix_promotion_service ON promotion (service_id) WHERE is_active;

-- Services réalisés par chaque garage (tous les garages ne font pas tout)
CREATE TABLE garage_service (
  garage_id  bigint NOT NULL REFERENCES garage (id) ON DELETE CASCADE,
  service_id bigint NOT NULL REFERENCES service (id) ON DELETE CASCADE,
  PRIMARY KEY (garage_id, service_id)
);
CREATE INDEX ix_garage_service_service ON garage_service (service_id);

-- -----------------------------------------------------------------------------
-- Rendez-vous pris sur le site
-- -----------------------------------------------------------------------------
CREATE TABLE appointment (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reference      varchar(20)  NOT NULL UNIQUE,         -- affichée au client (ex. RDV-8K2F9Q)
  customer_id    bigint       NOT NULL REFERENCES customer (id),
  vehicle_id     bigint       NOT NULL REFERENCES vehicle (id),
  garage_id      bigint       NOT NULL REFERENCES garage (id),
  scheduled_at   timestamptz  NOT NULL,
  -- Fin estimée = début + somme des durées des services demandés (calculée par l'API).
  -- Permet de trouver les créneaux libres sans recalculer chaque rendez-vous.
  estimated_end_at timestamptz NOT NULL,
  status         varchar(20)  NOT NULL DEFAULT 'confirmed'
                 CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  customer_notes text,                                  -- « Quelque chose à signaler au garage ? »
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  CHECK (estimated_end_at > scheduled_at)
);
CREATE INDEX ix_appointment_customer ON appointment (customer_id);
CREATE INDEX ix_appointment_vehicle ON appointment (vehicle_id);
CREATE INDEX ix_appointment_garage_date ON appointment (garage_id, scheduled_at, estimated_end_at);

-- Services demandés par le client lors de la réservation (avant l'intervention)
CREATE TABLE appointment_service (
  appointment_id bigint NOT NULL REFERENCES appointment (id) ON DELETE CASCADE,
  service_id     bigint NOT NULL REFERENCES service (id),
  PRIMARY KEY (appointment_id, service_id)
);

-- -----------------------------------------------------------------------------
-- Interventions : le travail réalisé, liée au rendez-vous et au client
-- (appointment_id facultatif pour un client venu sans rendez-vous)
-- -----------------------------------------------------------------------------
CREATE TABLE intervention (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id bigint       UNIQUE REFERENCES appointment (id),
  customer_id    bigint       NOT NULL REFERENCES customer (id),
  vehicle_id     bigint       NOT NULL REFERENCES vehicle (id),
  garage_id      bigint       NOT NULL REFERENCES garage (id),
  employee_id    bigint       REFERENCES employee (id),  -- mécanicien affecté (à réaffecter en cas d'absence)
  mileage        integer      CHECK (mileage >= 0),      -- kilométrage relevé à l'intervention
  status         varchar(20)  NOT NULL DEFAULT 'planned'
                 CHECK (status IN ('planned', 'in_progress', 'done', 'cancelled')),
  started_at     timestamptz,
  finished_at    timestamptz,
  notes          text,                                  -- notes internes du garage
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at)
);
CREATE INDEX ix_intervention_customer ON intervention (customer_id);
CREATE INDEX ix_intervention_employee ON intervention (employee_id);
CREATE INDEX ix_intervention_vehicle ON intervention (vehicle_id);

-- Services réalisés pendant une intervention (prix figé au moment de l'intervention)
CREATE TABLE intervention_service (
  intervention_id bigint        NOT NULL REFERENCES intervention (id) ON DELETE CASCADE,
  service_id      bigint        NOT NULL REFERENCES service (id),
  quantity        integer       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price      numeric(10,2) NOT NULL CHECK (unit_price >= 0),  -- TTC
  PRIMARY KEY (intervention_id, service_id)
);

-- Pièces de rechange utilisées pendant une intervention
CREATE TABLE spare_part (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  intervention_id bigint        NOT NULL REFERENCES intervention (id) ON DELETE CASCADE,
  reference       varchar(100),                         -- référence fabricant
  name            varchar(200)  NOT NULL,
  quantity        numeric(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price      numeric(10,2) NOT NULL CHECK (unit_price >= 0),  -- TTC
  created_at      timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX ix_spare_part_intervention ON spare_part (intervention_id);

-- -----------------------------------------------------------------------------
-- Facturation : une facture par intervention, montants figés à l'émission
-- -----------------------------------------------------------------------------
CREATE TABLE invoice (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  intervention_id bigint        NOT NULL UNIQUE REFERENCES intervention (id),
  number          varchar(30)   NOT NULL UNIQUE,        -- numérotation continue (ex. F-2026-000123)
  issued_at       timestamptz   NOT NULL DEFAULT now(),
  due_date        date,
  total_ht        numeric(10,2) NOT NULL CHECK (total_ht >= 0),
  total_vat       numeric(10,2) NOT NULL CHECK (total_vat >= 0),
  total_ttc       numeric(10,2) NOT NULL CHECK (total_ttc >= 0),
  status          varchar(20)   NOT NULL DEFAULT 'issued'
                  CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'cancelled')),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  CHECK (total_ttc = total_ht + total_vat)
);

-- Paiements d'une facture (plusieurs possibles : acompte, paiement en 2 fois...)
CREATE TABLE payment (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id     bigint        NOT NULL REFERENCES invoice (id),
  amount         numeric(10,2) NOT NULL CHECK (amount > 0),
  method         varchar(20)   NOT NULL
                 CHECK (method IN ('card', 'cash', 'transfer', 'check', 'online')),
  status         varchar(20)   NOT NULL DEFAULT 'succeeded'
                 CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  transaction_id varchar(100),                          -- référence du prestataire de paiement
  paid_at        timestamptz   NOT NULL DEFAULT now(),
  created_at     timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX ix_payment_invoice ON payment (invoice_id);

-- Triggers updated_at ------------------------------------------------------------
CREATE TRIGGER trg_customer_updated     BEFORE UPDATE ON customer     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vehicle_updated      BEFORE UPDATE ON vehicle      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_garage_updated       BEFORE UPDATE ON garage       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employee_updated     BEFORE UPDATE ON employee     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_service_updated      BEFORE UPDATE ON service      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_promotion_updated    BEFORE UPDATE ON promotion    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_appointment_updated  BEFORE UPDATE ON appointment  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_intervention_updated BEFORE UPDATE ON intervention FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_invoice_updated      BEFORE UPDATE ON invoice      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
