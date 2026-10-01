# FitSync

FitSync is a Spring Boot REST API and fitness dashboard. It keeps account and calorie-entry data in MySQL and serves the existing frontend from the same origin.

## Run

Install Java 17 or later, Maven 3.9 or later, and MySQL Server 8 or later. Create the database and an app user in MySQL:

```sql
CREATE DATABASE fitsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fitsync_app'@'localhost' IDENTIFIED BY 'your-local-password';
GRANT ALL PRIVILEGES ON fitsync.* TO 'fitsync_app'@'localhost';
```

Set the connection password in the current PowerShell session, then run from this directory:

```powershell
$env:DB_PASSWORD = "your-local-password"
mvn spring-boot:run
```

The defaults connect to `localhost:3306/fitsync` as `fitsync_app`. Override `DB_URL` or `DB_USERNAME` if your local MySQL configuration differs. Open <http://localhost:8080>. To run the calculator tests, use `mvn test`.

## API

- `POST /api/auth/register` creates a profile and signs the user in.
- `POST /api/auth/login` creates a signed-in session.
- `POST /api/auth/logout` ends the session.
- `GET /api/profile` and `GET /api/dashboard` return the signed-in user's profile and today's calorie entries.
- `POST /api/food-entries` logs positive calories consumed.
- `POST /api/activity-entries` logs positive calories burned.
- `GET /api/health` checks that the service is running.

Sessions use HTTP-only cookies, and passwords are stored as BCrypt hashes. Profiles and calorie entries are kept in MySQL. Keep `DB_PASSWORD` out of source control.

## Fitness estimates

BMI and calorie targets are educational estimates, not medical advice. The calorie-target formula mirrors the supplied console example: body weight in kilograms times 24, adjusted by 400 calories for weight-loss or weight-gain goals, with a 1,200 calorie minimum.