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
