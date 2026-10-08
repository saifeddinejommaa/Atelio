--
-- PostgreSQL database dump
--

\restrict RdU005BbFsnkDCfoHMgxJGZuUHOSzzt17AbEMiAl75ANAvxcX9Mhk0fACv2v4uQ

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.2

-- Started on 2026-10-05 16:35:24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 258 (class 1255 OID 21158)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 235 (class 1259 OID 21348)
-- Name: appointment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment (
    id bigint NOT NULL,
    reference character varying(20) NOT NULL,
    customer_id bigint NOT NULL,
    vehicle_id bigint NOT NULL,
    garage_id bigint NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    estimated_end_at timestamp with time zone NOT NULL,
    customer_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status_id integer CONSTRAINT appointment_status_id_not_null1 NOT NULL,
    CONSTRAINT appointment_check CHECK ((estimated_end_at > scheduled_at))
);


ALTER TABLE public.appointment OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 21347)
-- Name: appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.appointment ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.appointment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 236 (class 1259 OID 21390)
-- Name: appointment_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment_service (
    appointment_id bigint NOT NULL,
    service_id bigint NOT NULL
);


ALTER TABLE public.appointment_service OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 21671)
-- Name: appointment_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment_status (
    id integer NOT NULL,
    label character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.appointment_status OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 21160)
-- Name: customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer (
    id bigint NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(30),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customer OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 21159)
-- Name: customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.customer ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 21233)
-- Name: employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee (
    id bigint NOT NULL,
    garage_id bigint NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'mechanic'::character varying NOT NULL,
    email character varying(255),
    phone character varying(30),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employee_role_check CHECK (((role)::text = ANY ((ARRAY['mechanic'::character varying, 'manager'::character varying, 'reception'::character varying])::text[])))
);


ALTER TABLE public.employee OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 21260)
-- Name: employee_absence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_absence (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    reason character varying(20) DEFAULT 'leave'::character varying NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employee_absence_check CHECK ((end_at > start_at)),
    CONSTRAINT employee_absence_reason_check CHECK (((reason)::text = ANY ((ARRAY['leave'::character varying, 'sick'::character varying, 'training'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.employee_absence OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 21259)
-- Name: employee_absence_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.employee_absence ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.employee_absence_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 225 (class 1259 OID 21232)
-- Name: employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.employee ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 247 (class 1259 OID 21577)
-- Name: employee_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_schedule (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    day_of_week smallint NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employee_schedule_check CHECK ((end_time > start_time)),
    CONSTRAINT employee_schedule_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 7)))
);


ALTER TABLE public.employee_schedule OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 21576)
-- Name: employee_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.employee_schedule ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.employee_schedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 21203)
-- Name: garage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.garage (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    address_line character varying(255) NOT NULL,
    postal_code character varying(10) NOT NULL,
    city character varying(100) NOT NULL,
    country character(2) DEFAULT 'FR'::bpchar NOT NULL,
    latitude numeric(9,6) NOT NULL,
    longitude numeric(9,6) NOT NULL,
    phone character varying(30),
    email character varying(255),
    opening_time time without time zone DEFAULT '08:00:00'::time without time zone NOT NULL,
    closing_time time without time zone DEFAULT '18:00:00'::time without time zone NOT NULL,
    open_days smallint[] DEFAULT '{1,2,3,4,5,6}'::smallint[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT garage_check CHECK ((closing_time > opening_time)),
    CONSTRAINT garage_latitude_check CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT garage_longitude_check CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric))),
    CONSTRAINT garage_open_days_check CHECK ((open_days <@ '{1,2,3,4,5,6,7}'::smallint[]))
);


ALTER TABLE public.garage OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 21202)
-- Name: garage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.garage ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.garage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 233 (class 1259 OID 21329)
-- Name: garage_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.garage_service (
    garage_id bigint NOT NULL,
    service_id bigint NOT NULL
);


ALTER TABLE public.garage_service OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 21408)
-- Name: intervention; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intervention (
    id bigint NOT NULL,
    appointment_id bigint,
    customer_id bigint NOT NULL,
    vehicle_id bigint NOT NULL,
    garage_id bigint NOT NULL,
    employee_id bigint,
    mileage integer,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status_id integer CONSTRAINT intervention_status_id_not_null1 NOT NULL,
    CONSTRAINT intervention_check CHECK (((finished_at IS NULL) OR (started_at IS NULL) OR (finished_at >= started_at))),
    CONSTRAINT intervention_mileage_check CHECK ((mileage >= 0))
);


ALTER TABLE public.intervention OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 21407)
-- Name: intervention_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.intervention ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.intervention_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 21458)
-- Name: intervention_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intervention_service (
    intervention_id bigint NOT NULL,
    service_id bigint NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    labour_minutes integer,
    category_id bigint,
    CONSTRAINT intervention_service_labour_minutes_check CHECK ((labour_minutes > 0)),
    CONSTRAINT intervention_service_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT intervention_service_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.intervention_service OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 21680)
-- Name: intervention_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intervention_status (
    id integer NOT NULL,
    label character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.intervention_status OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 21503)
-- Name: invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice (
    id bigint NOT NULL,
    intervention_id bigint NOT NULL,
    number character varying(30) NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    due_date date,
    total_ht numeric(10,2) NOT NULL,
    total_vat numeric(10,2) NOT NULL,
    total_ttc numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status_id integer CONSTRAINT invoice_status_id_not_null1 NOT NULL,
    CONSTRAINT invoice_check CHECK ((total_ttc = (total_ht + total_vat))),
    CONSTRAINT invoice_total_ht_check CHECK ((total_ht >= (0)::numeric)),
    CONSTRAINT invoice_total_ttc_check CHECK ((total_ttc >= (0)::numeric)),
    CONSTRAINT invoice_total_vat_check CHECK ((total_vat >= (0)::numeric))
);


ALTER TABLE public.invoice OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 21502)
-- Name: invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 253 (class 1259 OID 21647)
-- Name: invoice_line; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_line (
    id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    kind character varying(20) NOT NULL,
    label character varying(300) NOT NULL,
    reference character varying(100),
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    CONSTRAINT invoice_line_kind_check CHECK (((kind)::text = ANY ((ARRAY['labour'::character varying, 'part'::character varying])::text[]))),
    CONSTRAINT invoice_line_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT invoice_line_total_check CHECK ((total >= (0)::numeric)),
    CONSTRAINT invoice_line_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.invoice_line OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 21646)
-- Name: invoice_line_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_line ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.invoice_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 256 (class 1259 OID 21689)
-- Name: invoice_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_status (
    id integer NOT NULL,
    label character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.invoice_status OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 21537)
-- Name: payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment (
    id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    method character varying(20) NOT NULL,
    transaction_id character varying(100),
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status_id integer CONSTRAINT payment_status_id_not_null1 NOT NULL,
    CONSTRAINT payment_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payment_method_check CHECK (((method)::text = ANY ((ARRAY['card'::character varying, 'cash'::character varying, 'transfer'::character varying, 'check'::character varying, 'online'::character varying])::text[])))
);


ALTER TABLE public.payment OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 21536)
-- Name: payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payment ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 257 (class 1259 OID 21698)
-- Name: payment_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_status (
    id integer NOT NULL,
    label character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.payment_status OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 21305)
-- Name: promotion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion (
    id bigint NOT NULL,
    service_id bigint NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    discount_percent numeric(5,2) NOT NULL,
    CONSTRAINT promotion_discount_percent_check CHECK (((discount_percent > (0)::numeric) AND (discount_percent <= (100)::numeric)))
);


ALTER TABLE public.promotion OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 21304)
-- Name: promotion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.promotion ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.promotion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 230 (class 1259 OID 21284)
-- Name: service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    duration_minutes integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    price numeric(10,2) NOT NULL,
    uncertain_duration boolean DEFAULT false NOT NULL,
    category_id bigint,
    CONSTRAINT service_duration_minutes_check CHECK ((duration_minutes > 0)),
    CONSTRAINT service_price_check CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.service OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 21621)
-- Name: service_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_category (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    hourly_rate numeric(10,2) NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    CONSTRAINT service_category_hourly_rate_check CHECK ((hourly_rate >= (0)::numeric))
);


ALTER TABLE public.service_category OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 21620)
-- Name: service_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.service_category ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.service_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 229 (class 1259 OID 21283)
-- Name: service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.service ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.service_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 249 (class 1259 OID 21604)
-- Name: service_part; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_part (
    id bigint NOT NULL,
    service_id bigint NOT NULL,
    name character varying(200) NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.service_part OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 21603)
-- Name: service_part_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.service_part ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.service_part_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 241 (class 1259 OID 21481)
-- Name: spare_part; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spare_part (
    id bigint NOT NULL,
    intervention_id bigint NOT NULL,
    reference character varying(100),
    name character varying(200) NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT spare_part_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT spare_part_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.spare_part OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 21480)
-- Name: spare_part_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.spare_part ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.spare_part_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 21177)
-- Name: vehicle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle (
    id bigint NOT NULL,
    customer_id bigint NOT NULL,
    plate character varying(15) NOT NULL,
    make character varying(50),
    model character varying(80),
    year smallint,
    fuel character varying(20),
    category character varying(20),
    mileage integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vehicle_category_check CHECK (((category)::text = ANY ((ARRAY['city'::character varying, 'compact'::character varying, 'suv'::character varying, 'utility'::character varying])::text[]))),
    CONSTRAINT vehicle_fuel_check CHECK (((fuel)::text = ANY ((ARRAY['petrol'::character varying, 'diesel'::character varying, 'hybrid'::character varying, 'electric'::character varying, 'lpg'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT vehicle_mileage_check CHECK ((mileage >= 0)),
    CONSTRAINT vehicle_year_check CHECK (((year >= 1950) AND (year <= 2100)))
);


ALTER TABLE public.vehicle OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 21176)
-- Name: vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.vehicle ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vehicle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 5068 (class 2606 OID 21369)
-- Name: appointment appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT appointment_pkey PRIMARY KEY (id);


--
-- TOC entry 5070 (class 2606 OID 21371)
-- Name: appointment appointment_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT appointment_reference_key UNIQUE (reference);


--
-- TOC entry 5076 (class 2606 OID 21396)
-- Name: appointment_service appointment_service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_service
    ADD CONSTRAINT appointment_service_pkey PRIMARY KEY (appointment_id, service_id);


--
-- TOC entry 5113 (class 2606 OID 21679)
-- Name: appointment_status appointment_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_status
    ADD CONSTRAINT appointment_status_pkey PRIMARY KEY (id);


--
-- TOC entry 5042 (class 2606 OID 21174)
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- TOC entry 5055 (class 2606 OID 21276)
-- Name: employee_absence employee_absence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_absence
    ADD CONSTRAINT employee_absence_pkey PRIMARY KEY (id);


--
-- TOC entry 5052 (class 2606 OID 21252)
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (id);


--
-- TOC entry 5100 (class 2606 OID 21592)
-- Name: employee_schedule employee_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_schedule
    ADD CONSTRAINT employee_schedule_pkey PRIMARY KEY (id);


--
-- TOC entry 5049 (class 2606 OID 21230)
-- Name: garage garage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.garage
    ADD CONSTRAINT garage_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 21335)
-- Name: garage_service garage_service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.garage_service
    ADD CONSTRAINT garage_service_pkey PRIMARY KEY (garage_id, service_id);


--
-- TOC entry 5078 (class 2606 OID 21429)
-- Name: intervention intervention_appointment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_appointment_id_key UNIQUE (appointment_id);


--
-- TOC entry 5080 (class 2606 OID 21427)
-- Name: intervention intervention_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_pkey PRIMARY KEY (id);


--
-- TOC entry 5086 (class 2606 OID 21469)
-- Name: intervention_service intervention_service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention_service
    ADD CONSTRAINT intervention_service_pkey PRIMARY KEY (intervention_id, service_id);


--
-- TOC entry 5115 (class 2606 OID 21688)
-- Name: intervention_status intervention_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention_status
    ADD CONSTRAINT intervention_status_pkey PRIMARY KEY (id);


--
-- TOC entry 5091 (class 2606 OID 21528)
-- Name: invoice invoice_intervention_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_intervention_id_key UNIQUE (intervention_id);


--
-- TOC entry 5110 (class 2606 OID 21664)
-- Name: invoice_line invoice_line_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_pkey PRIMARY KEY (id);


--
-- TOC entry 5093 (class 2606 OID 21530)
-- Name: invoice invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_number_key UNIQUE (number);


--
-- TOC entry 5095 (class 2606 OID 21526)
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (id);


--
-- TOC entry 5117 (class 2606 OID 21697)
-- Name: invoice_status invoice_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_status
    ADD CONSTRAINT invoice_status_pkey PRIMARY KEY (id);


--
-- TOC entry 5098 (class 2606 OID 21554)
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);


--
-- TOC entry 5119 (class 2606 OID 21706)
-- Name: payment_status payment_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_status
    ADD CONSTRAINT payment_status_pkey PRIMARY KEY (id);


--
-- TOC entry 5063 (class 2606 OID 21322)
-- Name: promotion promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion
    ADD CONSTRAINT promotion_pkey PRIMARY KEY (id);


--
-- TOC entry 5106 (class 2606 OID 21634)
-- Name: service_category service_category_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_category
    ADD CONSTRAINT service_category_code_key UNIQUE (code);


--
-- TOC entry 5108 (class 2606 OID 21632)
-- Name: service_category service_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_category
    ADD CONSTRAINT service_category_pkey PRIMARY KEY (id);


--
-- TOC entry 5058 (class 2606 OID 21303)
-- Name: service service_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_code_key UNIQUE (code);


--
-- TOC entry 5104 (class 2606 OID 21613)
-- Name: service_part service_part_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_part
    ADD CONSTRAINT service_part_pkey PRIMARY KEY (id);


--
-- TOC entry 5060 (class 2606 OID 21301)
-- Name: service service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_pkey PRIMARY KEY (id);


--
-- TOC entry 5089 (class 2606 OID 21495)
-- Name: spare_part spare_part_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spare_part
    ADD CONSTRAINT spare_part_pkey PRIMARY KEY (id);


--
-- TOC entry 5047 (class 2606 OID 21194)
-- Name: vehicle vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_pkey PRIMARY KEY (id);


--
-- TOC entry 5071 (class 1259 OID 21387)
-- Name: ix_appointment_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointment_customer ON public.appointment USING btree (customer_id);


--
-- TOC entry 5072 (class 1259 OID 21389)
-- Name: ix_appointment_garage_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointment_garage_date ON public.appointment USING btree (garage_id, scheduled_at, estimated_end_at);


--
-- TOC entry 5073 (class 1259 OID 21731)
-- Name: ix_appointment_status_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointment_status_id ON public.appointment USING btree (status_id);


--
-- TOC entry 5074 (class 1259 OID 21388)
-- Name: ix_appointment_vehicle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointment_vehicle ON public.appointment USING btree (vehicle_id);


--
-- TOC entry 5056 (class 1259 OID 21282)
-- Name: ix_employee_absence_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employee_absence_period ON public.employee_absence USING btree (employee_id, start_at, end_at);


--
-- TOC entry 5053 (class 1259 OID 21258)
-- Name: ix_employee_garage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employee_garage ON public.employee USING btree (garage_id) WHERE is_active;


--
-- TOC entry 5101 (class 1259 OID 21598)
-- Name: ix_employee_schedule_employee_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employee_schedule_employee_day ON public.employee_schedule USING btree (employee_id, day_of_week);


--
-- TOC entry 5050 (class 1259 OID 21231)
-- Name: ix_garage_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_garage_city ON public.garage USING btree (postal_code, city);


--
-- TOC entry 5066 (class 1259 OID 21346)
-- Name: ix_garage_service_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_garage_service_service ON public.garage_service USING btree (service_id);


--
-- TOC entry 5081 (class 1259 OID 21455)
-- Name: ix_intervention_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_intervention_customer ON public.intervention USING btree (customer_id);


--
-- TOC entry 5082 (class 1259 OID 21456)
-- Name: ix_intervention_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_intervention_employee ON public.intervention USING btree (employee_id);


--
-- TOC entry 5083 (class 1259 OID 21732)
-- Name: ix_intervention_status_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_intervention_status_id ON public.intervention USING btree (status_id);


--
-- TOC entry 5084 (class 1259 OID 21457)
-- Name: ix_intervention_vehicle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_intervention_vehicle ON public.intervention USING btree (vehicle_id);


--
-- TOC entry 5111 (class 1259 OID 21670)
-- Name: ix_invoice_line_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_invoice_line_invoice ON public.invoice_line USING btree (invoice_id);


--
-- TOC entry 5096 (class 1259 OID 21560)
-- Name: ix_payment_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payment_invoice ON public.payment USING btree (invoice_id);


--
-- TOC entry 5061 (class 1259 OID 21328)
-- Name: ix_promotion_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_promotion_service ON public.promotion USING btree (service_id) WHERE is_active;


--
-- TOC entry 5102 (class 1259 OID 21619)
-- Name: ix_service_part_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_service_part_service ON public.service_part USING btree (service_id);


--
-- TOC entry 5087 (class 1259 OID 21501)
-- Name: ix_spare_part_intervention; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_spare_part_intervention ON public.spare_part USING btree (intervention_id);


--
-- TOC entry 5044 (class 1259 OID 21201)
-- Name: ix_vehicle_plate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vehicle_plate ON public.vehicle USING btree (upper((plate)::text));


--
-- TOC entry 5043 (class 1259 OID 21175)
-- Name: ux_customer_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_customer_email ON public.customer USING btree (lower((email)::text));


--
-- TOC entry 5045 (class 1259 OID 21200)
-- Name: ux_vehicle_customer_plate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_vehicle_customer_plate ON public.vehicle USING btree (customer_id, upper((plate)::text));


--
-- TOC entry 5156 (class 2620 OID 21567)
-- Name: appointment trg_appointment_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_appointment_updated BEFORE UPDATE ON public.appointment FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5150 (class 2620 OID 21561)
-- Name: customer trg_customer_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_customer_updated BEFORE UPDATE ON public.customer FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5159 (class 2620 OID 21599)
-- Name: employee_schedule trg_employee_schedule_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_employee_schedule_updated_at BEFORE UPDATE ON public.employee_schedule FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5153 (class 2620 OID 21564)
-- Name: employee trg_employee_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_employee_updated BEFORE UPDATE ON public.employee FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5152 (class 2620 OID 21563)
-- Name: garage trg_garage_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_garage_updated BEFORE UPDATE ON public.garage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5157 (class 2620 OID 21568)
-- Name: intervention trg_intervention_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_intervention_updated BEFORE UPDATE ON public.intervention FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5158 (class 2620 OID 21569)
-- Name: invoice trg_invoice_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_invoice_updated BEFORE UPDATE ON public.invoice FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5155 (class 2620 OID 21566)
-- Name: promotion trg_promotion_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_promotion_updated BEFORE UPDATE ON public.promotion FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5154 (class 2620 OID 21565)
-- Name: service trg_service_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_service_updated BEFORE UPDATE ON public.service FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5151 (class 2620 OID 21562)
-- Name: vehicle trg_vehicle_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vehicle_updated BEFORE UPDATE ON public.vehicle FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5127 (class 2606 OID 21372)
-- Name: appointment appointment_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT appointment_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id);


--
-- TOC entry 5128 (class 2606 OID 21382)
-- Name: appointment appointment_garage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT appointment_garage_id_fkey FOREIGN KEY (garage_id) REFERENCES public.garage(id);


--
-- TOC entry 5131 (class 2606 OID 21397)
-- Name: appointment_service appointment_service_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_service
    ADD CONSTRAINT appointment_service_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointment(id) ON DELETE CASCADE;


--
-- TOC entry 5132 (class 2606 OID 21402)
-- Name: appointment_service appointment_service_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_service
    ADD CONSTRAINT appointment_service_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service(id);


--
-- TOC entry 5129 (class 2606 OID 21377)
-- Name: appointment appointment_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT appointment_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(id);


--
-- TOC entry 5122 (class 2606 OID 21277)
-- Name: employee_absence employee_absence_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_absence
    ADD CONSTRAINT employee_absence_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(id) ON DELETE CASCADE;


--
-- TOC entry 5121 (class 2606 OID 21253)
-- Name: employee employee_garage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_garage_id_fkey FOREIGN KEY (garage_id) REFERENCES public.garage(id);


--
-- TOC entry 5147 (class 2606 OID 21593)
-- Name: employee_schedule employee_schedule_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_schedule
    ADD CONSTRAINT employee_schedule_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(id) ON DELETE CASCADE;


--
-- TOC entry 5130 (class 2606 OID 21708)
-- Name: appointment fk_appointment_status; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT fk_appointment_status FOREIGN KEY (status_id) REFERENCES public.appointment_status(id);


--
-- TOC entry 5133 (class 2606 OID 21714)
-- Name: intervention fk_intervention_status; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT fk_intervention_status FOREIGN KEY (status_id) REFERENCES public.intervention_status(id);


--
-- TOC entry 5143 (class 2606 OID 21720)
-- Name: invoice fk_invoice_status; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT fk_invoice_status FOREIGN KEY (status_id) REFERENCES public.invoice_status(id);


--
-- TOC entry 5145 (class 2606 OID 21726)
-- Name: payment fk_payment_status; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT fk_payment_status FOREIGN KEY (status_id) REFERENCES public.payment_status(id);


--
-- TOC entry 5125 (class 2606 OID 21336)
-- Name: garage_service garage_service_garage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.garage_service
    ADD CONSTRAINT garage_service_garage_id_fkey FOREIGN KEY (garage_id) REFERENCES public.garage(id) ON DELETE CASCADE;


--
-- TOC entry 5126 (class 2606 OID 21341)
-- Name: garage_service garage_service_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.garage_service
    ADD CONSTRAINT garage_service_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service(id) ON DELETE CASCADE;


--
-- TOC entry 5134 (class 2606 OID 21430)
-- Name: intervention intervention_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointment(id);


--
-- TOC entry 5135 (class 2606 OID 21435)
-- Name: intervention intervention_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id);


--
-- TOC entry 5136 (class 2606 OID 21450)
-- Name: intervention intervention_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(id);


--
-- TOC entry 5137 (class 2606 OID 21445)
-- Name: intervention intervention_garage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_garage_id_fkey FOREIGN KEY (garage_id) REFERENCES public.garage(id);


--
-- TOC entry 5139 (class 2606 OID 21641)
-- Name: intervention_service intervention_service_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention_service
    ADD CONSTRAINT intervention_service_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_category(id);


--
-- TOC entry 5140 (class 2606 OID 21470)
-- Name: intervention_service intervention_service_intervention_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention_service
    ADD CONSTRAINT intervention_service_intervention_id_fkey FOREIGN KEY (intervention_id) REFERENCES public.intervention(id) ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 21475)
-- Name: intervention_service intervention_service_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention_service
    ADD CONSTRAINT intervention_service_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service(id);


--
-- TOC entry 5138 (class 2606 OID 21440)
-- Name: intervention intervention_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(id);


--
-- TOC entry 5144 (class 2606 OID 21531)
-- Name: invoice invoice_intervention_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_intervention_id_fkey FOREIGN KEY (intervention_id) REFERENCES public.intervention(id);


--
-- TOC entry 5149 (class 2606 OID 21665)
-- Name: invoice_line invoice_line_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE CASCADE;


--
-- TOC entry 5146 (class 2606 OID 21555)
-- Name: payment payment_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);


--
-- TOC entry 5124 (class 2606 OID 21323)
-- Name: promotion promotion_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion
    ADD CONSTRAINT promotion_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service(id);


--
-- TOC entry 5123 (class 2606 OID 21635)
-- Name: service service_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_category(id);


--
-- TOC entry 5148 (class 2606 OID 21614)
-- Name: service_part service_part_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_part
    ADD CONSTRAINT service_part_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service(id) ON DELETE CASCADE;


--
-- TOC entry 5142 (class 2606 OID 21496)
-- Name: spare_part spare_part_intervention_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spare_part
    ADD CONSTRAINT spare_part_intervention_id_fkey FOREIGN KEY (intervention_id) REFERENCES public.intervention(id) ON DELETE CASCADE;


--
-- TOC entry 5120 (class 2606 OID 21195)
-- Name: vehicle vehicle_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id);


-- Completed on 2026-10-05 16:35:24

--
-- PostgreSQL database dump complete
--

\unrestrict RdU005BbFsnkDCfoHMgxJGZuUHOSzzt17AbEMiAl75ANAvxcX9Mhk0fACv2v4uQ

--
-- Données de référence : statuts (ids fixes, partagés avec les enums C#) et types d'intervention.
--

-- Statuts des rendez-vous
INSERT INTO public.appointment_status (id, label, is_active) VALUES
    (1, 'En attente', true),
    (2, 'Confirmé',   true),
    (3, 'Annulé',     true),
    (4, 'Terminé',    true),   -- rendez-vous lancé : l'intervention a pris le relais
    (5, 'Non venu',   true);

-- Statuts des interventions
INSERT INTO public.intervention_status (id, label, is_active) VALUES
    (1, 'Planifiée', false),   -- jamais attribué par l'application
    (2, 'En cours',  true),
    (3, 'Prête',     true),    -- travaux terminés, véhicule prêt
    (4, 'Facturée',  true),
    (5, 'Clôturée',  true),    -- facture réglée
    (6, 'Annulée',   true);

-- Statuts des factures
INSERT INTO public.invoice_status (id, label, is_active) VALUES
    (1, 'Brouillon',           false),  -- jamais attribué par l'application
    (2, 'Émise',               true),
    (3, 'Payée',               true),
    (4, 'Partiellement payée', true),
    (5, 'Annulée',             true);

-- Statuts des paiements
INSERT INTO public.payment_status (id, label, is_active) VALUES
    (1, 'En attente', true),
    (2, 'Réussi',     true),
    (3, 'Échoué',     true),
    (4, 'Remboursé',  true);

-- Types d'intervention (catégories de prestations) et taux horaire de main-d'œuvre TTC
INSERT INTO public.service_category (code, name, hourly_rate, sort_order) VALUES
    ('entretien',   'Entretien',                   55, 1),
    ('pneumatique', 'Pneumatiques',                50, 2),
    ('mecanique',   'Mécanique',                   65, 3),
    ('electricite', 'Électricité & climatisation', 75, 4),
    ('diagnostic',  'Contrôle & diagnostic',       70, 5);