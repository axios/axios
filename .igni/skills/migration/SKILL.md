---
name: migration
description: This skill should be used when the user asks to "create a migration", "add a column", "modify the schema", "database migration", or wants to generate a database migration file.
category: operations
argument-hint: <description>
---

Generate a database migration for: `$ARGUMENTS`

## Detect Migration Framework

1. **Identify the ORM and migration tool:**
   - **Django:** `manage.py` exists, look for `migrations/` directories under apps
   - **Alembic (SQLAlchemy):** `alembic.ini` or `alembic/` directory exists
   - **Prisma:** `prisma/schema.prisma` exists
   - **Knex:** `knexfile.js` or `knexfile.ts` exists
   - **TypeORM:** `ormconfig.*` or `typeorm` in package.json
   - **Drizzle:** `drizzle.config.*` exists
   - **Rails ActiveRecord:** `db/migrate/` exists
   - **Sequelize:** `sequelize` in package.json, `.sequelizerc` exists

2. If no framework detected, tell the user and stop. Do not generate raw SQL.

## Understand Current Schema

3. **Read relevant models** to understand the current state:
   - Django: find the app's `models.py`
   - SQLAlchemy: find model files (usually in `models/` or `models.py`)
   - Prisma: read `prisma/schema.prisma`
   - Rails: read `db/schema.rb`

4. **Read existing migrations** (last 3-5) to understand:
   - Naming convention (timestamp prefix, sequential numbers, descriptive names)
   - Import patterns
   - Migration style (auto-generated vs hand-written)
   - Rollback patterns (up/down, reversible)

## Generate the Migration

5. **For Django:**
   - Modify the model in `models.py` to reflect the desired change
   - Run `python manage.py makemigrations` to auto-generate
   - Review the generated migration for correctness
   - If auto-generation isn't possible (data migration), write a manual migration following existing patterns

6. **For Alembic:**
   - Generate with `alembic revision --autogenerate -m "$ARGUMENTS"` if models are updated
   - Or write a manual migration with `alembic revision -m "$ARGUMENTS"`
   - Include both `upgrade()` and `downgrade()` functions
   - Follow the naming pattern from existing migrations

7. **For Prisma:**
   - Update `prisma/schema.prisma` with the new schema
   - Tell the user to run `npx prisma migrate dev --name $ARGUMENTS`

8. **For Knex/TypeORM/Drizzle/Sequelize:**
   - Generate migration file following the framework's CLI conventions
   - Include both up and down migrations
   - Match existing migration style

9. **For Rails:**
   - Generate with `rails generate migration $ARGUMENTS`
   - Or write manually in `db/migrate/` with timestamp prefix

## Validate

10. **Check the migration for common mistakes:**
    - Missing indexes on foreign keys or frequently queried columns
    - Missing `NOT NULL` constraints with no default value on existing tables (will fail on non-empty tables)
    - Destructive operations (DROP COLUMN, DROP TABLE) without explicit confirmation
    - Missing rollback/down migration

11. **Show the migration** and the command to run it.

## Edge Cases

- **No migration framework detected:** Suggest the most common framework for the detected language. Do not generate raw SQL.
- **Destructive migration (drop column/table):** Flag clearly and ask for confirmation. Suggest a multi-step approach (deprecate, then remove).
- **Data migration needed:** Note that data migrations require careful handling and suggest testing on a copy of production data.
- **Multiple apps/modules:** Ask which app the migration belongs to if ambiguous.
