-- Up Migration

ALTER TABLE muscle_group ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE exercise ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX muscle_group_default_name_key
    ON muscle_group (lower(name)) WHERE user_id IS NULL;
CREATE UNIQUE INDEX exercise_default_group_name_key
    ON exercise (muscle_group_id, lower(name)) WHERE user_id IS NULL;

CREATE TABLE muscle_group_preference (
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    muscle_group_id integer NOT NULL REFERENCES muscle_group (id) ON DELETE CASCADE,
    name varchar(100),
    colour varchar(7),
    is_hidden boolean DEFAULT false NOT NULL,
    PRIMARY KEY (user_id, muscle_group_id)
);

CREATE TABLE exercise_preference (
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    exercise_id integer NOT NULL REFERENCES exercise (id) ON DELETE CASCADE,
    name varchar(255),
    muscle_group_id integer REFERENCES muscle_group (id) ON DELETE SET NULL,
    is_hidden boolean DEFAULT false NOT NULL,
    PRIMARY KEY (user_id, exercise_id)
);

INSERT INTO muscle_group (name, user_id, colour)
SELECT defaults.name, NULL, defaults.colour
FROM (VALUES
    ('Chest', '#b45309'),
    ('Back', '#2563eb'),
    ('Shoulders', '#7c3aed'),
    ('Biceps', '#db2777'),
    ('Triceps', '#0891b2'),
    ('Forearms', '#4d7c0f'),
    ('Quadriceps', '#dc2626'),
    ('Hamstrings', '#0d9488'),
    ('Glutes', '#9333ea'),
    ('Calves', '#ca8a04'),
    ('Core', '#475569'),
    ('Full Body', '#16a34a'),
    ('Cardio', '#ea580c')
) AS defaults(name, colour)
WHERE NOT EXISTS (
    SELECT 1 FROM muscle_group existing
    WHERE existing.user_id IS NULL AND lower(existing.name) = lower(defaults.name)
);

INSERT INTO exercise (name, muscle_group_id, user_id)
SELECT defaults.name, muscle_group.id, NULL
FROM (VALUES
    ('Bench Press', 'Chest'),
    ('Incline Dumbbell Press', 'Chest'),
    ('Push-Up', 'Chest'),
    ('Cable Fly', 'Chest'),
    ('Lat Pulldown', 'Back'),
    ('Pull-Up', 'Back'),
    ('Barbell Row', 'Back'),
    ('Seated Cable Row', 'Back'),
    ('Overhead Press', 'Shoulders'),
    ('Lateral Raise', 'Shoulders'),
    ('Face Pull', 'Shoulders'),
    ('Barbell Curl', 'Biceps'),
    ('Dumbbell Curl', 'Biceps'),
    ('Hammer Curl', 'Biceps'),
    ('Cable Triceps Pushdown', 'Triceps'),
    ('Overhead Triceps Extension', 'Triceps'),
    ('Close-Grip Bench Press', 'Triceps'),
    ('Wrist Curl', 'Forearms'),
    ('Reverse Curl', 'Forearms'),
    ('Back Squat', 'Quadriceps'),
    ('Front Squat', 'Quadriceps'),
    ('Leg Press', 'Quadriceps'),
    ('Leg Extension', 'Quadriceps'),
    ('Romanian Deadlift', 'Hamstrings'),
    ('Seated Leg Curl', 'Hamstrings'),
    ('Lying Leg Curl', 'Hamstrings'),
    ('Hip Thrust', 'Glutes'),
    ('Glute Bridge', 'Glutes'),
    ('Cable Kickback', 'Glutes'),
    ('Standing Calf Raise', 'Calves'),
    ('Seated Calf Raise', 'Calves'),
    ('Plank', 'Core'),
    ('Side Plank', 'Core'),
    ('Hanging Knee Raise', 'Core'),
    ('Cable Crunch', 'Core'),
    ('Deadlift', 'Full Body'),
    ('Kettlebell Swing', 'Full Body'),
    ('Burpee', 'Full Body'),
    ('Treadmill Run', 'Cardio'),
    ('Cycling', 'Cardio'),
    ('Rowing Machine', 'Cardio'),
    ('Elliptical', 'Cardio')
) AS defaults(name, muscle_group_name)
JOIN muscle_group ON lower(muscle_group.name) = lower(defaults.muscle_group_name)
    AND muscle_group.user_id IS NULL
WHERE NOT EXISTS (
    SELECT 1 FROM exercise existing
    WHERE existing.user_id IS NULL
      AND existing.muscle_group_id = muscle_group.id
      AND lower(existing.name) = lower(defaults.name)
);

-- Down Migration

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM muscle_group_preference)
       OR EXISTS (SELECT 1 FROM exercise_preference) THEN
        RAISE EXCEPTION 'Cannot roll back shared workout catalogue while user preferences exist';
    END IF;

    IF EXISTS (
        SELECT 1 FROM exercise e
        JOIN workout_exercise we ON we.exercise_id = e.id
        WHERE e.user_id IS NULL
    ) OR EXISTS (
        SELECT 1 FROM exercise e
        JOIN muscle_group mg ON mg.id = e.muscle_group_id
        WHERE mg.user_id IS NULL AND e.user_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Cannot roll back shared workout catalogue while workouts or custom exercises use defaults';
    END IF;
END
$$;

DROP TABLE exercise_preference;
DROP TABLE muscle_group_preference;
DELETE FROM exercise WHERE user_id IS NULL;
DELETE FROM muscle_group WHERE user_id IS NULL;
DROP INDEX exercise_default_group_name_key;
DROP INDEX muscle_group_default_name_key;
ALTER TABLE exercise ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE muscle_group ALTER COLUMN user_id SET NOT NULL;