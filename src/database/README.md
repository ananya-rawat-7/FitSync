# FitSync database

`schema.sql` documents the initial MySQL schema used by the active Spring Boot API in `src/backend`.
It creates the `fitsync` database and the account, exercise library, exercise-goal tags, goal workout
templates, template exercises, workout session, workout plan, plan exercise, and calorie-entry tables
without dropping existing data.

The `exercises`, `exercise_goals`, `workout_templates`, and `workout_template_exercises` tables are
populated once by the backend's `CatalogSeeder` on startup. Runtime reads and writes use those tables;
the seeder only inserts missing rows, so edits made with SQL are preserved across restarts.

The backend also uses Hibernate `ddl-auto=update` to apply entity changes when it starts. Do not
put database passwords or other secrets in this directory; configure them through environment
variables instead.

To apply the initial schema manually from the repository root, use MySQL's command-line client:

```powershell
Get-Content .\src\database\schema.sql | mysql -u root -p
```
