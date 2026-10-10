-- Up Migration

CREATE TABLE book_club_notes (
    id serial PRIMARY KEY,
    book_id integer NOT NULL,
    question text NOT NULL,
    answer text,
    sort_order integer DEFAULT 0 NOT NULL
);

CREATE TABLE books (
    id serial PRIMARY KEY,
    title varchar(255) NOT NULL,
    author varchar(255) NOT NULL,
    genre varchar(100) NOT NULL,
    isbn varchar(13),
    dateobtained date,
    datecompleted date,
    datestartedreading date,
    shortstory boolean DEFAULT true NOT NULL,
    rating integer,
    review text,
    coverimageurl text,
    description text,
    apidatafetchedat timestamp,
    spinecolor varchar(7),
    currentpage integer,
    audiobook boolean DEFAULT false,
    CONSTRAINT books_rating_check CHECK (rating >= 0 AND rating <= 5)
);

CREATE TABLE muscle_group (
    id serial PRIMARY KEY,
    name varchar(100) NOT NULL,
    user_id uuid NOT NULL,
    colour varchar(7) DEFAULT '#737373',
    permanent_id uuid DEFAULT gen_random_uuid() NOT NULL CONSTRAINT muscle_group_permanent_id_unique UNIQUE,
    CONSTRAINT muscle_group_name_user_id_key UNIQUE (name, user_id)
);

CREATE TABLE exercise (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    muscle_group_id integer NOT NULL,
    user_id uuid NOT NULL,
    permanent_id uuid DEFAULT gen_random_uuid() NOT NULL CONSTRAINT exercise_permanent_id_unique UNIQUE,
    CONSTRAINT exercise_name_user_id_key UNIQUE (name, user_id),
    CONSTRAINT exercise_muscle_group_id_fkey FOREIGN KEY (muscle_group_id) REFERENCES muscle_group (id)
);

CREATE TABLE workout (
    id serial PRIMARY KEY,
    date date NOT NULL,
    user_id uuid NOT NULL,
    notes text,
    permanent_id uuid DEFAULT gen_random_uuid() NOT NULL CONSTRAINT workout_permanent_id_unique UNIQUE,
    CONSTRAINT workout_date_user_id_key UNIQUE (date, user_id)
);

CREATE TABLE workout_exercise (
    id serial PRIMARY KEY,
    workout_id integer NOT NULL,
    exercise_id integer NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    permanent_id uuid DEFAULT gen_random_uuid() NOT NULL CONSTRAINT workout_exercise_permanent_id_unique UNIQUE,
    CONSTRAINT workout_exercise_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES exercise (id),
    CONSTRAINT workout_exercise_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES workout (id) ON DELETE CASCADE
);

CREATE TABLE exercise_set (
    id serial PRIMARY KEY,
    workout_exercise_id integer NOT NULL,
    weight numeric(7, 2),
    weight_unit varchar(10) DEFAULT 'kgs',
    reps integer,
    distance numeric(10, 2),
    distance_unit varchar(10),
    duration integer,
    tempo varchar(20),
    notes text,
    sort_order integer DEFAULT 0 NOT NULL,
    set_type varchar(10) DEFAULT 'working',
    permanent_id uuid DEFAULT gen_random_uuid() NOT NULL CONSTRAINT exercise_set_permanent_id_unique UNIQUE,
    CONSTRAINT exercise_set_workout_exercise_id_fkey FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercise (id) ON DELETE CASCADE
);

CREATE TABLE idempotency_log (
    idempotency_key text PRIMARY KEY,
    entity_table text NOT NULL,
    entity_id integer NOT NULL,
    created_at timestamp DEFAULT now()
);

CREATE TABLE portfolio (
    title varchar(255) NOT NULL,
    url varchar(255) NOT NULL,
    svg_icon text,
    description varchar(255),
    id serial PRIMARY KEY,
    user_id uuid
);

CREATE TABLE users (
    id uuid DEFAULT gen_random_uuid(),
    email varchar(255),
    created_at timestamp DEFAULT now(),
    CONSTRAINT users_pkey1 PRIMARY KEY (id)
);

CREATE TABLE user_provider (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL,
    provider varchar(50) NOT NULL,
    provider_id_hash varchar(255) NOT NULL,
    CONSTRAINT user_provider_provider_provider_id_hash_key UNIQUE (provider, provider_id_hash),
    CONSTRAINT user_provider_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE users_old (
    id integer,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_book_club_notes_book_id ON book_club_notes (book_id);
CREATE INDEX idx_exercise_muscle_group ON exercise (muscle_group_id);
CREATE INDEX idx_exercise_user ON exercise (user_id);
CREATE INDEX idx_exercise_set_workout_exercise ON exercise_set (workout_exercise_id);
CREATE INDEX idx_user_provider_lookup ON user_provider (provider, provider_id_hash);
CREATE INDEX idx_workout_user_date ON workout (user_id, date);
CREATE INDEX idx_workout_exercise_workout ON workout_exercise (workout_id);

ALTER TABLE book_club_notes
    ADD CONSTRAINT book_club_notes_book_id_fkey
    FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE;

-- Down Migration

DROP TABLE users_old;
DROP TABLE user_provider;
DROP TABLE users;
DROP TABLE portfolio;
DROP TABLE idempotency_log;
DROP TABLE exercise_set;
DROP TABLE workout_exercise;
DROP TABLE workout;
DROP TABLE exercise;
DROP TABLE muscle_group;
DROP TABLE book_club_notes;
DROP TABLE books;