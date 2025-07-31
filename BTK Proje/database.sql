--
-- PostgreSQL database dump
--

-- Dumped from database version 17.3
-- Dumped by pg_dump version 17.3

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    class_id integer NOT NULL,
    name character varying,
    teacher_id integer,
    teacher_name character varying,
    teacher_surname character varying,
    teacher_email character varying
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: classes_class_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.classes_class_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_class_id_seq OWNER TO postgres;

--
-- Name: classes_class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.classes_class_id_seq OWNED BY public.classes.class_id;


--
-- Name: student_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_analysis (
    analiz_id integer NOT NULL,
    student_id integer,
    analiz_data character varying
);


ALTER TABLE public.student_analysis OWNER TO postgres;

--
-- Name: student_analysis_analiz_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_analysis_analiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_analysis_analiz_id_seq OWNER TO postgres;

--
-- Name: student_analysis_analiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_analysis_analiz_id_seq OWNED BY public.student_analysis.analiz_id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    name character varying,
    surname character varying,
    email character varying,
    sinif character varying,
    password character varying,
    class_id integer
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teachers (
    teacher_id integer NOT NULL,
    name character varying,
    surname character varying,
    user_name character varying,
    email character varying,
    password character varying,
    gender character varying
);


ALTER TABLE public.teachers OWNER TO postgres;

--
-- Name: teachers_teacher_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teachers_teacher_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teachers_teacher_id_seq OWNER TO postgres;

--
-- Name: teachers_teacher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teachers_teacher_id_seq OWNED BY public.teachers.teacher_id;


--
-- Name: classes class_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes ALTER COLUMN class_id SET DEFAULT nextval('public.classes_class_id_seq'::regclass);


--
-- Name: student_analysis analiz_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_analysis ALTER COLUMN analiz_id SET DEFAULT nextval('public.student_analysis_analiz_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: teachers teacher_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers ALTER COLUMN teacher_id SET DEFAULT nextval('public.teachers_teacher_id_seq'::regclass);


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (class_id, name, teacher_id, teacher_name, teacher_surname, teacher_email) FROM stdin;
1	1A	1	Ahmet	Yılmaz	ahmet@example.com
2	2B	2	Ayşe	Kara	ayse@example.com
\.


--
-- Data for Name: student_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_analysis (analiz_id, student_id, analiz_data) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, name, surname, email, sinif, password, class_id) FROM stdin;
1	Ali	Demir	ali_demir@example.com	1A	pass1	1
2	Zeynep	Çelik	zeynep_çelik@example.com	1A	pass1	1
3	Veli	Yılmaz	veli_yılmaz@example.com	1A	pass1	1
4	Elif	Kara	elif_kara@example.com	1A	pass1	1
5	Mehmet	Şahin	mehmet_şahin@example.com	1A	pass1	1
6	Ayşe	Aydın	ayşe_aydın@example.com	1A	pass1	1
7	Can	Koç	can_koç@example.com	1A	pass1	1
8	Fatma	Aslan	fatma_aslan@example.com	1A	pass1	1
9	Emir	Polat	emir_polat@example.com	1A	pass1	1
10	Derya	Güneş	derya_güneş@example.com	1A	pass1	1
11	Kerem	Kurt	kerem_kurt@example.com	2B	pass2	2
12	Sude	Arslan	sude_arslan@example.com	2B	pass2	2
13	Deniz	Öztürk	deniz_öztürk@example.com	2B	pass2	2
14	Buse	Doğan	buse_doğan@example.com	2B	pass2	2
15	Baran	Aksoy	baran_aksoy@example.com	2B	pass2	2
16	İlayda	Erdoğan	i̇layda_erdoğan@example.com	2B	pass2	2
17	Burak	Kılıç	burak_kılıç@example.com	2B	pass2	2
18	Yasemin	Yıldız	yasemin_yıldız@example.com	2B	pass2	2
19	Efe	Taş	efe_taş@example.com	2B	pass2	2
20	Melis	Bulut	melis_bulut@example.com	2B	pass2	2
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teachers (teacher_id, name, surname, user_name, email, password, gender) FROM stdin;
1	Ahmet	Yılmaz	ahmetyilmaz	ahmet@example.com	1234	M
2	Ayşe	Kara	aysekara	ayse@example.com	5678	F
\.


--
-- Name: classes_class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.classes_class_id_seq', 2, true);


--
-- Name: student_analysis_analiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_analysis_analiz_id_seq', 1, false);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 20, true);


--
-- Name: teachers_teacher_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teachers_teacher_id_seq', 2, true);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (class_id);


--
-- Name: student_analysis student_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_analysis
    ADD CONSTRAINT student_analysis_pkey PRIMARY KEY (analiz_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (teacher_id);


--
-- Name: teachers teachers_user_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_name_key UNIQUE (user_name);


--
-- Name: classes classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(teacher_id);


--
-- Name: student_analysis student_analysis_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_analysis
    ADD CONSTRAINT student_analysis_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: students students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id);


--
-- PostgreSQL database dump complete
--

