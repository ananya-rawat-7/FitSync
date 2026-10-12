# FitSync

FitSync is a React single-page fitness application backed by a Spring Boot REST API. Workout sessions are persisted with Spring Data JPA in MySQL, and account and workout endpoints use stateless JWT authentication.

## Project structure

```text
FitSync/
├── src/
│   ├── auth/                 # Authentication context and protected routes
│   ├── components/           # Shared React layout
│   ├── pages/                # Landing, login, registration, dashboard, workouts, profile
│   ├── services/api.js       # Shared authenticated REST client
│   ├── App.jsx               # React Router routes
│   └── main.jsx              # React entry point
├── backend/
│   └── src/main/java/com/fitsync/api/
│       ├── auth/             # Registration, login, profile, account model/repository
│       ├── config/           # CORS and API error responses
│       ├── security/         # JWT creation, validation, and Spring Security
│       └── workout/          # JPA workout entity, repository, service, and REST controller
├── index.html
├── styles.css
└── package.json
```

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- Java 17+ and Maven 3.6+
- MySQL 8+ (the existing `fitsync` schema is reused; Hibernate updates its tables)

## Configuration and startup

Start MySQL and create a database user with access to `fitsync`. The default JDBC URL creates that database if needed. Set these environment variables in the terminal that will run Spring Boot; replace the sample values with your local settings:

```powershell
$env:MYSQL_URL = "jdbc:mysql://localhost:3306/fitsync?createDatabaseIfNotExist=true"
$env:MYSQL_USER = "root"
$env:MYSQL_PASSWORD = "<your-mysql-password>"
$env:JWT_SECRET = "<at-least-32-random-characters>"
```

`JWT_SECRET` is required, is never returned by an endpoint, and must be at least 32 UTF-8 bytes. Generate a strong random value for local development and keep it out of source control. `JWT_EXPIRATION_MS` defaults to `900000` (15 minutes). `CORS_ALLOWED_ORIGINS` defaults to `http://localhost:5173,http://127.0.0.1:5173`. `MYSQL_URL`, `MYSQL_USER`, and `MYSQL_PASSWORD` can be omitted only when the local MySQL defaults are appropriate.

In one terminal, start the backend:

```powershell
cd backend
mvn spring-boot:run
```

In a second terminal, install and start the React frontend:

```powershell
npm install
npm run dev
```

The Vite server uses `http://localhost:5173`; the Spring Boot API uses `http://localhost:8080`. To point the frontend at a different backend, set `VITE_API_BASE_URL` (for example, `http://localhost:8080/api`) before running Vite.

## Browser routes

| URL | Access | Purpose |
| --- | --- | --- |
| `http://localhost:5173/` | Public | FitSync landing page and workout templates |
| `http://localhost:5173/register` | Public | Create an account |
| `http://localhost:5173/login` | Public | Sign in |
| `http://localhost:5173/dashboard` | Protected | Account-specific activity totals and recent workouts |
| `http://localhost:5173/workouts` | Protected | Create, read, update, and delete the signed-in user's workouts |
| `http://localhost:5173/profile` | Protected | View the current account profile |

## API and access rules

The frontend calls `http://localhost:8080/api` through the shared `src/services/api.js` helper. It sends JSON, adds `Authorization: Bearer <JWT>` to requests when signed in, translates network failures to a user-friendly message, and clears the local session after an HTTP 401.

Only registration and login are public. Every other API route requires a valid, unexpired bearer token.

| Method | Endpoint | Access | Result |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Creates an account; returns safe profile fields (`201`) |
| `POST` | `/api/auth/login` | Public | Verifies the password and returns a bearer JWT and safe profile (`200`) |
| `GET` | `/api/auth/me` | JWT | Returns the authenticated user's profile |
| `GET` | `/api/workouts` | JWT | Lists only the authenticated user's workouts |
| `GET` | `/api/workouts/{id}` | JWT | Reads an owned workout; another user's ID returns `404` |
| `POST` | `/api/workouts` | JWT | Creates a workout for the authenticated user (`201`) |
| `PUT` | `/api/workouts/{id}` | JWT | Updates an owned workout |
| `DELETE` | `/api/workouts/{id}` | JWT | Deletes an owned workout (`204`) |

Passwords are encoded with BCrypt and are never included in response DTOs. Workout ownership is taken from the authenticated identity, not from request JSON. Invalid or absent tokens receive `401`; a valid identity without permission receives `403`. The current API has no role-specific operations, so an authenticated account has access only to its own workouts. Logout clears the token from browser `sessionStorage`; because JWTs are stateless, a token already copied elsewhere remains valid until its 15-minute expiry.

Registration and login example:

```http
POST /api/auth/register
Content-Type: application/json

{"displayName":"Alex Fit","email":"alex@example.com","password":"a-long-password"}
```

```json
{"id":1,"displayName":"Alex Fit","email":"alex@example.com"}
```

```http
POST /api/auth/login
Content-Type: application/json

{"email":"alex@example.com","password":"a-long-password"}
```

```json
{"token":"<signed-jwt>","tokenType":"Bearer","user":{"id":1,"displayName":"Alex Fit","email":"alex@example.com"}}
```

Use the returned token on protected requests:

```http
POST /api/workouts
Authorization: Bearer <signed-jwt>
Content-Type: application/json

{"name":"Full Body","category":"Strength","durationMinutes":30,"performedAt":"2026-10-07T18:30:00","notes":"First session"}
```

The workout response contains `id`, `name`, `category`, `durationMinutes`, `performedAt`, and `notes`; it does not include the password, JWT secret, or account's password hash.

## Database compatibility

The existing MySQL datasource, `workout_sessions` table, JPA repository, and CRUD routes are retained. Hibernate `ddl-auto=update` adds a `user_accounts` table and a nullable `user_id` relationship column to `workout_sessions`; it does not drop the existing database. Historical workouts without an owner remain in the database but are deliberately not returned to any account. Newly created sessions are assigned to the signed-in user.

## Tests

Backend integration tests use an in-memory H2 database and a test-only JWT key; they do not need MySQL:

```powershell
cd backend
mvn test
```

Build the frontend:

```powershell
npm run build
```

Register an account in the app and use those credentials to test login. No shared or hard-coded test account is configured.

## Viva explanation

- **SPA:** A Single-Page Application loads one HTML shell and changes the view in the browser as the user navigates. FitSync uses React Router, so dashboard, workout, profile, login, and registration routes change without a full page reload.
- **React.js:** A JavaScript UI library for composing interactive interfaces from reusable components. FitSync pages, forms, navigation, and workout lists are React components.
- **REST API:** An HTTP interface that exposes resources through routes and methods such as `GET`, `POST`, `PUT`, and `DELETE`. FitSync's Spring controllers expose account and workout resources as JSON.
- **Secure API endpoint:** A server-side endpoint that verifies the caller's identity and authorization before returning or changing protected data. Hiding a page in React alone is not security; Spring Security enforces it on every request.
- **JWT:** A signed token containing claims (here, the account email as subject and an expiry). The server signs it at login and verifies its signature and expiry on protected requests.
- **React-to-Spring communication:** React's shared API helper sends HTTP requests to the Spring Boot API, encodes request/response data as JSON, and attaches the bearer token from the current browser session.
- **FitSync authentication:** A user registers with an email and password; Spring stores a BCrypt hash. Login verifies the password and returns a short-lived JWT plus non-sensitive profile data. React stores the token in `sessionStorage`, attaches it to protected requests, and clears it on logout or an unauthorized response.
- **Why protect APIs:** Workout information is private, and only an authenticated owner should read or change it. Server-side checks prevent clients from bypassing the UI and prevent cross-account access.
- **Unauthorized request:** If a caller omits, corrupts, or presents an expired JWT, Spring returns `401 Unauthorized`. The React API helper clears the current session and protected routes send the user to login. A valid token cannot read another user's workout; that resource appears as `404 Not Found`.

## Security note

The configured CORS origins are restricted to the two local Vite development origins, not `*`. For a production deployment, use HTTPS, set a strong secret in a secret manager, set the exact production frontend origin in `CORS_ALLOWED_ORIGINS`, and review browser token storage against the deployment's XSS threat model.
FitSync is a Spring Boot REST API and fitness dashboard. It keeps account and calorie-entry data in MySQL and serves the existing frontend from the same origin.

## Run

Install Java 17 or later, Maven 3.9 or later, and MySQL Server 8 or later. Create the database and an app user in MySQL:

```sql
CREATE DATABASE fitsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fitsync_app'@'localhost' IDENTIFIED BY 'your-local-password';
GRANT ALL PRIVILEGES ON fitsync.* TO 'fitsync_app'@'localhost';
```

Set the connection password and a random 256-bit Base64 JWT signing key in the current PowerShell session, then run from this directory:

```powershell
$env:DB_PASSWORD = "your-local-password"
$jwtKey = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($jwtKey)
$env:JWT_SECRET = [Convert]::ToBase64String($jwtKey)
mvn spring-boot:run
```

The defaults connect to `localhost:3306/fitsync` as `fitsync_app`. Override `DB_URL` or `DB_USERNAME` if your local MySQL configuration differs. Open <http://localhost:8080>. To run the calculator tests, use `mvn test`.

## API

- `POST /api/auth/register` creates a profile and returns a signed JWT with its dashboard.
- `POST /api/auth/login` validates credentials and returns a signed JWT with its dashboard.
- Send the JWT as `Authorization: Bearer <token>` to access protected `/api/**` endpoints. Tokens expire after 30 minutes by default; set `JWT_EXPIRATION_MS` to change this.
- `GET /api/profile` and `GET /api/dashboard` return the signed-in user's profile and today's calorie entries.
- `POST /api/food-entries` logs positive calories consumed.
- `POST /api/activity-entries` logs positive calories burned.
- `GET /api/health` checks that the service is running.

The API is stateless and does not use session cookies or CSRF tokens. The browser keeps the JWT in memory, so reloading the page signs out. Passwords are stored as BCrypt hashes. Profiles and calorie entries are kept in MySQL. Keep `DB_PASSWORD` and `JWT_SECRET` out of source control.

## Fitness estimates

BMI and calorie targets are educational estimates, not medical advice. The calorie-target formula mirrors the supplied console example: body weight in kilograms times 24, adjusted by 400 calories for weight-loss or weight-gain goals, with a 1,200 calorie minimum.


## Ananya's idea

# Fitness Web App --- Product Requirements and Development Plan

## 1. Project Overview

**Project type:** Fitness and nutrition tracking web application\
**Frontend:** React\
**Backend:** Java (Spring Boot recommended)\
**Database:** MySQL

### Purpose

The app helps users understand their current fitness situation, set a
realistic goal, track the food they eat, and plan workouts or other
activities. It should make calorie and nutrition tracking simple,
including for common Indian foods and foods that are not already in the
app's database.

## 2. Main Features

1.  **User profile and measurements**
2.  **Fitness status and BMI calculator**
3.  **Goal setting**
4.  **Food and calorie tracker**
5.  **Daily dashboard**
6.  **Workout and activity planner**
7.  **Progress tracking**

------------------------------------------------------------------------

## 3. User Profile and Measurements

Collect the information needed to estimate a user's current fitness
status.

### 3.1 Basic details

-   Name or display name
-   Age or date of birth
-   Gender, if the selected calculation or recommendation requires it
-   Height
-   Current weight
-   Preferred units (kg/cm or lb/ft-in)
-   Activity level (sedentary, lightly active, moderately active, very
    active)

### 3.2 Optional measurements

Allow users to add any measurements they know. Do not require every
measurement to use the app.

-   Waist circumference
-   Hip circumference
-   Neck circumference
-   Chest circumference
-   Arm circumference
-   Thigh circumference
-   Body-fat percentage, if the user has a reliable measurement
-   Resting heart rate, if known

The app should show which values are user-entered and which are
calculated estimates. More measurements do not automatically make every
estimate accurate; results depend on the method and quality of the
input.

------------------------------------------------------------------------

## 4. Current Fitness Status

### 4.1 BMI calculator

Calculate Body Mass Index (BMI) using height and weight.

**Metric formula:**

`BMI = weight in kilograms / (height in metres × height in metres)`

Display:

-   Current BMI
-   A plain-language explanation of the result
-   The height and weight used in the calculation
-   A note that BMI is a screening measure and does not directly measure
    body fat or overall health

Use appropriate interpretation for the user's age. Adult BMI categories
should not automatically be applied to children or teenagers.

### 4.2 Other status indicators

Where enough information is available, the app may display:

-   Current weight
-   Waist-to-height ratio
-   Estimated daily maintenance calories
-   Optional body-fat estimate, clearly labelled as an estimate
-   Recent weight trend

Do not present estimates as medical diagnoses.

------------------------------------------------------------------------

## 5. Goal Setting

Ask the user what they want to achieve. Use clear, respectful options
rather than labels such as "get fatter" or "stay fat."

### 5.1 Goal options

-   **Lose weight / reduce body fat**
-   **Gain weight**
-   **Maintain current weight**
-   **Improve fitness or build strength** (optional goal)

### 5.2 Goal details

Ask the user to provide:

-   Target weight, if relevant
-   Target date or duration
-   Preferred pace of progress, where appropriate
-   Main focus: weight, body measurements, strength, or general activity

The app should check that the goal and duration are plausible, show an
estimate rather than a guarantee, and encourage professional advice when
a goal may be unsafe. Avoid extreme calorie targets or rapid
weight-change recommendations.

------------------------------------------------------------------------

## 6. Food and Nutrition Tracker

### 6.1 Food database

Include a searchable database of common Indian foods and popular foods
from other cuisines.

Possible categories:

-   Rice and roti
-   Dal, beans, and legumes
-   Vegetables and salads
-   Fruits
-   Dairy products
-   Snacks and street food
-   Breakfast foods
-   Indian meals and curries
-   Meat, fish, and eggs
-   Packaged foods and drinks
-   Popular international foods

Food nutrition values should be stored with a clear serving basis, such
as per 100 g, per serving, or per item. Where possible, distinguish raw
and cooked foods because their nutrition values can differ.

### 6.2 Add a food entry

Users should be able to:

1.  Search for and select a food from the database.
2.  Choose a portion size in grams, millilitres, or a familiar unit such
    as one roti or one bowl.
3.  See the estimated calories and nutrition for that portion.
4.  Add the entry to a meal and save it to the daily log.

For foods not in the database, provide a custom-food option:

-   Food name
-   Calories per 100 g (recommended default basis)
-   Protein per 100 g
-   Carbohydrates per 100 g
-   Fat per 100 g
-   Portion amount and unit

The original idea of entering calories per 10 g can be supported, but
the app should clearly show the chosen basis. A consistent per-100-g
basis is easier to compare and calculate.

### 6.3 Calculation

For a food with nutrition values stored per 100 g:

`Nutrition for portion = (portion in grams / 100) × nutrition per 100 g`

For example, if a food has 200 kcal per 100 g and the portion is 150 g:

`Calories = (150 / 100) × 200 = 300 kcal`

For packaged foods, users may enter the nutrition values from the
product label. Make clear that user-entered values may be approximate.

### 6.4 Meal organisation

Allow users to organise food entries by:

-   Breakfast
-   Lunch
-   Dinner
-   Snacks
-   Other

Users should be able to edit or remove an entry and view their food log
by date.

------------------------------------------------------------------------

## 7. Daily Dashboard

The dashboard should give users a quick summary of their daily intake,
activity, and goal.

### 7.1 Nutrition summary

Display:

-   Total calories consumed
-   Protein consumed (g)
-   Carbohydrates consumed (g)
-   Fat consumed (g)
-   Daily targets, where available
-   Remaining amount against each target

### 7.2 Calorie balance

Display the difference between estimated calorie intake and the user's
estimated daily calorie target.

-   For a weight-loss goal, show progress against the planned intake
    target.
-   For a weight-gain goal, show progress against the planned intake
    target.
-   For maintenance, show progress against the maintenance estimate.

Also show calories recorded as burned through exercise separately.
Exercise-calorie estimates can be inaccurate, so label them as estimates
and avoid implying that they are exact.

**Important:** Do not treat "calories to burn or gain" as a single exact
number. Show intake targets, activity estimates, and progress in clearly
labelled sections.

### 7.3 Dashboard visualisations

Useful components include:

-   Calorie progress bar
-   Protein, carbohydrate, and fat summary
-   Food entries grouped by meal
-   Activity and exercise summary
-   Weight history chart
-   Daily and weekly progress view

------------------------------------------------------------------------

## 8. Workout and Activity Planner

### 8.1 Activity selection

Provide a searchable list of exercises and everyday activities, for
example:

-   Walking
-   Running
-   Cycling
-   Swimming
-   Strength training
-   Yoga
-   Stretching
-   Dancing
-   Sports
-   Other custom activity

### 8.2 Record an activity

Let the user enter:

-   Activity name
-   Duration
-   Date and time
-   Optional distance, steps, or intensity
-   Optional notes

Estimate calories burned using an appropriate method and, where
relevant, the user's weight, activity intensity, and duration. Show the
result as an estimate.

### 8.3 Workout planning

Users should be able to:

-   Create a workout plan
-   Add activities or exercises to a plan
-   Set duration, repetitions, sets, or distance when relevant
-   Schedule activities for a date
-   Mark a planned activity as completed
-   View completed and planned activities

Start with a simple activity log and planner. More advanced personalised
workout recommendations can be added later.

------------------------------------------------------------------------

## 9. Progress Tracking

Track changes over time so users can see whether they are moving toward
their goals.

-   Record weight by date
-   Record optional body measurements
-   Compare current measurements with previous measurements
-   Show weekly and monthly trends
-   Show food and activity history
-   Show progress toward the selected goal

Users should be able to correct or delete their own entries.

------------------------------------------------------------------------

## 10. Main User Flow

1.  The user opens the app and creates a profile.
2.  The user enters height, weight, age, activity level, and any
    optional measurements.
3.  The app calculates BMI and displays the current fitness summary.
4.  The user chooses a goal and enters a target and duration, where
    relevant.
5.  The app estimates suitable daily targets and explains that they are
    estimates.
6.  The user records meals and portion sizes throughout the day.
7.  The user records workouts and other physical activities.
8.  The dashboard updates the daily nutrition and activity summaries.
9.  The user checks their progress over time and updates measurements or
    goals when needed.

------------------------------------------------------------------------

## 11. Suggested Pages

1.  **Sign up / Login** --- account access
2.  **Profile Setup** --- personal details and measurements
3.  **Fitness Overview** --- BMI and current status
4.  **Goal Setup** --- goal, target, and duration
5.  **Dashboard** --- daily calories, macros, and activity
6.  **Food Tracker** --- search, portions, custom foods, and meal log
7.  **Workout Planner** --- planned and completed activities
8.  **Progress** --- weight and measurement charts
9.  **Settings** --- units, profile, and account preferences

------------------------------------------------------------------------

## 12. Suggested Technical Architecture

### Frontend: React

Responsibilities:

-   User interface and forms
-   Food search and portion calculator
-   Dashboard and charts
-   Workout planner
-   Input validation and error messages
-   Calling the backend through HTTP APIs

### Backend: Java with Spring Boot

Responsibilities:

-   REST API endpoints
-   Business logic and nutrition calculations
-   Authentication and authorisation
-   Input validation
-   Reading and writing application data
-   Ensuring each user can access only their own private records

### Database: MySQL

Suggested main tables:

  -----------------------------------------------------------------------
  Table                               Purpose
  ----------------------------------- -----------------------------------
  `users`                             Account and login-related
                                      information

  `user_profiles`                     Age or birth date, height, units,
                                      activity level, and profile details

  `body_measurements`                 Weight and optional measurements
                                      recorded over time

  `goals`                             Goal type, target, start date,
                                      target date, and status

  `foods`                             Shared food database and nutrition
                                      values

  `food_logs`                         Foods eaten, portions, meals, and
                                      timestamps

  `activities`                        Shared activity and exercise
                                      catalogue

  `activity_logs`                     User-recorded activities and
                                      estimated calories

  `workout_plans`                     Workout plan details and schedules

  `workout_plan_items`                Exercises or activities included in
                                      a plan
  -----------------------------------------------------------------------

Use foreign keys and appropriate indexes. Store dates and numeric values
with suitable database types. Passwords must be securely hashed; never
store plain-text passwords.

------------------------------------------------------------------------

## 13. Example REST API Endpoints

These are suggested endpoint names, not implemented APIs.

  ----------------------------------------------------------------------------------
  Method                  Endpoint                           Purpose
  ----------------------- ---------------------------------- -----------------------
  `POST`                  `/api/auth/register`               Register a user

  `POST`                  `/api/auth/login`                  Log in

  `GET`                   `/api/profile`                     Get the user's profile

  `PUT`                   `/api/profile`                     Update the user's
                                                             profile

  `POST`                  `/api/measurements`                Save a measurement

  `GET`                   `/api/measurements`                View measurement
                                                             history

  `POST`                  `/api/goals`                       Create a goal

  `GET`                   `/api/foods`                       Search the food
                                                             catalogue

  `POST`                  `/api/foods/custom`                Add a custom food

  `POST`                  `/api/food-logs`                   Record a meal item

  `GET`                   `/api/food-logs?date=YYYY-MM-DD`   Get food entries for a
                                                             date

  `DELETE`                `/api/food-logs/{id}`              Delete a food entry

  `GET`                   `/api/dashboard?date=YYYY-MM-DD`   Get daily summary

  `GET`                   `/api/activities`                  Search activities

  `POST`                  `/api/activity-logs`               Record an activity

  `GET`                   `/api/activity-logs`               View activity history

  `POST`                  `/api/workout-plans`               Create a workout plan
  ----------------------------------------------------------------------------------

Protect private endpoints with authentication and verify ownership for
every record.

------------------------------------------------------------------------

## 14. Development Phases

### Phase 1 --- Basic working app

-   Set up React, Spring Boot, and MySQL
-   Create the profile and measurement forms
-   Calculate BMI
-   Allow users to set a goal
-   Create a basic dashboard

### Phase 2 --- Food tracking

-   Add a starter Indian-food catalogue
-   Add search and portion-size calculations
-   Support custom foods
-   Calculate daily calories, protein, carbohydrates, and fat
-   Save and edit meal logs

### Phase 3 --- Activity tracking

-   Add a starter exercise and activity catalogue
-   Record activity duration and optional intensity
-   Estimate calories burned
-   Create and manage workout plans

### Phase 4 --- Progress and improvements

-   Add weight and measurement charts
-   Add weekly summaries
-   Improve food search and serving-size options
-   Add authentication, privacy controls, validation, and tests
-   Improve accessibility and mobile responsiveness

------------------------------------------------------------------------

## 15. Important Product Rules

-   Clearly label nutrition and calorie-burn values as estimates when
    appropriate.
-   Use a consistent nutrition basis and show the serving unit.
-   Do not claim BMI or any single measurement gives a complete picture
    of health.
-   Use respectful, goal-focused language.
-   Do not recommend extreme dieting or unsafe weight-change targets.
-   Keep personal health and account data private.
-   Validate user inputs in both React and the Java backend.
-   Make the main tasks easy on mobile screens as well as desktop
    screens.

## 16. Initial MVP Scope

For the first release, focus on these essentials:

1.  User profile with height, weight, and activity level
2.  BMI calculator and fitness overview
3.  Goal setting
4.  Searchable common-food list
5.  Portion-size calorie and macro calculations
6.  Custom food entry
7.  Daily nutrition dashboard
8.  Activity log with estimated calories burned
9.  Weight history

Workout schedules, advanced recommendations, and more detailed analytics
can follow after the core tracking flow works reliably.
