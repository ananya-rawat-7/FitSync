-- Initial MySQL schema for the active FitSync API.
-- Hibernate ddl-auto=update remains enabled and applies entity changes at startup.

CREATE DATABASE IF NOT EXISTS fitsync
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE fitsync;

CREATE TABLE IF NOT EXISTS user_accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    age INT DEFAULT NULL,
    display_name VARCHAR(80) NOT NULL,
    email VARCHAR(254) NOT NULL,
    fitness_goal VARCHAR(32) DEFAULT NULL,
    gender VARCHAR(32) DEFAULT NULL,
    height_cm DECIMAL(6, 2) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    weight_kg DECIMAL(6, 2) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_accounts_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS exercises (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    equipment VARCHAR(80) DEFAULT 'None',
    difficulty VARCHAR(30) DEFAULT 'Beginner',
    default_set_count INT DEFAULT NULL,
    default_reps VARCHAR(32) DEFAULT NULL,
    default_rest_seconds INT DEFAULT NULL,
    instructions VARCHAR(500) DEFAULT NULL,
    owner_id BIGINT DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_exercises_owner (owner_id),
    CONSTRAINT fk_exercises_owner
        FOREIGN KEY (owner_id) REFERENCES user_accounts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS exercise_goals (
    exercise_id BIGINT NOT NULL,
    goal VARCHAR(32) NOT NULL,
    PRIMARY KEY (exercise_id, goal),
    CONSTRAINT fk_exercise_goals_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workout_templates (
    id BIGINT NOT NULL AUTO_INCREMENT,
    goal VARCHAR(32) NOT NULL,
    day_index INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    duration_minutes INT NOT NULL,
    note VARCHAR(500) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_workout_templates_goal_day (goal, day_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workout_template_exercises (
    id BIGINT NOT NULL AUTO_INCREMENT,
    template_id BIGINT NOT NULL,
    exercise_id BIGINT NOT NULL,
    position_index INT NOT NULL DEFAULT 0,
    set_count INT DEFAULT NULL,
    reps VARCHAR(32) DEFAULT NULL,
    rest_seconds INT DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_template_exercises_template (template_id),
    KEY idx_template_exercises_exercise (exercise_id),
    CONSTRAINT fk_template_exercises_template
        FOREIGN KEY (template_id) REFERENCES workout_templates (id) ON DELETE CASCADE,
    CONSTRAINT fk_template_exercises_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workout_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category VARCHAR(50) NOT NULL,
    duration_minutes INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    notes VARCHAR(500) DEFAULT NULL,
    performed_at DATETIME(6) NOT NULL,
    user_id BIGINT DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_workout_sessions_user_id (user_id),
    CONSTRAINT fk_workout_sessions_user
        FOREIGN KEY (user_id) REFERENCES user_accounts (id),
    CONSTRAINT chk_workout_sessions_duration
        CHECK (duration_minutes <= 1440 AND duration_minutes >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workout_plans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    duration_minutes INT NOT NULL,
    planned_at DATETIME(6) NOT NULL,
    notes VARCHAR(500) DEFAULT NULL,
    goal VARCHAR(32) DEFAULT NULL,
    day_of_week VARCHAR(12) DEFAULT NULL,
    auto_generated BOOLEAN DEFAULT FALSE,
    position_in_day INT DEFAULT 0,
    user_id BIGINT DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_workout_plans_user_id (user_id),
    CONSTRAINT fk_workout_plans_user
        FOREIGN KEY (user_id) REFERENCES user_accounts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workout_plan_exercises (
    id BIGINT NOT NULL AUTO_INCREMENT,
    workout_plan_id BIGINT NOT NULL,
    exercise_id BIGINT DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    set_count INT DEFAULT NULL,
    reps VARCHAR(32) DEFAULT NULL,
    rest_seconds INT DEFAULT NULL,
    instructions VARCHAR(500) DEFAULT NULL,
    position_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_workout_plan_exercises_plan (workout_plan_id),
    KEY idx_workout_plan_exercises_exercise (exercise_id),
    CONSTRAINT fk_workout_plan_exercises_plan
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_workout_plan_exercises_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS calorie_entries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    calories INT NOT NULL,
    consumed_on DATE DEFAULT NULL,
    food_name VARCHAR(255) DEFAULT NULL,
    meal_type ENUM('BREAKFAST', 'DINNER', 'LUNCH', 'SNACK') DEFAULT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_calorie_entries_user_id (user_id),
    CONSTRAINT fk_calorie_entries_user
        FOREIGN KEY (user_id) REFERENCES user_accounts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
