# FitSync database

`schema.sql` documents the initial MySQL schema used by the active Spring Boot API in `src/backend`.
It creates the `fitsync` database and the account, workout, and calorie-entry tables without
dropping existing data.

The backend also uses Hibernate `ddl-auto=update` to apply entity changes when it starts. Do not
put database passwords or other secrets in this directory; configure them through environment
variables instead.

To apply the initial schema manually from the repository root, use MySQL's command-line client:

```powershell
Get-Content .\src\backend\database\schema.sql | mysql -u root -p
```
