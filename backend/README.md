# FitSync Spring Boot API

This Spring Boot API uses Spring Data JPA and the existing MySQL `fitsync` database. For full application architecture, route, API, security, and viva documentation, see the repository [README](../README.md).

## Run locally

Set `MYSQL_URL`, `MYSQL_USER`, `MYSQL_PASSWORD`, and a strong `JWT_SECRET` of at least 32 UTF-8 bytes. `JWT_EXPIRATION_MS` defaults to 15 minutes. Then, from this directory:

```powershell
mvn spring-boot:run
```

The API listens at `http://localhost:8080`. Keep database credentials and the JWT secret in environment variables; do not commit them.

## Test

```powershell
mvn test
```

Integration tests use H2 and a test-only JWT key, not the local MySQL instance. They cover registration, login, profile access, authenticated workout CRUD, rejection of missing credentials, and workout ownership.

Public routes are `POST /api/auth/register` and `POST /api/auth/login`. All other routes, including `/api/auth/me` and `/api/workouts/**`, require `Authorization: Bearer <JWT>`.
