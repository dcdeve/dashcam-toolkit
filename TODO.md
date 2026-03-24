# TODO

## Bugs

- [ ] **Rescan falla con UNIQUE constraint** — `SqliteError: UNIQUE constraint failed: clips.path` al hacer rescan de una carpeta ya importada. El scanner intenta insertar clips que ya existen en la DB. Fix: usar `INSERT OR IGNORE` o `INSERT ... ON CONFLICT DO UPDATE` (upsert) en lugar de un INSERT simple.
