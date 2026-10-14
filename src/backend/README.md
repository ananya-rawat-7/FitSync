# FitSync Spring Boot API

This Spring Boot API uses Spring Data JPA and the existing MySQL `fitsync` database. The initial database schema is in [schema.sql](../database/schema.sql). For full application architecture, route, API, security, and viva documentation, see the repository [README](../../README.md).

## Development

Copy `.env.example` to `.env` in this directory and replace the placeholder MySQL password and JWT secret. The backend imports this local file when it starts. Keep `.env` private; it is ignored by Git. `JWT_SECRET` must contain at least 32 UTF-8 bytes, and `JWT_EXPIRATION_MS` defaults to 15 minutes. From this directory, start the API with dev request and SQL logging enabled:

```powershell
Copy-Item .env.example .env
# Edit .env with your local secrets before starting the API.
mvn.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

The API listens at `http://localhost:8080`. The `dev` profile logs API method, path, status, duration, and SQL statements to the console. It deliberately does not log request bodies, credentials, JWTs, or SQL parameter values. Environment variables set in the process still override values from `.env`.

## Production build and run

There is no separate `prod` Spring profile. Build and launch the packaged JAR without the `dev` profile; this runs the default configuration without development request/SQL logging. Set the database, JWT, and CORS values through the production environment or secret manager before launching. For a local PowerShell example:

```powershell
$env:MYSQL_URL = "jdbc:mysql://<mysql-host>:3306/fitsync?createDatabaseIfNotExist=true"
$env:MYSQL_USER = "<mysql-user>"
$env:MYSQL_PASSWORD = "<mysql-password>"
$env:JWT_SECRET = "<unique-random-secret-of-at-least-32-characters>"
$env:FITSYNC_CORS_ALLOWED_ORIGINS = "https://<your-frontend-host>"
mvn.cmd clean package
java -jar .\target\fitsync-api-1.0.0.jar
```

The API listens on port `8080` by default; set `PORT` to change it. Use HTTPS and allow only the deployed frontend origin. The current Hibernate configuration uses `ddl-auto=update`; use a managed schema migration process before production database changes.

## Test

```powershell
mvn.cmd test
```

Integration tests use H2 and a test-only JWT key, not the local MySQL instance. They cover registration, login, profile access, authenticated workout CRUD, rejection of missing credentials, and workout ownership.

Public routes are `POST /api/auth/register` and `POST /api/auth/login`. All other routes, including `/api/auth/me` and `/api/workouts/**`, require `Authorization: Bearer <JWT>`.
