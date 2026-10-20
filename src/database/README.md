# FitSync database

`schema.sql` documents the initial MySQL schema used by the active Spring Boot API in `src/backend`.
It creates the `fitsync` database and the account, food library, meal template, meal plan, meal plan
item, food diary, water, exercise library, exercise-goal tag, goal workout template, template exercise,
workout session, workout plan, and plan exercise tables without dropping existing data.

The `exercises`, `exercise_goals`, `workout_templates`, and `workout_template_exercises` tables are
populated once by the backend's workout `CatalogSeeder` on startup. The `foods`, `meal_templates`, and
`meal_template_items` tables are populated once by the nutrition `NutritionSeeder`. Runtime reads and
writes use those tables; the seeders only insert missing rows, so edits made with SQL are preserved
across restarts.

The old `calorie_entries` table is no longer created for fresh installs. Existing databases keep it
as unused legacy data; the active nutrition feature uses `meal_plans`, `meal_plan_items`,
`food_log_entries`, and `water_entries`.

The backend also uses Hibernate `ddl-auto=update` to apply entity changes when it starts. Do not
put database passwords or other secrets in this directory; configure them through environment
variables instead.

To apply the initial schema manually from the repository root, use MySQL's command-line client:

```powershell
Get-Content .\src\database\schema.sql | mysql -u root -p
```
