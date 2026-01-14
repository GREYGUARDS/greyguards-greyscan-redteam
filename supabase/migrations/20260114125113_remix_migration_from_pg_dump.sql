CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_table_access_method = heap;

--
-- Name: brand_people; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_people (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name text NOT NULL,
    user_id uuid NOT NULL,
    person_name text NOT NULL,
    person_role text NOT NULL,
    discovered_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mdm_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mdm_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_name text NOT NULL,
    alert_type text NOT NULL,
    narrative_id text NOT NULL,
    narrative_description text NOT NULL,
    severity text NOT NULL,
    previous_frequency integer,
    current_frequency integer,
    frequency_change_percent numeric,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mdm_narratives_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mdm_narratives_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_name text NOT NULL,
    narrative_id text NOT NULL,
    narrative_type text NOT NULL,
    narrative_description text NOT NULL,
    severity text NOT NULL,
    frequency integer DEFAULT 0 NOT NULL,
    keywords text[] DEFAULT '{}'::text[] NOT NULL,
    detected_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: person_mdm_narratives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person_mdm_narratives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    brand_name text NOT NULL,
    user_id uuid NOT NULL,
    narrative_id text NOT NULL,
    narrative_type text NOT NULL,
    narrative_description text NOT NULL,
    severity text NOT NULL,
    keywords text[] DEFAULT '{}'::text[] NOT NULL,
    frequency integer DEFAULT 0 NOT NULL,
    detected_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: person_mentions_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person_mentions_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    brand_name text NOT NULL,
    user_id uuid NOT NULL,
    mention_count integer DEFAULT 0 NOT NULL,
    sentiment_score numeric NOT NULL,
    positive_count integer DEFAULT 0 NOT NULL,
    negative_count integer DEFAULT 0 NOT NULL,
    neutral_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sentiment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sentiment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name text NOT NULL,
    sentiment_score numeric NOT NULL,
    positive_count integer NOT NULL,
    negative_count integer NOT NULL,
    neutral_count integer NOT NULL,
    total_mentions integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);


--
-- Name: user_brand_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_brand_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: brand_people brand_people_brand_name_user_id_person_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_people
    ADD CONSTRAINT brand_people_brand_name_user_id_person_name_key UNIQUE (brand_name, user_id, person_name);


--
-- Name: brand_people brand_people_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_people
    ADD CONSTRAINT brand_people_pkey PRIMARY KEY (id);


--
-- Name: mdm_alerts mdm_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mdm_alerts
    ADD CONSTRAINT mdm_alerts_pkey PRIMARY KEY (id);


--
-- Name: mdm_narratives_history mdm_narratives_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mdm_narratives_history
    ADD CONSTRAINT mdm_narratives_history_pkey PRIMARY KEY (id);


--
-- Name: person_mdm_narratives person_mdm_narratives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_mdm_narratives
    ADD CONSTRAINT person_mdm_narratives_pkey PRIMARY KEY (id);


--
-- Name: person_mentions_history person_mentions_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_mentions_history
    ADD CONSTRAINT person_mentions_history_pkey PRIMARY KEY (id);


--
-- Name: sentiment_history sentiment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_history
    ADD CONSTRAINT sentiment_history_pkey PRIMARY KEY (id);


--
-- Name: user_brand_access user_brand_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_brand_access
    ADD CONSTRAINT user_brand_access_pkey PRIMARY KEY (id);


--
-- Name: user_brand_access user_brand_access_user_id_brand_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_brand_access
    ADD CONSTRAINT user_brand_access_user_id_brand_name_key UNIQUE (user_id, brand_name);


--
-- Name: idx_mdm_alerts_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mdm_alerts_unread ON public.mdm_alerts USING btree (user_id, is_read, created_at DESC);


--
-- Name: idx_mdm_alerts_user_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mdm_alerts_user_brand ON public.mdm_alerts USING btree (user_id, brand_name, created_at DESC);


--
-- Name: idx_mdm_narratives_brand_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mdm_narratives_brand_user ON public.mdm_narratives_history USING btree (brand_name, user_id, detected_at DESC);


--
-- Name: idx_mdm_narratives_narrative_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mdm_narratives_narrative_id ON public.mdm_narratives_history USING btree (narrative_id, brand_name, user_id);


--
-- Name: idx_sentiment_history_brand_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_history_brand_date ON public.sentiment_history USING btree (brand_name, created_at DESC);


--
-- Name: idx_sentiment_history_brand_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_history_brand_name ON public.sentiment_history USING btree (brand_name);


--
-- Name: idx_sentiment_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_history_created_at ON public.sentiment_history USING btree (created_at DESC);


--
-- Name: idx_sentiment_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_history_user_id ON public.sentiment_history USING btree (user_id);


--
-- Name: person_mdm_narratives person_mdm_narratives_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_mdm_narratives
    ADD CONSTRAINT person_mdm_narratives_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.brand_people(id) ON DELETE CASCADE;


--
-- Name: person_mentions_history person_mentions_history_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_mentions_history
    ADD CONSTRAINT person_mentions_history_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.brand_people(id) ON DELETE CASCADE;


--
-- Name: user_brand_access Users can add own brand access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add own brand access" ON public.user_brand_access FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: mdm_alerts Users can delete own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own alerts" ON public.mdm_alerts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_brand_access Users can delete own brand access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own brand access" ON public.user_brand_access FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: brand_people Users can delete own brand people; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own brand people" ON public.brand_people FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: mdm_narratives_history Users can delete own narrative history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own narrative history" ON public.mdm_narratives_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: person_mentions_history Users can delete own person mentions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own person mentions" ON public.person_mentions_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: person_mdm_narratives Users can delete own person narratives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own person narratives" ON public.person_mdm_narratives FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: sentiment_history Users can delete own sentiment data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own sentiment data" ON public.sentiment_history FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: mdm_alerts Users can insert own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own alerts" ON public.mdm_alerts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: brand_people Users can insert own brand people; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own brand people" ON public.brand_people FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: mdm_narratives_history Users can insert own narrative history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own narrative history" ON public.mdm_narratives_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: person_mentions_history Users can insert own person mentions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own person mentions" ON public.person_mentions_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: person_mdm_narratives Users can insert own person narratives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own person narratives" ON public.person_mdm_narratives FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: sentiment_history Users can insert sentiment data for accessible brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert sentiment data for accessible brands" ON public.sentiment_history FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.user_brand_access
  WHERE ((user_brand_access.user_id = auth.uid()) AND (user_brand_access.brand_name = sentiment_history.brand_name))))));


--
-- Name: mdm_alerts Users can update own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own alerts" ON public.mdm_alerts FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: sentiment_history Users can update own sentiment data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sentiment data" ON public.sentiment_history FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: mdm_alerts Users can view own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own alerts" ON public.mdm_alerts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_brand_access Users can view own brand access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own brand access" ON public.user_brand_access FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: brand_people Users can view own brand people; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own brand people" ON public.brand_people FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: sentiment_history Users can view own brand sentiment data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own brand sentiment data" ON public.sentiment_history FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.user_brand_access
  WHERE ((user_brand_access.user_id = auth.uid()) AND (user_brand_access.brand_name = sentiment_history.brand_name))))));


--
-- Name: mdm_narratives_history Users can view own narrative history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own narrative history" ON public.mdm_narratives_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: person_mentions_history Users can view own person mentions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own person mentions" ON public.person_mentions_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: person_mdm_narratives Users can view own person narratives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own person narratives" ON public.person_mdm_narratives FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: brand_people; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brand_people ENABLE ROW LEVEL SECURITY;

--
-- Name: mdm_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mdm_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: mdm_narratives_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mdm_narratives_history ENABLE ROW LEVEL SECURITY;

--
-- Name: person_mdm_narratives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.person_mdm_narratives ENABLE ROW LEVEL SECURITY;

--
-- Name: person_mentions_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.person_mentions_history ENABLE ROW LEVEL SECURITY;

--
-- Name: sentiment_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sentiment_history ENABLE ROW LEVEL SECURITY;

--
-- Name: user_brand_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_brand_access ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;